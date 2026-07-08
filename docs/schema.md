# Database Schema

All schema, RLS policies, RPCs, realtime publication, and storage setup live
in `supabase/migrations/`. This is a reference for how the pieces fit
together — see the migrations themselves for exact SQL.

## Tables

| Table | Purpose | RLS |
| --- | --- | --- |
| `profiles` | One row per account (`id` = `auth.users.id`), username, avatar, lifetime stats | Public read; only the row owner can update `avatar_url` |
| `credentials` | `profile_id` → bcrypt PIN hash | **No client policies at all** — only the `account` edge function (service role) can read/write it |
| `rooms` | A game room: code, name, host, status, public/private, max players, win condition | Visible if public, a member, or the host; only `name`/`win_condition`/`max_players` are directly client-editable |
| `room_players` | Membership: seat, ready/host/spectator flags, connection state | Visible to members (or previewers of a public room); a player can only edit their own `is_ready`/`connected` |
| `chat_messages` | Room + in-game chat (same table for both) | Members only, insert-only (immutable) |
| `games` | One row per started room: the full `GameState` JSONB snapshot + denormalized `turn`/`round`/`current_seat`/`market` columns | Members can read; all writes go through host-only RPCs |
| `game_actions` | Non-host players' submitted intents (`type` + `payload`), consumed by the host | Members can read/insert their own; only the host can mark `processed` |
| `game_log` | (Reserved for a durable action audit trail; the primary "History" feature is powered by `GameState.log`, embedded in `games.state`) | Members can read; host can insert |

## Why security-definer RPCs instead of raw table writes

Every real mutation that isn't a single player editing their own row goes
through a `security definer` Postgres function instead of a direct
`UPDATE`/`INSERT`/`DELETE`:

- `create_room`, `join_room`, `leave_room`, `kick_player`, `transfer_host` —
  atomic, authorization-checked room/membership changes (e.g., joining
  assigns the next free seat and enforces the player cap in one
  transaction; leaving as host reassigns the next-seated player).
- `start_game`, `sync_game_state`, `finish_game` — the `games` table has no
  direct client UPDATE policy at all; only these RPCs (which check
  `host_id = auth.uid()` internally) can write to it.
- `submit_game_result` — lets each player record their own end-of-game
  stats without granting a broad `UPDATE` on other players' `profiles` rows.

Three small helper functions (`is_room_member`, `is_room_host`,
`game_room_id`) live in a separate `private` schema — not `public` — so
PostgREST never exposes them as callable endpoints; they exist purely to be
referenced from inside RLS policy expressions.

## Realtime

`rooms`, `room_players`, `chat_messages`, `games`, `game_actions`, and
`game_log` are all added to the `supabase_realtime` publication, with
`REPLICA IDENTITY FULL` set on the ones where a client needs the full row
on `UPDATE`/`DELETE` (e.g., `room_players`, so a client can tell *who* just
left/was kicked).

## Storage

A public `avatars` bucket: object reads are served via Supabase's public
bucket URL path (which bypasses RLS entirely for buckets marked `public`),
while direct Storage API access (list/authenticated fetch) is restricted to
each user's own `{auth.uid()}/...` folder.

## Auth model

Login is username + 4-digit PIN — no email or password. Under the hood,
every browser session is a Supabase **anonymous** sign-in (so `auth.uid()`
and RLS work like any authenticated user). A single edge function
(`supabase/functions/account`) handles both registration and login:

- Unknown username → bcrypt-hash the PIN, create a `profiles` row for the
  caller's current anonymous `auth.uid()`.
- Known username → verify the PIN against the stored hash, then **re-link**
  the profile (`UPDATE profiles SET id = <new auth.uid()>`) to the caller's
  current session. All foreign keys referencing `profiles.id` cascade on
  update, so history/rooms/stats follow the account across the relink.

This means logging into the same username from a second device re-points
the account to that device's session — the original device's session no
longer matches any profile row. That's an intentional simplification for a
PIN-based casual game (see `docs/architecture.md`).
