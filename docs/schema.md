# Database Schema

All schema, RLS policies, RPCs, realtime publication, and storage setup live
in `supabase/migrations/`. This is a reference for how the pieces fit
together — see the migrations themselves for exact SQL.

## Tables

| Table | Purpose | RLS |
| --- | --- | --- |
| `profiles` | One row per account (`id` = `auth.users.id`), username, avatar, lifetime stats | Public read; only the row owner can update `avatar_url` |
| `credentials` | `profile_id` → bcrypt PIN hash, failed-attempt counter, lockout timestamp | **No client policies at all** — only the `account` edge function (service role) can read/write it |
| `rooms` | A game room: code, name, host, status, public/private, max players | Visible if public, a member, or the host; only `name`/`win_condition`/`max_players` are directly client-editable |
| `room_players` | Membership: seat, ready/host/spectator flags, connection state | Visible to members (or previewers of a public room); a player can only edit their own `is_ready`/`connected` |
| `chat_messages` | Room chat | Members only, insert-only (immutable), rate-limited to 5 messages / 10s per profile |
| `card_catalog` | The ~80-card investment catalog (name, category, purchase price, base value, passive income, description) | Public read — pure reference data |
| `global_event_catalog` | Global Event templates (type + per-category market multiplier deltas) | Public read |
| `personal_event_catalog` | Personal Event templates (cash/salary/grant-card effects) | Public read |
| `games` | One row per started room: `status`, `age` (20..70), `phase` (1..5), `round_no`, shared `market` multipliers, current `global_event` | Members can read; all writes go through the RPCs below |
| `game_players` | Per-player game state: cash, salary, hand, assets, debts, passive income, net worth, ready flag, this round's personal event, last income summary, and this player's own shuffled card deck | Members can read; all writes go through the RPCs below |
| `game_results` | Final `(room_id, profile_id) → net_worth, won` — one row per player, written once at game end | Visible to the player themself or any room member |

## Why security-definer RPCs instead of raw table writes

There is no client-trusted "host." Every game-state mutation — buying a
card, taking a loan, marking ready, resolving a phase — goes through a
`security definer` Postgres function that re-validates authorization and
game/phase state itself:

- `create_room`, `join_room`, `leave_room`, `kick_player`, `transfer_host` —
  atomic, authorization-checked room/membership changes.
- `game_start` — host-only, requires the lobby to have ≥2 players all
  ready; deals each player a shuffled personal deck and an initial 6-card
  hand.
- `game_buy_card`, `game_sell_asset`, `game_borrow`, `game_repay` — Phase-1
  actions. Each re-fetches pricing from `card_catalog` and the game's
  current `market` multipliers rather than trusting anything the client
  sent, and re-checks `games.phase = 1` before applying.
- `game_set_ready(_game_id, _ready)` — the core of the round loop. Sets the
  caller's ready flag; when it becomes the **last** ready flag among all
  players in the game, it resolves the current phase (rolls the Global
  Event, deals Personal Events, computes Income & Expense, refills hands,
  or advances the age / ends the game at 70) and resets every player's
  ready flag for the next phase.

  Concurrency: `game_set_ready` opens with
  `select ... from games where id = _game_id for update`, taking a row
  lock on the shared `games` row *before* touching anything else. Every
  call for the same game — from any player, ready or unready — fully
  serializes against every other call for that game. This is what
  guarantees exactly one caller ever performs a given phase resolution,
  and that no buy/sell/borrow/repay can land after a phase has already
  advanced (those RPCs take the same lock at their own start, for the
  same reason).

Small helper functions (`is_room_member`, `is_room_host`, `game_room_id`,
`recompute_player`, `apply_market_effects`, `draw_cards`,
`resolve_phase_*`) live in a separate `private` schema — not `public` — so
PostgREST never exposes them as callable endpoints; they exist purely to
be called from inside the public RPCs and RLS policy expressions.

## Investment-card decks

Each player has their **own** shuffled deck (`game_players.deck` +
`deck_cursor`), not a single deck shared across the table. A card a player
has already drawn will not reappear in their hand until their personal
deck is fully exhausted, at which point it reshuffles (fresh random order,
cursor reset to 0). Per-player decks avoid any draw-order race between
players refilling their hands in the same phase resolution.

## Realtime

`rooms`, `room_players`, `chat_messages`, `games`, and `game_players` are
all added to the `supabase_realtime` publication, with `REPLICA IDENTITY
FULL` set where a client needs the full row on `UPDATE`/`DELETE`.

## Storage

A public `avatars` bucket: object reads are served via Supabase's public
bucket URL path (which bypasses RLS entirely for buckets marked `public`),
while direct Storage API access (list/authenticated fetch) is restricted to
each user's own `{auth.uid()}/...` folder.

## Auth model

Login is username + 4-digit PIN — no email or password, and no prior
Supabase session required. A single edge function
(`supabase/functions/account`) handles both registration and login using
the service-role key internally:

- Unknown username → bcrypt-hash the PIN, create a real `auth.users` row
  via the admin API (a synthetic `@players.networth.local` email + a
  random password only this function ever knows), a matching `profiles`
  row, and the `credentials` row.
- Known username → verify the PIN against the stored hash (with brute
  force lockout: exponential backoff after 5 wrong attempts), then rotate
  the account's auth password and sign in as it.

Either path ends with the edge function calling
`signInWithPassword` server-side and handing the resulting
`access_token`/`refresh_token` back to the client, which calls
`supabase.auth.setSession(...)`. The client never sees a Supabase
email/password login — only username + PIN.
