import { describe, expect, it } from "vitest";
import { contactMessage, orderRequest, orderRequestItem } from "@/server/db/schema";
import { createTestDb, insertTestMenu } from "@/server/db/test-helpers";
import { loadCategories, loadMenuItemForEdit, loadMenuItems } from "./menu";
import {
  ADMIN_PAGE_SIZE,
  loadContactMessages,
  loadNewRequestCount,
  loadOrderRequest,
  loadOrderRequests,
} from "./requests";

const db = await createTestDb();
const menu = await insertTestMenu(db);

describe("query thực đơn quản trị", () => {
  it("danh mục kèm số món (gồm cả món đang ẩn)", async () => {
    const [cat] = await loadCategories(db);
    expect(cat?.itemCount).toBe(3);
  });

  it("liệt kê cả món ẩn và món tạm hết, kèm giá thấp nhất", async () => {
    const items = await loadMenuItems(db);
    expect(items).toHaveLength(3);
    expect(items.find((item) => item.slug === "thit-nuong")?.minPrice).toBe(25_000);
    expect(items.find((item) => item.slug === "da-an")?.isActive).toBe(false);
  });

  it("tìm theo tên không phân biệt hoa thường, lọc theo danh mục", async () => {
    expect((await loadMenuItems(db, { q: "CÀ PHÊ" })).map((i) => i.slug)).toEqual(["ca-phe"]);
    expect(await loadMenuItems(db, { categoryId: "khac" })).toEqual([]);
  });

  it("ký tự % và _ trong ô tìm kiếm được coi là chữ thường", async () => {
    expect(await loadMenuItems(db, { q: "%" })).toEqual([]);
  });

  it("lấy món để sửa kèm lựa chọn; id sai trả null", async () => {
    const item = await loadMenuItemForEdit(db, menu.bread.id);
    expect(item?.options.map((o) => o.name)).toEqual(["Thường", "Đặc biệt"]);
    expect(await loadMenuItemForEdit(db, "khong-co")).toBeNull();
  });
});

describe("query yêu cầu và liên hệ", () => {
  it("phân trang 20 dòng, mới nhất trước, đếm đúng số món mỗi yêu cầu", async () => {
    const base = new Date("2026-10-07T00:00:00.000Z").getTime();
    for (let i = 0; i < ADMIN_PAGE_SIZE + 5; i++) {
      const [row] = await db
        .insert(orderRequest)
        .values({
          code: `TL-1007-${String(i).padStart(3, "0")}`,
          customerName: `Khách ${i}`,
          phone: "0901234567",
          fulfillment: "PICKUP",
          estimatedTotal: 0,
          status: i < 3 ? "NEW" : "DONE",
          telegramError: i === 24 ? "lỗi" : null,
          createdAt: new Date(base + i * 60_000),
        })
        .returning();
      if (!row) throw new Error("không tạo được yêu cầu");
      await db.insert(orderRequestItem).values(
        [1, 2].slice(0, (i % 2) + 1).map((n) => ({
          orderRequestId: row.id,
          itemName: `Món ${n}`,
          optionName: "Thường",
          unitPrice: 1000,
          quantity: n,
          lineTotal: 1000 * n,
        })),
      );
    }

    const first = await loadOrderRequests(db);
    expect(first).toMatchObject({ total: 25, page: 1, pageCount: 2 });
    expect(first.rows).toHaveLength(ADMIN_PAGE_SIZE);
    expect(first.rows[0]).toMatchObject({
      code: "TL-1007-024",
      telegramFailed: true,
      itemCount: 1,
    });
    expect(first.rows[1]).toMatchObject({ telegramFailed: false, itemCount: 2 });

    const second = await loadOrderRequests(db, { page: 2 });
    expect(second.rows).toHaveLength(5);
  });

  it("lọc theo trạng thái và đếm yêu cầu mới", async () => {
    expect((await loadOrderRequests(db, { status: "NEW" })).total).toBe(3);
    expect(await loadNewRequestCount(db)).toBe(3);
  });

  it("số trang rác được coi là trang 1", async () => {
    expect((await loadOrderRequests(db, { page: -4 })).page).toBe(1);
    expect((await loadOrderRequests(db, { page: Number.NaN })).page).toBe(1);
  });

  it("lấy chi tiết một yêu cầu kèm dòng món; id sai trả null", async () => {
    const [{ id } = { id: "" }] = await db
      .select({ id: orderRequest.id })
      .from(orderRequest)
      .limit(1);
    expect((await loadOrderRequest(db, id))?.items.length).toBeGreaterThan(0);
    expect(await loadOrderRequest(db, "khong-co")).toBeNull();
  });

  it("tin liên hệ không lộ ip_hash", async () => {
    await db.insert(contactMessage).values({
      name: "B",
      phone: "0912345678",
      message: "Nội dung đủ dài",
      ipHash: "bi-mat",
    });
    const { rows } = await loadContactMessages(db);
    expect(rows).toHaveLength(1);
    expect(Object.keys(rows[0] ?? {})).not.toContain("ipHash");
  });
});
