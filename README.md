# 🌾 SawahVerse — Farm, Fish, Chill on Solana

A relaxing, token-gated browser game inspired by Indonesian rice-field villages.
Connect a Solana wallet, hold at least **1 token**, and enter a cozy blue village
where you plant rice, fish in rivers, level up, and (soon) chat with friends.

> **This is a game.** The token is for gameplay access only. Nothing here is an
> investment, and there is no promise of profit, yield, or returns.

---

## 1. The MVP architecture (simple version)

```
┌─────────────────────────────────────────────────┐
│  Browser (your players)                         │
│                                                 │
│  React + TypeScript + Vite (TanStack Start)     │
│  Tailwind CSS v4 + shadcn/ui  → the blue UI     │
│  Solana Wallet Adapter        → connect wallet  │
│  localStorage                 → game progress   │
└───────────────┬─────────────────────────────────┘
                │ read-only RPC call (no signing!)
                ▼
┌─────────────────────────────────────────────────┐
│  Solana mainnet RPC                             │
│  "Does this wallet hold ≥ 1 token of the mint?" │
└─────────────────────────────────────────────────┘

Later (schema already prepared in supabase/schema.sql):
┌─────────────────────────────────────────────────┐
│  Supabase: users, farms, inventory,             │
│  fish_catches, leaderboard, chat (Realtime)     │
└─────────────────────────────────────────────────┘
```

Key idea for the MVP: **no backend yet.** The token check is a read-only
blockchain query, and game progress lives in the player's browser
(`localStorage`). That keeps everything simple while you learn. Supabase comes
next when you want real multiplayer.

## 2. Install & run

```bash
# 1. install dependencies (bun is used here; npm install also works)
bun install

# 2. start the dev server
bun run dev
# → open the local URL Vite prints in the terminal

# 3. production build
bun run build
```

## 3. Folder structure

```
src/
  routes/
    __root.tsx        # app shell: fonts, providers, toaster
    index.tsx         # landing page (hero, features, token, roadmap)
    game.tsx          # token gate + game dashboard
  components/
    SolanaProvider.tsx # wallet adapter setup (Phantom, Solflare)
    WalletButton.tsx   # the "Connect Wallet" button
    Navbar.tsx / Footer.tsx
    ui/                # shadcn/ui components (button, card, tabs, …)
  hooks/
    useTokenGate.ts    # checks the wallet's token balance (read-only)
    useGame.ts         # all game logic: farm, fish, inventory, XP
  lib/
    solana-config.ts   # token mint address, RPC endpoint
  styles.css           # the blue theme (Tailwind v4 design tokens)
supabase/
  schema.sql           # future backend: tables + RLS policies
```

## 4. How the token gate works

File: `src/hooks/useTokenGate.ts`

1. Player clicks **Connect Wallet** (Phantom or Solflare).
2. We call `connection.getParsedTokenAccountsByOwner(wallet, { mint })` —
   a **read-only** RPC call. The player never signs anything just to be checked.
3. We sum the balances of all token accounts for the mint
   `Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump`.
4. Balance ≥ 1 → the game unlocks. Otherwise the player sees:
   *“You need at least 1 token to enter SawahVerse.”*

Config lives in `src/lib/solana-config.ts`. The default RPC is the public
mainnet endpoint, which is rate-limited — for production, paste a free endpoint
from Helius or QuickNode into `RPC_ENDPOINT`.

## 5. The gameplay loop (MVP)

All in `src/hooks/useGame.ts`:

- **Farm:** click an empty tile to plant (costs 1 seed + 2 energy). Rice grows
  for 15 seconds, then turns golden. Harvest → +1 rice, +2 coins, +10 XP.
- **Sell & shop:** rice sells for 8 coins; seeds cost 3 coins. Expand the paddy
  for 250 coins.
- **Fish:** cast once every 5 seconds (costs 5 energy). Rarity odds:
  Common 70% · Uncommon 20% · Rare 7% · Epic 2.5% · Legendary 0.5%.
- **Progress:** XP fills a bar; each level needs `level × 100` XP. Energy
  regenerates 1 point every 8 seconds.
- **Saved** automatically to `localStorage` under `sawahverse_game_v1`.

Leaderboard, online players, activity feed, and chat are **mockups** for now —
they show the final UI with placeholder data until Supabase is wired up.

## 6. Next steps (in order)

1. **Supabase project** → run `supabase/schema.sql`, add the project URL + anon
   key to a `.env`, and swap `localStorage` for Supabase reads/writes.
2. **Sign in with Solana** → a small Edge Function verifies a signed message so
   players can only write their own rows (the RLS policies are ready).
3. **Real chat & leaderboard** → Supabase Realtime on `chat_messages`, and the
   `leaderboard` view replaces the mock list.
4. **Art pass** → replace the CSS-built village with original voxel/isometric
   illustrations (no copied game assets).
