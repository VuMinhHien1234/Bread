import { cn } from "@/lib/cn";

/** Khối giữ chỗ khi đang tải. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-button bg-border/60", className)}
    />
  );
}
