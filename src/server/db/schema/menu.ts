import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, primaryId, updatedAt } from "./shared";

export const category = pgTable(
  "category",
  {
    id: primaryId(),
    name: varchar("name", { length: 80 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    description: varchar("description", { length: 300 }),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("category_active_sort_idx").on(table.isActive, table.sortOrder)],
);

export const menuItem = pgTable(
  "menu_item",
  {
    id: primaryId(),
    // RESTRICT: không xóa được danh mục khi còn món (UI báo chuyển món trước)
    categoryId: text("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull().unique(),
    shortDescription: varchar("short_description", { length: 200 }),
    description: text("description"),
    ingredients: text("ingredients"),
    isSpicy: boolean("is_spicy").notNull().default(false),
    isVegetarian: boolean("is_vegetarian").notNull().default(false),
    isBestSeller: boolean("is_best_seller").notNull().default(false),
    isNew: boolean("is_new").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    isSoldOutToday: boolean("is_sold_out_today").notNull().default(false),
    soldOutAt: timestamp("sold_out_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("menu_item_category_idx").on(table.categoryId, table.isActive, table.sortOrder),
    index("menu_item_featured_idx")
      .on(table.isFeatured)
      .where(sql`${table.isActive} = true`),
  ],
);

export const menuItemOption = pgTable(
  "menu_item_option",
  {
    id: primaryId(),
    menuItemId: text("menu_item_id")
      .notNull()
      .references(() => menuItem.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 60 }).notNull(),
    /** Giá VND, số nguyên */
    price: integer("price").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    check("menu_item_option_price_check", sql`${table.price} >= 0`),
    index("menu_item_option_item_idx").on(table.menuItemId, table.sortOrder),
    // Mỗi món tối đa một lựa chọn mặc định
    uniqueIndex("menu_item_option_one_default_idx")
      .on(table.menuItemId)
      .where(sql`${table.isDefault} = true`),
  ],
);

export const menuItemImage = pgTable(
  "menu_item_image",
  {
    id: primaryId(),
    menuItemId: text("menu_item_id")
      .notNull()
      .references(() => menuItem.id, { onDelete: "cascade" }),
    /** id của ảnh trên Cloudinary, dùng khi xóa */
    publicId: varchar("public_id", { length: 255 }).notNull(),
    url: text("url").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    alt: varchar("alt", { length: 200 }),
    isPrimary: boolean("is_primary").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (table) => [index("menu_item_image_item_idx").on(table.menuItemId, table.sortOrder)],
);
