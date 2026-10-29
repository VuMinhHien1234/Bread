import { count, eq } from "drizzle-orm";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import type { CategoryInput } from "@/lib/validation/admin";
import { category, menuItem } from "@/server/db/schema";
import type { AppDb } from "@/server/db/types";
import { isUniqueViolation } from "./order-code";

const SLUG_TAKEN = { slug: "Đường dẫn này đã có, bạn đổi sang tên khác nhé." };

export async function createCategory(
  db: AppDb,
  input: CategoryInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const [created] = await db
      .insert(category)
      .values({ ...input, sortOrder: await nextSortOrder(db) })
      .returning({ id: category.id });
    if (!created) throw new Error("Không tạo được danh mục");
    return actionOk({ id: created.id });
  } catch (error) {
    if (isUniqueViolation(error)) return actionError("Danh mục bị trùng đường dẫn.", SLUG_TAKEN);
    throw error;
  }
}

async function nextSortOrder(db: AppDb): Promise<number> {
  const [row] = await db.select({ total: count() }).from(category);
  return row?.total ?? 0;
}

export async function updateCategory(
  db: AppDb,
  id: string,
  input: CategoryInput,
): Promise<ActionResult> {
  try {
    const updated = await db
      .update(category)
      .set(input)
      .where(eq(category.id, id))
      .returning({ id: category.id });
    if (updated.length === 0) return actionError("Không tìm thấy danh mục.");
    return actionOk(undefined);
  } catch (error) {
    if (isUniqueViolation(error)) return actionError("Danh mục bị trùng đường dẫn.", SLUG_TAKEN);
    throw error;
  }
}

/** Không xóa được danh mục còn món (khóa ngoại RESTRICT); báo rõ để chủ tiệm chuyển món trước. */
export async function deleteCategory(db: AppDb, id: string): Promise<ActionResult> {
  const [row] = await db
    .select({ total: count() })
    .from(menuItem)
    .where(eq(menuItem.categoryId, id));
  const itemCount = row?.total ?? 0;
  if (itemCount > 0) {
    return actionError(
      `Danh mục còn ${itemCount} món. Bạn chuyển hoặc xóa các món trước rồi mới xóa được danh mục.`,
    );
  }
  const deleted = await db
    .delete(category)
    .where(eq(category.id, id))
    .returning({ id: category.id });
  if (deleted.length === 0) return actionError("Không tìm thấy danh mục.");
  return actionOk(undefined);
}

/** Thứ tự mới = vị trí trong danh sách `ids`. */
export async function reorderCategories(db: AppDb, ids: string[]): Promise<ActionResult> {
  await db.transaction(async (tx) => {
    for (const [index, id] of ids.entries()) {
      await tx.update(category).set({ sortOrder: index }).where(eq(category.id, id));
    }
  });
  return actionOk(undefined);
}
