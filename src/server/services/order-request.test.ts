import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { contactMessage, formRateLimit, orderRequest, orderRequestItem } from "@/server/db/schema";
import { createTestDb, insertTestMenu } from "@/server/db/test-helpers";
import { submitContactMessage } from "./contact-message";
import { submitOrderRequest, type OrderRequestDeps } from "./order-request";

vi.mock("server-only", () => ({}));

const NOW = new Date("2026-10-07T04:00:00.000Z"); // 11:00 giờ Việt Nam, tiệm đang mở
const SITE_URL = "https://banhmi.example";

const db = await createTestDb();
const menu = await insertTestMenu(db);

const sendTelegram = vi.fn<OrderRequestDeps["sendTelegram"]>();

function deps(ipHash = "ip-1"): OrderRequestDeps {
  return { db, sendTelegram, ipHash, siteUrl: SITE_URL, now: () => NOW };
}

function orderInput(overrides: Record<string, unknown> = {}) {
  return {
    items: [{ menuItemId: menu.bread.id, optionId: menu.special.id, quantity: 2 }],
    customerName: "Nguyễn Văn A",
    phone: "0901 234 567",
    fulfillment: "PICKUP",
    startedAt: NOW.getTime() - 30_000,
    ...overrides,
  };
}

beforeEach(async () => {
  sendTelegram.mockReset();
  sendTelegram.mockResolvedValue({ ok: true, messageId: 77 });
  await db.delete(orderRequest);
  await db.delete(contactMessage);
  await db.delete(formRateLimit);
});

describe("submitOrderRequest", () => {
  it("tính giá từ database, bỏ qua giá do khách gửi", async () => {
    const result = await submitOrderRequest(
      deps(),
      orderInput({
        unitPrice: 1,
        estimatedTotal: 1,
        items: [
          { menuItemId: menu.bread.id, optionId: menu.special.id, quantity: 2, unitPrice: 1 },
        ],
      }),
    );

    expect(result).toEqual({
      ok: true,
      data: { code: "TL-1007-001", estimatedTotal: 70_000, isOpenNow: true },
    });
    const [line] = await db.select().from(orderRequestItem);
    expect(line).toMatchObject({
      itemName: "Bánh mì thịt nướng",
      optionName: "Đặc biệt",
      unitPrice: 35_000,
      quantity: 2,
      lineTotal: 70_000,
    });
  });

  it("lưu yêu cầu, chuẩn hóa số điện thoại, không lưu IP thô", async () => {
    await submitOrderRequest(deps("hash-abc"), orderInput({ note: "ít hành" }));
    const [saved] = await db.select().from(orderRequest);
    expect(saved).toMatchObject({
      phone: "0901234567",
      status: "NEW",
      note: "ít hành",
      ipHash: "hash-abc",
      estimatedTotal: 70_000,
    });
  });

  it("gửi Telegram đúng nội dung và ghi lại mã tin nhắn", async () => {
    await submitOrderRequest(deps(), orderInput());
    expect(sendTelegram).toHaveBeenCalledOnce();
    const text = sendTelegram.mock.calls[0]?.[0] ?? "";
    expect(text).toContain("#TL-1007-001");
    expect(text).toContain("2 × Bánh mì thịt nướng (Đặc biệt)");
    expect(text).not.toContain("ngoài giờ");

    const [saved] = await db.select().from(orderRequest);
    expect(saved?.telegramMessageId).toBe(77);
    expect(saved?.telegramSentAt).toEqual(NOW);
    expect(saved?.telegramError).toBeNull();
  });

  it("Telegram lỗi vẫn lưu yêu cầu và báo thành công cho khách", async () => {
    sendTelegram.mockResolvedValue({ ok: false, error: "mạng lỗi" });
    const result = await submitOrderRequest(deps(), orderInput());
    expect(result.ok).toBe(true);
    const [saved] = await db.select().from(orderRequest);
    expect(saved?.telegramError).toBe("mạng lỗi");
    expect(saved?.telegramSentAt).toBeNull();
  });

  it("Telegram ném lỗi bất ngờ cũng không làm mất yêu cầu", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    sendTelegram.mockRejectedValue(new Error("boom"));
    const result = await submitOrderRequest(deps(), orderInput());
    expect(result.ok).toBe(true);
    expect(await db.select().from(orderRequest)).toHaveLength(1);
  });

  it("ngoài giờ mở cửa vẫn nhận và ghi chú trong tin Telegram", async () => {
    const lateNight = new Date("2026-10-07T16:00:00.000Z"); // 23:00 giờ Việt Nam
    const result = await submitOrderRequest(
      { ...deps(), now: () => lateNight },
      orderInput({ startedAt: lateNight.getTime() - 30_000 }),
    );
    expect(result.ok && result.data.isOpenNow).toBe(false);
    expect(sendTelegram.mock.calls[0]?.[0]).toContain("ngoài giờ mở cửa");
  });

  it("từ chối món đã hết hôm nay và nêu tên món", async () => {
    const result = await submitOrderRequest(
      deps(),
      orderInput({
        items: [{ menuItemId: menu.coffee.id, optionId: menu.coffeeOption.id, quantity: 1 }],
      }),
    );
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain("Cà phê sữa");
    expect(await db.select().from(orderRequest)).toHaveLength(0);
  });

  it("từ chối món đã ẩn, món không tồn tại và lựa chọn không thuộc món", async () => {
    const hidden = { menuItemId: menu.hidden.id, optionId: menu.hiddenOption.id, quantity: 1 };
    const missing = { menuItemId: "khong-co", optionId: "khong-co", quantity: 1 };
    const mismatch = { menuItemId: menu.bread.id, optionId: menu.coffeeOption.id, quantity: 1 };
    for (const line of [hidden, missing, mismatch]) {
      const result = await submitOrderRequest(deps(), orderInput({ items: [line] }));
      expect(result.ok).toBe(false);
    }
    expect(await db.select().from(orderRequest)).toHaveLength(0);
  });

  it("dữ liệu sai trả lỗi theo từng ô", async () => {
    const result = await submitOrderRequest(
      deps(),
      orderInput({ phone: "abc", fulfillment: "DELIVERY" }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.fieldErrors ?? {})).toEqual(
      expect.arrayContaining(["phone", "deliveryAddress"]),
    );
  });

  it("bot (ô bẫy có chữ hoặc gửi quá nhanh) nhận thành công giả, không lưu, không báo Telegram", async () => {
    const honeypot = await submitOrderRequest(deps(), orderInput({ website: "http://spam.vn" }));
    const tooFast = await submitOrderRequest(
      deps(),
      orderInput({ startedAt: NOW.getTime() - 500 }),
    );
    expect(honeypot.ok).toBe(true);
    expect(tooFast.ok).toBe(true);
    expect(await db.select().from(orderRequest)).toHaveLength(0);
    expect(sendTelegram).not.toHaveBeenCalled();
  });

  it("giao hàng lưu địa chỉ; giờ hẹn được lưu", async () => {
    const requestedAt = new Date(NOW.getTime() + 60 * 60_000);
    await submitOrderRequest(
      deps(),
      orderInput({
        fulfillment: "DELIVERY",
        deliveryAddress: "12 Ngõ 5, Láng Hạ",
        requestedAt: requestedAt.toISOString(),
      }),
    );
    const [saved] = await db.select().from(orderRequest);
    expect(saved?.deliveryAddress).toBe("12 Ngõ 5, Láng Hạ");
    expect(saved?.requestedAt).toEqual(requestedAt);
  });

  it("chặn từ yêu cầu thứ 6 trong 10 phút từ cùng một IP", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await submitOrderRequest(deps("ip-spam"), orderInput())).ok).toBe(true);
    }
    const sixth = await submitOrderRequest(deps("ip-spam"), orderInput());
    expect(sixth.ok).toBe(false);
    expect(!sixth.ok && sixth.error).toContain("gọi trực tiếp");
    expect((await submitOrderRequest(deps("ip-khac"), orderInput())).ok).toBe(true);
  });

  it("các yêu cầu cùng ngày có mã tăng dần", async () => {
    const first = await submitOrderRequest(deps("ip-a"), orderInput());
    const second = await submitOrderRequest(deps("ip-b"), orderInput());
    expect(first.ok && first.data.code).toBe("TL-1007-001");
    expect(second.ok && second.data.code).toBe("TL-1007-002");
  });

  it("lỗi database trả thông báo chung, không lộ chi tiết kỹ thuật", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const brokenDb = new Proxy(db, {
      get(target, prop, receiver) {
        if (prop === "select") throw new Error("relation order_request does not exist");
        return Reflect.get(target, prop, receiver) as unknown;
      },
    });
    const result = await submitOrderRequest({ ...deps("ip-loi"), db: brokenDb }, orderInput());
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).not.toContain("relation");
  });
});

describe("submitContactMessage", () => {
  const contactInput = (overrides: Record<string, unknown> = {}) => ({
    name: "Trần Thị B",
    phone: "0912 345 678",
    message: "Tiệm có nhận đặt số lượng lớn không ạ?",
    startedAt: NOW.getTime() - 30_000,
    ...overrides,
  });

  it("lưu tin, báo Telegram và ghi thời điểm gửi", async () => {
    const result = await submitContactMessage(deps(), contactInput());
    expect(result).toEqual({ ok: true, data: { isOpenNow: true } });
    const [saved] = await db.select().from(contactMessage);
    expect(saved).toMatchObject({ phone: "0912345678", email: null, status: "NEW" });
    expect(saved?.telegramSentAt).toEqual(NOW);
    expect(sendTelegram.mock.calls[0]?.[0]).toContain("TIN LIÊN HỆ MỚI");
  });

  it("Telegram lỗi vẫn lưu và báo thành công", async () => {
    sendTelegram.mockResolvedValue({ ok: false, error: "429" });
    expect((await submitContactMessage(deps(), contactInput())).ok).toBe(true);
    const [saved] = await db
      .select()
      .from(contactMessage)
      .where(eq(contactMessage.name, "Trần Thị B"));
    expect(saved?.telegramError).toBe("429");
  });

  it("thiếu cả số điện thoại lẫn email thì báo lỗi", async () => {
    const result = await submitContactMessage(deps(), contactInput({ phone: "" }));
    expect(result.ok).toBe(false);
  });

  it("bot nhận thành công giả và không lưu", async () => {
    await submitContactMessage(deps(), contactInput({ website: "x" }));
    expect(await db.select().from(contactMessage)).toHaveLength(0);
  });

  it("chặn từ tin thứ 4 trong 10 phút", async () => {
    for (let i = 0; i < 3; i++) {
      expect((await submitContactMessage(deps("ip-c"), contactInput())).ok).toBe(true);
    }
    expect((await submitContactMessage(deps("ip-c"), contactInput())).ok).toBe(false);
  });
});
