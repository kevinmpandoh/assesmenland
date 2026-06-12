import { useEffect, useState, useCallback, useRef } from "react";
import {
  CROPS,
  EQUIPMENT,
  MAX_FARM_SIZE,
  MAX_LEVEL,
  PLANT_ENERGY,
  UPGRADE_PLOT_COST,
  applyXp,
  cropById,
  cropTier,
  cropsUnlockedAt,
  effectiveGrowMs,
  effectiveSellPrice,
  equipmentById,
  xpForLevel,
  type Crop,
} from "@/lib/game-logic";
import { syncPlayer, logFishCatch } from "@/lib/api/game.functions";

export {
  CROPS,
  EQUIPMENT,
  MAX_LEVEL,
  UPGRADE_PLOT_COST,
  xpForLevel,
  cropsUnlockedAt,
  effectiveGrowMs,
  effectiveSellPrice,
};

export type Tile = {
  id: number;
  state: "empty" | "growing" | "ready";
  plantedAt: number | null;
  crop: string | null;
  /** grow duration captured at plant time so buying gear later is fair */
  growMs: number | null;
};

export type GameState = {
  username: string;
  level: number;
  xp: number;
  gold: number;
  energy: number;
  farmSize: number;
  tiles: Tile[];
  harvests: number;
  equipment: string[];
  /** harvested produce waiting to be sold, by crop id */
  barn: Record<string, number>;
};

export type SyncState = "idle" | "syncing" | "synced" | "error";

const DEFAULT_SIZE = 9;
const KEY = "agriland_game_v1";
const SYNC_DEBOUNCE_MS = 3_000;

function makeTiles(size: number): Tile[] {
  return Array.from({ length: size }, (_, i) => ({
    id: i,
    state: "empty",
    plantedAt: null,
    crop: null,
    growMs: null,
  }));
}

const initial: GameState = {
  username: "",
  level: 1,
  xp: 0,
  gold: 25,
  energy: 100,
  farmSize: DEFAULT_SIZE,
  tiles: makeTiles(DEFAULT_SIZE),
  harvests: 0,
  equipment: [],
  barn: {},
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
 * The Agri Land loop: buy seeds → plant → wait → harvest → sell → level
 * up → unlock bigger crops → invest gold in equipment → repeat.
 * Saved locally on every change and synced to the server (debounced) so
 * the global leaderboard stays live.
 */
export function useGame(walletAddress: string | null = null) {
  const [state, setState] = useState<GameState>(initial);
  const [mounted, setMounted] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");

  useEffect(() => {
    setState(loadState());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveState(state);
  }, [state, mounted]);

  // Debounced cloud sync for the leaderboard/profile.
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
            coins: state.gold,
            riceHarvested: state.harvests,
            fishCaught: 0,
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
  }, [mounted, walletAddress, state.username, state.level, state.xp, state.gold, state.harvests]);

  // 1s tick: re-render growth bars and flip grown tiles to ready.
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
            tile.growMs &&
            Date.now() - tile.plantedAt >= tile.growMs
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

  const grant = useCallback((xp: number, gold = 0) => {
    setState((s) => {
      const leveled = applyXp(s.level, s.xp, xp);
      return { ...s, xp: leveled.xp, level: leveled.level, gold: s.gold + gold };
    });
  }, []);

  const setUsername = (name: string) => {
    setState((s) => ({ ...s, username: name.trim().slice(0, 20) }));
  };

  /** Buy a seed and plant it in one action (kintara-style quick loop). */
  const plant = (idx: number, cropId: string) => {
    setState((s) => {
      const crop = cropById(cropId);
      if (!crop) return s;
      if (crop.unlockLevel > s.level) return s;
      if (s.gold < crop.seedCost || s.energy < PLANT_ENERGY) return s;
      const tile = s.tiles[idx];
      if (!tile || tile.state !== "empty") return s;
      const growMs = effectiveGrowMs(crop, s.equipment);
      const tiles = s.tiles.map((t) =>
        t.id === idx
          ? { ...t, state: "growing" as const, plantedAt: Date.now(), crop: crop.id, growMs }
          : t,
      );
      return {
        ...s,
        tiles,
        gold: s.gold - crop.seedCost,
        energy: s.energy - PLANT_ENERGY,
      };
    });
  };

  const harvest = (idx: number): Crop | null => {
    const tile = state.tiles[idx];
    if (!tile || tile.state !== "ready" || !tile.crop) return null;
    const crop = cropById(tile.crop);
    if (!crop) return null;
    setState((s) => {
      const tiles = s.tiles.map((t) =>
        t.id === idx
          ? { ...t, state: "empty" as const, plantedAt: null, crop: null, growMs: null }
          : t,
      );
      return {
        ...s,
        tiles,
        harvests: s.harvests + 1,
        barn: { ...s.barn, [crop.id]: (s.barn[crop.id] ?? 0) + 1 },
      };
    });
    grant(crop.xp);
    // High-tier harvests show up in the village activity feed.
    if (walletAddress && crop.unlockLevel >= 5) {
      logFishCatch({
        data: {
          wallet: walletAddress,
          fishName: crop.name,
          rarity: cropTier(crop),
          value: crop.sellPrice,
        },
      }).catch((e) => console.warn("harvest log failed", e));
    }
    return crop;
  };

  /** Sell everything of one crop from the barn. Returns gold earned. */
  const sellCrop = (cropId: string): number => {
    const crop = cropById(cropId);
    if (!crop) return 0;
    const qty = state.barn[cropId] ?? 0;
    if (qty === 0) return 0;
    const price = effectiveSellPrice(crop, state.equipment);
    const earned = qty * price;
    setState((s) => {
      const barn = { ...s.barn };
      delete barn[cropId];
      return { ...s, gold: s.gold + earned, barn };
    });
    return earned;
  };

  const buyEquipment = (id: string): boolean => {
    const item = equipmentById(id);
    if (!item) return false;
    if (state.equipment.includes(id) || state.gold < item.cost) return false;
    setState((s) => ({
      ...s,
      gold: s.gold - item.cost,
      equipment: [...s.equipment, id],
    }));
    return true;
  };

  const upgradeFarm = () => {
    setState((s) => {
      if (s.gold < UPGRADE_PLOT_COST || s.farmSize >= MAX_FARM_SIZE) return s;
      const newSize = s.farmSize + 4;
      const extra = makeTiles(newSize)
        .slice(s.farmSize)
        .map((t, i) => ({ ...t, id: s.farmSize + i }));
      return {
        ...s,
        gold: s.gold - UPGRADE_PLOT_COST,
        farmSize: newSize,
        tiles: [...s.tiles, ...extra],
      };
    });
  };

  return { state, syncState, setUsername, plant, harvest, sellCrop, buyEquipment, upgradeFarm };
}
