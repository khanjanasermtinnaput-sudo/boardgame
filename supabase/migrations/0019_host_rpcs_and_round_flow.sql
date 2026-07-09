-- Host/banker foundation, part 2: host-only RPCs (round advance, banker
-- adjustments, pause/resume, kick) and the new round choreography.
--
-- Round choreography: phase 1 becomes "Awaiting Round Start" — nothing
-- resolves automatically here; only the room host may call
-- game_host_advance, which rolls a cosmetic 2d6 + tile index, records it on
-- games.last_roll, and reuses resolve_phase_1_to_2 (unchanged) to reveal
-- this round's market/tile event and open phase 2, "Invest/Buy". Phase 2 is
-- the single remaining ready-gated phase: once every player readies up,
-- game_set_ready chains straight through the existing
-- resolve_phase_2_to_3 -> _3_to_4 -> _4_to_5 -> _5_to_next resolvers
-- (crisis, interest/dividend, refill, then age advance or the untouched
-- age-70 end-game ranking) and lands back at phase 1 for the next round.

-- ============================================================================
-- Host RPCs — security definer, gated by private.is_room_host, never write
-- net_worth directly (always re-derived via private.recompute_player).
-- ============================================================================

create function public.game_host_advance(_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _game public.games;
  _die1 integer;
  _die2 integer;
  _tile_index integer;
begin
  select * into _game from public.games where id = _game_id for update;
  if _game.id is null then
    raise exception 'game_not_found';
  end if;
  if not private.is_room_host(_game.room_id) then
    raise exception 'not_host';
  end if;
  if _game.status <> 'active' then
    raise exception 'game_not_active';
  end if;
  if _game.paused then
    raise exception 'game_paused';
  end if;
  if _game.phase <> 1 then
    raise exception 'not_awaiting_round';
  end if;

  _die1 := 1 + floor(random() * 6)::integer;
  _die2 := 1 + floor(random() * 6)::integer;
  _tile_index := floor(random() * 12)::integer; -- purely cosmetic; 12-tile ring

  update public.games
    set last_roll = jsonb_build_object(
      'die1', _die1, 'die2', _die2, 'total', _die1 + _die2, 'tile_index', _tile_index
    )
    where id = _game_id;

  perform private.resolve_phase_1_to_2(_game_id);

  update public.game_players set ready = false where game_id = _game_id;

  insert into public.game_log (game_id, actor_profile_id, kind, entry)
    values (_game_id, auth.uid(), 'round_advance', jsonb_build_object(
      'age', _game.age, 'round_no', _game.round_no,
      'die1', _die1, 'die2', _die2, 'total', _die1 + _die2, 'tile_index', _tile_index
    ));
end;
$$;

create function public.game_host_adjust_player(
  _game_id uuid,
  _target uuid,
  _cash_delta bigint default 0,
  _hand_add jsonb default '[]'::jsonb,
  _asset_add jsonb default '[]'::jsonb,
  _debt_add jsonb default '[]'::jsonb,
  _reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _game public.games;
  _exists boolean;
begin
  select * into _game from public.games where id = _game_id for update;
  if _game.id is null then
    raise exception 'game_not_found';
  end if;
  if not private.is_room_host(_game.room_id) then
    raise exception 'not_host';
  end if;
  if _game.status <> 'active' then
    raise exception 'game_not_active';
  end if;

  select exists (
    select 1 from public.game_players where game_id = _game_id and profile_id = _target
  ) into _exists;
  if not _exists then
    raise exception 'not_in_game';
  end if;

  update public.game_players
    set cash = cash + coalesce(_cash_delta, 0),
        hand = hand || coalesce(_hand_add, '[]'::jsonb),
        assets = assets || coalesce(_asset_add, '[]'::jsonb),
        debts = debts || coalesce(_debt_add, '[]'::jsonb)
    where game_id = _game_id and profile_id = _target;

  perform private.recompute_player(_game_id, _target);

  insert into public.game_log (game_id, actor_profile_id, kind, entry)
    values (_game_id, auth.uid(), 'host_adjust_player', jsonb_build_object(
      'target', _target,
      'cash_delta', coalesce(_cash_delta, 0),
      'hand_add', coalesce(_hand_add, '[]'::jsonb),
      'asset_add', coalesce(_asset_add, '[]'::jsonb),
      'debt_add', coalesce(_debt_add, '[]'::jsonb),
      'reason', _reason
    ));
end;
$$;

create function public.game_host_set_paused(_game_id uuid, _paused boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _game public.games;
begin
  select * into _game from public.games where id = _game_id for update;
  if _game.id is null then
    raise exception 'game_not_found';
  end if;
  if not private.is_room_host(_game.room_id) then
    raise exception 'not_host';
  end if;
  if _game.status <> 'active' then
    raise exception 'game_not_active';
  end if;

  update public.games set paused = _paused where id = _game_id;

  insert into public.game_log (game_id, actor_profile_id, kind, entry)
    values (_game_id, auth.uid(), 'host_set_paused', jsonb_build_object('paused', _paused));
end;
$$;

create function public.game_host_kick(_game_id uuid, _target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _game public.games;
begin
  select * into _game from public.games where id = _game_id for update;
  if _game.id is null then
    raise exception 'game_not_found';
  end if;
  if not private.is_room_host(_game.room_id) then
    raise exception 'not_host';
  end if;
  if _target = auth.uid() then
    raise exception 'cannot_kick_self';
  end if;
  if _game.status <> 'active' then
    raise exception 'game_not_active';
  end if;

  delete from public.game_players where game_id = _game_id and profile_id = _target;
  delete from public.room_players where room_id = _game.room_id and profile_id = _target;

  insert into public.game_log (game_id, actor_profile_id, kind, entry)
    values (_game_id, auth.uid(), 'host_kick', jsonb_build_object('target', _target));
end;
$$;

revoke all on function
  public.game_host_advance(uuid),
  public.game_host_adjust_player(uuid, uuid, bigint, jsonb, jsonb, jsonb, text),
  public.game_host_set_paused(uuid, boolean),
  public.game_host_kick(uuid, uuid)
from public;

grant execute on function
  public.game_host_advance(uuid),
  public.game_host_adjust_player(uuid, uuid, bigint, jsonb, jsonb, jsonb, text),
  public.game_host_set_paused(uuid, boolean),
  public.game_host_kick(uuid, uuid)
to authenticated;

-- ============================================================================
-- game_set_ready — dispatch narrows to phase 2 only (the buy phase). Phase 1
-- ("Awaiting Round Start") never auto-resolves from ready flags; only the
-- host's game_host_advance moves it forward. Membership/mutex/paused checks
-- otherwise unchanged.
-- ============================================================================

create or replace function public.game_set_ready(_game_id uuid, _ready boolean)
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
  if _game.paused then
    raise exception 'game_paused';
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

  if _phase = 2 then
    perform private.resolve_phase_2_to_3(_game_id);
    perform private.resolve_phase_3_to_4(_game_id);
    perform private.resolve_phase_4_to_5(_game_id);
    perform private.resolve_phase_5_to_next(_game_id);
    update public.game_players set ready = false where game_id = _game_id;
  end if;
  -- phase 1: ready is advisory only here — game_host_advance (not this
  -- function) is what starts the round and clears ready flags.
end;
$$;
