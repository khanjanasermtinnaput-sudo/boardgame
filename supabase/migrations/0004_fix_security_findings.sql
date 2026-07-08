-- Fix findings from the adversarial security/QA pass:
--  1. (F1) submit_game_result trusted a client-supplied net worth/win flag
--     with no idempotency guard, letting any player forge leaderboard wins
--     and inflate games_played/wins/best_net_worth by re-calling the RPC.
--     Fix: the host now writes a per-player final_results snapshot when it
--     calls finish_game (same trust level as the rest of the authoritative
--     game state); submit_game_result reads the caller's own entry from
--     that snapshot instead of accepting client-supplied values, and a new
--     game_results table gives it a real once-per-(room,profile) guard.
--  2. (F2) The account edge function had no PIN attempt limit — schema
--     support for a failed-attempt counter + lockout window (enforced in
--     the edge function itself, since bcrypt verification happens there).
--  3. (F6) chat_messages had no insert rate limit — a member could flood a
--     room. Add a per-profile rate-limit trigger.

-- ============================================================================
-- F1 — server-derived, idempotent game results
-- ============================================================================

alter table public.games add column final_results jsonb not null default '{}'::jsonb;

create table public.game_results (
  room_id uuid not null references public.rooms (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade on update cascade,
  net_worth bigint not null,
  won boolean not null,
  created_at timestamptz not null default now(),
  primary key (room_id, profile_id)
);

alter table public.game_results enable row level security;

create policy "game_results_select" on public.game_results
  for select using (
    profile_id = (select auth.uid()) or private.is_room_member(room_id)
  );

-- No insert/update/delete client policies — writes only happen inside the
-- security-definer submit_game_result RPC below.

-- Old signatures must be dropped explicitly: CREATE OR REPLACE with a
-- different argument list creates a new overload rather than replacing the
-- original, leaving the old (vulnerable) function reachable.
drop function if exists public.finish_game(uuid, jsonb);
drop function if exists public.submit_game_result(uuid, bigint, boolean);
drop function if exists public.sync_game_state(uuid, jsonb, integer, integer, integer, jsonb);

-- F5 — both state-persisting RPCs take an optional _processed_action_id so
-- the host loop can mark a queued action's game_actions row processed in
-- the SAME transaction as persisting the state it produced. Previously
-- these were two separate round trips; if the host crashed between them, a
-- fully-applied-and-persisted action could still be picked up as
-- "unprocessed" by the next host and re-applied on top of state that
-- already reflected it (double-charge, double-move, etc. on host failover).

create function public.finish_game(
  _room_id uuid,
  _final_state jsonb,
  _final_results jsonb,
  _processed_action_id uuid default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _game_id uuid;
begin
  if not exists (
    select 1 from public.rooms where id = _room_id and host_id = auth.uid() and status = 'in_game'
  ) then
    raise exception 'not_host_or_not_in_game';
  end if;

  update public.rooms set status = 'finished' where id = _room_id;
  update public.games
    set state = _final_state, final_results = _final_results, updated_at = now()
    where room_id = _room_id
    returning id into _game_id;

  if _processed_action_id is not null then
    update public.game_actions set processed = true
      where id = _processed_action_id and game_id = _game_id;
  end if;
end;
$$;

create function public.sync_game_state(
  _room_id uuid,
  _state jsonb,
  _turn integer,
  _round integer,
  _current_seat integer,
  _market jsonb,
  _processed_action_id uuid default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _game_id uuid;
begin
  if not private.is_room_host(_room_id) then
    raise exception 'not_host';
  end if;

  update public.games
    set state = _state, turn = _turn, round = _round,
        current_seat = _current_seat, market = _market, updated_at = now()
    where room_id = _room_id
    returning id into _game_id;

  if _processed_action_id is not null then
    update public.game_actions set processed = true
      where id = _processed_action_id and game_id = _game_id;
  end if;
end;
$$;

revoke all on function public.sync_game_state(uuid, jsonb, integer, integer, integer, jsonb, uuid) from public;
grant execute on function public.sync_game_state(uuid, jsonb, integer, integer, integer, jsonb, uuid) to authenticated;

create function public.submit_game_result(_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _result jsonb;
  _net_worth bigint;
  _won boolean;
begin
  if not exists (select 1 from public.room_players where room_id = _room_id and profile_id = _uid) then
    raise exception 'not_in_room';
  end if;
  if not exists (select 1 from public.rooms where id = _room_id and status = 'finished') then
    raise exception 'game_not_finished';
  end if;

  select final_results -> _uid::text into _result from public.games where room_id = _room_id;
  if _result is null then
    raise exception 'no_result_for_player';
  end if;

  _net_worth := (_result ->> 'net_worth')::bigint;
  _won := (_result ->> 'won')::boolean;

  insert into public.game_results (room_id, profile_id, net_worth, won)
  values (_room_id, _uid, _net_worth, _won)
  on conflict (room_id, profile_id) do nothing;

  if not found then
    -- Already recorded for this (room, profile) — idempotent no-op so a
    -- retried or repeated client call can never double-count stats.
    return;
  end if;

  update public.profiles
    set games_played = games_played + 1,
        wins = wins + (case when _won then 1 else 0 end),
        best_net_worth = greatest(best_net_worth, _net_worth)
    where id = _uid;
end;
$$;

revoke all on function public.finish_game(uuid, jsonb, jsonb, uuid) from public;
revoke all on function public.submit_game_result(uuid) from public;
grant execute on function public.finish_game(uuid, jsonb, jsonb, uuid) to authenticated;
grant execute on function public.submit_game_result(uuid) to authenticated;

-- ============================================================================
-- F2 — PIN brute-force lockout (schema support; enforced in the account
-- edge function, which is the only place the PIN hash is ever compared)
-- ============================================================================

alter table public.credentials add column failed_attempts integer not null default 0;
alter table public.credentials add column locked_until timestamptz;

-- ============================================================================
-- F6 — chat flood protection: max 5 messages per profile per 10 seconds
-- ============================================================================

create function private.enforce_chat_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _recent_count integer;
begin
  select count(*) into _recent_count
    from public.chat_messages
    where profile_id = new.profile_id
      and created_at > now() - interval '10 seconds';

  if _recent_count >= 5 then
    raise exception 'rate_limited';
  end if;

  return new;
end;
$$;

create trigger chat_messages_rate_limit
  before insert on public.chat_messages
  for each row execute function private.enforce_chat_rate_limit();
