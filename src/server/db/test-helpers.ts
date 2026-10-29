import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";

/** Chỉ dùng trong test: một Postgres thật chạy trong bộ nhớ, đã áp migration khởi tạo. */
export async function createTestDb() {
  const db = drizzle(new PGlite(), { schema });
  const migration = readFileSync(
    new URL("../../../drizzle/0000_init.sql", import.meta.url),
    "utf8",
  );
  for (const statement of migration.split("--> statement-breakpoint")) {
    await db.execute(statement);
  }
  return db;
}

/** Một danh mục với hai món: bánh mì (2 lựa chọn) và cà phê (đang hết hàng hôm nay). */
export async function insertTestMenu(db: Awaited<ReturnType<typeof createTestDb>>) {
  const [category] = await db
    .insert(schema.category)
    .values({ name: "Bánh mì", slug: "banh-mi" })
    .returning();
  if (!category) throw new Error("không tạo được danh mục thử");

  const [bread, coffee, hidden] = await db
    .insert(schema.menuItem)
    .values([
      { categoryId: category.id, name: "Bánh mì thịt nướng", slug: "thit-nuong" },
      { categoryId: category.id, name: "Cà phê sữa", slug: "ca-phe", isSoldOutToday: true },
      { categoryId: category.id, name: "Món đã ẩn", slug: "da-an", isActive: false },
    ])
    .returning();
  if (!bread || !coffee || !hidden) throw new Error("không tạo được món thử");

  const [normal, special, coffeeOption, hiddenOption] = await db
    .insert(schema.menuItemOption)
    .values([
      { menuItemId: bread.id, name: "Thường", price: 25_000, isDefault: true },
      { menuItemId: bread.id, name: "Đặc biệt", price: 35_000 },
      { menuItemId: coffee.id, name: "Ly", price: 20_000, isDefault: true },
      { menuItemId: hidden.id, name: "Ly", price: 10_000, isDefault: true },
    ])
    .returning();
  if (!normal || !special || !coffeeOption || !hiddenOption) {
    throw new Error("không tạo được lựa chọn thử");
  }
  return { category, bread, coffee, hidden, normal, special, coffeeOption, hiddenOption };
}
