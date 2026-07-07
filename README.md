# Net Worth

**Net Worth** is an original, browser-based multiplayer financial strategy
board game. Buy businesses, invest in the market, collect rent, dodge market
crashes, and out-grow every other player's net worth before the game ends.

Built with React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, and
Supabase (Postgres + Realtime + Storage + Edge Functions).

## Stack

| Layer         | Technology                                  |
| ------------- | -------------------------------------------- |
| UI            | React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| State         | Zustand                                     |
| Routing       | React Router 7                              |
| Backend       | Supabase (Postgres, Realtime, Storage, Edge Functions) |
| Build/test    | Vite, Vitest, oxlint                        |

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

## Scripts

| Command            | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`        | Start the Vite dev server             |
| `npm run build`      | Type-check and build for production   |
| `npm run typecheck`  | Type-check only                       |
| `npm test`           | Run the Vitest unit test suite        |
| `npm run lint`       | Lint with oxlint                      |
| `npm run preview`    | Preview the production build locally  |

## Project layout

```
src/
  engine/      Pure game logic (board, economy, market, cards) — no React
  content/     Game data: board layout, 200+ event cards, market, catalogs
  lib/         Supabase client, auth, formatting helpers
  net/         Host-authoritative multiplayer sync loop
  stores/      Zustand state (auth, room, game)
  hooks/       Realtime + presence React hooks
  components/  Reusable UI primitives and game-board components
  features/    Screen-level feature modules (auth, home, room, game, ...)
supabase/
  migrations/  SQL schema, RLS policies, realtime publication
  functions/   Edge Functions (username/PIN account auth)
docs/          Architecture, game rules, and schema reference
```

See [`docs/architecture.md`](docs/architecture.md) for how the pieces fit
together, [`docs/rules.md`](docs/rules.md) for the full game rules, and
[`docs/schema.md`](docs/schema.md) for the database schema.

## License

Original work created for this project. All game content (board, cards,
rules, names) is original and not affiliated with any commercial board game.
