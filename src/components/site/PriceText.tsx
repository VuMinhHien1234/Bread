import { formatVND } from "@/lib/money";
import type { MenuOption } from "@/server/queries/public/menu";

/** "25.000₫" nếu một giá, "từ 25.000₫" nếu món có nhiều lựa chọn giá khác nhau. */
export function PriceText({ options, minPrice }: { options: MenuOption[]; minPrice: number }) {
  const hasRange = new Set(options.map((option) => option.price)).size > 1;
  return (
    <span className="font-heading text-xl tabular-nums text-brass-text">
      {hasRange ? "từ " : ""}
      {formatVND(minPrice)}
    </span>
  );
}
