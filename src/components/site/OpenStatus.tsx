import { cn } from "@/lib/cn";
import { formatVietnamClock } from "@/lib/datetime";
import { isOpenAt, nextOpenTime } from "@/lib/shop-config";

/** "Đang mở cửa" hoặc "Đang đóng cửa · mở lại lúc 06:00", tính theo giờ Việt Nam tại thời điểm `now`. */
export function OpenStatus({ now, tone = "light" }: { now: Date; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  const open = isOpenAt(now);
  const next = open ? null : nextOpenTime(now);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-[0.75rem] font-semibold tracking-wide",
        dark ? "border-ivory/20 text-ivory/85" : "border-border text-text-muted",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          open
            ? "bg-live shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-live)_25%,transparent)]"
            : "bg-brass",
        )}
      />
      {open
        ? "Đang mở cửa"
        : `Đang đóng cửa${next ? ` · mở lại lúc ${formatVietnamClock(next)}` : ""}`}
    </span>
  );
}
