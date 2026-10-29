import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrderRows, type OrderRowData } from "./OrderRows";
import { Pagination } from "./Pagination";

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
    expect(html).toContain('href="/admin/yeu-cau/abc"');
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
