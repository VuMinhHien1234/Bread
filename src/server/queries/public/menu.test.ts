import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { category, menuItem, menuItemImage } from "@/server/db/schema";
import { createTestDb, insertTestMenu } from "@/server/db/test-helpers";
import { loadAllMenuSlugs, loadFeaturedItems, loadMenu, loadMenuItemBySlug } from "./menu";

const db = await createTestDb();
const menu = await insertTestMenu(db);
await db.update(menuItem).set({ isFeatured: true }).where(eq(menuItem.id, menu.bread.id));
await db.insert(menuItemImage).values([
  {
    menuItemId: menu.bread.id,
    publicId: "a",
    url: "https://img/a.jpg",
    width: 800,
    height: 600,
    sortOrder: 1,
  },
  {
    menuItemId: menu.bread.id,
    publicId: "b",
    url: "https://img/b.jpg",
    width: 800,
    height: 600,
    isPrimary: true,
    sortOrder: 2,
  },
]);

describe("loadMenu", () => {
  it("hiện món đang bán và cả món tạm hết, ẩn món đã tắt", async () => {
    const [cat] = await loadMenu(db);
    expect(cat?.items.map((item) => item.slug).sort()).toEqual(["ca-phe", "thit-nuong"]);
    expect(cat?.items.find((item) => item.slug === "ca-phe")?.isSoldOutToday).toBe(true);
  });

  it("tính giá thấp nhất và đưa ảnh chính lên đầu", async () => {
    const [cat] = await loadMenu(db);
    const bread = cat?.items.find((item) => item.slug === "thit-nuong");
    expect(bread?.minPrice).toBe(25_000);
    expect(bread?.options.map((option) => option.name)).toEqual(["Thường", "Đặc biệt"]);
    expect(bread?.primaryImage?.url).toBe("https://img/b.jpg");
  });

  it("không trả cột nội bộ ra ngoài", async () => {
    const [cat] = await loadMenu(db);
    expect(Object.keys(cat?.items[0] ?? {})).not.toContain("categoryId");
    expect(Object.keys(cat?.items[0] ?? {})).not.toContain("isActive");
  });

  it("ẩn danh mục đã tắt", async () => {
    await db.update(category).set({ isActive: false }).where(eq(category.id, menu.category.id));
    expect(await loadMenu(db)).toEqual([]);
    expect(await loadAllMenuSlugs(db)).toEqual([]);
    expect(await loadMenuItemBySlug(db, "thit-nuong")).toBeNull();
    await db.update(category).set({ isActive: true }).where(eq(category.id, menu.category.id));
  });
});

describe("loadFeaturedItems", () => {
  it("chỉ lấy món nổi bật đang bán", async () => {
    const items = await loadFeaturedItems(db, 6);
    expect(items.map((item) => item.slug)).toEqual(["thit-nuong"]);
  });
});

describe("loadMenuItemBySlug", () => {
  it("trả đủ chi tiết, danh mục và mọi ảnh", async () => {
    const item = await loadMenuItemBySlug(db, "thit-nuong");
    expect(item?.category).toEqual({ name: "Bánh mì", slug: "banh-mi" });
    expect(item?.images.map((image) => image.url)).toEqual([
      "https://img/b.jpg",
      "https://img/a.jpg",
    ]);
  });

  it("trả null khi món không tồn tại hoặc đã ẩn", async () => {
    expect(await loadMenuItemBySlug(db, "khong-co")).toBeNull();
    expect(await loadMenuItemBySlug(db, "da-an")).toBeNull();
  });
});

describe("loadAllMenuSlugs", () => {
  it("chỉ liệt kê món đang hiện", async () => {
    expect((await loadAllMenuSlugs(db)).sort()).toEqual(["ca-phe", "thit-nuong"]);
  });
});
