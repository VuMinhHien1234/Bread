import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb } from "@/server/db/test-helpers";
import { consumeRateLimit } from "./rate-limit";

const RULE = { limit: 3, windowMinutes: 10 };
const T0 = new Date("2026-10-07T04:00:00.000Z");
const minutesLater = (minutes: number) => new Date(T0.getTime() + minutes * 60_000);

let db: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => {
  db = await createTestDb();
});

describe("consumeRateLimit", () => {
  it("cho phép đến hết giới hạn rồi chặn", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await consumeRateLimit(db, "a", RULE, T0));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results.map((r) => r.count)).toEqual([1, 2, 3, 4]);
  });

  it("đếm riêng theo từng khóa", async () => {
    await consumeRateLimit(db, "b", RULE, T0);
    const other = await consumeRateLimit(db, "c", RULE, T0);
    expect(other.count).toBe(1);
  });

  it("hết cửa sổ thời gian thì đếm lại từ đầu", async () => {
    for (let i = 0; i < 4; i++) await consumeRateLimit(db, "d", RULE, T0);
    const stillBlocked = await consumeRateLimit(db, "d", RULE, minutesLater(9));
    expect(stillBlocked.allowed).toBe(false);
    const afterWindow = await consumeRateLimit(db, "d", RULE, minutesLater(11));
    expect(afterWindow).toEqual({ allowed: true, count: 1 });
  });
});
