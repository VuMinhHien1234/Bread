import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MenuItemBadges } from "@/components/site/MenuItemBadges";
import { MenuItemImage } from "@/components/site/MenuItemImage";
import { buttonClassName } from "@/components/ui/Button";
import { formatVND } from "@/lib/money";
import { getMenuItemBySlug } from "@/server/queries/public";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getMenuItemBySlug(slug);
  if (!item) return { title: "Không tìm thấy món" };
  return {
    title: item.name,
    description: item.shortDescription ?? `${item.name} — giá từ ${formatVND(item.minPrice)}.`,
    alternates: { canonical: `/thuc-don/${item.slug}` },
    openGraph: item.primaryImage ? { images: [{ url: item.primaryImage.url }] } : {},
  };
}

export default async function MenuItemPage({ params }: Props) {
  const { slug } = await params;
  const item = await getMenuItemBySlug(slug);
  if (!item) notFound();

  const [mainImage, ...otherImages] = item.images;

  return (
    <article className="grid gap-12 md:grid-cols-[1.05fr_0.95fr] lg:gap-20">
      <div className="flex flex-col gap-3">
        <MenuItemImage
          image={mainImage ?? null}
          name={item.name}
          priority
          sizes="(min-width: 768px) 560px, 100vw"
        />
        {otherImages.length > 0 ? (
          <ul className="grid grid-cols-3 gap-3">
            {otherImages.map((image) => (
              <li key={image.url}>
                <MenuItemImage image={image} name={item.name} sizes="180px" />
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-col gap-7 md:pt-4">
        <nav
          aria-label="Đường dẫn"
          className="text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-text-muted"
        >
          <Link href="/thuc-don" className="link-line hover:text-text">
            Thực đơn
          </Link>
          <span aria-hidden="true" className="mx-3 text-brass">
            /
          </span>
          {item.category.name}
        </nav>
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl sm:text-6xl">{item.name}</h1>
          <MenuItemBadges item={item} />
        </div>
        {(item.description ?? item.shortDescription) ? (
          <p className="whitespace-pre-line font-heading text-xl leading-relaxed text-text sm:text-2xl sm:leading-relaxed">
            {item.description ?? item.shortDescription}
          </p>
        ) : null}
        {item.ingredients ? (
          <section className="flex flex-col gap-2 border-t border-border pt-6">
            <h2 className="eyebrow">Thành phần</h2>
            <p className="whitespace-pre-line leading-relaxed text-text-muted">
              {item.ingredients}
            </p>
          </section>
        ) : null}

        <section
          aria-labelledby="lua-chon"
          className="flex flex-col gap-3 border-t border-border pt-6"
        >
          <h2 id="lua-chon" className="eyebrow">
            Lựa chọn và giá tham khảo
          </h2>
          <ul className="flex flex-col">
            {item.options.map((option) => (
              <li key={option.id} className="flex items-baseline gap-4 py-2.5">
                <span className="text-lg">{option.name}</span>
                <span
                  aria-hidden="true"
                  className="mb-1 flex-1 border-b border-dotted border-text/30"
                />
                <span className="font-heading text-2xl tabular-nums text-brass-text">
                  {formatVND(option.price)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {item.isSoldOutToday ? (
          <p className="border border-danger bg-danger/5 p-5 font-medium text-danger">
            Hôm nay món này đã hết. Bạn xem các món khác trong thực đơn nhé.
          </p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/dat-mon?mon=${encodeURIComponent(item.slug)}`}
              className={buttonClassName("primary", "lg")}
            >
              Đặt món này
            </Link>
            <Link href="/thuc-don" className={buttonClassName("secondary", "lg")}>
              Xem món khác
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
