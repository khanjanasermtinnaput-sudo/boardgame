-- Harden security per advisor findings:
--  1. Move RLS helper functions to a `private` schema so they are not
--     reachable as public RPC endpoints (PostgREST only exposes `public`).
--  2. Fix `set_updated_at` missing search_path.
--  3. Restrict the avatars bucket SELECT policy so it can't be used to list
--     every file in the bucket (public URL access is unaffected — that path
--     bypasses RLS entirely for public buckets).

create schema if not exists private;
grant usage on schema private to authenticated;

-- Drop policies that depend on the soon-to-be-relocated helper functions.
drop policy "rooms_select" on public.rooms;
drop policy "room_players_select" on public.room_players;
drop policy "chat_messages_select" on public.chat_messages;
drop policy "chat_messages_insert" on public.chat_messages;
drop policy "games_select" on public.games;
drop policy "game_actions_select" on public.game_actions;
drop policy "game_actions_insert" on public.game_actions;
drop policy "game_actions_update_host" on public.game_actions;
drop policy "game_log_select" on public.game_log;
drop policy "game_log_insert_host" on public.game_log;

drop function public.is_room_member(uuid);
drop function public.is_room_host(uuid);
drop function public.game_room_id(uuid);

create function private.is_room_member(_room_id uuid)
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

create function private.is_room_host(_room_id uuid)
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

create function private.game_room_id(_game_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select room_id from public.games where id = _game_id;
$$;

revoke all on function
  private.is_room_member(uuid),
  private.is_room_host(uuid),
  private.game_room_id(uuid)
from public;

grant execute on function
  private.is_room_member(uuid),
  private.is_room_host(uuid),
  private.game_room_id(uuid)
to authenticated;

-- Recreate the dependent policies against the relocated functions.
create policy "rooms_select" on public.rooms
  for select using (
    is_public or private.is_room_member(id) or host_id = auth.uid()
  );

create policy "room_players_select" on public.room_players
  for select using (
    private.is_room_member(room_id)
    or exists (select 1 from public.rooms r where r.id = room_id and r.is_public)
  );

create policy "chat_messages_select" on public.chat_messages
  for select using (private.is_room_member(room_id));

create policy "chat_messages_insert" on public.chat_messages
  for insert with check (profile_id = auth.uid() and private.is_room_member(room_id));

create policy "games_select" on public.games
  for select using (private.is_room_member(room_id));

create policy "game_actions_select" on public.game_actions
  for select using (private.is_room_member(private.game_room_id(game_id)));

create policy "game_actions_insert" on public.game_actions
  for insert with check (
    profile_id = auth.uid() and private.is_room_member(private.game_room_id(game_id))
  );

create policy "game_actions_update_host" on public.game_actions
  for update using (private.is_room_host(private.game_room_id(game_id)))
  with check (private.is_room_host(private.game_room_id(game_id)));

create policy "game_log_select" on public.game_log
  for select using (private.is_room_member(private.game_room_id(game_id)));

create policy "game_log_insert_host" on public.game_log
  for insert with check (private.is_room_host(private.game_room_id(game_id)));

-- Update RPC bodies that called the old public.* helper names.
create or replace function public.kick_player(_room_id uuid, _target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.is_room_host(_room_id) then
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
  if not private.is_room_host(_room_id) then
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
  if not private.is_room_host(_room_id) then
    raise exception 'not_host';
  end if;

  update public.games
    set state = _state, turn = _turn, round = _round,
        current_seat = _current_seat, market = _market, updated_at = now()
    where room_id = _room_id;
end;
$$;

-- Fix missing search_path on the updated_at trigger function.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Avatars: public URL access doesn't need a SELECT policy (that path bypasses
-- RLS for public buckets); restrict SELECT to the owner's own folder so the
-- storage API can't be used to enumerate every uploaded file.
drop policy "avatars_public_read" on storage.objects;

create policy "avatars_owner_read" on storage.objects
  for select using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
