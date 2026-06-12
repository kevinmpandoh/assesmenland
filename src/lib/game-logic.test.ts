import { describe, expect, test } from "bun:test";
import {
  CROPS,
  MAX_SEED_BAG,
  REWARD_INTERVAL_MS,
  WINNER_COOLDOWN_MS,
  currentEpochStart,
  nextRewardAt,
  seedBagCount,
  seedBagSpace,
  EQUIPMENT,
  MAX_LEVEL,
  applyXp,
  cropTier,
  cropsUnlockedAt,
  effectiveGrowMs,
  effectiveSellPrice,
  xpForLevel,
} from "./game-logic";

describe("crops", () => {
  test("there are 10 crops, one unlocking per level", () => {
    expect(CROPS.length).toBe(10);
    const levels = CROPS.map((c) => c.unlockLevel);
    expect(levels).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  test("every crop is profitable per seed", () => {
    for (const c of CROPS) expect(c.sellPrice).toBeGreaterThan(c.seedCost);
  });

  test("grow time scales 5s per crop level (5s … 50s)", () => {
    for (const c of CROPS) expect(c.growMs).toBe(c.unlockLevel * 5_000);
  });

  test("level gates which crops can be planted", () => {
    expect(cropsUnlockedAt(1).map((c) => c.id)).toEqual(["tomato"]);
    expect(cropsUnlockedAt(3).length).toBe(3);
    expect(cropsUnlockedAt(MAX_LEVEL).length).toBe(10);
  });

  test("activity tiers span common to legendary", () => {
    expect(cropTier(CROPS[0])).toBe("Common");
    expect(cropTier(CROPS[9])).toBe("Legendary");
  });
});

describe("equipment", () => {
  test("speed equipment shortens grow time, capped at 55%", () => {
    const tomato = CROPS[0];
    expect(effectiveGrowMs(tomato, [])).toBe(5_000);
    expect(effectiveGrowMs(tomato, ["watering_can"])).toBe(4_500);
    const all = EQUIPMENT.map((e) => e.id);
    // total speed bonuses = 0.7 → capped at 0.55
    expect(effectiveGrowMs(tomato, all)).toBe(2_250);
  });

  test("sell equipment raises prices, capped at 15%", () => {
    const melon = CROPS.find((c) => c.id === "melon")!;
    expect(effectiveSellPrice(melon, [])).toBe(58);
    expect(effectiveSellPrice(melon, ["scarecrow"])).toBe(61);
    expect(effectiveSellPrice(melon, ["scarecrow", "golden_hoe"])).toBe(Math.round(58 * 1.15));
  });
});

describe("levels", () => {
  test("xp requirement grows with level", () => {
    expect(xpForLevel(1)).toBe(100);
    expect(xpForLevel(7)).toBe(700);
  });

  test("levels up and carries over remaining xp", () => {
    expect(applyXp(1, 90, 20)).toEqual({ level: 2, xp: 10 });
    expect(applyXp(1, 0, 305)).toEqual({ level: 3, xp: 5 });
  });

  test("levels are uncapped and keep climbing past 10", () => {
    // level 10 needs 1000 XP → 1100 lands at level 11 with 100 left over
    expect(applyXp(10, 0, 1_100)).toEqual({ level: 11, xp: 100 });
    const high = applyXp(1, 0, 1_000_000);
    expect(high.level).toBeGreaterThan(10);
  });
});

describe("seed bag", () => {
  test("holds at most 10 seeds in total", () => {
    expect(MAX_SEED_BAG).toBe(10);
    expect(seedBagCount({ tomato: 4, corn: 3 })).toBe(7);
    expect(seedBagSpace({ tomato: 4, corn: 3 })).toBe(3);
    expect(seedBagSpace({ tomato: 10 })).toBe(0);
    expect(seedBagSpace({})).toBe(MAX_SEED_BAG);
  });
});

describe("reward schedule", () => {
  test("epochs are 3 hours on a fixed grid", () => {
    expect(REWARD_INTERVAL_MS).toBe(3 * 60 * 60 * 1000);
    expect(WINNER_COOLDOWN_MS).toBe(24 * 60 * 60 * 1000);
    const now = Date.UTC(2026, 5, 12, 7, 30); // 07:30 UTC
    expect(currentEpochStart(now)).toBe(Date.UTC(2026, 5, 12, 6, 0));
    expect(nextRewardAt(now)).toBe(Date.UTC(2026, 5, 12, 9, 0));
  });
});
