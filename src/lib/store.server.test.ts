import { afterAll, describe, expect, test } from "bun:test";
import { rm } from "node:fs/promises";
import { getStore, displayName } from "./store.server";

// Exercises the FileStore fallback (no SUPABASE_* env in tests).
const store = getStore();
const WALLET = "TestWa11et1111111111111111111111111111111111";

afterAll(async () => {
  await rm(".data", { recursive: true, force: true });
});

describe("FileStore", () => {
  test("upserts and reads back a player", async () => {
    const saved = await store.upsertPlayer({
      wallet_address: WALLET,
      username: "Tester",
      level: 3,
      xp: 50,
      coins: 999,
      rice_harvested: 12,
      fish_caught: 4,
    });
    expect(saved.username).toBe("Tester");
    const read = await store.getPlayer(WALLET);
    expect(read?.coins).toBe(999);
    expect(read?.level).toBe(3);
  });

  test("ranks players by coins", async () => {
    await store.upsertPlayer({
      wallet_address: "TestWa11et2222222222222222222222222222222222",
      username: "Poorer",
      level: 1,
      xp: 0,
      coins: 10,
      rice_harvested: 0,
      fish_caught: 0,
    });
    const top = await store.topPlayers(10);
    expect(top.length).toBeGreaterThanOrEqual(2);
    expect(top[0].coins).toBeGreaterThanOrEqual(top[1].coins);
    expect(top[0].wallet_address).toBe(WALLET);
  });

  test("stores chat with resolved display name", async () => {
    const msg = await store.insertChat(WALLET, "selamat pagi!");
    expect(msg.display_name).toBe("Tester");
    const list = await store.listChat(50);
    expect(list.at(-1)?.body).toBe("selamat pagi!");
  });

  test("logs fish catches into the activity feed", async () => {
    await store.logCatch({
      wallet_address: WALLET,
      fish_name: "Golden Koi",
      rarity: "Legendary",
      value: 500,
    });
    const recent = await store.recentCatches(5);
    expect(recent[0].fish_name).toBe("Golden Koi");
    expect(recent[0].display_name).toBe("Tester");
  });
});

describe("displayName", () => {
  test("falls back to a shortened wallet", () => {
    expect(displayName({ username: null, wallet_address: WALLET })).toBe("Test…1111");
    expect(displayName({ username: "  ", wallet_address: WALLET })).toBe("Test…1111");
    expect(displayName({ username: "Budi", wallet_address: WALLET })).toBe("Budi");
  });
});
