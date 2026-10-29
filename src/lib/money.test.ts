import { describe, expect, it } from "vitest";
import { formatVND } from "./money";

describe("formatVND", () => {
  it("nhóm hàng nghìn bằng dấu chấm và thêm ký hiệu ₫", () => {
    expect(formatVND(25000)).toBe("25.000₫");
    expect(formatVND(1250000)).toBe("1.250.000₫");
  });

  it("giữ nguyên số nhỏ hơn 1.000", () => {
    expect(formatVND(0)).toBe("0₫");
    expect(formatVND(999)).toBe("999₫");
  });

  it("từ chối số thực hoặc số âm vì tiền phải là số nguyên", () => {
    expect(() => formatVND(25000.5)).toThrow(RangeError);
    expect(() => formatVND(-1)).toThrow(RangeError);
    expect(() => formatVND(Number.NaN)).toThrow(RangeError);
  });
});
