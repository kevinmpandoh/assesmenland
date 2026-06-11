import { useEffect, useState, useCallback } from "react";

export type Fish = { id: string; name: string; rarity: Rarity; emoji: string; value: number; caughtAt: number };
export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
export type Tile = { id: number; state: "empty" | "growing" | "ready"; plantedAt: number | null };

export type GameState = {
  level: number;
  xp: number;
  coins: number;
  energy: number;
  seeds: number;
  farmSize: number;
  tiles: Tile[];
  inventory: { rice: number; fish: Fish[] };
};

const DEFAULT_SIZE = 9;
const KEY = "sawahverse_game_v1";

export const GROW_MS = 15_000;
export const PLANT_COST = 1; // seed
export const SELL_PRICE = 8;
export const SEED_PRICE = 3;
export const UPGRADE_COST = 250;

function makeTiles(size: number): Tile[] {
  return Array.from({ length: size }, (_, i) => ({ id: i, state: "empty", plantedAt: null }));
}

const initial: GameState = {
  level: 1,
  xp: 0,
  coins: 50,
  energy: 100,
  seeds: 5,
  farmSize: DEFAULT_SIZE,
  tiles: makeTiles(DEFAULT_SIZE),
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

export function xpForLevel(level: number) {
  return level * 100;
}

export function useGame() {
  const [state, setState] = useState<GameState>(initial);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setState(loadState());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveState(state);
  }, [state, mounted]);

  // refresh tile readiness over time
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
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
      let newXp = s.xp + xp;
      let level = s.level;
      while (newXp >= xpForLevel(level)) {
        newXp -= xpForLevel(level);
        level += 1;
      }
      return { ...s, xp: newXp, level, coins: s.coins + coins };
    });
  }, []);

  const plant = (idx: number) => {
    setState((s) => {
      if (s.seeds < PLANT_COST || s.energy < 2) return s;
      const tile = s.tiles[idx];
      if (!tile || tile.state !== "empty") return s;
      const tiles = s.tiles.map((t) => (t.id === idx ? { ...t, state: "growing" as const, plantedAt: Date.now() } : t));
      return { ...s, tiles, seeds: s.seeds - PLANT_COST, energy: s.energy - 2 };
    });
  };

  const harvest = (idx: number) => {
    setState((s) => {
      const tile = s.tiles[idx];
      if (!tile || tile.state !== "ready") return s;
      const tiles = s.tiles.map((t) => (t.id === idx ? { ...t, state: "empty" as const, plantedAt: null } : t));
      return { ...s, tiles, inventory: { ...s.inventory, rice: s.inventory.rice + 1 } };
    });
    grant(10);
  };

  const sellRice = (qty = 1) => {
    setState((s) => {
      const take = Math.min(qty, s.inventory.rice);
      if (take === 0) return s;
      return { ...s, coins: s.coins + take * SELL_PRICE, inventory: { ...s.inventory, rice: s.inventory.rice - take } };
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
      if (s.coins < UPGRADE_COST || s.farmSize >= 25) return s;
      const newSize = s.farmSize + 4;
      const extra = makeTiles(newSize).slice(s.farmSize).map((t, i) => ({ ...t, id: s.farmSize + i }));
      return { ...s, coins: s.coins - UPGRADE_COST, farmSize: newSize, tiles: [...s.tiles, ...extra] };
    });
  };

  const fish = () => {
    if (state.energy < 5) return null;
    const roll = Math.random();
    let rarity: Rarity;
    if (roll < 0.5) rarity = "Common";
    else if (roll < 0.8) rarity = "Uncommon";
    else if (roll < 0.94) rarity = "Rare";
    else if (roll < 0.99) rarity = "Epic";
    else rarity = "Legendary";
    const fishes: Record<Rarity, { name: string; emoji: string; value: number; xp: number }[]> = {
      Common: [{ name: "Sardine", emoji: "🐟", value: 5, xp: 4 }, { name: "Carp", emoji: "🐠", value: 7, xp: 5 }],
      Uncommon: [{ name: "Snapper", emoji: "🐡", value: 18, xp: 10 }, { name: "Mackerel", emoji: "🐟", value: 20, xp: 10 }],
      Rare: [{ name: "Tuna", emoji: "🐠", value: 60, xp: 25 }],
      Epic: [{ name: "Mahi-Mahi", emoji: "🐡", value: 150, xp: 60 }],
      Legendary: [{ name: "Golden Koi", emoji: "🪙", value: 500, xp: 200 }],
    };
    const pool = fishes[rarity];
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
      energy: s.energy - 5,
      inventory: { ...s.inventory, fish: [caught, ...s.inventory.fish].slice(0, 30) },
    }));
    grant(pick.xp);
    return caught;
  };

  // auto-mark ready
  useEffect(() => {
    setState((s) => {
      let changed = false;
      const tiles = s.tiles.map((t) => {
        if (t.state === "growing" && t.plantedAt && Date.now() - t.plantedAt >= GROW_MS) {
          changed = true;
          return { ...t, state: "ready" as const };
        }
        return t;
      });
      return changed ? { ...s, tiles } : s;
    });
  });

  return { state, plant, harvest, sellRice, sellFish, buySeeds, upgradeFarm, fish };
}

export const rarityColor: Record<Rarity, string> = {
  Common: "text-muted-foreground",
  Uncommon: "text-leaf",
  Rare: "text-ocean",
  Epic: "text-violet-500",
  Legendary: "text-gold",
};
