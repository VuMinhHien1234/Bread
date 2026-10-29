import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { categorySchema, menuItemSchema } from "@/lib/validation/admin";
import {
  category,
  contactMessage,
  menuItem,
  menuItemImage,
  menuItemOption,
  orderRequest,
} from "@/server/db/schema";
import { createTestDb } from "@/server/db/test-helpers";
import {
  createCategory,
  deleteCategory,
  reorderCategories,
  updateCategory,
} from "./admin-categories";
import {
  addMenuItemImage,
  deleteMenuItemImage,
  reorderImages,
  setPrimaryImage,
} from "./admin-images";
import {
  createMenuItem,
  deleteMenuItem,
  reorderMenuItems,
  setActive,
  setSoldOutToday,
  updateMenuItem,
} from "./admin-menu";
import { retryTelegram, updateContactStatus, updateOrderRequestStatus } from "./admin-requests";

vi.mock("server-only", () => ({}));

const NOW = new Date("2026-10-07T04:00:00.000Z");
const db = await createTestDb();

function parseCategory(input: object) {
  return categorySchema.parse({ name: "Bánh mì", ...input });
}
function parseItem(categoryId: string, input: object = {}) {
  return menuItemSchema.parse({
    categoryId,
    name: "Bánh mì thịt nướng",
    options: [{ name: "Thường", price: 25_000 }],
    ...input,
  });
}
async function mustCreateCategory(name = "Bánh mì") {
  const result = await createCategory(db, parseCategory({ name }));
  if (!result.ok) throw new Error(result.error);
  return result.data.id;
}
async function mustCreateItem(categoryId: string, input: object = {}) {
  const result = await createMenuItem(db, parseItem(categoryId, input));
  if (!result.ok) throw new Error(result.error);
  return result.data.id;
}
const optionsOf = (menuItemId: string) =>
  db.select().from(menuItemOption).where(eq(menuItemOption.menuItemId, menuItemId));

describe("schema quản trị", () => {
  it("tự sinh đường dẫn từ tên tiếng Việt", () => {
    expect(parseCategory({ name: "Đồ uống nóng" }).slug).toBe("do-uong-nong");
    expect(parseCategory({ name: "Đồ uống", slug: "nuoc" }).slug).toBe("nuoc");
  });

  it("từ chối đường dẫn gõ tay sai dạng", () => {
    expect(categorySchema.safeParse({ name: "A", slug: "Có Dấu" }).success).toBe(false);
  });

  it("món cần ít nhất một lựa chọn, giá nguyên 0–10 triệu", () => {
    const base = { categoryId: "c", name: "Món" };
    expect(menuItemSchema.safeParse({ ...base, options: [] }).success).toBe(false);
    for (const price of [-1, 1.5, 10_000_001]) {
      expect(menuItemSchema.safeParse({ ...base, options: [{ name: "x", price }] }).success).toBe(
        false,
      );
    }
    expect(menuItemSchema.safeParse({ ...base, options: [{ name: "x", price: 0 }] }).success).toBe(
      true,
    );
  });

  it("chỉ cho một lựa chọn mặc định; không chọn thì lấy lựa chọn đầu", () => {
    const two = menuItemSchema.safeParse({
      categoryId: "c",
      name: "Món",
      options: [
        { name: "a", price: 1, isDefault: true },
        { name: "b", price: 2, isDefault: true },
      ],
    });
    expect(two.success).toBe(false);
    const none = parseItem("c", {
      options: [
        { name: "a", price: 1 },
        { name: "b", price: 2 },
      ],
    });
    expect(none.options.map((o) => o.isDefault)).toEqual([true, false]);
  });
});

describe("danh mục", () => {
  it("tạo, sửa và báo trùng đường dẫn", async () => {
    const id = await mustCreateCategory("Đồ uống");
    expect((await updateCategory(db, id, parseCategory({ name: "Nước", slug: "nuoc" }))).ok).toBe(
      true,
    );
    const duplicate = await createCategory(db, parseCategory({ name: "Khác", slug: "nuoc" }));
    expect(duplicate.ok).toBe(false);
    expect(!duplicate.ok && duplicate.fieldErrors?.["slug"]).toBeDefined();
  });

  it("không xóa được danh mục còn món, xóa được khi trống", async () => {
    const id = await mustCreateCategory("Danh mục xóa");
    const itemId = await mustCreateItem(id, { name: "Món A" });
    const blocked = await deleteCategory(db, id);
    expect(!blocked.ok && blocked.error).toContain("1 món");

    await deleteMenuItem(db, itemId, () => Promise.resolve(true));
    expect((await deleteCategory(db, id)).ok).toBe(true);
    expect((await deleteCategory(db, id)).ok).toBe(false);
  });

  it("sắp xếp lại theo thứ tự danh sách", async () => {
    const a = await mustCreateCategory("Sắp A");
    const b = await mustCreateCategory("Sắp B");
    await reorderCategories(db, [b, a]);
    const rows = await db.select().from(category).where(eq(category.id, b));
    expect(rows[0]?.sortOrder).toBe(0);
  });
});

describe("món và lựa chọn", () => {
  it("tạo món kèm lựa chọn trong một lần, lựa chọn đầu là mặc định", async () => {
    const categoryId = await mustCreateCategory("Cho món");
    const id = await mustCreateItem(categoryId, {
      name: "Món hai giá",
      options: [
        { name: "Thường", price: 25_000 },
        { name: "Đặc biệt", price: 35_000 },
      ],
    });
    const options = await optionsOf(id);
    expect(options).toHaveLength(2);
    expect(options.find((o) => o.name === "Thường")?.isDefault).toBe(true);
  });

  it("trùng đường dẫn món báo lỗi theo ô và không tạo gì thêm", async () => {
    const categoryId = await mustCreateCategory("Trùng slug");
    await mustCreateItem(categoryId, { name: "Món X" });
    const duplicate = await createMenuItem(db, parseItem(categoryId, { name: "Món X" }));
    expect(!duplicate.ok && duplicate.fieldErrors?.["slug"]).toBeDefined();
  });

  it("danh mục không tồn tại bị từ chối", async () => {
    const result = await createMenuItem(db, parseItem("khong-co"));
    expect(result.ok).toBe(false);
  });

  it("sửa món: cập nhật, thêm, xóa lựa chọn và đổi mặc định", async () => {
    const categoryId = await mustCreateCategory("Sửa món");
    const id = await mustCreateItem(categoryId, {
      name: "Món sửa",
      options: [
        { name: "Nhỏ", price: 20_000 },
        { name: "Lớn", price: 30_000 },
      ],
    });
    const [small, large] = (await optionsOf(id)).sort((x, y) => x.price - y.price);
    if (!small || !large) throw new Error("thiếu lựa chọn");

    const result = await updateMenuItem(
      db,
      id,
      parseItem(categoryId, {
        name: "Món sửa (mới)",
        slug: "mon-sua",
        options: [
          { id: large.id, name: "Lớn", price: 32_000, isDefault: true },
          { name: "Siêu lớn", price: 40_000 },
        ],
      }),
    );
    expect(result.ok).toBe(true);

    const options = await optionsOf(id);
    expect(options.map((o) => o.name).sort()).toEqual(["Lớn", "Siêu lớn"]);
    expect(options.find((o) => o.name === "Lớn")).toMatchObject({ price: 32_000, isDefault: true });
    expect(options.filter((o) => o.isDefault)).toHaveLength(1);
    const [item] = await db.select().from(menuItem).where(eq(menuItem.id, id));
    expect(item?.name).toBe("Món sửa (mới)");
  });

  it("từ chối lựa chọn của món khác và không sửa gì", async () => {
    const categoryId = await mustCreateCategory("Chéo");
    const first = await mustCreateItem(categoryId, { name: "Món 1" });
    const second = await mustCreateItem(categoryId, { name: "Món 2" });
    const [foreign] = await optionsOf(second);
    const result = await updateMenuItem(
      db,
      first,
      parseItem(categoryId, {
        name: "Đổi tên",
        options: [{ id: foreign?.id, name: "x", price: 1 }],
      }),
    );
    expect(result.ok).toBe(false);
    const [item] = await db.select().from(menuItem).where(eq(menuItem.id, first));
    expect(item?.name).toBe("Món 1");
  });

  it("bật/tắt Tạm hết ghi thời điểm; trả lỗi khi món không có", async () => {
    const categoryId = await mustCreateCategory("Tạm hết");
    const id = await mustCreateItem(categoryId, { name: "Món hết" });
    await setSoldOutToday(db, id, true, NOW);
    let [item] = await db.select().from(menuItem).where(eq(menuItem.id, id));
    expect(item).toMatchObject({ isSoldOutToday: true, soldOutAt: NOW });
    await setSoldOutToday(db, id, false, NOW);
    [item] = await db.select().from(menuItem).where(eq(menuItem.id, id));
    expect(item).toMatchObject({ isSoldOutToday: false, soldOutAt: null });
    expect((await setSoldOutToday(db, "khong-co", true, NOW)).ok).toBe(false);
  });

  it("chặn hiện món khi chưa có lựa chọn nào", async () => {
    const categoryId = await mustCreateCategory("Ẩn hiện");
    const id = await mustCreateItem(categoryId, { name: "Món ẩn hiện" });
    expect((await setActive(db, id, false)).ok).toBe(true);
    expect((await setActive(db, id, true)).ok).toBe(true);
    await db.delete(menuItemOption).where(eq(menuItemOption.menuItemId, id));
    await setActive(db, id, false);
    expect((await setActive(db, id, true)).ok).toBe(false);
  });

  it("sắp xếp món trong danh mục", async () => {
    const categoryId = await mustCreateCategory("Sắp món");
    const a = await mustCreateItem(categoryId, { name: "Sắp món A" });
    const b = await mustCreateItem(categoryId, { name: "Sắp món B" });
    await reorderMenuItems(db, categoryId, [b, a]);
    const [row] = await db.select().from(menuItem).where(eq(menuItem.id, b));
    expect(row?.sortOrder).toBe(0);
  });

  it("xóa món cũng xóa ảnh Cloudinary; ảnh lỗi không làm hỏng việc xóa", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const categoryId = await mustCreateCategory("Xóa món");
    const id = await mustCreateItem(categoryId, { name: "Món bị xóa" });
    for (const publicId of ["p1", "p2"]) {
      await addMenuItemImage(db, {
        menuItemId: id,
        publicId,
        url: `https://i/${publicId}.jpg`,
        width: 1,
        height: 1,
        alt: null,
      });
    }
    const deleteImage = vi.fn((publicId: string) =>
      publicId === "p1" ? Promise.reject(new Error("mạng")) : Promise.resolve(true),
    );
    expect((await deleteMenuItem(db, id, deleteImage)).ok).toBe(true);
    expect(deleteImage).toHaveBeenCalledTimes(2);
    expect(await db.select().from(menuItem).where(eq(menuItem.id, id))).toHaveLength(0);
    expect(
      await db.select().from(menuItemImage).where(eq(menuItemImage.menuItemId, id)),
    ).toHaveLength(0);
  });
});

describe("ảnh món", () => {
  const image = (menuItemId: string, publicId: string) => ({
    menuItemId,
    publicId,
    url: `https://i/${publicId}.jpg`,
    width: 800,
    height: 600,
    alt: null,
  });

  it("ảnh đầu là ảnh chính, đổi ảnh chính, xóa ảnh chính thì ảnh sau lên thay", async () => {
    const categoryId = await mustCreateCategory("Ảnh");
    const id = await mustCreateItem(categoryId, { name: "Món ảnh" });
    const first = await addMenuItemImage(db, image(id, "a"));
    const second = await addMenuItemImage(db, image(id, "b"));
    if (!first.ok || !second.ok) throw new Error("không thêm được ảnh");

    const primaryIds = async () =>
      (await db.select().from(menuItemImage).where(eq(menuItemImage.menuItemId, id)))
        .filter((row) => row.isPrimary)
        .map((row) => row.publicId);

    expect(await primaryIds()).toEqual(["a"]);
    await setPrimaryImage(db, second.data.id);
    expect(await primaryIds()).toEqual(["b"]);

    const deleteImage = vi.fn(() => Promise.resolve(true));
    await deleteMenuItemImage(db, second.data.id, deleteImage);
    expect(deleteImage).toHaveBeenCalledWith("b");
    expect(await primaryIds()).toEqual(["a"]);
  });

  it("thêm ảnh cho món không tồn tại bị từ chối; sắp xếp ảnh", async () => {
    expect((await addMenuItemImage(db, image("khong-co", "z"))).ok).toBe(false);
    const categoryId = await mustCreateCategory("Ảnh 2");
    const id = await mustCreateItem(categoryId, { name: "Món ảnh 2" });
    const a = await addMenuItemImage(db, image(id, "x"));
    const b = await addMenuItemImage(db, image(id, "y"));
    if (!a.ok || !b.ok) throw new Error("không thêm được ảnh");
    await reorderImages(db, id, [b.data.id, a.data.id]);
    const [row] = await db.select().from(menuItemImage).where(eq(menuItemImage.id, b.data.id));
    expect(row?.sortOrder).toBe(0);
  });
});

describe("yêu cầu và tin liên hệ", () => {
  async function insertOrder() {
    const [row] = await db
      .insert(orderRequest)
      .values({
        code: `TL-X-${Math.random().toString(36).slice(2, 6)}`,
        customerName: "Khách <b>",
        phone: "0901234567",
        fulfillment: "PICKUP",
        estimatedTotal: 50_000,
        telegramError: "lỗi cũ",
      })
      .returning();
    if (!row) throw new Error("không tạo được yêu cầu");
    return row;
  }

  it("đổi trạng thái kèm ghi chú; id sai báo lỗi", async () => {
    const order = await insertOrder();
    await updateOrderRequestStatus(db, { id: order.id, status: "CALLED", adminNote: "đã gọi 10h" });
    const [row] = await db.select().from(orderRequest).where(eq(orderRequest.id, order.id));
    expect(row).toMatchObject({ status: "CALLED", adminNote: "đã gọi 10h" });
    expect(
      (await updateOrderRequestStatus(db, { id: "x", status: "DONE", adminNote: null })).ok,
    ).toBe(false);
  });

  it("đổi trạng thái tin liên hệ", async () => {
    const [message] = await db
      .insert(contactMessage)
      .values({ name: "B", phone: "0912345678", message: "Nội dung đủ dài" })
      .returning();
    if (!message) throw new Error("không tạo được tin");
    await updateContactStatus(db, { id: message.id, status: "HANDLED" });
    const [row] = await db.select().from(contactMessage).where(eq(contactMessage.id, message.id));
    expect(row?.status).toBe("HANDLED");
  });

  it("gửi lại Telegram thành công thì xóa lỗi cũ, thất bại thì ghi lỗi mới", async () => {
    const order = await insertOrder();
    const send =
      vi.fn<
        (text: string) => Promise<{ ok: true; messageId: number } | { ok: false; error: string }>
      >();
    const deps = { db, siteUrl: "https://banhmi.example", now: NOW, sendTelegram: send };

    send.mockResolvedValueOnce({ ok: false, error: "429" });
    expect((await retryTelegram(deps, "order", order.id)).ok).toBe(false);
    let [row] = await db.select().from(orderRequest).where(eq(orderRequest.id, order.id));
    expect(row?.telegramError).toBe("429");

    send.mockResolvedValueOnce({ ok: true, messageId: 9 });
    expect((await retryTelegram(deps, "order", order.id)).ok).toBe(true);
    [row] = await db.select().from(orderRequest).where(eq(orderRequest.id, order.id));
    expect(row).toMatchObject({ telegramError: null, telegramMessageId: 9, telegramSentAt: NOW });
    expect(send.mock.calls[0]?.[0]).toContain("Khách &lt;b&gt;");
  });

  it("gửi lại cho mục không tồn tại báo lỗi", async () => {
    const deps = { db, siteUrl: "https://x", now: NOW, sendTelegram: vi.fn() };
    expect((await retryTelegram(deps, "contact", "khong-co")).ok).toBe(false);
    expect(deps.sendTelegram).not.toHaveBeenCalled();
  });
});
