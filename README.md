# Net Worth

**Net Worth** is an original, browser-based multiplayer financial strategy
card game. Every player starts at age 20 with $10,000 cash; six simultaneous
rounds (ages 20, 30, 40, 50, 60, 70) each play out five ready-gated phases —
Investment, Global Event, Personal Event, Income & Expense, Refill. Buy asset
cards from your own 6-card hand, borrow and repay debt, and out-grow every
other player's net worth by age 70.

Built with React 19, TypeScript, Vite, Tailwind CSS, and Supabase (Postgres +
Realtime + Storage + Edge Functions). There is no client-trusted host — every
game mutation is a security-definer Postgres RPC; see
[`docs/architecture.md`](docs/architecture.md).

## Stack

| Layer         | Technology                                  |
| ------------- | -------------------------------------------- |
| UI            | React 19, TypeScript, Tailwind CSS 4         |
| State         | Zustand                                     |
| Routing       | React Router 7 (`HashRouter`, for static hosting) |
| Backend       | Supabase (Postgres, Realtime, Storage, Edge Functions) |
| Build/test    | Vite, Vitest, oxlint                        |

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev
```

## Scripts

| Command                   | Description                                    |
| -------------------------- | ----------------------------------------------- |
| `npm run dev`               | Start the Vite dev server                        |
| `npm run build`             | Type-check and build for production              |
| `npm run typecheck`         | Type-check only                                  |
| `npm test`                  | Run the Vitest unit test suite                   |
| `npm run test:integration`  | Drive a full multi-player game through the real RPCs (needs a live Supabase project; see `scripts/integration-test.mjs`) |
| `npm run lint`              | Lint with oxlint                                 |
| `npm run preview`           | Preview the production build locally             |

## Project layout

```
src/
  engine/      Pure calculation mirror (net worth, pricing, interest tiers) — no React, no I/O
  content/     Card/global-event/personal-event catalogs (display only — server RPCs are authoritative)
  lib/         Supabase client, auth, room/game RPC wrappers, formatting helpers
  stores/      Zustand state (auth, room, game)
  hooks/       Realtime React hooks (room presence/chat, game state)
  components/  Reusable UI primitives and game-display components
  features/    Screen-level feature modules (auth, home, room, game, endgame, ...)
supabase/
  migrations/  SQL schema, RLS policies, RPCs, realtime publication
  functions/   Edge Functions (username/PIN account auth)
scripts/       Dev tooling (RPC integration test)
docs/          Architecture, game rules, and schema reference
```

See [`docs/architecture.md`](docs/architecture.md) for how the pieces fit
together, [`docs/rules.md`](docs/rules.md) for the full game rules, and
[`docs/schema.md`](docs/schema.md) for the database schema.

## Deployment

The repo is deployed to two targets in parallel:

- **GitHub Pages** — pushes to the trunk branch build and deploy via
  `.github/workflows/deploy.yml` (needs `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` set as repository secrets), served from
  `/boardgame/`.
- **Vercel** — connected directly to this GitHub repo via Vercel's Git
  integration, which auto-builds on every push and serves `dist/` from
  the domain root.

Because the two hosts serve from different paths, `vite.config.ts` picks
the Vite `base` at build time instead of hardcoding it:
`base: process.env.VERCEL ? '/' : '/boardgame/'` (Vercel sets `VERCEL=1`
during every build). Don't hardcode `base` back to `/boardgame/` — that
breaks Vercel by pointing the built JS/CSS bundle URLs at a path that
doesn't exist there, producing 404s on every asset and a black screen.

The app uses `HashRouter` so no server-side routing config is needed on
either host.

## License

Original work created for this project. All game content (cards, events,
rules, names) is original and not affiliated with any commercial board game.
