import Link from "next/link";
import { cn } from "@/lib/cn";
import { shopConfig } from "@/lib/shop-config";

/**
 * Logo chữ tạm: dấu ấn tròn viền đồng thau với ổ bánh + tên tiệm và dòng phụ viết hoa giãn chữ.
 * Thay bằng logo thật khi có (G6.7).
 */
export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const light = tone === "light";
  return (
    <Link
      href="/"
      className="group flex items-center gap-3"
      aria-label={`${shopConfig.name} — trang chủ`}
    >
      <svg
        viewBox="0 0 44 44"
        className={cn("size-10 shrink-0", light ? "text-brass" : "text-primary")}
        aria-hidden="true"
      >
        <circle cx="22" cy="22" r="21.25" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          className="stroke-brass"
          strokeWidth="0.75"
          strokeDasharray="0.5 2.2"
          strokeLinecap="round"
        />
        <path
          d="M11.5 25.5c0-5.3 4.7-9.3 10.5-9.3s10.5 4 10.5 9.3c0 1.2-1 2-2.2 2H13.7c-1.2 0-2.2-.8-2.2-2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
        />
        <path
          d="M16.6 21.4l1.8 3M21.4 19.8l1.4 4.1M26.2 21.4l1.6 3"
          className="stroke-brass"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </svg>
      <span className="flex flex-col">
        <span
          className={cn(
            "font-heading text-[1.45rem] font-medium leading-none tracking-[-0.01em]",
            light ? "text-ivory" : "text-primary",
          )}
        >
          {shopConfig.name}
        </span>
        <span
          className={cn(
            "mt-1 text-[0.625rem] font-semibold uppercase leading-none tracking-[0.28em]",
            light ? "text-brass" : "text-brass-text",
          )}
        >
          {shopConfig.subtitle}
        </span>
      </span>
    </Link>
  );
}
