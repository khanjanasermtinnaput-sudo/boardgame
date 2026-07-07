-- Performance tuning per advisor findings:
--  1. Wrap direct auth.uid() calls in RLS policies with `(select ...)` so
--     Postgres evaluates them once per query instead of once per row.
--  2. Add covering indexes for the two FK columns that lacked one.

drop policy "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy "rooms_select" on public.rooms;
create policy "rooms_select" on public.rooms
  for select using (
    is_public or private.is_room_member(id) or host_id = (select auth.uid())
  );

drop policy "rooms_update_host" on public.rooms;
create policy "rooms_update_host" on public.rooms
  for update using (host_id = (select auth.uid())) with check (host_id = (select auth.uid()));

drop policy "room_players_update_own" on public.room_players;
create policy "room_players_update_own" on public.room_players
  for update using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

drop policy "chat_messages_insert" on public.chat_messages;
create policy "chat_messages_insert" on public.chat_messages
  for insert with check (profile_id = (select auth.uid()) and private.is_room_member(room_id));

drop policy "game_actions_insert" on public.game_actions;
create policy "game_actions_insert" on public.game_actions
  for insert with check (
    profile_id = (select auth.uid()) and private.is_room_member(private.game_room_id(game_id))
  );

create index chat_messages_profile_id_idx on public.chat_messages (profile_id);
create index game_actions_profile_id_idx on public.game_actions (profile_id);
