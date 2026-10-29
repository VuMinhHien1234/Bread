import { and, count, eq, notInArray } from "drizzle-orm";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import type { MenuItemInput } from "@/lib/validation/admin";
import { category, menuItem, menuItemImage, menuItemOption } from "@/server/db/schema";
import type { AppDb } from "@/server/db/types";
import { logServerError } from "@/server/log";
import { isUniqueViolation } from "./order-code";

const SLUG_TAKEN = { slug: "Đường dẫn này đã có, bạn đổi sang tên món khác nhé." };
const BAD_CATEGORY = { categoryId: "Danh mục không tồn tại." };

async function categoryExists(db: AppDb, categoryId: string) {
  const [row] = await db
    .select({ id: category.id })
    .from(category)
    .where(eq(category.id, categoryId))
    .limit(1);
  return row !== undefined;
}

export async function createMenuItem(
  db: AppDb,
  { options, ...fields }: MenuItemInput,
): Promise<ActionResult<{ id: string }>> {
  if (!(await categoryExists(db, fields.categoryId))) {
    return actionError("Danh mục không tồn tại.", BAD_CATEGORY);
  }
  try {
    const id = await db.transaction(async (tx) => {
      const [{ total } = { total: 0 }] = await tx
        .select({ total: count() })
        .from(menuItem)
        .where(eq(menuItem.categoryId, fields.categoryId));
      const [created] = await tx
        .insert(menuItem)
        .values({ ...fields, sortOrder: total })
        .returning({ id: menuItem.id });
      if (!created) throw new Error("Không tạo được món");
      await tx.insert(menuItemOption).values(
        options.map((option, index) => ({
          name: option.name,
          price: option.price,
          isDefault: option.isDefault,
          menuItemId: created.id,
          sortOrder: index,
        })),
      );
      return created.id;
    });
    return actionOk({ id });
  } catch (error) {
    if (isUniqueViolation(error)) return actionError("Món bị trùng đường dẫn.", SLUG_TAKEN);
    throw error;
  }
}

/**
 * Lưu món và các lựa chọn trong một transaction: lựa chọn có id thì sửa, không id thì thêm,
 * lựa chọn cũ không còn trong danh sách thì xóa. Dòng yêu cầu cũ giữ bản chụp tên/giá nên không ảnh hưởng.
 */
export async function updateMenuItem(
  db: AppDb,
  id: string,
  { options, ...fields }: MenuItemInput,
): Promise<ActionResult> {
  if (!(await categoryExists(db, fields.categoryId))) {
    return actionError("Danh mục không tồn tại.", BAD_CATEGORY);
  }
  try {
    return await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: menuItemOption.id })
        .from(menuItemOption)
        .where(eq(menuItemOption.menuItemId, id));
      const existingIds = new Set(existing.map((row) => row.id));
      if (options.some((option) => option.id !== undefined && !existingIds.has(option.id))) {
        return actionError("Có lựa chọn không thuộc món này. Bạn tải lại trang rồi sửa lại nhé.");
      }

      const updated = await tx
        .update(menuItem)
        .set(fields)
        .where(eq(menuItem.id, id))
        .returning({ id: menuItem.id });
      if (updated.length === 0) return actionError("Không tìm thấy món.");

      // Bỏ cờ mặc định trước để việc đổi lựa chọn mặc định không vướng ràng buộc "tối đa một mặc định"
      await tx
        .update(menuItemOption)
        .set({ isDefault: false })
        .where(eq(menuItemOption.menuItemId, id));

      const keptIds = options.flatMap((option) => (option.id ? [option.id] : []));
      await tx
        .delete(menuItemOption)
        .where(
          keptIds.length > 0
            ? and(eq(menuItemOption.menuItemId, id), notInArray(menuItemOption.id, keptIds))
            : eq(menuItemOption.menuItemId, id),
        );

      for (const [index, { id: optionId, ...option }] of options.entries()) {
        if (optionId) {
          await tx
            .update(menuItemOption)
            .set({ ...option, sortOrder: index })
            .where(eq(menuItemOption.id, optionId));
        } else {
          await tx.insert(menuItemOption).values({ ...option, menuItemId: id, sortOrder: index });
        }
      }
      return actionOk(undefined);
    });
  } catch (error) {
    if (isUniqueViolation(error)) return actionError("Món bị trùng đường dẫn.", SLUG_TAKEN);
    throw error;
  }
}

/**
 * Xóa món rồi mới xóa ảnh trên Cloudinary (gọi dịch vụ ngoài sau khi DB thành công).
 * Xóa ảnh lỗi chỉ ghi log: ảnh mồ côi tốn ít dung lượng, còn món đã xóa thật rồi.
 */
export async function deleteMenuItem(
  db: AppDb,
  id: string,
  deleteImage: (publicId: string) => Promise<boolean>,
): Promise<ActionResult> {
  const images = await db
    .select({ publicId: menuItemImage.publicId })
    .from(menuItemImage)
    .where(eq(menuItemImage.menuItemId, id));
  const deleted = await db
    .delete(menuItem)
    .where(eq(menuItem.id, id))
    .returning({ id: menuItem.id });
  if (deleted.length === 0) return actionError("Không tìm thấy món.");

  await Promise.all(
    images.map(async ({ publicId }) => {
      try {
        if (!(await deleteImage(publicId)))
          logServerError("deleteMenuItem.image", `Cloudinary từ chối xóa ${publicId}`);
      } catch (error) {
        logServerError("deleteMenuItem.image", error);
      }
    }),
  );
  return actionOk(undefined);
}

export async function setSoldOutToday(
  db: AppDb,
  id: string,
  value: boolean,
  now: Date,
): Promise<ActionResult> {
  const updated = await db
    .update(menuItem)
    .set({ isSoldOutToday: value, soldOutAt: value ? now : null })
    .where(eq(menuItem.id, id))
    .returning({ id: menuItem.id });
  return updated.length === 0 ? actionError("Không tìm thấy món.") : actionOk(undefined);
}

export async function setActive(db: AppDb, id: string, value: boolean): Promise<ActionResult> {
  if (value) {
    const [row] = await db
      .select({ total: count() })
      .from(menuItemOption)
      .where(eq(menuItemOption.menuItemId, id));
    if ((row?.total ?? 0) === 0) {
      return actionError("Món chưa có lựa chọn nào có giá nên chưa thể hiện lên web.");
    }
  }
  const updated = await db
    .update(menuItem)
    .set({ isActive: value })
    .where(eq(menuItem.id, id))
    .returning({ id: menuItem.id });
  return updated.length === 0 ? actionError("Không tìm thấy món.") : actionOk(undefined);
}

export async function reorderMenuItems(
  db: AppDb,
  categoryId: string,
  ids: string[],
): Promise<ActionResult> {
  await db.transaction(async (tx) => {
    for (const [index, id] of ids.entries()) {
      await tx
        .update(menuItem)
        .set({ sortOrder: index })
        .where(and(eq(menuItem.id, id), eq(menuItem.categoryId, categoryId)));
    }
  });
  return actionOk(undefined);
}
