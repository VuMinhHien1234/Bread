import type { PublicMenuCategory } from "@/server/queries/public/menu";

/** Một dòng chọn món: một món + một lựa chọn giá. */
export type OrderLineRow = {
  key: string;
  menuItemId: string;
  optionId: string;
  itemName: string;
  optionName: string;
  /** Tên lựa chọn chỉ hiện khi món có nhiều hơn một lựa chọn */
  showOptionName: boolean;
  price: number;
  soldOut: boolean;
  categoryName: string;
  slug: string;
};

export function buildOrderRows(menu: PublicMenuCategory[]): OrderLineRow[] {
  return menu.flatMap((category) =>
    category.items.flatMap((item) =>
      item.options.map((option) => ({
        key: `${item.id}:${option.id}`,
        menuItemId: item.id,
        optionId: option.id,
        itemName: item.name,
        optionName: option.name,
        showOptionName: item.options.length > 1,
        price: option.price,
        soldOut: item.isSoldOutToday,
        categoryName: category.name,
        slug: item.slug,
      })),
    ),
  );
}

/**
 * Món khách chọn từ trang thực đơn (?mon=slug): chọn sẵn 1 phần ở lựa chọn mặc định
 * (hoặc lựa chọn đầu tiên). Món đã hết thì không chọn sẵn.
 */
export function initialQuantities(
  menu: PublicMenuCategory[],
  slug: string | undefined,
): Record<string, number> {
  if (!slug) return {};
  const item = menu.flatMap((category) => category.items).find((entry) => entry.slug === slug);
  if (!item || item.isSoldOutToday) return {};
  const option = item.options.find((entry) => entry.isDefault) ?? item.options[0];
  return option ? { [`${item.id}:${option.id}`]: 1 } : {};
}

export function estimateTotal(rows: OrderLineRow[], quantities: Record<string, number>): number {
  return rows.reduce((sum, row) => sum + row.price * (quantities[row.key] ?? 0), 0);
}
