import { describe, expect, it } from "vitest";
import { toFieldErrors } from "./field-errors";
import { createOrderRequestSchema } from "./order-request";

const NOW = new Date("2026-10-07T04:00:00.000Z");
const schema = createOrderRequestSchema(NOW);

const valid = {
  items: [{ menuItemId: "m1", optionId: "o1", quantity: 2 }],
  customerName: "  Nguyễn Văn A ",
  phone: "0901 234 567",
  fulfillment: "PICKUP" as const,
  startedAt: NOW.getTime() - 20_000,
};

function minutesFromNow(minutes: number) {
  return new Date(NOW.getTime() + minutes * 60_000).toISOString();
}

describe("createOrderRequestSchema", () => {
  it("nhận dữ liệu hợp lệ và chuẩn hóa tên, số điện thoại", () => {
    const result = schema.safeParse(valid);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.customerName).toBe("Nguyễn Văn A");
    expect(result.data.phone).toBe("0901234567");
    expect(result.data.requestedAt).toBeNull();
    expect(result.data.note).toBeNull();
  });

  it("giao hàng mà thiếu địa chỉ thì báo lỗi ở ô địa chỉ", () => {
    const result = schema.safeParse({ ...valid, fulfillment: "DELIVERY" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(toFieldErrors(result.error)["deliveryAddress"]).toBeDefined();
  });

  it("lấy tại quầy thì bỏ địa chỉ đã nhập", () => {
    const result = schema.safeParse({ ...valid, deliveryAddress: "12 Láng Hạ" });
    expect(result.success && result.data.deliveryAddress).toBeNull();
  });

  it.each([0, 51, 1.5])("từ chối số lượng %s", (quantity) => {
    const result = schema.safeParse({ ...valid, items: [{ ...valid.items[0], quantity }] });
    expect(result.success).toBe(false);
  });

  it("gộp các dòng trùng món và lựa chọn", () => {
    const result = schema.safeParse({
      ...valid,
      items: [
        { menuItemId: "m1", optionId: "o1", quantity: 2 },
        { menuItemId: "m1", optionId: "o1", quantity: 3 },
        { menuItemId: "m1", optionId: "o2", quantity: 1 },
      ],
    });
    expect(result.success && result.data.items).toEqual([
      { menuItemId: "m1", optionId: "o1", quantity: 5 },
      { menuItemId: "m1", optionId: "o2", quantity: 1 },
    ]);
  });

  it("từ chối khi số lượng sau khi gộp vượt 50", () => {
    const result = schema.safeParse({
      ...valid,
      items: [
        { menuItemId: "m1", optionId: "o1", quantity: 30 },
        { menuItemId: "m1", optionId: "o1", quantity: 30 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("từ chối giỏ rỗng", () => {
    expect(schema.safeParse({ ...valid, items: [] }).success).toBe(false);
  });

  it("từ chối số điện thoại sai", () => {
    const result = schema.safeParse({ ...valid, phone: "12345" });
    expect(result.success).toBe(false);
  });

  describe("giờ nhận", () => {
    it("nhận giờ trong khoảng 15 phút đến 7 ngày", () => {
      expect(schema.safeParse({ ...valid, requestedAt: minutesFromNow(15) }).success).toBe(true);
      expect(schema.safeParse({ ...valid, requestedAt: minutesFromNow(7 * 24 * 60) }).success).toBe(
        true,
      );
    });

    it("từ chối giờ quá gần hoặc đã qua", () => {
      expect(schema.safeParse({ ...valid, requestedAt: minutesFromNow(14) }).success).toBe(false);
      expect(schema.safeParse({ ...valid, requestedAt: minutesFromNow(-60) }).success).toBe(false);
    });

    it("từ chối giờ xa hơn 7 ngày", () => {
      const result = schema.safeParse({ ...valid, requestedAt: minutesFromNow(7 * 24 * 60 + 1) });
      expect(result.success).toBe(false);
    });

    it("từ chối chuỗi không phải ngày", () => {
      expect(schema.safeParse({ ...valid, requestedAt: "mai" }).success).toBe(false);
    });
  });

  it("ghi chú quá 500 ký tự bị từ chối", () => {
    expect(schema.safeParse({ ...valid, note: "a".repeat(501) }).success).toBe(false);
  });
});
