import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getStore } from "../store.server";

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
      level: z.number().int().min(1).max(10_000),
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

export const getLeaderboard = createServerFn({ method: "GET" })
  .inputValidator(z.object({ limit: z.number().int().min(1).max(100).default(20) }).optional())
  .handler(async ({ data }) => {
    const store = getStore();
    const players = await store.topPlayers(data?.limit ?? 20);
    return players.map((p, i) => ({
      rank: i + 1,
      wallet: p.wallet_address,
      name: p.username?.trim() || `${p.wallet_address.slice(0, 4)}…${p.wallet_address.slice(-4)}`,
      level: p.level,
      coins: p.coins,
      harvests: p.rice_harvested,
      lastSeenAt: p.last_seen_at,
    }));
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
      level: z.number().int().min(1).max(100).default(1),
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
      x: Math.round(data.x * 100) / 100,
      y: Math.round(data.y * 100) / 100,
    });
    return store.listPresence(PRESENCE_TTL_MS);
  });

// ----------------------------------------------------- shared town field

// Everyone plants on the same fenced fields in the town. Only the farmer
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
      return { ok: false as const, reason: "This plant belongs to another farmer." };
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
