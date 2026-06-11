import { describe, expect, test } from "bun:test";
import { RARITY_ODDS, applyXp, rollRarity, xpForLevel } from "./game-logic";

describe("rollRarity", () => {
  test("odds sum to exactly 100%", () => {
    const total = RARITY_ODDS.reduce((s, r) => s + r.chance, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  test("maps rolls to the spec rarities (70/20/7/2.5/0.5)", () => {
    expect(rollRarity(0)).toBe("Common");
    expect(rollRarity(0.699)).toBe("Common");
    expect(rollRarity(0.7)).toBe("Uncommon");
    expect(rollRarity(0.899)).toBe("Uncommon");
    expect(rollRarity(0.9)).toBe("Rare");
    expect(rollRarity(0.969)).toBe("Rare");
    expect(rollRarity(0.97)).toBe("Epic");
    expect(rollRarity(0.994)).toBe("Epic");
    expect(rollRarity(0.995)).toBe("Legendary");
    expect(rollRarity(0.9999)).toBe("Legendary");
  });
});

describe("applyXp", () => {
  test("accumulates xp below the threshold", () => {
    expect(applyXp(1, 0, 50)).toEqual({ level: 1, xp: 50 });
  });

  test("levels up and carries over remaining xp", () => {
    // level 1 needs 100 xp
    expect(applyXp(1, 90, 20)).toEqual({ level: 2, xp: 10 });
  });

  test("handles multiple level-ups in one grant", () => {
    // 100 (lvl1) + 200 (lvl2) = 300 spent, 5 left over
    expect(applyXp(1, 0, 305)).toEqual({ level: 3, xp: 5 });
  });

  test("xp requirement grows with level", () => {
    expect(xpForLevel(1)).toBe(100);
    expect(xpForLevel(7)).toBe(700);
  });
});
