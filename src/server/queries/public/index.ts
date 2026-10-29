import "server-only";
import { unstable_cache } from "next/cache";
import { getDb } from "@/server/db";
import { MENU_CACHE_TAG } from "@/server/cache-tags";
import { loadAllMenuSlugs, loadFeaturedItems, loadMenu, loadMenuItemBySlug } from "./menu";

export type {
  MenuImage,
  MenuOption,
  PublicMenuCategory,
  PublicMenuItem,
  PublicMenuItemDetail,
} from "./menu";

/**
 * Dữ liệu thực đơn được cache theo tag "menu". Mọi thao tác quản trị sửa thực đơn gọi
 * `updateTag(MENU_CACHE_TAG)` nên món "Tạm hết" hiện trên web ngay sau khi bật.
 */
const cacheOptions = { tags: [MENU_CACHE_TAG] };

export const getMenu = unstable_cache(() => loadMenu(getDb()), ["menu", "all"], cacheOptions);

export const getFeaturedItems = unstable_cache(
  (limit: number = 6) => loadFeaturedItems(getDb(), limit),
  ["menu", "featured"],
  cacheOptions,
);

export const getMenuItemBySlug = unstable_cache(
  (slug: string) => loadMenuItemBySlug(getDb(), slug),
  ["menu", "by-slug"],
  cacheOptions,
);

export const getAllMenuSlugs = unstable_cache(
  () => loadAllMenuSlugs(getDb()),
  ["menu", "slugs"],
  cacheOptions,
);
