import { describe, expect, it } from "vitest";
import { formatPhoneDisplay, maskPhone, normalizeVietnamPhone } from "./phone";

describe("normalizeVietnamPhone", () => {
  it("chấp nhận số di động với dấu cách, chấm, gạch", () => {
    expect(normalizeVietnamPhone("0901 234 567")).toBe("0901234567");
    expect(normalizeVietnamPhone("0901.234.567")).toBe("0901234567");
    expect(normalizeVietnamPhone("(0901)-234-567")).toBe("0901234567");
  });

  it("đổi tiền tố +84 và 84 về 0", () => {
    expect(normalizeVietnamPhone("+84901234567")).toBe("0901234567");
    expect(normalizeVietnamPhone("84 901 234 567")).toBe("0901234567");
  });

  it("chấp nhận số cố định 11 số", () => {
    expect(normalizeVietnamPhone("024 1234 5678")).toBe("02412345678");
  });

  it("từ chối số sai độ dài, sai đầu số, hoặc có chữ", () => {
    expect(normalizeVietnamPhone("090123456")).toBeNull();
    expect(normalizeVietnamPhone("0101234567")).toBeNull();
    expect(normalizeVietnamPhone("09012345a7")).toBeNull();
    expect(normalizeVietnamPhone("")).toBeNull();
  });
});

describe("maskPhone", () => {
  it("che phần giữa", () => {
    expect(maskPhone("0901234567")).toBe("0901***567");
  });

  it("che hết khi chuỗi quá ngắn", () => {
    expect(maskPhone("123")).toBe("***");
  });
});

describe("formatPhoneDisplay", () => {
  it("tách nhóm 4-3-3 cho số di động", () => {
    expect(formatPhoneDisplay("0901234567")).toBe("0901 234 567");
  });
});
