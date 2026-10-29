import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, insertTestMenu } from "@/server/db/test-helpers";
import { orderRequest } from "@/server/db/schema";
import { isUniqueViolation, nextOrderCode } from "./order-code";

let db: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => {
  db = await createTestDb();
  await insertTestMenu(db);
});

async function insertOrder(code: string) {
  await db.insert(orderRequest).values({
    code,
    customerName: "Khách",
    phone: "0901234567",
    fulfillment: "PICKUP",
    estimatedTotal: 0,
  });
}

describe("nextOrderCode", () => {
  const day = new Date("2026-10-07T04:00:00.000Z");

  it("bắt đầu từ 001 trong ngày mới", async () => {
    expect(await nextOrderCode(db, day)).toBe("TL-1007-001");
  });

  it("tăng dần theo số lớn nhất của ngày, không bị ngày khác ảnh hưởng", async () => {
    await insertOrder("TL-1007-001");
    await insertOrder("TL-1007-009");
    await insertOrder("TL-1006-050");
    expect(await nextOrderCode(db, day)).toBe("TL-1007-010");
  });

  it("tính ngày theo giờ Việt Nam: 18:00 UTC đã là sáng hôm sau", async () => {
    expect(await nextOrderCode(db, new Date("2026-10-07T18:00:00.000Z"))).toBe("TL-1008-001");
  });

  it("nhận ra lỗi trùng mã (kể cả khi bị bọc trong cause)", async () => {
    const error = await insertOrder("TL-1007-001").catch((e: unknown) => e);
    expect(isUniqueViolation(error)).toBe(true);
    expect(isUniqueViolation(new Error("khác"))).toBe(false);
  });
});
