import { describe, expect, it } from "vitest";
import { buildRestaurantJsonLd } from "./structured-data";

describe("buildRestaurantJsonLd", () => {
  it("có tên, link thực đơn và giờ mở cửa", () => {
    const data = buildRestaurantJsonLd("https://example.vn");
    expect(data["@type"]).toBe("Restaurant");
    expect(data.hasMenu).toBe("https://example.vn/thuc-don");
    expect(data.openingHoursSpecification[0]?.dayOfWeek).toHaveLength(7);
  });
});
