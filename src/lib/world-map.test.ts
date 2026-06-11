import { describe, expect, test } from "bun:test";
import { MAP_SIZE, SPAWN, buildMap, isWalkable, nearWater } from "./world-map";

const { tiles, objects } = buildMap();

describe("world map", () => {
  test("map is the right size", () => {
    expect(tiles.length).toBe(MAP_SIZE);
    expect(tiles.every((row) => row.length === MAP_SIZE)).toBe(true);
  });

  test("border is water, interior has land", () => {
    expect(tiles[0][0]).toBe("deep");
    expect(tiles[0][MAP_SIZE - 1]).toBe("deep");
    const kinds = new Set(tiles.flat());
    expect(kinds.has("grass")).toBe(true);
    expect(kinds.has("sand")).toBe(true);
    expect(kinds.has("paddy")).toBe(true);
    expect(kinds.has("dock")).toBe(true);
  });

  test("spawn point is walkable", () => {
    expect(isWalkable(tiles, objects, SPAWN.x, SPAWN.y)).toBe(true);
  });

  test("water is not walkable, objects block tiles", () => {
    expect(isWalkable(tiles, objects, 0, 0)).toBe(false);
    const house = objects.find((o) => o.kind === "house")!;
    expect(isWalkable(tiles, objects, house.x, house.y)).toBe(false);
  });

  test("end of the dock is walkable and near water", () => {
    expect(isWalkable(tiles, objects, 14, 23)).toBe(true);
    expect(nearWater(tiles, 14, 23)).toBe(true);
  });

  test("village centre is not near water", () => {
    expect(nearWater(tiles, SPAWN.x, SPAWN.y)).toBe(false);
  });
});
