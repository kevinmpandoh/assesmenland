import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getStore } from "../store.server";
import {
  currentEpochStart,
  nextRewardAt,
  REWARD_INTERVAL_MS,
  WINNER_COOLDOWN_MS,
} from "../game-logic";

// SawahVerse game API. Each function runs server-side only; the client
// calls them like async functions. Storage backend is resolved in
// store.server.ts (Supabase in production, local file in dev).

const wallet = z
  .string()
  .min(32)
  .max(44)
  .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "not a base58 Solana address");

const rarity = z.enum(["Common", "Uncommon", "Rare", "Epic", "Legendary"]);

// -------------------------------------------------------------- progress

export const syncPlayer = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      wallet: wallet,
      username: z.string().trim().max(20).optional(),
      level: z.number().int().min(1).max(1_000_000),
      xp: z.number().int().min(0),
      coins: z.number().int().min(0),
      riceHarvested: z.number().int().min(0).default(0),
      fishCaught: z.number().int().min(0).default(0),
    }),
  )
  .handler(async ({ data }) => {
    const store = getStore();
    const existing = await store.getPlayer(data.wallet);
    return store.upsertPlayer({
      wallet_address: data.wallet,
      username: data.username ?? existing?.username ?? null,
      level: data.level,
      xp: data.xp,
      coins: data.coins,
      rice_harvested: data.riceHarvested,
      fish_caught: data.fishCaught,
    });
  });

// ----------------------------------------------------------- leaderboard

/**
 * Reward rounds close once a day, exactly at 00:00 UTC. On the first
 * request of a new day we snapshot the current top-3 as that round's
 * winners ("lazy cron" — no scheduler needed).
 *
 * Fair-play rules:
 *  - a round's champions are hidden from the rankings until the next
 *    00:00 UTC reset (24h cooldown), and
 *  - the previous round's champions can't win two rounds back to back,
 *    so the podium always rotates to new players.
 */
async function settleRewardEpoch(store: ReturnType<typeof getStore>) {
  const { REWARD_TOP_N } = await import("../game-logic");
  const now = Date.now();
  const currentEpoch = currentEpochStart(now);
  // Snapshot the round that JUST ENDED (the previous 24h window). The
  // current round is still in progress — players are competing.
  const endedEpochStart = currentEpoch - REWARD_INTERVAL_MS;
  const endedEpochIso = new Date(endedEpochStart).toISOString();
  const latest = await store.latestWinnerEpoch();
  if (latest && latest >= endedEpochIso) return; // last ended round already settled

  // Skip pre-launch rounds. A reward round is valid only if the game already
  // had players before that round ended; otherwise a fresh launch would crown
  // fake "previous" winners immediately.
  const firstPlayerCreatedAt = await store.firstPlayerCreatedAt();
  if (!firstPlayerCreatedAt || new Date(firstPlayerCreatedAt).getTime() >= currentEpoch) return;

  const topAll = await store.topPlayers(50);
  const playedDuringRound = topAll.some((p) => new Date(p.last_seen_at).getTime() < currentEpoch);
  if (!playedDuringRound) return;

  // No back-to-back wins: the round before that sits this snapshot out.
  const twoBackIso = new Date(currentEpoch - 2 * REWARD_INTERVAL_MS).toISOString();
  const blocked = new Set((await store.winnersSince(twoBackIso)).map((w) => w.wallet_address));
  const eligible = topAll.filter((p) => !blocked.has(p.wallet_address) && p.coins > 0);
  if (eligible.length === 0) return;
  await store.recordWinners(
    eligible.slice(0, REWARD_TOP_N).map((p, i) => ({
      epoch: endedEpochIso,
      rank: i + 1,
      wallet_address: p.wallet_address,
      name: p.username?.trim() || `${p.wallet_address.slice(0, 4)}…${p.wallet_address.slice(-4)}`,
      coins: p.coins,
    })),
  );
}

export const getLeaderboard = createServerFn({ method: "GET" })
  .inputValidator(z.object({ limit: z.number().int().min(1).max(100).default(20) }).optional())
  .handler(async ({ data }) => {
    const store = getStore();
    await settleRewardEpoch(store).catch((e) => console.warn("epoch settle failed", e));

    // Champions of the most recently ENDED round rest until the next reset.
    const cooldownSince = new Date(
      currentEpochStart(Date.now()) - REWARD_INTERVAL_MS,
    ).toISOString();
    const onCooldown = new Set(
      (await store.winnersSince(cooldownSince)).map((w) => w.wallet_address),
    );
    const limit = data?.limit ?? 20;
    const players = (await store.topPlayers(limit + onCooldown.size)).filter(
      (p) => !onCooldown.has(p.wallet_address),
    );
    return players.slice(0, limit).map((p, i) => ({
      rank: i + 1,
      wallet: p.wallet_address,
      name: p.username?.trim() || `${p.wallet_address.slice(0, 4)}…${p.wallet_address.slice(-4)}`,
      level: p.level,
      coins: p.coins,
      harvests: p.rice_harvested,
      lastSeenAt: p.last_seen_at,
    }));
  });

export const getRewardsStatus = createServerFn({ method: "GET" }).handler(async () => {
  const store = getStore();
  await settleRewardEpoch(store).catch((e) => console.warn("epoch settle failed", e));

  const now = Date.now();
  // Resting = winners of the last ENDED round, back at the next reset.
  const restSince = new Date(currentEpochStart(now) - REWARD_INTERVAL_MS).toISOString();
  const recent = await store.winnersSince(restSince);
  const cooldown = recent.map((w) => ({
    wallet: w.wallet_address,
    name: w.name,
    rank: w.rank,
    until: new Date(new Date(w.epoch).getTime() + 2 * REWARD_INTERVAL_MS).toISOString(),
  }));
  // Previous winners = older completed rounds (not the one still resting).
  const winners = (await store.listWinners(50)).filter((w) => w.epoch < restSince).slice(0, 15);
  return {
    nextRewardAt: new Date(nextRewardAt(now)).toISOString(),
    intervalMs: REWARD_INTERVAL_MS,
    cooldownMs: WINNER_COOLDOWN_MS,
    winners: winners.map((w) => ({
      epoch: w.epoch,
      rank: w.rank,
      wallet: w.wallet_address,
      name: w.name,
      coins: w.coins,
    })),
    cooldown,
  };
});

// ------------------------------------------------------------------ chat

// Light per-wallet rate limit. In-memory is fine: one warm server instance
// per region, and the worst case is a missed limit — not a security issue.
const lastMessageAt = new Map<string, number>();
const CHAT_COOLDOWN_MS = 2_000;

export const getChatMessages = createServerFn({ method: "GET" }).handler(async () => {
  return getStore().listChat(50);
});

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ wallet: wallet, body: z.string().trim().min(1).max(280) }))
  .handler(async ({ data }) => {
    const last = lastMessageAt.get(data.wallet) ?? 0;
    if (Date.now() - last < CHAT_COOLDOWN_MS) {
      throw new Error("You're sending messages too fast — wait a moment.");
    }
    lastMessageAt.set(data.wallet, Date.now());
    return getStore().insertChat(data.wallet, data.body);
  });

// --------------------------------------------------------------- fishing

export const logFishCatch = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      wallet: wallet,
      fishName: z.string().trim().min(1).max(40),
      rarity: rarity,
      value: z.number().int().min(0).max(100_000),
    }),
  )
  .handler(async ({ data }) => {
    await getStore().logCatch({
      wallet_address: data.wallet,
      fish_name: data.fishName,
      rarity: data.rarity,
      value: data.value,
    });
    return { ok: true };
  });

export const getRecentCatches = createServerFn({ method: "GET" }).handler(async () => {
  return getStore().recentCatches(10);
});

// ----------------------------------------------------------------- world

// One call per tick: report my position, get everyone back. Players who
// haven't pinged in 12s are considered offline.
const PRESENCE_TTL_MS = 12_000;

export const pingWorld = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      wallet: wallet,
      name: z.string().trim().min(1).max(20),
      level: z.number().int().min(1).max(100_000).default(1),
      tier: z.enum(["sprout", "farmer", "rancher", "landlord"]).default("sprout"),
      x: z.number().min(0).max(200),
      y: z.number().min(0).max(200),
    }),
  )
  .handler(async ({ data }) => {
    const store = getStore();
    await store.upsertPresence({
      wallet_address: data.wallet,
      name: data.name,
      level: data.level,
      tier: data.tier,
      x: Math.round(data.x * 100) / 100,
      y: Math.round(data.y * 100) / 100,
    });
    return store.listPresence(PRESENCE_TTL_MS);
  });

// ----------------------------------------------------- shared town field

// Everyone plants on the same fenced fields in the town. Only the player
// who planted a plot can harvest it, and a ready crop withers (the row is
// deleted) WORLD_PLOT_WITHER_MS after maturing.

const plotCoord = z.number().int().min(0).max(200);

export const getWorldPlots = createServerFn({ method: "GET" }).handler(async () => {
  return getStore().listPlots();
});

export const plantWorldPlot = createServerFn({ method: "POST" })
  .inputValidator(z.object({ wallet: wallet, x: plotCoord, y: plotCoord, crop: z.string() }))
  .handler(async ({ data }) => {
    const { buildMap } = await import("../world-map");
    const { cropById, cropsUnlockedAt, WORLD_PLOT_WITHER_MS } = await import("../game-logic");

    const crop = cropById(data.crop);
    if (!crop) return { ok: false as const, reason: "Unknown crop." };

    const { tiles } = buildMap();
    if (tiles[data.y]?.[data.x] !== "soil") {
      return { ok: false as const, reason: "You can only plant on tilled soil." };
    }

    const store = getStore();
    const player = await store.getPlayer(data.wallet);
    const level = player?.level ?? 1;
    if (!cropsUnlockedAt(level).some((c) => c.id === crop.id)) {
      return { ok: false as const, reason: `Unlocks at level ${crop.unlockLevel}.` };
    }

    const now = Date.now();
    const planted = await store.plantPlot({
      plot_key: `${data.x}:${data.y}`,
      x: data.x,
      y: data.y,
      wallet_address: data.wallet,
      crop: crop.id,
      planted_at: new Date(now).toISOString(),
      ready_at: new Date(now + crop.growMs).toISOString(),
      expires_at: new Date(now + crop.growMs + WORLD_PLOT_WITHER_MS).toISOString(),
    });
    if (!planted) return { ok: false as const, reason: "Someone already planted here." };
    return { ok: true as const };
  });

export const harvestWorldPlot = createServerFn({ method: "POST" })
  .inputValidator(z.object({ wallet: wallet, x: plotCoord, y: plotCoord }))
  .handler(async ({ data }) => {
    const store = getStore();
    const key = `${data.x}:${data.y}`;
    const plot = await store.getPlot(key);
    if (!plot) return { ok: false as const, reason: "Nothing growing here." };
    if (plot.wallet_address !== data.wallet) {
      return { ok: false as const, reason: "This plant belongs to another player." };
    }
    const now = Date.now();
    if (now < new Date(plot.ready_at).getTime()) {
      return { ok: false as const, reason: "Still growing — be patient!" };
    }
    if (now > new Date(plot.expires_at).getTime()) {
      await store.removePlot(key);
      return { ok: false as const, reason: "Too late — the plant withered." };
    }
    await store.removePlot(key);
    return { ok: true as const, crop: plot.crop };
  });
