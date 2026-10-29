import { describe, expect, it } from "vitest";
import { looksLikeBot } from "./common";
import { contactSchema } from "./contact";

const base = {
  name: "Trần Thị B",
  message: "Tiệm có nhận đặt bánh mì số lượng lớn không?",
  startedAt: 0,
};

describe("contactSchema", () => {
  it("nhận khi có số điện thoại", () => {
    const result = contactSchema.safeParse({ ...base, phone: "0912 345 678" });
    expect(result.success && result.data.phone).toBe("0912345678");
  });

  it("nhận khi chỉ có email", () => {
    const result = contactSchema.safeParse({ ...base, phone: "", email: "b@gmail.com" });
    expect(result.success).toBe(true);
  });

  it("từ chối khi không có số điện thoại lẫn email", () => {
    expect(contactSchema.safeParse(base).success).toBe(false);
    expect(contactSchema.safeParse({ ...base, phone: "", email: "" }).success).toBe(false);
  });

  it("từ chối email hoặc số điện thoại sai định dạng", () => {
    expect(contactSchema.safeParse({ ...base, email: "khong-phai-email" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...base, phone: "123" }).success).toBe(false);
  });

  it("từ chối nội dung quá ngắn", () => {
    expect(contactSchema.safeParse({ ...base, phone: "0912345678", message: "alo" }).success).toBe(
      false,
    );
  });
});

describe("looksLikeBot", () => {
  const now = new Date("2026-10-07T04:00:00.000Z");

  it("ô bẫy có chữ thì là bot", () => {
    expect(
      looksLikeBot({ website: "http://spam", startedAt: now.getTime() - 60_000 }, now, 3),
    ).toBe(true);
  });

  it("gửi nhanh hơn 3 giây thì là bot", () => {
    expect(looksLikeBot({ startedAt: now.getTime() - 2_000 }, now, 3)).toBe(true);
  });

  it("người thật điền đủ lâu và để trống ô bẫy", () => {
    expect(looksLikeBot({ website: "", startedAt: now.getTime() - 10_000 }, now, 3)).toBe(false);
  });
});
