// The island map for the explorable world. Pure data + helpers so the
// canvas renderer and tests can share it. Coordinates are tile units;
// (0,0) is the top corner of the isometric diamond.

export const MAP_SIZE = 26;

export type TileKind =
  | "deep" // deep water (border)
  | "water" // shallow water
  | "sand"
  | "grass"
  | "paddy"
  | "path"
  | "dock";

export type WorldObject = {
  kind: "house" | "tree" | "rock" | "stall";
  x: number;
  y: number;
};

const W = MAP_SIZE;
const center = (W - 1) / 2;

// Island shape: a rounded blob. Everything beyond radius is water.
function baseTile(x: number, y: number): TileKind {
  const dx = x - center;
  const dy = y - center;
  // slightly oval, with a wavy edge so the coast isn't a perfect circle
  const wobble = Math.sin(x * 1.7) * 0.7 + Math.cos(y * 2.3) * 0.7;
  const d = Math.sqrt(dx * dx * 1.15 + dy * dy) + wobble;
  if (d > 11.5) return "deep";
  if (d > 9.8) return "water";
  if (d > 8.4) return "sand";
  return "grass";
}

function stampRect(
  tiles: TileKind[][],
  kind: TileKind,
  x0: number,
  y0: number,
  w: number,
  h: number,
) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      if (tiles[y]?.[x] !== undefined) tiles[y][x] = kind;
    }
  }
}

export function buildMap(): { tiles: TileKind[][]; objects: WorldObject[] } {
  const tiles: TileKind[][] = [];
  for (let y = 0; y < W; y++) {
    const row: TileKind[] = [];
    for (let x = 0; x < W; x++) row.push(baseTile(x, y));
    tiles.push(row);
  }

  // Rice paddies on the west side
  stampRect(tiles, "paddy", 6, 10, 4, 2);
  stampRect(tiles, "paddy", 6, 13, 4, 2);

  // Village path: from the paddies through the centre down to the dock
  stampRect(tiles, "path", 10, 12, 7, 1);
  stampRect(tiles, "path", 14, 12, 1, 6);

  // Dock: wooden planks running south into the water
  stampRect(tiles, "dock", 14, 18, 1, 6);

  // Objects (drawn on top, not walkable)
  const objects: WorldObject[] = [
    { kind: "house", x: 12, y: 10 },
    { kind: "house", x: 16, y: 10 },
    { kind: "stall", x: 11, y: 14 },
    { kind: "tree", x: 8, y: 8 },
    { kind: "tree", x: 18, y: 8 },
    { kind: "tree", x: 19, y: 14 },
    { kind: "tree", x: 9, y: 17 },
    { kind: "tree", x: 16, y: 16 },
    { kind: "rock", x: 11, y: 7 },
    { kind: "rock", x: 18, y: 17 },
  ];

  return { tiles, objects };
}

const WALKABLE: Record<TileKind, boolean> = {
  deep: false,
  water: false,
  sand: true,
  grass: true,
  paddy: true,
  path: true,
  dock: true,
};

export function isWalkable(
  tiles: TileKind[][],
  objects: WorldObject[],
  x: number,
  y: number,
): boolean {
  const tx = Math.round(x);
  const ty = Math.round(y);
  const tile = tiles[ty]?.[tx];
  if (!tile || !WALKABLE[tile]) return false;
  return !objects.some((o) => o.x === tx && o.y === ty);
}

/** True when the tile (or a neighbour) touches water — fishing allowed. */
export function nearWater(tiles: TileKind[][], x: number, y: number): boolean {
  const tx = Math.round(x);
  const ty = Math.round(y);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const t = tiles[ty + dy]?.[tx + dx];
      if (t === "water" || t === "deep") return true;
    }
  }
  return false;
}

/** Village square — where new captains appear. */
export const SPAWN = { x: 14, y: 12.5 };
