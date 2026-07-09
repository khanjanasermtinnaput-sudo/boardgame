-- Reset the game model from the old turn-based dice/board design to the
-- new simultaneous age/phase/card design (ages 20..70, 5 ready-gated
-- phases per age, 6-card investment hand, no client-trusted host).
--
-- All game logic now lives in security-definer RPCs; there is no more
-- "host writes canonical state" trust model — every mutation re-validates
-- authorization and phase/turn state itself, and phase transitions are
-- resolved by whichever RPC call happens to set the LAST ready flag,
-- under a row lock, so exactly one caller performs the resolution.

-- ============================================================================
-- DROP OLD GAME-ACTION MACHINERY (host-authoritative model)
-- ============================================================================

drop function if exists public.sync_game_state(uuid, jsonb, integer, integer, integer, jsonb, uuid);
drop function if exists public.finish_game(uuid, jsonb, jsonb, uuid);
drop function if exists public.submit_game_result(uuid);
drop function if exists public.start_game(uuid, jsonb);

drop table if exists public.game_actions;
drop table if exists public.game_log;

-- ============================================================================
-- RESHAPE games
-- ============================================================================

alter table public.games drop column if exists state;
alter table public.games drop column if exists turn;
alter table public.games drop column if exists current_seat;
alter table public.games drop column if exists final_results;

alter table public.games rename column round to round_no;

alter table public.games
  add column status text not null default 'active' check (status in ('active', 'finished')),
  add column age integer not null default 20 check (age between 20 and 70),
  add column phase smallint not null default 1 check (phase between 1 and 5),
  add column global_event jsonb not null default '{}'::jsonb;

comment on column public.games.market is 'per-category price multipliers, e.g. {"house": 1.05, "crypto": 0.6, ...}';

-- (No deterministic PRNG seed column: randomness uses plain Postgres
-- random()/order by random() throughout, so there's nothing to seed.)

-- ============================================================================
-- game_players — per-player game state, including their own shuffled
-- investment-card deck (decks are per-player, not shared, so simultaneous
-- refills across players never race on a shared draw cursor).
-- ============================================================================

create table public.game_players (
  game_id uuid not null references public.games (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade on update cascade,
  seat integer not null,
  cash bigint not null default 0,
  salary bigint not null default 0,
  hand jsonb not null default '[]'::jsonb,
  assets jsonb not null default '[]'::jsonb,
  debts jsonb not null default '[]'::jsonb,
  passive_income bigint not null default 0,
  net_worth bigint not null default 0,
  ready boolean not null default false,
  personal_event jsonb not null default '{}'::jsonb,
  income_summary jsonb not null default '{}'::jsonb,
  deck jsonb not null default '[]'::jsonb,
  deck_cursor integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (game_id, profile_id)
);

comment on column public.game_players.deck is 'this player''s shuffled array of card_id (text) draw order; deck_cursor is the next undrawn index. Reshuffled (fresh random order, cursor reset to 0) only once fully exhausted.';

create index game_players_game_id_idx on public.game_players (game_id);
create index game_players_profile_id_idx on public.game_players (profile_id);

create trigger game_players_set_updated_at
  before update on public.game_players
  for each row execute function public.set_updated_at();

alter table public.game_players enable row level security;

create policy "game_players_select" on public.game_players
  for select using (private.is_room_member(private.game_room_id(game_id)));

-- No client policies for insert/update/delete — every mutation goes through
-- security-definer RPCs below, which re-check phase/turn/ownership.

-- game_results (room_id, profile_id, net_worth, won, created_at) already
-- exists from the fix_security_findings migration and is reused as-is; the
-- new finish/rank logic below writes into it as the sole source of truth.

-- ============================================================================
-- REALTIME
-- ============================================================================

alter publication supabase_realtime add table public.game_players;
alter table public.game_players replica identity full;
