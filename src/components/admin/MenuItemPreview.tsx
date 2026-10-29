import { MenuCard } from "@/components/site/MenuCard";
import { cn } from "@/lib/cn";
import type { PublicMenuItem } from "@/server/queries/public/menu";

type PreviewSource = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  isSpicy: boolean;
  isVegetarian: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  isFeatured: boolean;
  isSoldOutToday: boolean;
  isActive: boolean;
  options: Array<{ id: string; name: string; price: number; isDefault: boolean }>;
  images: Array<{
    url: string;
    width: number;
    height: number;
    alt: string | null;
    isPrimary: boolean;
  }>;
};

/** Chuyển dữ liệu món trong trang quản trị sang đúng dạng thẻ món ngoài web. */
export function toPreviewItem(item: PreviewSource): PublicMenuItem {
  const primary = item.images.find((image) => image.isPrimary) ?? item.images[0] ?? null;
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    shortDescription: item.shortDescription,
    isSpicy: item.isSpicy,
    isVegetarian: item.isVegetarian,
    isBestSeller: item.isBestSeller,
    isNew: item.isNew,
    isFeatured: item.isFeatured,
    isSoldOutToday: item.isSoldOutToday,
    options: item.options,
    minPrice: item.options.length > 0 ? Math.min(...item.options.map((o) => o.price)) : 0,
    primaryImage: primary
      ? { url: primary.url, width: primary.width, height: primary.height, alt: primary.alt }
      : null,
  };
}

/**
 * Xem trước thẻ món đúng như khách thấy ở trang Thực đơn.
 * Tự cập nhật sau mỗi lần lưu (trang quản trị tải lại dữ liệu khi lưu thành công).
 */
export function MenuItemPreview({ item }: { item: PreviewSource }) {
  const publicUrl = `/thuc-don/${item.slug}`;
  return (
    <section
      aria-labelledby="xem-truoc"
      className="flex flex-col gap-4 rounded-card border border-border bg-bg p-4 sm:p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="xem-truoc" className="text-xl">
          Xem trước
        </h2>
        <span className="text-xs text-text-muted">Như khách thấy ở Thực đơn</span>
      </div>

      {item.isActive ? null : (
        <p className="rounded-card border border-border bg-surface p-3 text-sm text-text-muted">
          Món đang <strong>ẩn</strong>: khách chưa thấy món này. Bật &quot;Hiện trên web&quot; rồi
          lưu để đăng.
        </p>
      )}

      {/* inert: bấm vào thẻ xem trước không chuyển trang */}
      <div inert className={cn("mx-auto w-full max-w-xs", !item.isActive && "opacity-60")}>
        <MenuCard item={toPreviewItem(item)} />
      </div>

      {item.isActive ? (
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="self-center text-sm font-semibold text-primary underline underline-offset-4"
        >
          Mở trang món trên web ↗
        </a>
      ) : null}
    </section>
  );
}
