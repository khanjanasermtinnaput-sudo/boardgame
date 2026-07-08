# Architecture

## Overview

Net Worth is a client-heavy, host-authoritative multiplayer game. The
backend (Supabase) provides authentication, storage, and a thin
authorization/persistence layer; all game logic runs in the browser.

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (host player)                                          │
│                                                                   │
│  engine/*  ──applyGameAction──▶  gameStore (Zustand)             │
│     ▲                                  │                        │
│     │                                  ▼                        │
│  net/hostLoop.ts  ◀────────────  syncGameState (lib/game.ts)     │
│     ▲                                  │                        │
│     │ processes                        ▼                        │
│  game_actions (Postgres, realtime)  games.state (Postgres)       │
└─────────────────────────────────────────────────────────────────┘
                    ▲                            │
                    │ INSERT (intent)             │ UPDATE (realtime)
                    │                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Browser (non-host player)                                       │
│                                                                    │
│  UI ──dispatchGameAction──▶ submitGameAction (lib/game.ts)         │
│                                                                    │
│  useGameSync ◀── games table UPDATE ── renders synced GameState   │
└─────────────────────────────────────────────────────────────────┘
```

## Why host-authoritative

Running the full game engine identically on every client (lockstep
simulation) would require deterministic RNG seeding across clients and
careful reconciliation on reconnect. Instead, exactly one browser — the
room's host — owns the canonical `GameState` and is the only writer to the
`games` table. This is simpler, has lower latency for the host, and makes
reconnect trivial (a rejoining client just re-fetches `games.state`).

**Trade-off:** the host's client is trusted. A malicious host could tamper
with their local state before it syncs. This is acceptable for a casual,
invite-based game between friends; it is not intended to resist a
adversarial host. If that's ever required, the fix is to move `engine/*`
into a Supabase Edge Function and validate every action server-side before
persisting — the pure, dependency-free design of `src/engine` makes that a
drop-in change (it doesn't import React or Supabase).

## Layers

- **`src/engine/`** — pure game logic. No I/O, no React, no Supabase.
  `applyGameAction(state, actorId, action)` is the single entry point; every
  mutation is turn-gated (rejects any actor that isn't the current player).
  Fully unit-tested (see `src/engine/__tests__`).
- **`src/content/`** — static game data (board layout, investment/business/
  property catalogs, market regimes, the 212 event cards). Pure data, no
  logic.
- **`src/lib/`** — thin wrappers around the Supabase client: auth, room
  RPCs, game persistence, profile lookups. Nothing here holds state.
- **`src/net/`** — bridges the pure engine to the persistence layer.
  `hostLoop.ts` applies an action to the in-memory `gameStore` and persists
  the result; `actions.ts` decides whether the current client should apply
  locally (host) or submit an intent row (non-host).
- **`src/stores/`** — Zustand stores (`authStore`, `roomStore`, `gameStore`).
  Thin, no business logic.
- **`src/hooks/`** — React bindings to Supabase Realtime: `useRealtimeRoom`
  (room/players/chat + presence), `useGameSync` (games table → gameStore),
  `useHostGameLoop` (host-only: drains `game_actions` into the reducer).
- **`src/components/`** — reusable UI: design-system primitives
  (`components/ui`) and game-board rendering (`components/game`).
- **`src/features/`** — screen-level composition (auth, home, room/lobby,
  game, endgame, profile, leaderboard, settings).

## Multiplayer sync in detail

1. The host's browser holds the only writable copy of `GameState` (in
   `gameStore`). Every action it takes calls `hostApplyAction`, which runs
   the reducer, updates `gameStore` synchronously, and persists to
   `games.state` via the `sync_game_state` Postgres RPC (or `finish_game`
   once the game ends).
2. Non-host players call `dispatchGameAction`, which inserts a row into
   `game_actions` (their "intent"). RLS lets a player insert only their own
   actions in rooms they belong to.
3. The host subscribes to `game_actions` INSERTs (`useHostGameLoop`) and
   processes them **in order** through a promise queue, applying each via
   the same reducer, so ordering matches submission order regardless of who
   submitted it. The reducer's turn-gating means an action from a player
   who isn't currently "up" is simply rejected — no special handling needed.
4. Every client (host included) subscribes to `games` table UPDATEs
   (`useGameSync`) and renders whatever `state` it receives. For the host
   this is a no-op echo of what it already wrote; for everyone else it's
   the only way they see the game advance.
5. Room membership, readiness, chat, and live presence (`useRealtimeRoom`)
   are a separate, simpler realtime channel — presence is used purely for
   the lobby/game's "reconnecting…" indicator, independent of the `games`
   sync above.

## Database access model

All game-state mutation happens through **security-definer Postgres RPCs**
(`create_room`, `join_room`, `kick_player`, `transfer_host`, `start_game`,
`sync_game_state`, `finish_game`, `submit_game_result`, `leave_room`) rather
than raw table writes. Each RPC re-validates authorization internally
(`auth.uid()` checks), so exposing them as public endpoints is intentional
and safe — see `docs/schema.md` for the full RLS model.

## Known simplifications

- The host is trusted (see trade-off above).
- Reconnect works by re-fetching current state on mount; there's no replay
  of missed actions beyond what's already reflected in `games.state` and
  `state.log`.
- If the host disconnects mid-game, the room has no automatic host-failover
  for an *in-progress* game (host migration is implemented for the lobby via
  `leave_room`'s reassignment logic, but a game already in progress has no
  "promote a new host" path yet — the safest extension point is
  `finish_game`/`sync_game_state`'s authorization check, which would need to
  accept a newly-promoted host).
