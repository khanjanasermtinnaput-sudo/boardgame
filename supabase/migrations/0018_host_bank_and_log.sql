-- Host/banker foundation, part 1:
--  - `games.paused` / `games.last_roll` columns for the round-flow redesign.
--  - Reinstate a per-game action log (dropped in 0007) so host adjustments
--    are visible to every player, not just synthesized client-side history.
--  - Relax the buy/sell/borrow/repay RPCs: the Bank (sell/borrow/repay) is
--    now available in every phase, not gated to phase 1; buying moves to
--    phase 2 (Invest/Buy) under the new round choreography introduced in
--    migration 0019.

-- ============================================================================
-- games: paused flag + last dice/tile roll (cosmetic reveal payload)
-- ============================================================================

alter table public.games
  add column if not exists paused boolean not null default false,
  add column if not exists last_roll jsonb not null default '{}'::jsonb;

-- ============================================================================
-- game_log — persistent, member-readable record of host/banker actions.
-- Writes only ever happen from security-definer RPCs (which run as the table
-- owner and bypass RLS), so there is no client insert policy — mirrors the
-- write model already used for games/game_players.
-- ============================================================================

create table public.game_log (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  actor_profile_id uuid references public.profiles (id) on delete set null,
  kind text not null,
  entry jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index game_log_game_id_idx on public.game_log (game_id, created_at);

alter table public.game_log enable row level security;

create policy "game_log_select" on public.game_log
  for select using (private.is_room_member(private.game_room_id(game_id)));

alter publication supabase_realtime add table public.game_log;
alter table public.game_log replica identity full;

-- ============================================================================
-- Bank RPCs — sell/borrow/repay: drop the phase = 1 gate, keep status and
-- add a paused guard. Still act only on auth.uid()'s own row and re-derive
-- net_worth via private.recompute_player, unchanged.
-- ============================================================================

create or replace function public.game_sell_asset(_game_id uuid, _instance_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _game public.games;
  _assets jsonb;
  _found jsonb := null;
  _new_assets jsonb := '[]'::jsonb;
  _elem jsonb;
  _multiplier numeric;
  _sell_price bigint;
begin
  select * into _game from public.games where id = _game_id for update;
  if _game.id is null then
    raise exception 'game_not_found';
  end if;
  if _game.status <> 'active' then
    raise exception 'game_not_active';
  end if;
  if _game.paused then
    raise exception 'game_paused';
  end if;

  select assets into _assets
    from public.game_players where game_id = _game_id and profile_id = _uid;
  if _assets is null then
    raise exception 'not_in_game';
  end if;

  for _elem in select * from jsonb_array_elements(_assets) loop
    if (_elem ->> 'instance_id')::uuid = _instance_id and _found is null then
      _found := _elem;
    else
      _new_assets := _new_assets || jsonb_build_array(_elem);
    end if;
  end loop;

  if _found is null then
    raise exception 'asset_not_owned';
  end if;

  _multiplier := coalesce((_game.market ->> (_found ->> 'category'))::numeric, 1.0);
  _sell_price := round((_found ->> 'base_value')::bigint * _multiplier * 0.90);

  update public.game_players
    set cash = cash + _sell_price,
        assets = _new_assets
    where game_id = _game_id and profile_id = _uid;

  perform private.recompute_player(_game_id, _uid);
end;
$$;

create or replace function public.game_borrow(_game_id uuid, _amount bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _game public.games;
  _exists boolean;
begin
  if _amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  select * into _game from public.games where id = _game_id for update;
  if _game.id is null then
    raise exception 'game_not_found';
  end if;
  if _game.status <> 'active' then
    raise exception 'game_not_active';
  end if;
  if _game.paused then
    raise exception 'game_paused';
  end if;

  select exists (
    select 1 from public.game_players where game_id = _game_id and profile_id = _uid
  ) into _exists;
  if not _exists then
    raise exception 'not_in_game';
  end if;

  update public.game_players
    set cash = cash + _amount,
        debts = debts || jsonb_build_array(jsonb_build_object(
          'debt_id', gen_random_uuid(),
          'principal', _amount,
          'outstanding', _amount,
          'created_age', _game.age
        ))
    where game_id = _game_id and profile_id = _uid;

  perform private.recompute_player(_game_id, _uid);
end;
$$;

create or replace function public.game_repay(_game_id uuid, _debt_id uuid, _amount bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _game public.games;
  _debts jsonb;
  _cash bigint;
  _found jsonb := null;
  _new_debts jsonb := '[]'::jsonb;
  _elem jsonb;
  _outstanding bigint;
  _actual_repay bigint;
  _remaining bigint;
begin
  if _amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  select * into _game from public.games where id = _game_id for update;
  if _game.id is null then
    raise exception 'game_not_found';
  end if;
  if _game.status <> 'active' then
    raise exception 'game_not_active';
  end if;
  if _game.paused then
    raise exception 'game_paused';
  end if;

  select debts, cash into _debts, _cash
    from public.game_players where game_id = _game_id and profile_id = _uid;
  if _debts is null then
    raise exception 'not_in_game';
  end if;

  for _elem in select * from jsonb_array_elements(_debts) loop
    if (_elem ->> 'debt_id')::uuid = _debt_id and _found is null then
      _found := _elem;
    else
      _new_debts := _new_debts || jsonb_build_array(_elem);
    end if;
  end loop;

  if _found is null then
    raise exception 'debt_not_found';
  end if;

  _outstanding := (_found ->> 'outstanding')::bigint;
  _actual_repay := least(_amount, _outstanding);

  if _cash < _actual_repay then
    raise exception 'insufficient_funds';
  end if;

  _remaining := _outstanding - _actual_repay;
  if _remaining > 0 then
    _new_debts := _new_debts || jsonb_build_array(jsonb_set(_found, '{outstanding}', to_jsonb(_remaining)));
  end if;

  update public.game_players
    set cash = cash - _actual_repay,
        debts = _new_debts
    where game_id = _game_id and profile_id = _uid;

  perform private.recompute_player(_game_id, _uid);
end;
$$;

-- ============================================================================
-- game_buy_card — buying moves from phase 1 (old Investment phase) to phase
-- 2 (new Invest/Buy phase opened by the host's round-advance roll).
-- ============================================================================

create or replace function public.game_buy_card(_game_id uuid, _card_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _game public.games;
  _hand jsonb;
  _cash bigint;
  _idx integer := null;
  _card record;
  _multiplier numeric;
  _price bigint;
  _new_hand jsonb := '[]'::jsonb;
  _elem jsonb;
  _i integer := 0;
begin
  select * into _game from public.games where id = _game_id for update;
  if _game.id is null then
    raise exception 'game_not_found';
  end if;
  if _game.status <> 'active' or _game.phase <> 2 then
    raise exception 'not_buy_phase';
  end if;
  if _game.paused then
    raise exception 'game_paused';
  end if;

  select hand, cash into _hand, _cash
    from public.game_players where game_id = _game_id and profile_id = _uid;
  if _hand is null then
    raise exception 'not_in_game';
  end if;

  for _elem in select * from jsonb_array_elements(_hand) loop
    if _elem ->> 'card_id' = _card_id and _idx is null then
      _idx := _i;
    else
      _new_hand := _new_hand || jsonb_build_array(_elem);
    end if;
    _i := _i + 1;
  end loop;

  if _idx is null then
    raise exception 'card_not_in_hand';
  end if;

  select id, name, category, purchase_price, base_value, passive_income, description
    into _card from public.card_catalog where id = _card_id;

  _multiplier := coalesce((_game.market ->> _card.category)::numeric, 1.0);
  _price := round(_card.purchase_price * _multiplier);

  if _cash < _price then
    raise exception 'insufficient_funds';
  end if;

  update public.game_players
    set cash = cash - _price,
        hand = _new_hand,
        assets = assets || jsonb_build_array(jsonb_build_object(
          'instance_id', gen_random_uuid(),
          'card_id', _card.id,
          'name', _card.name,
          'category', _card.category,
          'base_value', _card.base_value,
          'passive_income', _card.passive_income,
          'bought_at_price', _price,
          'acquired_age', _game.age
        ))
    where game_id = _game_id and profile_id = _uid;

  perform private.recompute_player(_game_id, _uid);
end;
$$;
