import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import * as schema from "./schema";
import { seedDatabase } from "./seed";
import { seedCategories } from "./seed-data";

const db = drizzle(new PGlite(), { schema });

async function countRows(
  table: typeof schema.menuItem | typeof schema.category | typeof schema.orderRequest,
) {
  const [row] = await db.select({ total: count() }).from(table);
  return row?.total ?? 0;
}

beforeAll(async () => {
  const migration = readFileSync(
    new URL("../../../drizzle/0000_init.sql", import.meta.url),
    "utf8",
  );
  for (const statement of migration.split("--> statement-breakpoint")) {
    await db.execute(statement);
  }
});

describe("seedDatabase", () => {
  const expectedItems = seedCategories.reduce((sum, category) => sum + category.items.length, 0);

  it("chèn đủ danh mục, món, lựa chọn có giá và yêu cầu mẫu", async () => {
    await seedDatabase(db);
    expect(await countRows(schema.category)).toBe(seedCategories.length);
    expect(await countRows(schema.menuItem)).toBe(expectedItems);
    expect(await countRows(schema.orderRequest)).toBe(3);

    const statuses = await db
      .select({ status: schema.orderRequest.status })
      .from(schema.orderRequest);
    expect(statuses.map((row) => row.status).sort()).toEqual(["CALLED", "DONE", "NEW"]);
  });

  it("mỗi món có ít nhất một lựa chọn và đúng một lựa chọn mặc định", async () => {
    const items = await db.select({ id: schema.menuItem.id }).from(schema.menuItem);
    for (const item of items) {
      const options = await db
        .select()
        .from(schema.menuItemOption)
        .where(eq(schema.menuItemOption.menuItemId, item.id));
      expect(options.length).toBeGreaterThan(0);
      expect(options.filter((option) => option.isDefault)).toHaveLength(1);
    }
  });

  it("chạy lại không nhân đôi dữ liệu", async () => {
    await seedDatabase(db);
    expect(await countRows(schema.menuItem)).toBe(expectedItems);
    expect(await countRows(schema.orderRequest)).toBe(3);
  });

  it("không đụng tới dữ liệu thật khi chạy lại", async () => {
    const [category] = await db
      .insert(schema.category)
      .values({ name: "Thật", slug: "danh-muc-that" })
      .returning();
    await seedDatabase(db);
    const kept = await db
      .select()
      .from(schema.category)
      .where(eq(schema.category.slug, "danh-muc-that"));
    expect(kept).toHaveLength(1);
    expect(kept[0]?.id).toBe(category?.id);
  });
});
