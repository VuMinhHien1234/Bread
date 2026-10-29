import { describe, expect, it } from "vitest";
import { isOpenAt, nextOpenTime, type OpeningRule } from "./shop-config";

/** Tạo thời điểm theo giờ Việt Nam (UTC+7) cho dễ đọc test. */
function vn(isoLocal: string): Date {
  return new Date(`${isoLocal}+07:00`);
}

const everyDay: OpeningRule[] = [{ days: [0, 1, 2, 3, 4, 5, 6], open: "06:00", close: "20:00" }];

// 2026-10-07 là Thứ tư.
describe("isOpenAt", () => {
  it("mở cửa trong khung giờ, tính cả giờ mở", () => {
    expect(isOpenAt(vn("2026-10-07T06:00:00"), everyDay)).toBe(true);
    expect(isOpenAt(vn("2026-10-07T12:30:00"), everyDay)).toBe(true);
  });

  it("đóng cửa đúng giờ đóng và trước giờ mở", () => {
    expect(isOpenAt(vn("2026-10-07T20:00:00"), everyDay)).toBe(false);
    expect(isOpenAt(vn("2026-10-07T05:59:00"), everyDay)).toBe(false);
  });

  it("chỉ mở vào các ngày được khai báo", () => {
    const weekdays: OpeningRule[] = [{ days: [1, 2, 3, 4, 5], open: "06:00", close: "20:00" }];
    expect(isOpenAt(vn("2026-10-07T10:00:00"), weekdays)).toBe(true); // Thứ tư
    expect(isOpenAt(vn("2026-10-11T10:00:00"), weekdays)).toBe(false); // Chủ nhật
  });

  it("xử lý khung giờ qua nửa đêm", () => {
    const night: OpeningRule[] = [{ days: [3], open: "18:00", close: "02:00" }];
    expect(isOpenAt(vn("2026-10-07T23:00:00"), night)).toBe(true); // Thứ tư 23:00
    expect(isOpenAt(vn("2026-10-08T01:00:00"), night)).toBe(true); // sang Thứ năm 01:00
    expect(isOpenAt(vn("2026-10-08T02:00:00"), night)).toBe(false);
  });

  it("khung giờ qua nửa đêm Thứ bảy vẫn đúng ở đầu tuần (Chủ nhật)", () => {
    const night: OpeningRule[] = [{ days: [6], open: "18:00", close: "02:00" }];
    expect(isOpenAt(vn("2026-10-11T01:00:00"), night)).toBe(true); // Chủ nhật 01:00
  });

  it("đóng cửa khi chưa cấu hình giờ", () => {
    expect(isOpenAt(vn("2026-10-07T10:00:00"), [])).toBe(false);
  });
});

describe("nextOpenTime", () => {
  it("lúc đóng cửa buổi tối trả về giờ mở sáng hôm sau", () => {
    const next = nextOpenTime(vn("2026-10-07T21:15:30"), everyDay);
    expect(next?.toISOString()).toBe(vn("2026-10-08T06:00:00").toISOString());
  });

  it("trước giờ mở trả về giờ mở cùng ngày", () => {
    const next = nextOpenTime(vn("2026-10-07T04:00:00"), everyDay);
    expect(next?.toISOString()).toBe(vn("2026-10-07T06:00:00").toISOString());
  });

  it("bỏ qua ngày nghỉ", () => {
    const weekdays: OpeningRule[] = [{ days: [1, 2, 3, 4, 5], open: "06:00", close: "20:00" }];
    const next = nextOpenTime(vn("2026-10-10T21:00:00"), weekdays); // Thứ sáu tối
    expect(next?.toISOString()).toBe(vn("2026-10-12T06:00:00").toISOString()); // Thứ hai
  });

  it("trả null khi chưa cấu hình giờ mở cửa", () => {
    expect(nextOpenTime(vn("2026-10-07T10:00:00"), [])).toBeNull();
  });
});
