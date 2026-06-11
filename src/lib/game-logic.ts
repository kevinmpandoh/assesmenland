// Pure game rules shared by the React hook and unit tests.
// Keep React/browser APIs out of this file.

export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

export const GROW_MS = 15_000;
export const PLANT_COST = 1; // seed
export const SELL_PRICE = 8;
export const SEED_PRICE = 3;
export const UPGRADE_COST = 250;
export const HARVEST_COINS = 2;
export const HARVEST_XP = 10;
export const FISH_COOLDOWN_MS = 5_000;
export const FISH_ENERGY_COST = 5;
export const MAX_FARM_SIZE = 25;

export const RARITY_ODDS: { rarity: Rarity; chance: number }[] = [
  { rarity: "Common", chance: 0.7 },
  { rarity: "Uncommon", chance: 0.2 },
  { rarity: "Rare", chance: 0.07 },
  { rarity: "Epic", chance: 0.025 },
  { rarity: "Legendary", chance: 0.005 },
];

export const FISH_TABLE: Record<
  Rarity,
  { name: string; emoji: string; value: number; xp: number }[]
> = {
  Common: [
    { name: "Sardine", emoji: "🐟", value: 5, xp: 4 },
    { name: "Carp", emoji: "🐠", value: 7, xp: 5 },
  ],
  Uncommon: [
    { name: "Snapper", emoji: "🐡", value: 18, xp: 10 },
    { name: "Mackerel", emoji: "🐟", value: 20, xp: 10 },
  ],
  Rare: [{ name: "Tuna", emoji: "🐠", value: 60, xp: 25 }],
  Epic: [{ name: "Mahi-Mahi", emoji: "🐡", value: 150, xp: 60 }],
  Legendary: [{ name: "Golden Koi", emoji: "🪙", value: 500, xp: 200 }],
};

/** Map a uniform roll in [0, 1) to a rarity using RARITY_ODDS. */
export function rollRarity(roll: number): Rarity {
  let cumulative = 0;
  for (const { rarity, chance } of RARITY_ODDS) {
    cumulative += chance;
    if (roll < cumulative) return rarity;
  }
  return "Legendary";
}

export function xpForLevel(level: number) {
  return level * 100;
}

/** Add XP to (level, xp) and carry over level-ups. */
export function applyXp(level: number, xp: number, gained: number): { level: number; xp: number } {
  let newXp = xp + gained;
  while (newXp >= xpForLevel(level)) {
    newXp -= xpForLevel(level);
    level += 1;
  }
  return { level, xp: newXp };
}
