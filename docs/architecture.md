# Architecture

## Overview

Net Worth is a **server-authoritative** multiplayer game. There is no
trusted client, and no single player's browser owns canonical game state
— every mutation (buying a card, borrowing, marking ready, resolving a
phase) is a Postgres `security definer` RPC that re-validates
authorization and game/phase state itself before writing anything.

```
┌────────────────────────────────────────────────────────────────────┐
│  Any player's browser                                              │
│                                                                     │
│  UI ──calls──▶ lib/game.ts (RPC wrappers: game_buy_card,            │
│                game_borrow, game_set_ready, ...)                    │
│                          │                                          │
│                          ▼                                          │
│              Supabase Postgres RPC (security definer)               │
│              — re-checks auth.uid(), phase, ownership                │
│              — mutates games / game_players directly                 │
└────────────────────────────────────────────────────────────────────┘
                          │
                          ▼ realtime UPDATE broadcast
┌────────────────────────────────────────────────────────────────────┐
│  Every player's browser (including the actor's)                    │
│  useGameState ◀── games + game_players table UPDATEs                │
│  renders whatever state it receives — no client-side reducer         │
└────────────────────────────────────────────────────────────────────┘
```

## Why server-authoritative (not host-authoritative)

An earlier design let one browser (the room's "host") own the canonical
game state and be the sole writer, with every other player submitting
"intent" rows for the host to apply. That's simpler to build, but it
means a malicious or crashed host can corrupt the game or stall it, and
every mutation needs a full round trip through the host's browser even
when it only affects one player's own row.

Since this game's phases are simultaneous (every player acts independently
during the Investment Phase, then everyone just presses Ready), there's no
natural "whoever's turn it is" host role to lean on anyway. Instead:

- Each player's own actions (buy/sell/borrow/repay) mutate only *their own*
  `game_players` row, validated by an RPC that re-checks the game is in
  Phase 1 — no host involved at all.
- Phase resolution (rolling the Global Event, dealing Personal Events,
  computing Income & Expense, refilling hands, advancing the age) is
  resolved by **whichever player's `game_set_ready` call happens to set
  the last ready flag** — see `docs/schema.md` for exactly how the row
  lock on `games` makes this safe under concurrent ready-presses.

This removes the "host is trusted" trade-off entirely: every player's
client is equally (un)trusted, and the database is the only source of
truth.

## Layers

- **`src/content/`** — static game data: the investment card catalog,
  global/personal event catalogs (mirrors of what's seeded server-side in
  `card_catalog`/`global_event_catalog`/`personal_event_catalog`, used for
  client-side display only — pricing and effects are always re-validated
  server-side).
- **`src/lib/`** — thin wrappers around the Supabase client: auth, room
  RPCs, game RPCs, profile lookups. Nothing here holds state.
- **`src/stores/`** — Zustand stores (`authStore`, `roomStore`,
  `gameStore`). Thin, no business logic — they hold whatever the last
  realtime payload said.
- **`src/hooks/`** — React bindings to Supabase Realtime: `useRealtimeRoom`
  (room/players/chat + presence), `useGameState` (`games` +
  `game_players` → gameStore).
- **`src/components/`** — reusable UI primitives (`components/ui`) and
  game-specific display components (`components/game`).
- **`src/features/`** — screen-level composition (auth, home, room/lobby,
  game, endgame, profile, leaderboard, settings).

## Multiplayer sync in detail

1. A player takes an action (buy a card, borrow, mark ready). The client
   calls the corresponding RPC directly — there is no local reducer and no
   optimistic local mutation of authoritative state.
2. The RPC validates `auth.uid()`, room/game membership, and phase, then
   mutates `games` and/or the caller's own `game_players` row in Postgres.
3. Every client (including the actor's) is subscribed to `games` and
   `game_players` table `UPDATE`s via Realtime (`useGameState`). When the
   RPC's transaction commits, every subscriber receives the new row(s) and
   re-renders — the acting client learns of its own action's result the
   same way everyone else does.
4. Room membership, readiness-in-the-lobby, chat, and live presence
   (`useRealtimeRoom`) are a separate, simpler realtime channel used purely
   for the lobby/game's "reconnecting…" indicator, independent of the
   `games`/`game_players` sync above.
5. Reconnect is trivial: a rejoining client just re-fetches the current
   `games` + `game_players` rows for its game — there is no missed-action
   replay to reason about, because there's no per-client action log to
   replay in the first place; the database row *is* the state.

## Database access model

All game-state mutation happens through **security-definer Postgres RPCs**
(`create_room`, `join_room`, `kick_player`, `transfer_host`, `game_start`,
`game_buy_card`, `game_sell_asset`, `game_borrow`, `game_repay`,
`game_set_ready`) rather than raw table writes. Each RPC re-validates
authorization internally (`auth.uid()` checks, phase checks), so exposing
them as public endpoints is intentional and safe — see `docs/schema.md`
for the full RLS model and the concurrency guarantee `game_set_ready`
provides.
