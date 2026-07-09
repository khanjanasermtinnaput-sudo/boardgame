-- Phase 1 (Investment) -> Phase 2: roll a Global Event (50% positive_market /
-- 30% economic_slowdown / 20% black_event), apply its category multiplier
-- deltas to the shared market.
create function private.resolve_phase_1_to_2(_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _game public.games;
  _roll numeric := random();
  _type text;
  _event record;
  _new_market jsonb;
begin
  select * into _game from public.games where id = _game_id;

  if _roll < 0.5 then
    _type := 'positive_market';
  elsif _roll < 0.8 then
    _type := 'economic_slowdown';
  else
    _type := 'black_event';
  end if;

  select id, name, type, description, effects into _event
    from public.global_event_catalog where type = _type order by random() limit 1;

  _new_market := private.apply_market_effects(_game.market, _event.effects);

  update public.games
    set market = _new_market,
        global_event = jsonb_build_object(
          'id', _event.id, 'name', _event.name, 'type', _event.type,
          'description', _event.description, 'effects', _event.effects
        ),
        phase = 2
    where id = _game_id;
end;
$$;

-- Phase 2 (Global Event) -> Phase 3: deal one distinct Personal Event to
-- each player (no two players in the same round get the same card) and
-- apply its effect immediately.
create function private.resolve_phase_2_to_3(_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  _game_age integer;
begin
  select age into _game_age from public.games where id = _game_id;

  with shuffled_events as (
    select id, name, description, effect_kind, amount, pct,
           row_number() over (order by random()) as rn
    from public.personal_event_catalog
  ),
  shuffled_players as (
    select profile_id, row_number() over (order by random()) as rn
    from public.game_players where game_id = _game_id
  )
  update public.game_players gp
    set personal_event = jsonb_build_object(
      'id', se.id, 'name', se.name, 'description', se.description,
      'effect_kind', se.effect_kind, 'amount', se.amount, 'pct', se.pct
    )
    from shuffled_players sp
    join shuffled_events se on se.rn = sp.rn
    where gp.game_id = _game_id and gp.profile_id = sp.profile_id;

  for rec in
    select profile_id, personal_event, net_worth
    from public.game_players where game_id = _game_id
  loop
    if rec.personal_event ->> 'effect_kind' = 'cash' then
      update public.game_players
        set cash = cash + (rec.personal_event ->> 'amount')::bigint
        where game_id = _game_id and profile_id = rec.profile_id;

    elsif rec.personal_event ->> 'effect_kind' = 'cash_pct_net_worth' then
      update public.game_players
        set cash = cash + round(rec.net_worth * (rec.personal_event ->> 'pct')::numeric)
        where game_id = _game_id and profile_id = rec.profile_id;

    elsif rec.personal_event ->> 'effect_kind' = 'salary' then
      update public.game_players
        set salary = greatest(0, salary + (rec.personal_event ->> 'amount')::bigint)
        where game_id = _game_id and profile_id = rec.profile_id;

    elsif rec.personal_event ->> 'effect_kind' = 'grant_card' then
      declare
        _card record;
      begin
        select id, name, category, base_value, passive_income into _card
          from public.card_catalog order by random() limit 1;

        update public.game_players
          set assets = assets || jsonb_build_array(jsonb_build_object(
            'instance_id', gen_random_uuid(),
            'card_id', _card.id, 'name', _card.name, 'category', _card.category,
            'base_value', _card.base_value, 'passive_income', _card.passive_income,
            'bought_at_price', 0, 'acquired_age', _game_age
          ))
          where game_id = _game_id and profile_id = rec.profile_id;
      end;
    end if;

    perform private.recompute_player(_game_id, rec.profile_id);
  end loop;

  update public.games set phase = 3 where id = _game_id;
end;
$$;

-- Phase 3 (Personal Event) -> Phase 4: compute income/expense for every
-- player, accrue loan interest onto outstanding debt (compounds if unpaid).
create function private.resolve_phase_3_to_4(_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _game public.games;
  rec record;
  _maintenance bigint;
  _living_cost bigint;
  _gross_income bigint;
  _tax bigint;
  _net_change bigint;
  _debt_count integer;
  _rate numeric;
  _interest_total bigint;
  _new_debts jsonb;
  _elem jsonb;
  _outstanding bigint;
  _accrued bigint;
begin
  select * into _game from public.games where id = _game_id;

  for rec in
    select profile_id, cash, salary, passive_income, assets, debts
    from public.game_players where game_id = _game_id
  loop
    select coalesce(round(sum((a ->> 'base_value')::bigint) * 0.02), 0) into _maintenance
      from jsonb_array_elements(rec.assets) a;

    _living_cost := round(800 + (_game.age - 20)::numeric / 10 * 200);
    _gross_income := rec.salary + rec.passive_income;
    _tax := round(_gross_income * 0.15);
    _net_change := _gross_income - _living_cost - _maintenance - _tax;

    _debt_count := jsonb_array_length(rec.debts);
    _rate := case
      when _debt_count = 0 then 0
      when _debt_count = 1 then 0.05
      when _debt_count = 2 then 0.10
      when _debt_count = 3 then 0.20
      when _debt_count = 4 then 0.30
      when _debt_count = 5 then 0.40
      when _debt_count = 6 then 0.50
      else 0.50 + 0.05 * (_debt_count - 6)
    end;

    _new_debts := '[]'::jsonb;
    _interest_total := 0;
    for _elem in select * from jsonb_array_elements(rec.debts) loop
      _outstanding := (_elem ->> 'outstanding')::bigint;
      _accrued := round(_outstanding * _rate);
      _interest_total := _interest_total + _accrued;
      _new_debts := _new_debts || jsonb_build_array(jsonb_set(_elem, '{outstanding}', to_jsonb(_outstanding + _accrued)));
    end loop;

    update public.game_players
      set cash = cash + _net_change,
          debts = _new_debts,
          income_summary = jsonb_build_object(
            'salary', rec.salary,
            'passive_income', rec.passive_income,
            'gross_income', _gross_income,
            'living_cost', _living_cost,
            'maintenance', _maintenance,
            'tax', _tax,
            'net_change', _net_change,
            'debt_count', _debt_count,
            'interest_rate', _rate,
            'interest_total', _interest_total
          )
      where game_id = _game_id and profile_id = rec.profile_id;

    perform private.recompute_player(_game_id, rec.profile_id);
  end loop;

  update public.games set phase = 4 where id = _game_id;
end;
$$;

-- Phase 4 (Income & Expense) -> Phase 5: refill every hand back to 6 cards.
create function private.resolve_phase_4_to_5(_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  _need integer;
begin
  for rec in select profile_id, hand from public.game_players where game_id = _game_id loop
    _need := 6 - jsonb_array_length(rec.hand);
    if _need > 0 then
      perform private.draw_cards(_game_id, rec.profile_id, _need);
    end if;
  end loop;

  update public.games set phase = 5 where id = _game_id;
end;
$$;

-- Phase 5 (Refill) -> next age (or end game at age 70): rank by net worth,
-- write results, bump profile stats, mark the room/game finished.
create function private.resolve_phase_5_to_next(_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _game public.games;
  rec record;
begin
  select * into _game from public.games where id = _game_id;

  if _game.age >= 70 then
    for rec in
      select profile_id, net_worth,
             row_number() over (order by net_worth desc) as rn
      from public.game_players where game_id = _game_id
    loop
      insert into public.game_results (room_id, profile_id, net_worth, won)
        values (_game.room_id, rec.profile_id, rec.net_worth, rec.rn = 1)
        on conflict (room_id, profile_id) do nothing;

      update public.profiles
        set games_played = games_played + 1,
            wins = wins + (case when rec.rn = 1 then 1 else 0 end),
            best_net_worth = greatest(best_net_worth, rec.net_worth)
        where id = rec.profile_id;
    end loop;

    update public.games set status = 'finished' where id = _game_id;
    update public.rooms set status = 'finished' where id = _game.room_id;
  else
    update public.games
      set age = age + 10, phase = 1, round_no = round_no + 1
      where id = _game_id;
  end if;
end;
$$;

-- Sets the caller's ready flag for the current phase. When it becomes the
-- LAST ready flag among all players in the game, resolves the current
-- phase and advances. `select ... for update` on the games row makes this
-- a per-game mutex: every call (ready or unready, from any player) fully
-- serializes against every other call for the same game, so exactly one
-- caller ever performs a given phase resolution and no action can sneak in
-- after a phase has already advanced.
create function public.game_set_ready(_game_id uuid, _ready boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _game public.games;
  _ready_count integer;
  _total integer;
  _phase smallint;
begin
  select * into _game from public.games where id = _game_id for update;
  if _game.id is null then
    raise exception 'game_not_found';
  end if;
  if _game.status <> 'active' then
    raise exception 'game_not_active';
  end if;

  if not exists (
    select 1 from public.game_players where game_id = _game_id and profile_id = _uid
  ) then
    raise exception 'not_in_game';
  end if;

  update public.game_players
    set ready = _ready, updated_at = now()
    where game_id = _game_id and profile_id = _uid;

  if not _ready then
    return;
  end if;

  select count(*) filter (where ready), count(*)
    into _ready_count, _total
    from public.game_players where game_id = _game_id;

  if _ready_count < _total then
    return;
  end if;

  _phase := _game.phase;

  if _phase = 1 then
    perform private.resolve_phase_1_to_2(_game_id);
  elsif _phase = 2 then
    perform private.resolve_phase_2_to_3(_game_id);
  elsif _phase = 3 then
    perform private.resolve_phase_3_to_4(_game_id);
  elsif _phase = 4 then
    perform private.resolve_phase_4_to_5(_game_id);
  elsif _phase = 5 then
    perform private.resolve_phase_5_to_next(_game_id);
  end if;

  update public.game_players set ready = false where game_id = _game_id;
end;
$$;

revoke all on function public.game_set_ready(uuid, boolean) from public;
grant execute on function public.game_set_ready(uuid, boolean) to authenticated;
