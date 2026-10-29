import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";

type Props = {
  page: number;
  pageCount: number;
  /** Tạo địa chỉ cho một số trang, giữ nguyên bộ lọc đang dùng */
  hrefFor: (page: number) => string;
};

export function Pagination({ page, pageCount, hrefFor }: Props) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Phân trang" className="flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={buttonClassName("secondary")}>
          ← Trang trước
        </Link>
      ) : (
        <span />
      )}
      <span className="text-text-muted">
        Trang {page}/{pageCount}
      </span>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={buttonClassName("secondary")}>
          Trang sau →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
