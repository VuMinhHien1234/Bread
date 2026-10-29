import { and, asc, count, eq, ilike, min, or } from "drizzle-orm";
import { category, menuItem, menuItemImage, menuItemOption } from "@/server/db/schema";
import type { AppDb } from "@/server/db/types";

export type AdminCategory = typeof category.$inferSelect & { itemCount: number };

export async function loadCategories(db: AppDb): Promise<AdminCategory[]> {
  const [categories, counts] = await Promise.all([
    db.select().from(category).orderBy(asc(category.sortOrder), asc(category.name)),
    db
      .select({ categoryId: menuItem.categoryId, total: count() })
      .from(menuItem)
      .groupBy(menuItem.categoryId),
  ]);
  const totals = new Map(counts.map((row) => [row.categoryId, row.total]));
  return categories.map((row) => ({ ...row, itemCount: totals.get(row.id) ?? 0 }));
}

export type AdminMenuItemRow = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  isActive: boolean;
  isSoldOutToday: boolean;
  isFeatured: boolean;
  minPrice: number | null;
};

/** Tìm theo tên (không phân biệt hoa thường), lọc theo danh mục; kèm giá thấp nhất. */
export async function loadMenuItems(
  db: AppDb,
  filter: { categoryId?: string; q?: string } = {},
): Promise<AdminMenuItemRow[]> {
  const search = filter.q?.trim();
  const escaped = search?.replace(/[\\%_]/g, (char) => `\\${char}`);
  const conditions = [
    filter.categoryId ? eq(menuItem.categoryId, filter.categoryId) : undefined,
    escaped
      ? or(ilike(menuItem.name, `%${escaped}%`), ilike(menuItem.slug, `%${escaped}%`))
      : undefined,
  ];
  return db
    .select({
      id: menuItem.id,
      categoryId: menuItem.categoryId,
      categoryName: category.name,
      name: menuItem.name,
      slug: menuItem.slug,
      isActive: menuItem.isActive,
      isSoldOutToday: menuItem.isSoldOutToday,
      isFeatured: menuItem.isFeatured,
      minPrice: min(menuItemOption.price),
    })
    .from(menuItem)
    .innerJoin(category, eq(category.id, menuItem.categoryId))
    .leftJoin(menuItemOption, eq(menuItemOption.menuItemId, menuItem.id))
    .where(and(...conditions))
    .groupBy(menuItem.id, category.id)
    .orderBy(asc(category.sortOrder), asc(menuItem.sortOrder), asc(menuItem.name));
}

export async function loadMenuItemForEdit(db: AppDb, id: string) {
  const [item] = await db.select().from(menuItem).where(eq(menuItem.id, id)).limit(1);
  if (!item) return null;
  const [options, images] = await Promise.all([
    db
      .select()
      .from(menuItemOption)
      .where(eq(menuItemOption.menuItemId, id))
      .orderBy(asc(menuItemOption.sortOrder)),
    db
      .select()
      .from(menuItemImage)
      .where(eq(menuItemImage.menuItemId, id))
      .orderBy(asc(menuItemImage.sortOrder)),
  ]);
  return { ...item, options, images };
}
