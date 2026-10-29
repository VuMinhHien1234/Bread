import Link from "next/link";
import { cn } from "@/lib/cn";
import type { PublicMenuItem } from "@/server/queries/public/menu";
import { MenuItemBadges } from "./MenuItemBadges";
import { MenuItemImage } from "./MenuItemImage";
import { PriceText } from "./PriceText";

/**
 * Thẻ món. Món "Tạm hết" vẫn hiện nhưng mờ đi và không có nút đặt.
 * Giá chỉ để tham khảo; chốt giá khi tiệm gọi lại.
 */
export function MenuCard({ item, priority = false }: { item: PublicMenuItem; priority?: boolean }) {
  const soldOut = item.isSoldOutToday;
  return (
    <article className="group flex flex-col">
      <Link
        href={`/thuc-don/${item.slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className={cn("zoom-on-hover relative block", soldOut && "opacity-60 grayscale")}
      >
        <MenuItemImage
          image={item.primaryImage}
          name={item.name}
          priority={priority}
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 pt-5">
        <MenuItemBadges item={item} />
        <h3 className={cn("text-[1.65rem] leading-tight", soldOut && "text-text-muted")}>
          <Link href={`/thuc-don/${item.slug}`} className="link-line">
            {item.name}
          </Link>
        </h3>
        {item.shortDescription ? (
          <p className="leading-relaxed text-text-muted">{item.shortDescription}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
          <PriceText options={item.options} minPrice={item.minPrice} />
          {soldOut ? null : (
            <Link
              href={`/dat-mon?mon=${encodeURIComponent(item.slug)}`}
              className="link-line text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-primary"
            >
              Đặt món này <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
