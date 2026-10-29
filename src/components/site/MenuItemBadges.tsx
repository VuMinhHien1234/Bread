import { Badge } from "@/components/ui/Badge";
import type { PublicMenuItem } from "@/server/queries/public/menu";

type BadgeFlags = Pick<
  PublicMenuItem,
  "isSpicy" | "isVegetarian" | "isBestSeller" | "isNew" | "isSoldOutToday"
>;

export function MenuItemBadges({ item }: { item: BadgeFlags }) {
  if (!(
    item.isSoldOutToday ||
    item.isBestSeller ||
    item.isNew ||
    item.isSpicy ||
    item.isVegetarian
  )) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {item.isSoldOutToday ? <Badge tone="danger">Tạm hết hôm nay</Badge> : null}
      {item.isBestSeller ? <Badge tone="primary">Bán chạy</Badge> : null}
      {item.isNew ? <Badge tone="yellow">Món mới</Badge> : null}
      {item.isSpicy ? <Badge tone="neutral">Cay</Badge> : null}
      {item.isVegetarian ? <Badge tone="green">Chay</Badge> : null}
    </div>
  );
}
