import { describe, expect, it } from "vitest";
import {
  formatVietnamClock,
  formatVietnamDateTime,
  formatVietnamMonthDay,
  fromVietnamDateTimeLocal,
  toVietnamDateTimeLocal,
} from "./datetime";

describe("giờ Việt Nam", () => {
  it("formatVietnamClock đổi UTC sang giờ Việt Nam", () => {
    expect(formatVietnamClock(new Date("2026-10-07T23:00:00Z"))).toBe("06:00");
  });

  it("formatVietnamDateTime có thứ, ngày/tháng và qua ngày mới khi cộng 7 tiếng", () => {
    // 2026-10-07 17:30 UTC = 00:30 ngày 08/10 giờ Việt Nam, thứ Năm
    expect(formatVietnamDateTime(new Date("2026-10-07T17:30:00Z"))).toBe("00:30 thứ Năm 08/10");
  });

  it("formatVietnamMonthDay dùng ngày theo giờ Việt Nam", () => {
    expect(formatVietnamMonthDay(new Date("2026-10-07T17:30:00Z"))).toBe("1008");
  });
});

describe("ô datetime-local theo giờ Việt Nam", () => {
  it("đổi thời điểm sang chuỗi giờ Việt Nam", () => {
    expect(toVietnamDateTimeLocal(new Date("2026-10-07T04:05:00.000Z"))).toBe("2026-10-07T11:05");
    expect(toVietnamDateTimeLocal(new Date("2026-10-07T18:30:00.000Z"))).toBe("2026-10-08T01:30");
  });

  it("đổi chuỗi khách nhập sang ISO, không phụ thuộc múi giờ máy", () => {
    expect(fromVietnamDateTimeLocal("2026-10-07T11:05")).toBe("2026-10-07T04:05:00.000Z");
  });

  it("từ chối chuỗi sai định dạng", () => {
    expect(fromVietnamDateTimeLocal("")).toBeNull();
    expect(fromVietnamDateTimeLocal("2026-13-40T99:99")).toBeNull();
    expect(fromVietnamDateTimeLocal("mai")).toBeNull();
  });
});
