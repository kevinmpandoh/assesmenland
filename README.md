# 🧑‍🌾 Agri Land — Plant, Grow, Prosper on Solana

A cozy, token-gated multiplayer farming game. Connect a Solana wallet, hold at
least **1 token**, claim your field, and grow it from a single tomato plot into
a farming empire — while walking around one shared live town with every other
farmer.

> **This is a game.** The token is for gameplay access only. Gold and crops are
> in-game items with no monetary value. Nothing here is an investment, and
> there is no promise of profit, yield, or returns.

---

## 1. Architecture

```
┌──────────────────────────────────────────────────────┐
│  Browser                                             │
│  React 19 + TypeScript (TanStack Start, SSR)         │
│  Tailwind v4 + shadcn/ui      → pixel farm UI        │
│  Solana Wallet Adapter        → Phantom / Solflare   │
│  TanStack Query               → live data (polling)  │
│  Canvas 2D                    → isometric town       │
│  localStorage                 → instant local save   │
└────────┬─────────────────────────────┬───────────────┘
         │ read-only RPC (no signing)  │ server functions (zod-validated)
         ▼                             ▼
┌──────────────────┐   ┌───────────────────────────────┐
│  Solana mainnet  │   │  Game API (src/lib/api)       │
│  token balance   │   │  sync · leaderboard · chat ·  │
│  check for gate  │   │  harvest log · presence       │
└──────────────────┘   └──────────┬────────────────────┘
                                  ▼
                    ┌─────────────────────────────┐
                    │  Storage (src/lib/store)    │
                    │  Supabase  ← if env set     │
                    │  .data/*.json ← dev default │
                    └─────────────────────────────┘
```

The API works **with zero configuration**: without env vars it persists to a
local JSON file; set the two Supabase variables and the same code runs against
Postgres. Player progress is mirrored in `localStorage` so nothing is lost if
the network drops (profile card shows a saved/offline badge).

## 2. Run it

```bash
bun install        # or npm install
bun run dev        # start dev server (URL printed in terminal)

bun test           # unit tests (game rules, map, storage)
bun run lint       # eslint + prettier
bun run build      # production build
```

Optional `.env` (see `.env.example`):

| Variable                                     | What it does                                                                                                           |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `VITE_RPC_ENDPOINT`                          | Custom Solana RPC (Helius/QuickNode). Default is a public CORS-enabled endpoint.                                       |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Switch the game API from local file storage to Supabase. Run `supabase/schema.sql` first. Server-only — never `VITE_`. |

## 3. The game

### Farming loop (10 levels)

Plant → wait → harvest → sell → level up → unlock bigger crops → invest in
equipment → repeat. One crop unlocks per level:

🍅 Tomato → 🍆 Eggplant → 🌽 Corn → 🌶️ Chili → 🥬 Cabbage → 🍈 Melon →
🎃 Pumpkin → 🍓 Strawberry → 🥭 Mango → 🌾 Golden Rice

- Buy seeds at the Seed Shop (bag holds 10), then plant: 1 seed + 2 energy.
  Grow time is 5s per crop level (tomato 5s → Golden Rice 50s); energy
  regens 1 per 8s.
- Equipment (6 items, 150g–5,000g) permanently speeds growth up to **55%** and
  raises sell prices up to **+15%**. Field expands from 9 to 25 plots.
- Each level needs `level × 100` XP; level 10 is the current cap.
- All exact numbers live in `src/lib/game-logic.ts` and on the `/docs` page.

### The Town (shared multiplayer map)

`/world` is a 48×48 isometric town rendered on `<canvas>` — plaza with a
fountain, seed shop & market stalls, housing districts, fenced farm fields, a
lake, and wandering NPC villagers. **Every player is on the same map**: walk
with WASD/click, see everyone's name + level badge live, and chat via speech
bubbles. Presence works through the `pingWorld` server function (1.5s
polling, 12s TTL) — no websocket server needed.

## 4. Token gate

1. Player connects a wallet (Phantom/Solflare).
2. `GateBridge` calls `getParsedTokenAccountsByOwner` — **read-only**, the
   player never signs anything.
3. Balance for mint `Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump` is summed.
4. ≥ 1 → game unlocks; otherwise blocked with a Get Token link. RPC failures
   show a retry button.

## 5. Pages

| Route          | What it is                                                |
| -------------- | --------------------------------------------------------- |
| `/`            | Landing: hero, crop marquee, how it works, token, roadmap |
| `/game`        | My Farm: field, barn, equipment shop + live sidebar       |
| `/world`       | The Town: shared multiplayer map                          |
| `/leaderboard` | Full top-50 ranking by gold                               |
| `/how-to-play` | Step-by-step guide                                        |
| `/docs`        | Full docs: tables, levels, FAQ, roadmap                   |

## 6. API endpoints (server functions)

All in `src/lib/api/game.functions.ts`, zod-validated:

| Function           | Method | Purpose                                          |
| ------------------ | ------ | ------------------------------------------------ |
| `syncPlayer`       | POST   | Upsert progress (level, xp, gold, harvest count) |
| `getLeaderboard`   | GET    | Top players by gold                              |
| `getChatMessages`  | GET    | Last 50 chat messages                            |
| `sendChatMessage`  | POST   | Post a message (2s rate limit per wallet)        |
| `logFishCatch`     | POST   | Log a notable (level 5+) harvest for the feed    |
| `getRecentCatches` | GET    | Recent-harvests activity feed                    |
| `pingWorld`        | POST   | Report my town position, get all online players  |

## 7. Roadmap

1. **Phase 1 — First seeds (LIVE):** everything above.
2. **Phase 2 — Personal plots:** farms visible on the town map, visiting,
   sign-in-with-Solana for account security.
3. **Phase 3 — Seasons & festivals:** weather, seasonal crops, events,
   levels beyond 10.
4. **Phase 4 — Marketplace & cosmetics:** crop trading, skins, pets, hats.
