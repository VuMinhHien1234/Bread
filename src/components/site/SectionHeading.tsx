import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Tiêu đề mục: dòng chữ nhỏ viết hoa (eyebrow) + tiêu đề lớn + mô tả ngắn tùy chọn. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "left",
  as: Tag = "h2",
  className,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <p className="eyebrow">{eyebrow}</p>
      <Tag
        id={id}
        className={cn(
          Tag === "h1" ? "text-5xl sm:text-6xl lg:text-7xl" : "text-4xl sm:text-5xl",
          "max-w-3xl",
        )}
      >
        {title}
      </Tag>
      {description ? (
        <p className="max-w-xl text-lg leading-relaxed text-text-muted">{description}</p>
      ) : null}
      {children}
    </div>
  );
}
