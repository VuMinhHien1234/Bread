import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Đầu trang con: eyebrow + tiêu đề lớn + mô tả, có đường kẻ mảnh phía dưới. */
export function PageHeader({
  eyebrow,
  title,
  description,
  className,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <header className={cn("flex flex-col gap-5 border-b border-border pb-10 sm:pb-14", className)}>
      <p className="rise eyebrow">{eyebrow}</p>
      <h1 className="rise rise-delay-1 max-w-3xl text-5xl sm:text-6xl lg:text-7xl">{title}</h1>
      {description ? (
        <p className="rise rise-delay-2 max-w-xl text-lg leading-relaxed text-text-muted">
          {description}
        </p>
      ) : null}
      {children}
    </header>
  );
}
