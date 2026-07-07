-- Net Worth — initial schema
-- Tables, RLS policies, security-definer RPCs, realtime publication, storage.

create extension if not exists pgcrypto;

-- ============================================================================
-- TABLES
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{1,10}$'),
  avatar_url text,
  games_played integer not null default 0,
  wins integer not null default 0,
  best_net_worth bigint not null default 0,
  created_at timestamptz not null default now()
);

create unique index profiles_username_lower_idx on public.profiles (lower(username));

create table public.credentials (
  profile_id uuid primary key references public.profiles (id) on delete cascade on update cascade,
  pin_hash text not null,
  updated_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null check (char_length(trim(name)) between 1 and 40),
  host_id uuid not null references public.profiles (id) on delete cascade on update cascade,
  status text not null default 'lobby' check (status in ('lobby', 'in_game', 'finished')),
  is_public boolean not null default true,
  max_players integer not null check (max_players between 2 and 10),
  win_condition jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rooms_public_lobby_idx on public.rooms (created_at desc) where is_public and status = 'lobby';
create index rooms_host_id_idx on public.rooms (host_id);

create table public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade on update cascade,
  seat integer,
  is_ready boolean not null default false,
  is_host boolean not null default false,
  is_spectator boolean not null default false,
  connected boolean not null default true,
  token_color text,
  joined_at timestamptz not null default now(),
  unique (room_id, profile_id)
);

create index room_players_room_id_idx on public.room_players (room_id);
create index room_players_profile_id_idx on public.room_players (profile_id);
create unique index room_players_room_seat_idx on public.room_players (room_id, seat) where seat is not null;

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade on update cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index chat_messages_room_id_idx on public.chat_messages (room_id, created_at);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references public.rooms (id) on delete cascade,
  state jsonb not null,
  turn integer not null default 0,
  round integer not null default 1,
  current_seat integer not null default 0,
  market jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.game_actions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade on update cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

create index game_actions_game_id_idx on public.game_actions (game_id, processed);

create table public.game_log (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  seq integer not null,
  entry jsonb not null,
  created_at timestamptz not null default now(),
  unique (game_id, seq)
);

create index game_log_game_id_idx on public.game_log (game_id, seq);

-- ============================================================================
-- updated_at TRIGGERS
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger rooms_set_updated_at
  before update on public.rooms
  for each row execute function public.set_updated_at();

create trigger games_set_updated_at
  before update on public.games
  for each row execute function public.set_updated_at();

-- ============================================================================
-- RLS HELPER FUNCTIONS (security definer — bypass RLS for membership checks
-- to avoid recursive-policy pitfalls; each returns only a boolean/id, no rows)
-- ============================================================================

create or replace function public.is_room_member(_room_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.room_players
    where room_id = _room_id and profile_id = auth.uid()
  );
$$;

create or replace function public.is_room_host(_room_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.rooms
    where id = _room_id and host_id = auth.uid()
  );
$$;

create or replace function public.game_room_id(_game_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select room_id from public.games where id = _game_id;
$$;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.credentials enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.chat_messages enable row level security;
alter table public.games enable row level security;
alter table public.game_actions enable row level security;
alter table public.game_log enable row level security;

-- profiles: public read (leaderboard, rosters, chat); self can only edit avatar
create policy "profiles_select_all" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

revoke update on public.profiles from authenticated;
grant update (avatar_url) on public.profiles to authenticated;

-- credentials: no client policies at all — service role (edge function) only

-- rooms: visible if public, a member, or the host; only name/win_condition/
-- max_players are directly client-editable — status/host_id/code changes are
-- gated behind the RPCs below (security definer, run as table owner)
create policy "rooms_select" on public.rooms
  for select using (
    is_public or public.is_room_member(id) or host_id = auth.uid()
  );

create policy "rooms_update_host" on public.rooms
  for update using (host_id = auth.uid()) with check (host_id = auth.uid());

revoke update on public.rooms from authenticated;
grant update (name, win_condition, max_players) on public.rooms to authenticated;

-- room_players: visible to members (or previewers of a public room); a player
-- may only edit their own ready/connected flags. Join/leave/kick/transfer all
-- go through RPCs so host-reassignment and capacity rules always run.
create policy "room_players_select" on public.room_players
  for select using (
    public.is_room_member(room_id)
    or exists (select 1 from public.rooms r where r.id = room_id and r.is_public)
  );

create policy "room_players_update_own" on public.room_players
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

revoke update on public.room_players from authenticated;
grant update (is_ready, connected) on public.room_players to authenticated;

-- chat_messages: members only, immutable once sent
create policy "chat_messages_select" on public.chat_messages
  for select using (public.is_room_member(room_id));

create policy "chat_messages_insert" on public.chat_messages
  for insert with check (profile_id = auth.uid() and public.is_room_member(room_id));

-- games: members can read; all writes go through host-only RPCs
create policy "games_select" on public.games
  for select using (public.is_room_member(room_id));

-- game_actions: members submit intents; only the host may mark them processed
create policy "game_actions_select" on public.game_actions
  for select using (public.is_room_member(public.game_room_id(game_id)));

create policy "game_actions_insert" on public.game_actions
  for insert with check (
    profile_id = auth.uid() and public.is_room_member(public.game_room_id(game_id))
  );

create policy "game_actions_update_host" on public.game_actions
  for update using (public.is_room_host(public.game_room_id(game_id)))
  with check (public.is_room_host(public.game_room_id(game_id)));

revoke update on public.game_actions from authenticated;
grant update (processed) on public.game_actions to authenticated;

-- game_log: members can read; only the host appends entries
create policy "game_log_select" on public.game_log
  for select using (public.is_room_member(public.game_room_id(game_id)));

create policy "game_log_insert_host" on public.game_log
  for insert with check (public.is_room_host(public.game_room_id(game_id)));

-- ============================================================================
-- BUSINESS RPCs (security definer — atomic, authorization-checked mutations)
-- ============================================================================

create or replace function public.create_room(
  _name text,
  _max_players integer,
  _is_public boolean,
  _win_condition jsonb
) returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  _code text;
  _room public.rooms;
  _uid uuid := auth.uid();
  _palette text[] := array['emerald','gold','sky','rose','violet','amber','cyan','fuchsia','lime','orange'];
begin
  if _uid is null then
    raise exception 'not_authenticated';
  end if;
  if _max_players < 2 or _max_players > 10 then
    raise exception 'invalid_max_players';
  end if;
  if length(trim(_name)) = 0 or length(_name) > 40 then
    raise exception 'invalid_room_name';
  end if;

  loop
    _code := lpad(floor(random() * 10000)::int::text, 4, '0');
    exit when not exists (select 1 from public.rooms where code = _code);
  end loop;

  insert into public.rooms (name, host_id, is_public, max_players, win_condition, code)
  values (_name, _uid, _is_public, _max_players, _win_condition, _code)
  returning * into _room;

  insert into public.room_players (room_id, profile_id, seat, is_host, is_ready, is_spectator, token_color)
  values (_room.id, _uid, 0, true, false, false, _palette[1]);

  return _room;
end;
$$;

create or replace function public.join_room(
  _room_id uuid default null,
  _code text default null,
  _as_spectator boolean default false
) returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  _room public.rooms;
  _uid uuid := auth.uid();
  _count integer;
  _seat integer;
  _palette text[] := array['emerald','gold','sky','rose','violet','amber','cyan','fuchsia','lime','orange'];
begin
  if _uid is null then
    raise exception 'not_authenticated';
  end if;

  if _room_id is not null then
    select * into _room from public.rooms where id = _room_id;
  elsif _code is not null then
    select * into _room from public.rooms where code = _code;
  else
    raise exception 'missing_room_reference';
  end if;

  if _room.id is null then
    raise exception 'room_not_found';
  end if;

  if exists (select 1 from public.room_players where room_id = _room.id and profile_id = _uid) then
    return _room;
  end if;

  if _room.status <> 'lobby' and not _as_spectator then
    raise exception 'room_not_joinable';
  end if;

  if _as_spectator then
    insert into public.room_players (room_id, profile_id, seat, is_host, is_ready, is_spectator, token_color)
    values (_room.id, _uid, null, false, true, true, null);
    return _room;
  end if;

  select count(*) into _count from public.room_players where room_id = _room.id and not is_spectator;
  if _count >= _room.max_players then
    raise exception 'room_full';
  end if;

  select min(s) into _seat
  from generate_series(0, _room.max_players - 1) s
  where not exists (select 1 from public.room_players where room_id = _room.id and seat = s);

  insert into public.room_players (room_id, profile_id, seat, is_host, is_ready, is_spectator, token_color)
  values (_room.id, _uid, _seat, false, false, false, _palette[_seat + 1]);

  return _room;
end;
$$;

create or replace function public.leave_room(_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _was_host boolean;
  _next uuid;
begin
  select is_host into _was_host from public.room_players
    where room_id = _room_id and profile_id = _uid;

  if _was_host is null then
    return;
  end if;

  delete from public.room_players where room_id = _room_id and profile_id = _uid;

  if _was_host then
    select profile_id into _next from public.room_players
      where room_id = _room_id and not is_spectator
      order by seat asc limit 1;

    if _next is not null then
      update public.rooms set host_id = _next where id = _room_id;
      update public.room_players set is_host = true where room_id = _room_id and profile_id = _next;
    else
      delete from public.rooms where id = _room_id;
    end if;
  end if;
end;
$$;

create or replace function public.kick_player(_room_id uuid, _target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_room_host(_room_id) then
    raise exception 'not_host';
  end if;
  if _target = auth.uid() then
    raise exception 'cannot_kick_self';
  end if;
  delete from public.room_players where room_id = _room_id and profile_id = _target;
end;
$$;

create or replace function public.transfer_host(_room_id uuid, _target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_room_host(_room_id) then
    raise exception 'not_host';
  end if;
  if not exists (
    select 1 from public.room_players where room_id = _room_id and profile_id = _target and not is_spectator
  ) then
    raise exception 'target_not_in_room';
  end if;

  update public.rooms set host_id = _target where id = _room_id;
  update public.room_players set is_host = (profile_id = _target) where room_id = _room_id;
end;
$$;

create or replace function public.start_game(_room_id uuid, _initial_state jsonb)
returns public.games
language plpgsql
security definer
set search_path = public
as $$
declare
  _game public.games;
  _ready_count integer;
  _total integer;
begin
  if not exists (
    select 1 from public.rooms where id = _room_id and host_id = auth.uid() and status = 'lobby'
  ) then
    raise exception 'not_host_or_not_in_lobby';
  end if;

  select count(*) filter (where is_ready), count(*)
    into _ready_count, _total
    from public.room_players where room_id = _room_id and not is_spectator;

  if _total < 2 then
    raise exception 'not_enough_players';
  end if;
  if _ready_count < _total then
    raise exception 'players_not_ready';
  end if;

  update public.rooms set status = 'in_game' where id = _room_id;

  insert into public.games (room_id, state, turn, round, current_seat, market)
  values (_room_id, _initial_state, 0, 1, 0, '{}'::jsonb)
  returning * into _game;

  return _game;
end;
$$;

create or replace function public.sync_game_state(
  _room_id uuid,
  _state jsonb,
  _turn integer,
  _round integer,
  _current_seat integer,
  _market jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_room_host(_room_id) then
    raise exception 'not_host';
  end if;

  update public.games
    set state = _state, turn = _turn, round = _round,
        current_seat = _current_seat, market = _market, updated_at = now()
    where room_id = _room_id;
end;
$$;

create or replace function public.finish_game(_room_id uuid, _final_state jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.rooms where id = _room_id and host_id = auth.uid() and status = 'in_game'
  ) then
    raise exception 'not_host_or_not_in_game';
  end if;

  update public.rooms set status = 'finished' where id = _room_id;
  update public.games set state = _final_state, updated_at = now() where room_id = _room_id;
end;
$$;

create or replace function public.submit_game_result(_room_id uuid, _net_worth bigint, _won boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
begin
  if not exists (select 1 from public.room_players where room_id = _room_id and profile_id = _uid) then
    raise exception 'not_in_room';
  end if;
  if not exists (select 1 from public.rooms where id = _room_id and status = 'finished') then
    raise exception 'game_not_finished';
  end if;

  update public.profiles
    set games_played = games_played + 1,
        wins = wins + (case when _won then 1 else 0 end),
        best_net_worth = greatest(best_net_worth, _net_worth)
    where id = _uid;
end;
$$;

revoke all on function
  public.create_room(text, integer, boolean, jsonb),
  public.join_room(uuid, text, boolean),
  public.leave_room(uuid),
  public.kick_player(uuid, uuid),
  public.transfer_host(uuid, uuid),
  public.start_game(uuid, jsonb),
  public.sync_game_state(uuid, jsonb, integer, integer, integer, jsonb),
  public.finish_game(uuid, jsonb),
  public.submit_game_result(uuid, bigint, boolean)
from public;

grant execute on function
  public.create_room(text, integer, boolean, jsonb),
  public.join_room(uuid, text, boolean),
  public.leave_room(uuid),
  public.kick_player(uuid, uuid),
  public.transfer_host(uuid, uuid),
  public.start_game(uuid, jsonb),
  public.sync_game_state(uuid, jsonb, integer, integer, integer, jsonb),
  public.finish_game(uuid, jsonb),
  public.submit_game_result(uuid, bigint, boolean)
to authenticated;

-- ============================================================================
-- REALTIME
-- ============================================================================

alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_players;
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.game_actions;
alter publication supabase_realtime add table public.game_log;

alter table public.rooms replica identity full;
alter table public.room_players replica identity full;
alter table public.games replica identity full;
alter table public.game_actions replica identity full;

-- ============================================================================
-- STORAGE — avatars bucket, owner-scoped write, public read
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_update" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
