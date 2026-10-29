import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { category, menuItem, menuItemImage, menuItemOption } from "@/server/db/schema";
import type { AppDb } from "@/server/db/types";

export type MenuImage = { url: string; width: number; height: number; alt: string | null };
export type MenuOption = { id: string; name: string; price: number; isDefault: boolean };

/** Chỉ các cột web khách cần; không có cột nội bộ (ip, ghi chú quản trị). */
export type PublicMenuItem = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  isSpicy: boolean;
  isVegetarian: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  isFeatured: boolean;
  isSoldOutToday: boolean;
  options: MenuOption[];
  /** Giá thấp nhất trong các lựa chọn, để hiện "từ 25.000₫" */
  minPrice: number;
  primaryImage: MenuImage | null;
};

export type PublicMenuCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  items: PublicMenuItem[];
};

export type PublicMenuItemDetail = PublicMenuItem & {
  description: string | null;
  ingredients: string | null;
  category: { name: string; slug: string };
  images: MenuImage[];
};

const itemColumns = {
  id: menuItem.id,
  categoryId: menuItem.categoryId,
  slug: menuItem.slug,
  name: menuItem.name,
  shortDescription: menuItem.shortDescription,
  description: menuItem.description,
  ingredients: menuItem.ingredients,
  isSpicy: menuItem.isSpicy,
  isVegetarian: menuItem.isVegetarian,
  isBestSeller: menuItem.isBestSeller,
  isNew: menuItem.isNew,
  isFeatured: menuItem.isFeatured,
  isSoldOutToday: menuItem.isSoldOutToday,
};

type ItemRow = Pick<typeof menuItem.$inferSelect, keyof typeof itemColumns>;

async function attachDetails(db: AppDb, rows: ItemRow[]) {
  const ids = rows.map((row) => row.id);
  if (ids.length === 0) return [];

  const options = await db
    .select({
      id: menuItemOption.id,
      menuItemId: menuItemOption.menuItemId,
      name: menuItemOption.name,
      price: menuItemOption.price,
      isDefault: menuItemOption.isDefault,
    })
    .from(menuItemOption)
    .where(inArray(menuItemOption.menuItemId, ids))
    .orderBy(asc(menuItemOption.sortOrder), asc(menuItemOption.price));

  const images = await db
    .select({
      menuItemId: menuItemImage.menuItemId,
      url: menuItemImage.url,
      width: menuItemImage.width,
      height: menuItemImage.height,
      alt: menuItemImage.alt,
    })
    .from(menuItemImage)
    .where(inArray(menuItemImage.menuItemId, ids))
    .orderBy(desc(menuItemImage.isPrimary), asc(menuItemImage.sortOrder));

  const optionsByItem = new Map<string, MenuOption[]>();
  for (const { menuItemId, ...option } of options) {
    optionsByItem.set(menuItemId, [...(optionsByItem.get(menuItemId) ?? []), option]);
  }
  const imagesByItem = new Map<string, MenuImage[]>();
  for (const { menuItemId, ...image } of images) {
    imagesByItem.set(menuItemId, [...(imagesByItem.get(menuItemId) ?? []), image]);
  }

  return rows.map((row) => {
    const itemOptions = optionsByItem.get(row.id) ?? [];
    const itemImages = imagesByItem.get(row.id) ?? [];
    return {
      row,
      options: itemOptions,
      // Ảnh đã xếp "ảnh chính" lên đầu
      images: itemImages,
      minPrice: itemOptions.length > 0 ? Math.min(...itemOptions.map((o) => o.price)) : 0,
    };
  });
}

function toPublicItem(detail: Awaited<ReturnType<typeof attachDetails>>[number]): PublicMenuItem {
  const { row, options, images, minPrice } = detail;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
    isSpicy: row.isSpicy,
    isVegetarian: row.isVegetarian,
    isBestSeller: row.isBestSeller,
    isNew: row.isNew,
    isFeatured: row.isFeatured,
    isSoldOutToday: row.isSoldOutToday,
    options,
    minPrice,
    primaryImage: images[0] ?? null,
  };
}

const activeItem = eq(menuItem.isActive, true);

/** Món phải có ít nhất một lựa chọn có giá thì mới hiện (master plan: món luôn có giá). */
function hasOptions(item: PublicMenuItem) {
  return item.options.length > 0;
}

export async function loadMenu(db: AppDb): Promise<PublicMenuCategory[]> {
  const [categories, rows] = await Promise.all([
    db
      .select()
      .from(category)
      .where(eq(category.isActive, true))
      .orderBy(asc(category.sortOrder), asc(category.name)),
    db
      .select(itemColumns)
      .from(menuItem)
      .where(activeItem)
      .orderBy(asc(menuItem.sortOrder), asc(menuItem.name)),
  ]);
  const items = (await attachDetails(db, rows)).map((detail) => ({
    categoryId: detail.row.categoryId,
    item: toPublicItem(detail),
  }));

  return categories
    .map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      items: items
        .filter((entry) => entry.categoryId === cat.id && hasOptions(entry.item))
        .map((entry) => entry.item),
    }))
    .filter((cat) => cat.items.length > 0);
}

export async function loadFeaturedItems(db: AppDb, limit: number): Promise<PublicMenuItem[]> {
  const rows = await db
    .select(itemColumns)
    .from(menuItem)
    .innerJoin(category, eq(category.id, menuItem.categoryId))
    .where(and(activeItem, eq(menuItem.isFeatured, true), eq(category.isActive, true)))
    .orderBy(asc(menuItem.sortOrder), asc(menuItem.name));
  return (await attachDetails(db, rows)).map(toPublicItem).filter(hasOptions).slice(0, limit);
}

export async function loadMenuItemBySlug(
  db: AppDb,
  slug: string,
): Promise<PublicMenuItemDetail | null> {
  const [found] = await db
    .select({ ...itemColumns, categoryName: category.name, categorySlug: category.slug })
    .from(menuItem)
    .innerJoin(category, eq(category.id, menuItem.categoryId))
    .where(and(eq(menuItem.slug, slug), activeItem, eq(category.isActive, true)))
    .limit(1);
  if (!found) return null;

  const [detail] = await attachDetails(db, [found]);
  if (!detail || detail.options.length === 0) return null;
  return {
    ...toPublicItem(detail),
    description: found.description,
    ingredients: found.ingredients,
    category: { name: found.categoryName, slug: found.categorySlug },
    images: detail.images,
  };
}

export async function loadAllMenuSlugs(db: AppDb): Promise<string[]> {
  const rows = await db
    .select({ slug: menuItem.slug })
    .from(menuItem)
    .innerJoin(category, eq(category.id, menuItem.categoryId))
    .where(and(activeItem, eq(category.isActive, true)));
  return rows.map((row) => row.slug);
}
