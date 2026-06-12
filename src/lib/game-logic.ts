// Pure game rules for Agri Land — shared by the React hook, the UI
// tables (shop, docs), and unit tests. Keep React/browser APIs out.

/**
 * Crops unlock through level 10, but levels themselves are endless —
 * keep harvesting and the number keeps climbing.
 */
export const MAX_CROP_LEVEL = 10;
/** @deprecated kept as an alias for the crop-unlock ceiling */
export const MAX_LEVEL = MAX_CROP_LEVEL;
export const PLANT_ENERGY = 2;
export const UPGRADE_PLOT_COST = 250;
export const MAX_FARM_SIZE = 25;
export const ENERGY_REGEN_MS = 8_000;

export type Crop = {
  id: string;
  name: string;
  emoji: string;
  unlockLevel: number;
  seedCost: number;
  sellPrice: number;
  growMs: number;
  xp: number;
};

// One new crop unlocks per level. Grow time scales with the crop level:
// 5 seconds per level (tomato 5s … Golden Rice 50s), and later crops pay
// far more per plot.
export const CROPS: Crop[] = [
  {
    id: "tomato",
    name: "Tomato",
    emoji: "🍅",
    unlockLevel: 1,
    seedCost: 4,
    sellPrice: 7,
    growMs: 5_000,
    xp: 8,
  },
  {
    id: "eggplant",
    name: "Eggplant",
    emoji: "🍆",
    unlockLevel: 2,
    seedCost: 6,
    sellPrice: 11,
    growMs: 10_000,
    xp: 12,
  },
  {
    id: "corn",
    name: "Corn",
    emoji: "🌽",
    unlockLevel: 3,
    seedCost: 9,
    sellPrice: 17,
    growMs: 15_000,
    xp: 18,
  },
  {
    id: "chili",
    name: "Chili",
    emoji: "🌶️",
    unlockLevel: 4,
    seedCost: 14,
    sellPrice: 26,
    growMs: 20_000,
    xp: 25,
  },
  {
    id: "cabbage",
    name: "Cabbage",
    emoji: "🥬",
    unlockLevel: 5,
    seedCost: 20,
    sellPrice: 38,
    growMs: 25_000,
    xp: 35,
  },
  {
    id: "melon",
    name: "Melon",
    emoji: "🍈",
    unlockLevel: 6,
    seedCost: 30,
    sellPrice: 58,
    growMs: 30_000,
    xp: 50,
  },
  {
    id: "pumpkin",
    name: "Pumpkin",
    emoji: "🎃",
    unlockLevel: 7,
    seedCost: 45,
    sellPrice: 88,
    growMs: 35_000,
    xp: 70,
  },
  {
    id: "strawberry",
    name: "Strawberry",
    emoji: "🍓",
    unlockLevel: 8,
    seedCost: 65,
    sellPrice: 130,
    growMs: 40_000,
    xp: 95,
  },
  {
    id: "mango",
    name: "Mango",
    emoji: "🥭",
    unlockLevel: 9,
    seedCost: 95,
    sellPrice: 195,
    growMs: 45_000,
    xp: 130,
  },
  {
    id: "golden_rice",
    name: "Golden Rice",
    emoji: "🌾",
    unlockLevel: 10,
    seedCost: 140,
    sellPrice: 300,
    growMs: 50_000,
    xp: 180,
  },
];

export function cropById(id: string): Crop | undefined {
  return CROPS.find((c) => c.id === id);
}

export function cropsUnlockedAt(level: number): Crop[] {
  return CROPS.filter((c) => c.unlockLevel <= level);
}

export type Equipment = {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  /** fraction shaved off grow time (0.1 = grows 10% faster) */
  speedBonus: number;
  /** fraction added to sell price */
  sellBonus: number;
  desc: string;
};

export const EQUIPMENT: Equipment[] = [
  {
    id: "watering_can",
    name: "Watering Can",
    emoji: "🚿",
    cost: 150,
    speedBonus: 0.1,
    sellBonus: 0,
    desc: "Crops grow 10% faster.",
  },
  {
    id: "scarecrow",
    name: "Scarecrow",
    emoji: "🎭",
    cost: 400,
    speedBonus: 0,
    sellBonus: 0.05,
    desc: "Crops sell for 5% more.",
  },
  {
    id: "sprinkler",
    name: "Sprinkler",
    emoji: "💧",
    cost: 900,
    speedBonus: 0.2,
    sellBonus: 0,
    desc: "Crops grow 20% faster.",
  },
  {
    id: "fertilizer",
    name: "Fertilizer Kit",
    emoji: "🧪",
    cost: 1_600,
    speedBonus: 0.15,
    sellBonus: 0,
    desc: "Crops grow another 15% faster.",
  },
  {
    id: "greenhouse",
    name: "Greenhouse",
    emoji: "🏡",
    cost: 3_000,
    speedBonus: 0.25,
    sellBonus: 0,
    desc: "Crops grow another 25% faster.",
  },
  {
    id: "golden_hoe",
    name: "Golden Hoe",
    emoji: "⛏️",
    cost: 5_000,
    speedBonus: 0,
    sellBonus: 0.1,
    desc: "Crops sell for 10% more.",
  },
];

export const MAX_SPEED_BONUS = 0.55;
export const MAX_SELL_BONUS = 0.15;

export function equipmentById(id: string): Equipment | undefined {
  return EQUIPMENT.find((e) => e.id === id);
}

/** Effective grow time for a crop given owned equipment ids. */
export function effectiveGrowMs(crop: Crop, owned: string[]): number {
  let speed = 0;
  for (const id of owned) speed += equipmentById(id)?.speedBonus ?? 0;
  speed = Math.min(speed, MAX_SPEED_BONUS);
  return Math.round(crop.growMs * (1 - speed));
}

/** Effective sell price for a crop given owned equipment ids. */
export function effectiveSellPrice(crop: Crop, owned: string[]): number {
  let bonus = 0;
  for (const id of owned) bonus += equipmentById(id)?.sellBonus ?? 0;
  bonus = Math.min(bonus, MAX_SELL_BONUS);
  return Math.round(crop.sellPrice * (1 + bonus));
}

export function xpForLevel(level: number) {
  return level * 100;
}

/** Add XP, carrying over level-ups. Levels are uncapped. */
export function applyXp(level: number, xp: number, gained: number): { level: number; xp: number } {
  let newXp = xp + gained;
  while (newXp >= xpForLevel(level)) {
    newXp -= xpForLevel(level);
    level += 1;
  }
  return { level, xp: newXp };
}

/** Activity-feed tier for a crop (reuses the rarity log pipeline). */
export function cropTier(crop: Crop): "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" {
  if (crop.unlockLevel >= 9) return "Legendary";
  if (crop.unlockLevel >= 7) return "Epic";
  if (crop.unlockLevel >= 5) return "Rare";
  if (crop.unlockLevel >= 3) return "Uncommon";
  return "Common";
}

export type Rarity = ReturnType<typeof cropTier>;

export const rarityColor: Record<Rarity, string> = {
  Common: "text-muted-foreground",
  Uncommon: "text-leaf",
  Rare: "text-ocean",
  Epic: "text-violet-500",
  Legendary: "text-sunset-deep",
};

/** Shared town field: a ready crop withers if not harvested in time. */
export const WORLD_PLOT_WITHER_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * A player's seed bag holds at most this many seeds in total — plant
 * what you have before buying more, so nobody hoards seeds while other
 * farmers wait for field space.
 */
export const MAX_SEED_BAG = 10;

export function seedBagCount(seeds: Record<string, number>): number {
  return Object.values(seeds).reduce((sum, n) => sum + n, 0);
}

export function seedBagSpace(seeds: Record<string, number>): number {
  return Math.max(0, MAX_SEED_BAG - seedBagCount(seeds));
}

// ------------------------------------------------- leaderboard rewards

/** Rewards are distributed every 3 hours, on a fixed UTC schedule. */
export const REWARD_INTERVAL_MS = 3 * 60 * 60 * 1000;
/** Recent winners sit out of the rankings for 24 hours. */
export const WINNER_COOLDOWN_MS = 24 * 60 * 60 * 1000;
/** Top N farmers win each round. */
export const REWARD_TOP_N = 3;

export function currentEpochStart(now: number): number {
  return Math.floor(now / REWARD_INTERVAL_MS) * REWARD_INTERVAL_MS;
}

export function nextRewardAt(now: number): number {
  return currentEpochStart(now) + REWARD_INTERVAL_MS;
}
