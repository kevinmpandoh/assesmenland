import { useEffect, useState, useCallback, useRef } from "react";
import {
  GROW_MS,
  PLANT_COST,
  SELL_PRICE,
  SEED_PRICE,
  UPGRADE_COST,
  HARVEST_COINS,
  HARVEST_XP,
  FISH_COOLDOWN_MS,
  FISH_ENERGY_COST,
  MAX_FARM_SIZE,
  RARITY_ODDS,
  FISH_TABLE,
  rollRarity,
  applyXp,
  xpForLevel,
  type Rarity,
} from "@/lib/game-logic";
import { syncPlayer, logFishCatch } from "@/lib/api/game.functions";

export {
  GROW_MS,
  PLANT_COST,
  SELL_PRICE,
  SEED_PRICE,
  UPGRADE_COST,
  HARVEST_COINS,
  FISH_COOLDOWN_MS,
  RARITY_ODDS,
  xpForLevel,
};
export type { Rarity };

export type Fish = {
  id: string;
  name: string;
  rarity: Rarity;
  emoji: string;
  value: number;
  caughtAt: number;
};
export type Tile = { id: number; state: "empty" | "growing" | "ready"; plantedAt: number | null };

export type GameState = {
  username: string;
  level: number;
  xp: number;
  coins: number;
  energy: number;
  seeds: number;
  farmSize: number;
  tiles: Tile[];
  riceHarvested: number;
  fishCaught: number;
  inventory: { rice: number; fish: Fish[] };
};

export type SyncState = "idle" | "syncing" | "synced" | "error";

const DEFAULT_SIZE = 9;
const KEY = "sawahverse_game_v1";
const SYNC_DEBOUNCE_MS = 3_000;

function makeTiles(size: number): Tile[] {
  return Array.from({ length: size }, (_, i) => ({ id: i, state: "empty", plantedAt: null }));
}

const initial: GameState = {
  username: "",
  level: 1,
  xp: 0,
  coins: 50,
  energy: 100,
  seeds: 5,
  farmSize: DEFAULT_SIZE,
  tiles: makeTiles(DEFAULT_SIZE),
  riceHarvested: 0,
  fishCaught: 0,
  inventory: { rice: 0, fish: [] },
};

export function loadState(): GameState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    return { ...initial, ...parsed };
  } catch {
    return initial;
  }
}

export function saveState(s: GameState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

/**
 * The whole game loop. Progress is saved locally on every change and
 * pushed to the server (debounced) so the leaderboard stays live.
 */
export function useGame(walletAddress: string | null = null) {
  const [state, setState] = useState<GameState>(initial);
  const [mounted, setMounted] = useState(false);
  const [lastFishAt, setLastFishAt] = useState(0);
  const [syncState, setSyncState] = useState<SyncState>("idle");

  useEffect(() => {
    setState(loadState());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveState(state);
  }, [state, mounted]);

  // Debounced cloud sync — keeps leaderboard/profile fresh without
  // hammering the API on every click.
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!mounted || !walletAddress) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      setSyncState("syncing");
      try {
        await syncPlayer({
          data: {
            wallet: walletAddress,
            username: state.username || undefined,
            level: state.level,
            xp: state.xp,
            coins: state.coins,
            riceHarvested: state.riceHarvested,
            fishCaught: state.fishCaught,
          },
        });
        setSyncState("synced");
      } catch (e) {
        console.warn("cloud sync failed", e);
        setSyncState("error");
      }
    }, SYNC_DEBOUNCE_MS);
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [
    mounted,
    walletAddress,
    state.username,
    state.level,
    state.xp,
    state.coins,
    state.riceHarvested,
    state.fishCaught,
  ]);

  // 1s tick: re-render growth bars/cooldowns and flip grown tiles to ready.
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      force((n) => n + 1);
      setState((s) => {
        let changed = false;
        const tiles = s.tiles.map((tile) => {
          if (
            tile.state === "growing" &&
            tile.plantedAt &&
            Date.now() - tile.plantedAt >= GROW_MS
          ) {
            changed = true;
            return { ...tile, state: "ready" as const };
          }
          return tile;
        });
        return changed ? { ...s, tiles } : s;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // energy regen
  useEffect(() => {
    const t = setInterval(() => {
      setState((s) => (s.energy < 100 ? { ...s, energy: Math.min(100, s.energy + 1) } : s));
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const grant = useCallback((xp: number, coins = 0) => {
    setState((s) => {
      const leveled = applyXp(s.level, s.xp, xp);
      return { ...s, xp: leveled.xp, level: leveled.level, coins: s.coins + coins };
    });
  }, []);

  const setUsername = (name: string) => {
    setState((s) => ({ ...s, username: name.trim().slice(0, 20) }));
  };

  const plant = (idx: number) => {
    setState((s) => {
      if (s.seeds < PLANT_COST || s.energy < 2) return s;
      const tile = s.tiles[idx];
      if (!tile || tile.state !== "empty") return s;
      const tiles = s.tiles.map((t) =>
        t.id === idx ? { ...t, state: "growing" as const, plantedAt: Date.now() } : t,
      );
      return { ...s, tiles, seeds: s.seeds - PLANT_COST, energy: s.energy - 2 };
    });
  };

  const harvest = (idx: number) => {
    setState((s) => {
      const tile = s.tiles[idx];
      if (!tile || tile.state !== "ready") return s;
      const tiles = s.tiles.map((t) =>
        t.id === idx ? { ...t, state: "empty" as const, plantedAt: null } : t,
      );
      return {
        ...s,
        tiles,
        riceHarvested: s.riceHarvested + 1,
        inventory: { ...s.inventory, rice: s.inventory.rice + 1 },
      };
    });
    grant(HARVEST_XP, HARVEST_COINS);
  };

  const sellRice = (qty = 1) => {
    setState((s) => {
      const take = Math.min(qty, s.inventory.rice);
      if (take === 0) return s;
      return {
        ...s,
        coins: s.coins + take * SELL_PRICE,
        inventory: { ...s.inventory, rice: s.inventory.rice - take },
      };
    });
  };

  const sellFish = (id: string) => {
    setState((s) => {
      const f = s.inventory.fish.find((x) => x.id === id);
      if (!f) return s;
      return {
        ...s,
        coins: s.coins + f.value,
        inventory: { ...s.inventory, fish: s.inventory.fish.filter((x) => x.id !== id) },
      };
    });
  };

  const buySeeds = (qty = 5) => {
    setState((s) => {
      const cost = qty * SEED_PRICE;
      if (s.coins < cost) return s;
      return { ...s, coins: s.coins - cost, seeds: s.seeds + qty };
    });
  };

  const upgradeFarm = () => {
    setState((s) => {
      if (s.coins < UPGRADE_COST || s.farmSize >= MAX_FARM_SIZE) return s;
      const newSize = s.farmSize + 4;
      const extra = makeTiles(newSize)
        .slice(s.farmSize)
        .map((t, i) => ({ ...t, id: s.farmSize + i }));
      return {
        ...s,
        coins: s.coins - UPGRADE_COST,
        farmSize: newSize,
        tiles: [...s.tiles, ...extra],
      };
    });
  };

  const fish = () => {
    if (state.energy < FISH_ENERGY_COST) return null;
    if (Date.now() - lastFishAt < FISH_COOLDOWN_MS) return null;
    const rarity = rollRarity(Math.random());
    const pool = FISH_TABLE[rarity];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const caught: Fish = {
      id: crypto.randomUUID(),
      name: pick.name,
      emoji: pick.emoji,
      rarity,
      value: pick.value,
      caughtAt: Date.now(),
    };
    setState((s) => ({
      ...s,
      energy: s.energy - FISH_ENERGY_COST,
      fishCaught: s.fishCaught + 1,
      inventory: { ...s.inventory, fish: [caught, ...s.inventory.fish].slice(0, 30) },
    }));
    setLastFishAt(Date.now());
    grant(pick.xp);
    if (walletAddress) {
      logFishCatch({
        data: {
          wallet: walletAddress,
          fishName: caught.name,
          rarity: caught.rarity,
          value: caught.value,
        },
      }).catch((e) => console.warn("catch log failed", e));
    }
    return caught;
  };

  const fishCooldownRemaining = Math.max(0, FISH_COOLDOWN_MS - (Date.now() - lastFishAt));

  return {
    state,
    syncState,
    setUsername,
    plant,
    harvest,
    sellRice,
    sellFish,
    buySeeds,
    upgradeFarm,
    fish,
    fishCooldownRemaining,
  };
}

export const rarityColor: Record<Rarity, string> = {
  Common: "text-muted-foreground",
  Uncommon: "text-leaf",
  Rare: "text-ocean",
  Epic: "text-violet-500",
  Legendary: "text-gold",
};
