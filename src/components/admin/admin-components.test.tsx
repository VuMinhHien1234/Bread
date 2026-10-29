import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MenuItemPreview, toPreviewItem } from "./MenuItemPreview";
import { OrderRows, type OrderRowData } from "./OrderRows";
import { Pagination } from "./Pagination";
import { adminPath } from "@/lib/admin-path";

const row: OrderRowData = {
  id: "abc",
  code: "TL-1007-001",
  customerName: "Nguyễn Văn A",
  phone: "0901234567",
  fulfillment: "DELIVERY",
  status: "NEW",
  estimatedTotal: 90_000,
  requestedAt: null,
  createdAt: new Date("2026-10-07T04:00:00Z"),
  telegramFailed: true,
  itemCount: 2,
};

describe("OrderRows", () => {
  it("hiện mã, trạng thái, tổng tạm tính, cảnh báo Telegram và nút gọi nhanh", () => {
    const html = renderToStaticMarkup(<OrderRows rows={[row]} />);
    expect(html).toContain("TL-1007-001");
    expect(html).toContain("Mới");
    expect(html).toContain("90.000₫");
    expect(html).toContain("Telegram lỗi");
    expect(html).toContain("Sớm nhất có thể");
    expect(html).toContain('href="tel:0901234567"');
    expect(html).toContain(`href="${adminPath("yeu-cau/abc")}"`);
  });

  it("danh sách rỗng có thông báo", () => {
    expect(renderToStaticMarkup(<OrderRows rows={[]} />)).toContain("Chưa có yêu cầu nào");
  });
});

describe("Pagination", () => {
  const hrefFor = (page: number) => `/x?trang=${page}`;

  it("không hiện khi chỉ có một trang", () => {
    expect(renderToStaticMarkup(<Pagination page={1} pageCount={1} hrefFor={hrefFor} />)).toBe("");
  });

  it("trang giữa có cả trang trước và trang sau", () => {
    const html = renderToStaticMarkup(<Pagination page={2} pageCount={3} hrefFor={hrefFor} />);
    expect(html).toContain('href="/x?trang=1"');
    expect(html).toContain('href="/x?trang=3"');
    expect(html).toContain("Trang 2/3");
  });

  it("trang đầu không có nút trang trước", () => {
    const html = renderToStaticMarkup(<Pagination page={1} pageCount={3} hrefFor={hrefFor} />);
    expect(html).not.toContain("Trang trước");
    expect(html).toContain("Trang sau");
  });
});

describe("MenuItemPreview", () => {
  const base = {
    id: "m1",
    slug: "banh-mi-ga",
    name: "Bánh mì gà",
    shortDescription: "Gà xé",
    isSpicy: false,
    isVegetarian: false,
    isBestSeller: true,
    isNew: false,
    isFeatured: false,
    isSoldOutToday: false,
    isActive: true,
    options: [
      { id: "o1", name: "Thường", price: 25_000, isDefault: true },
      { id: "o2", name: "Đặc biệt", price: 30_000, isDefault: false },
    ],
    images: [
      {
        url: "https://res.cloudinary.com/x/a.jpg",
        width: 800,
        height: 1000,
        alt: null,
        isPrimary: false,
      },
      {
        url: "https://res.cloudinary.com/x/b.jpg",
        width: 800,
        height: 1000,
        alt: null,
        isPrimary: true,
      },
    ],
  };

  it("lấy ảnh chính và giá thấp nhất như thẻ món ngoài web", () => {
    const preview = toPreviewItem(base);
    expect(preview.primaryImage?.url).toBe("https://res.cloudinary.com/x/b.jpg");
    expect(preview.minPrice).toBe(25_000);
  });

  it("hiện thẻ món và link mở trang khi món đang hiện", () => {
    const html = renderToStaticMarkup(<MenuItemPreview item={base} />);
    expect(html).toContain("Bánh mì gà");
    expect(html).toContain("từ 25.000₫");
    expect(html).toContain('href="/thuc-don/banh-mi-ga"');
  });

  it("món đang ẩn: báo khách chưa thấy, không có link mở trang", () => {
    const html = renderToStaticMarkup(<MenuItemPreview item={{ ...base, isActive: false }} />);
    expect(html).toContain("khách chưa thấy");
    expect(html).not.toContain("Mở trang món trên web");
  });
});
