# 🌾 SawahVerse — Farm, Fish, Chill on Solana

A relaxing, token-gated browser game inspired by Indonesian rice-field villages.
Connect a Solana wallet, hold at least **1 token**, and enter a cozy blue village
where you plant rice, fish in rivers, level up, chat, and climb the leaderboard.

> **This is a game.** The token is for gameplay access only. Nothing here is an
> investment, and there is no promise of profit, yield, or returns.

---

## 1. Architecture

```
┌──────────────────────────────────────────────────────┐
│  Browser                                             │
│  React 19 + TypeScript (TanStack Start, SSR)         │
│  Tailwind v4 + shadcn/ui      → blue glass UI        │
│  Solana Wallet Adapter        → Phantom / Solflare   │
│  TanStack Query               → live data (polling)  │
│  localStorage                 → instant local save   │
└────────┬─────────────────────────────┬───────────────┘
         │ read-only RPC (no signing)  │ server functions (zod-validated)
         ▼                             ▼
┌──────────────────┐   ┌───────────────────────────────┐
│  Solana mainnet  │   │  Game API (src/lib/api)       │
│  token balance   │   │  sync · leaderboard · chat ·  │
│  check for gate  │   │  fish-catch log · rate limit  │
└──────────────────┘   └──────────┬────────────────────┘
                                  ▼
                    ┌─────────────────────────────┐
                    │  Storage (src/lib/store)    │
                    │  Supabase  ← if env set     │
                    │  .data/*.json ← dev default │
                    └─────────────────────────────┘
```

Key design choice: the API works **with zero configuration**. Without env vars
it persists to a local JSON file; set the two Supabase variables and the same
code runs against Postgres. Game progress is also mirrored in `localStorage`
so the player never loses state even if the network drops (the profile card
shows a `saved / offline` badge).

## 2. Run it

```bash
bun install        # or npm install
bun run dev        # start dev server (URL printed in terminal)

bun test           # unit tests (game rules + storage layer)
bun run lint       # eslint + prettier
bun run build      # production build
```

Optional `.env` (see `.env.example`):

| Variable                                     | What it does                                                                                                           |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `VITE_RPC_ENDPOINT`                          | Custom Solana RPC (Helius/QuickNode). Public endpoint rate-limits.                                                     |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Switch the game API from local file storage to Supabase. Run `supabase/schema.sql` first. Server-only — never `VITE_`. |

## 3. Folder structure

```
src/
  routes/
    __root.tsx         # app shell, error boundary, 404
    index.tsx          # landing page
    game.tsx           # token gate + game dashboard
    leaderboard.tsx    # full leaderboard page
    how-to-play.tsx    # guide page
  components/
    SolanaProvider.tsx # wallet adapter (Phantom, Solflare)
    WalletButton.tsx / Navbar.tsx / Footer.tsx
    ui/                # shadcn/ui components
  hooks/
    useTokenGate.ts    # read-only balance check + retry
    useGame.ts         # game loop, localStorage, cloud sync
    useVillage.ts      # leaderboard / chat / activity queries
  lib/
    game-logic.ts      # pure rules (odds, XP) — unit tested
    solana-config.ts   # token mint + RPC endpoint
    store.server.ts    # storage layer (Supabase | file) — unit tested
    api/game.functions.ts  # the server API (zod-validated)
supabase/schema.sql    # tables, leaderboard view, RLS
```

## 4. Token gate

1. Player connects a wallet (Phantom/Solflare).
2. `useTokenGate` calls `getParsedTokenAccountsByOwner` — **read-only**, the
   player never signs anything just to be checked.
3. Balance for mint `Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump` is summed.
4. ≥ 1 → game unlocks. Otherwise: _“You need at least 1 token to enter
   SawahVerse.”_ RPC failures show a retry button.

## 5. Gameplay

- **Farm:** plant (1 seed + 2 energy) → 15s growth → harvest (+1 rice,
  +2 coins, +10 XP). Expand the paddy for 250 coins.
- **Fish:** one cast per 5 seconds, 5 energy. Odds: Common 70% · Uncommon 20% ·
  Rare 7% · Epic 2.5% · Legendary 0.5%. Catches are logged to the village
  activity feed.
- **Economy:** rice sells for 8, seeds cost 3. Each level needs `level × 100`
  XP; energy regenerates 1 per 8s.
- **Village:** live leaderboard (top coins), global chat (280-char limit,
  2s rate limit per wallet), recent-catches feed — all polling the game API.
- **Identity:** click your name on the profile card to set a villager name.

## 6. API endpoints (server functions)

All in `src/lib/api/game.functions.ts`, callable from the client as typed
async functions, validated with zod on the server:

| Function           | Method | Purpose                                             |
| ------------------ | ------ | --------------------------------------------------- |
| `syncPlayer`       | POST   | Upsert progress (level, xp, coins, stats, username) |
| `getLeaderboard`   | GET    | Top players by coins                                |
| `getChatMessages`  | GET    | Last 50 chat messages                               |
| `sendChatMessage`  | POST   | Post a message (rate-limited per wallet)            |
| `logFishCatch`     | POST   | Append to the catch log                             |
| `getRecentCatches` | GET    | Activity feed                                       |

## 7. Going further

1. **Supabase:** create a project, run `supabase/schema.sql`, set the two env
   vars — done, the API switches over.
2. **Wallet-signature auth:** today the API trusts the wallet string the
   client sends (fine for a cozy MVP, not for real money). Add a
   sign-in-with-Solana message verification step in the server functions
   before trusting writes.
3. **Realtime chat:** swap chat polling for Supabase Realtime.
4. **Art pass:** replace the CSS village with original voxel illustrations.
