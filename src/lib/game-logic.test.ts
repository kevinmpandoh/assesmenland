import { describe, expect, test } from "bun:test";
import {
  CROPS,
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
    expect(effectiveGrowMs(tomato, [])).toBe(20_000);
    expect(effectiveGrowMs(tomato, ["watering_can"])).toBe(18_000);
    const all = EQUIPMENT.map((e) => e.id);
    // total speed bonuses = 0.7 → capped at 0.55
    expect(effectiveGrowMs(tomato, all)).toBe(9_000);
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

  test("level is capped at 10", () => {
    expect(applyXp(9, 890, 99_999)).toEqual({ level: 10, xp: 0 });
    expect(applyXp(10, 0, 500)).toEqual({ level: 10, xp: 0 });
  });
});
