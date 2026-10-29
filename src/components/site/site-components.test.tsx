import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PublicMenuItem } from "@/server/queries/public/menu";
import { AccentTitle } from "./AccentTitle";
import { MenuCard } from "./MenuCard";
import { OpenStatus } from "./OpenStatus";
import { OpeningHours } from "./OpeningHours";

const item: PublicMenuItem = {
  id: "i1",
  slug: "thit-nuong",
  name: "Bánh mì thịt nướng",
  shortDescription: "Thịt nướng thơm",
  isSpicy: true,
  isVegetarian: false,
  isBestSeller: true,
  isNew: false,
  isFeatured: false,
  isSoldOutToday: false,
  minPrice: 25_000,
  primaryImage: null,
  options: [
    { id: "o1", name: "Thường", price: 25_000, isDefault: true },
    { id: "o2", name: "Đặc biệt", price: 35_000, isDefault: false },
  ],
};

describe("MenuCard", () => {
  it("hiện tên, giá 'từ', nhãn và nút đặt món dẫn tới form có chọn sẵn", () => {
    const html = renderToStaticMarkup(<MenuCard item={item} />);
    expect(html).toContain("Bánh mì thịt nướng");
    expect(html).toContain("từ 25.000₫");
    expect(html).toContain("Bán chạy");
    expect(html).toContain("Cay");
    expect(html).toContain('href="/dat-mon?mon=thit-nuong"');
  });

  it("món chỉ có một giá thì không ghi 'từ'", () => {
    const single = {
      ...item,
      options: [{ id: "o1", name: "Ly", price: 20_000, isDefault: true }],
      minPrice: 20_000,
    };
    expect(renderToStaticMarkup(<MenuCard item={single} />)).not.toContain("từ ");
  });

  it("món tạm hết vẫn hiện, có nhãn, và không có nút đặt món", () => {
    const html = renderToStaticMarkup(<MenuCard item={{ ...item, isSoldOutToday: true }} />);
    expect(html).toContain("Tạm hết hôm nay");
    expect(html).not.toContain("Đặt món này");
    expect(html).toContain("Bánh mì thịt nướng");
  });

  it("không có ảnh thì hiện hình giữ chỗ có mô tả cho trình đọc màn hình", () => {
    expect(renderToStaticMarkup(<MenuCard item={item} />)).toContain("Chưa có ảnh món");
  });
});

describe("OpenStatus", () => {
  it("11:00 giờ Việt Nam: đang mở cửa (giờ mở tạm 06:00–20:00)", () => {
    expect(renderToStaticMarkup(<OpenStatus now={new Date("2026-10-07T04:00:00Z")} />)).toContain(
      "Đang mở cửa",
    );
  });

  it("23:00 giờ Việt Nam: đang đóng cửa và nói giờ mở lại", () => {
    const html = renderToStaticMarkup(<OpenStatus now={new Date("2026-10-07T16:00:00Z")} />);
    expect(html).toContain("Đang đóng cửa");
    expect(html).toContain("06:00");
  });
});

describe("OpeningHours", () => {
  it("liệt kê đủ 7 ngày bắt đầu từ thứ Hai", () => {
    const html = renderToStaticMarkup(<OpeningHours />);
    expect(html.indexOf("Thứ hai")).toBeLessThan(html.indexOf("Chủ nhật"));
    expect((html.match(/<dt/g) ?? []).length).toBe(7);
  });
});

describe("OpeningHours compact", () => {
  it("gộp các ngày cùng giờ thành một dòng", () => {
    const html = renderToStaticMarkup(<OpeningHours compact />);
    expect((html.match(/<dt/g) ?? []).length).toBe(1);
    expect(html).toContain("Thứ hai – Chủ nhật");
    expect(html).toContain("06:00 – 20:00");
  });
});

describe("AccentTitle", () => {
  it("in nghiêng các chữ cuối, giữ nguyên toàn bộ câu", () => {
    const html = renderToStaticMarkup(<AccentTitle text="Bánh mì nóng giòn mỗi sáng" />);
    expect(html).toBe(
      'Bánh mì nóng giòn <em class="font-normal italic text-brass-text">mỗi sáng</em>',
    );
  });

  it("câu quá ngắn thì không nhấn", () => {
    expect(renderToStaticMarkup(<AccentTitle text="Thực đơn" accentWords={2} />)).toBe("Thực đơn");
  });
});
