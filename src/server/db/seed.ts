import { eq, inArray } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { SEED_MARKER, seedCategories } from "./seed-data";
import * as schema from "./schema";

type SeedDb = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Xóa các dòng mẫu cũ (nếu có), theo đúng thứ tự khóa ngoại cho phép. */
async function clearSeedData(db: SeedDb) {
  const itemSlugs = seedCategories.flatMap((category) => category.items.map((item) => item.slug));
  const categorySlugs = seedCategories.map((category) => category.slug);

  await db.delete(schema.orderRequest).where(eq(schema.orderRequest.ipHash, SEED_MARKER));
  await db.delete(schema.contactMessage).where(eq(schema.contactMessage.ipHash, SEED_MARKER));
  await db.delete(schema.menuItem).where(inArray(schema.menuItem.slug, itemSlugs));
  await db.delete(schema.category).where(inArray(schema.category.slug, categorySlugs));
}

/**
 * Chèn thực đơn mẫu, vài yêu cầu đặt món và tin liên hệ để dựng thử trang quản trị.
 * Chạy lại được nhiều lần; chỉ xóa những dòng do chính script này tạo.
 */
export async function seedDatabase(db: SeedDb) {
  await clearSeedData(db);

  const optionByItemSlug = new Map<
    string,
    { menuItemId: string; optionId: string; name: string; optionName: string; price: number }
  >();

  for (const [categoryIndex, category] of seedCategories.entries()) {
    const [createdCategory] = await db
      .insert(schema.category)
      .values({ name: category.name, slug: category.slug, sortOrder: categoryIndex })
      .returning({ id: schema.category.id });
    if (!createdCategory) throw new Error(`Không tạo được danh mục ${category.slug}`);

    for (const [itemIndex, item] of category.items.entries()) {
      const [createdItem] = await db
        .insert(schema.menuItem)
        .values({
          categoryId: createdCategory.id,
          name: item.name,
          slug: item.slug,
          shortDescription: item.shortDescription,
          isSpicy: item.isSpicy ?? false,
          isVegetarian: item.isVegetarian ?? false,
          isBestSeller: item.isBestSeller ?? false,
          isNew: item.isNew ?? false,
          isFeatured: item.isFeatured ?? false,
          sortOrder: itemIndex,
        })
        .returning({ id: schema.menuItem.id });
      if (!createdItem) throw new Error(`Không tạo được món ${item.slug}`);

      const createdOptions = await db
        .insert(schema.menuItemOption)
        .values(
          item.options.map((option, optionIndex) => ({
            menuItemId: createdItem.id,
            name: option.name,
            price: option.price,
            isDefault: optionIndex === 0,
            sortOrder: optionIndex,
          })),
        )
        .returning({ id: schema.menuItemOption.id });

      const first = createdOptions[0];
      const firstSeed = item.options[0];
      if (first && firstSeed) {
        optionByItemSlug.set(item.slug, {
          menuItemId: createdItem.id,
          optionId: first.id,
          name: item.name,
          optionName: firstSeed.name,
          price: firstSeed.price,
        });
      }
    }
  }

  await seedSampleRequests(db, optionByItemSlug);
}

async function seedSampleRequests(
  db: SeedDb,
  options: Map<
    string,
    { menuItemId: string; optionId: string; name: string; optionName: string; price: number }
  >,
) {
  const samples = [
    {
      code: "TL-SEED-001",
      status: "NEW",
      name: "Nguyễn Văn A",
      phone: "0901234567",
      fulfillment: "PICKUP",
      itemSlug: "banh-mi-thit-nuong",
      quantity: 2,
    },
    {
      code: "TL-SEED-002",
      status: "CALLED",
      name: "Trần Thị B",
      phone: "0912345678",
      fulfillment: "DELIVERY",
      itemSlug: "combo-sang",
      quantity: 1,
    },
    {
      code: "TL-SEED-003",
      status: "DONE",
      name: "Lê Văn C",
      phone: "0987654321",
      fulfillment: "PICKUP",
      itemSlug: "ca-phe-sua-da",
      quantity: 3,
    },
  ] as const;

  for (const sample of samples) {
    const option = options.get(sample.itemSlug);
    if (!option) continue;
    const lineTotal = option.price * sample.quantity;

    const [request] = await db
      .insert(schema.orderRequest)
      .values({
        code: sample.code,
        customerName: sample.name,
        phone: sample.phone,
        fulfillment: sample.fulfillment,
        deliveryAddress:
          sample.fulfillment === "DELIVERY" ? "12 Ngõ 5, Láng Hạ (dữ liệu mẫu)" : null,
        estimatedTotal: lineTotal,
        status: sample.status,
        ipHash: SEED_MARKER,
      })
      .returning({ id: schema.orderRequest.id });
    if (!request) continue;

    await db.insert(schema.orderRequestItem).values({
      orderRequestId: request.id,
      menuItemId: option.menuItemId,
      menuItemOptionId: option.optionId,
      itemName: option.name,
      optionName: option.optionName,
      unitPrice: option.price,
      quantity: sample.quantity,
      lineTotal,
    });
  }

  await db.insert(schema.contactMessage).values([
    {
      name: "Phạm Thị D",
      phone: "0933333333",
      message: "Tiệm có nhận đặt tiệc 50 phần không ạ? (dữ liệu mẫu)",
      ipHash: SEED_MARKER,
    },
    {
      name: "Hoàng Văn E",
      email: "e@example.com",
      message: "Tiệm mở cửa ngày lễ không? (dữ liệu mẫu)",
      status: "HANDLED",
      ipHash: SEED_MARKER,
    },
  ]);
}
