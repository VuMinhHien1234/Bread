import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "primary" | "green" | "yellow" | "danger";

const toneClass: Record<BadgeTone, string> = {
  neutral: "border border-border text-text-muted",
  primary: "bg-primary text-primary-foreground",
  green: "bg-accent-green text-primary-foreground",
  yellow: "bg-accent-yellow text-accent-yellow-foreground",
  danger: "bg-danger text-danger-foreground",
};

/** Nhãn nhỏ: Cay, Chay, Bán chạy, Món mới, Tạm hết… */
export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em]",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
