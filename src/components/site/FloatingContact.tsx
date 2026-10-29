import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { shopConfig } from "@/lib/shop-config";

const icons: Record<"phone" | "zalo" | "telegram", ReactNode> = {
  phone: (
    <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  ),
  zalo: <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l1.9-5.4A8.5 8.5 0 1 1 21 11.5z" />,
  telegram: (
    <path d="M21.5 4.5 2.8 11.7l5.5 2 2.1 6.6 3.1-3.7 5.2 3.9 2.8-16zM8.3 13.7l9.6-6.3-7.5 7.6" />
  ),
};

function Icon({ name }: { name: keyof typeof icons }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      strokeLinecap="round"
      className="size-5 shrink-0"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

const itemClass =
  "flex min-h-12 flex-1 items-center justify-center gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.14em] transition-colors md:size-12 md:min-h-0 md:flex-none md:rounded-full md:tracking-normal";

/**
 * Thanh liên hệ nổi: Gọi · Zalo · Telegram.
 * Điện thoại: thanh ngang sát đáy; màn hình rộng: ba nút tròn ở góc phải dưới, chữ chỉ hiện cho trình đọc màn hình.
 */
export function FloatingContact() {
  return (
    <nav
      aria-label="Liên hệ nhanh"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:inset-x-auto md:bottom-6 md:right-6 md:flex-col md:gap-2 md:border-0 md:bg-transparent md:pb-0 md:backdrop-blur-none"
    >
      <a
        href={`tel:${shopConfig.phone}`}
        className={cn(
          itemClass,
          "bg-primary text-primary-foreground hover:bg-primary-hover md:shadow-card",
        )}
      >
        <Icon name="phone" />
        <span className="md:sr-only">Gọi</span>
      </a>
      <a
        href={shopConfig.zalo}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          itemClass,
          "border-l border-border text-primary hover:bg-cream-deep md:border md:bg-surface md:shadow-card",
        )}
      >
        <Icon name="zalo" />
        <span className="md:sr-only">Zalo</span>
      </a>
      <a
        href={shopConfig.telegram}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          itemClass,
          "border-l border-border text-primary hover:bg-cream-deep md:border md:bg-surface md:shadow-card",
        )}
      >
        <Icon name="telegram" />
        <span className="md:sr-only">Telegram</span>
      </a>
    </nav>
  );
}
