# 💣 Time Bomb — Online Multiplayer

A real-time multiplayer adaptation of the social-deduction board game **Time Bomb** (4–12 players):
Sherlock's team must defuse the bomb; Moriarty's team hides it and lies. Includes optional game
modes — **Loupe** (scanner card + Brouilleur role), **Chrono** (turn timer with forced random cuts)
and **Chaos** (randomized team distribution) — plus accounts, persistent stats and achievements.

## Stack

| Layer  | Tech |
|--------|------|
| Client | Next.js 16, React 19, Zustand, Tailwind CSS 4, Framer Motion, socket.io-client |
| Server | Node 22, Express 5, Socket.IO, Prisma 7 (PostgreSQL) |
| Shared | TypeScript workspace consumed by both sides |

## Monorepo layout

```
client/   Next.js app
  src/components/
    ui/                    design system: Button, Panel, Stripes… + tokens
    home/                  login, main menu, join room
    lobby/                 lobby screen + game-mode toggles
    phase/                 role & card reveal ceremonies
    game/                  board, bars, timer + fullscreen animations
    end/                   end-of-game screen
    profile/               player profile & achievements
    wiki/                  in-game tutorial modals
  src/store/               Zustand store (typed socket actions)
  src/utils/               session persistence, asset paths
server/   Socket.IO server
  src/gameEngine.ts        pure game rules (testable, no IO)
  src/roomManager.ts       transport layer: auth, rooms, timers, broadcast
  src/services/            auth, tokens, profile, stats/achievements, db
shared/   single source of truth used by BOTH sides
  types.ts                 domain types (GameState, Player, Card…)
  config.ts                game rules as data (decks, chaos odds, loupe rates…)
  socketEvents.ts          typed Socket.IO contract + DTOs
```

### Architecture notes

- **Typed socket contract** — every event name and payload is declared once in
  `shared/socketEvents.ts` and enforced on both the server (`Server<C2S, S2C>`) and the client
  (`Socket<S2C, C2S>`). A payload mismatch is a compile error, not a production bug.
- **Server-side identity** — logging in returns a signed session token (HMAC-SHA256). On every
  (re)connection the client presents it via `authenticate`, which binds `userId` to the socket and
  reattaches the player to their in-progress game. No handler ever trusts a client-supplied player
  id, and the PIN is never persisted in the browser.
- **Pure game engine** — `gameEngine.ts` contains only state transitions (role assignment, deck
  building, `applyCut`, per-player state sanitization). It touches no sockets, timers or database,
  which is what makes the rules unit-testable.
- **Per-player state filtering** — `sanitizeStateForPlayer` anonymizes every hidden card and strips
  roles before broadcasting, so a malicious client can never read the bomb's position from the wire.
- **Rules as shared data** — chaos probabilities, loupe success rates, deck composition and player
  bounds live in `shared/config.ts`; the wiki modals and lobby display the very values the server
  enforces.
- **Design system** — the steampunk palette is declared once as Tailwind 4 `@theme` tokens in
  `globals.css` (`text-gold`, `border-bronze/40`…), mirrored in `ui/tokens.ts` for the few JS-side
  uses (glows, SVG strokes). Components are one per file, grouped by feature, with prop interfaces
  in each folder's `types.ts`.

## Getting started

```bash
npm install

# server (needs PostgreSQL)
cp server/.env.example server/.env   # or create it, see below
npm run dev --workspace=server

# client
npm run dev --workspace=client
```

### Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | server | PostgreSQL connection string |
| `AUTH_SECRET` | server | HMAC key for session tokens (random fallback per boot if unset) |
| `CLIENT_URL` | server | Allowed CORS origin |
| `PORT` | server | HTTP/WS port (default 3001) |
| `NEXT_PUBLIC_SOCKET_URL` | client | Server URL (default `http://localhost:3001`) |

## Scripts

```bash
npm run typecheck   # tsc --noEmit on all workspaces
npm run lint        # eslint (client)
npm test            # vitest: game engine, session tokens, stats, shared config
npm run seed --workspace=server          # demo accounts
```

CI (GitHub Actions) runs typecheck + lint + tests on every push and pull request.
