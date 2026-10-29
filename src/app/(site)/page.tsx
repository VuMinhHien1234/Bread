import type { Metadata } from "next";
import Link from "next/link";
import { AccentTitle } from "@/components/site/AccentTitle";
import { HeroArt } from "@/components/site/HeroArt";
import { JsonLd } from "@/components/site/JsonLd";
import { MenuCard } from "@/components/site/MenuCard";
import { OpenStatus } from "@/components/site/OpenStatus";
import { OpeningHours } from "@/components/site/OpeningHours";
import { SectionHeading } from "@/components/site/SectionHeading";
import { buttonClassName } from "@/components/ui/Button";
import { getSiteUrl } from "@/lib/env";
import { formatPhoneDisplay } from "@/lib/phone";
import { shopConfig } from "@/lib/shop-config";
import { buildRestaurantJsonLd } from "@/lib/structured-data";
import { getFeaturedItems, getMenu } from "@/server/queries/public";

// Dữ liệu thực đơn đọc từ database lúc có người truy cập (đã cache theo tag "menu"), không dựng sẵn lúc build
export const dynamic = "force-dynamic";

const FEATURED_LIMIT = 6;

export const metadata: Metadata = {
  title: { absolute: `${shopConfig.name} — ${shopConfig.tagline}` },
  description:
    "Xem thực đơn bánh mì nóng giòn và gửi yêu cầu đặt món. Tiệm sẽ gọi lại xác nhận ngay.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [featured, menu] = await Promise.all([getFeaturedItems(FEATURED_LIMIT), getMenu()]);
  const firstOpen = shopConfig.openingHours[0]?.open;
  const [leadStory, ...restStory] = shopConfig.story;

  return (
    <div className="flex flex-col gap-28 sm:gap-36">
      <JsonLd data={buildRestaurantJsonLd(getSiteUrl())} />

      {/* Hero */}
      <section className="full-bleed grain -mt-10 bg-ink text-ivory sm:-mt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 lg:py-28">
          <div className="flex flex-col items-start gap-7">
            <div className="rise">
              <OpenStatus now={new Date()} tone="dark" />
            </div>
            <p className="rise rise-delay-1 eyebrow eyebrow-light">{shopConfig.subtitle}</p>
            <h1 className="rise rise-delay-1 text-[2.9rem] leading-[1.08] sm:text-7xl lg:text-[5.25rem]">
              <AccentTitle text={shopConfig.tagline} accentClassName="text-brass" />
            </h1>
            <p className="rise rise-delay-2 max-w-md text-lg leading-relaxed text-ivory/70">
              Chọn món, gửi yêu cầu — tiệm gọi lại xác nhận. Giá trên web để bạn tham khảo, không
              cần thanh toán trước.
            </p>
            <div className="rise rise-delay-3 flex w-full flex-col gap-3 pt-2 sm:w-auto sm:flex-row">
              <Link href="/dat-mon" className={buttonClassName("gold", "lg")}>
                Đặt món
              </Link>
              <Link href="/thuc-don" className={buttonClassName("light", "lg")}>
                Xem thực đơn
              </Link>
            </div>
          </div>
          <div className="rise rise-delay-2">
            <HeroArt caption={firstOpen ? `Ra lò từ ${firstOpen} mỗi ngày` : "Ra lò mỗi ngày"} />
          </div>
        </div>
      </section>

      {/* Ba điểm mạnh */}
      <section aria-label="Điểm đặc biệt của tiệm">
        <ol className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
          {shopConfig.highlights.map((highlight, index) => (
            <li key={highlight.title} className="flex flex-col gap-3 bg-bg p-8 sm:p-10">
              <span className="font-heading text-lg italic text-brass-text">0{index + 1}</span>
              <h2 className="text-2xl">{highlight.title}</h2>
              <p className="leading-relaxed text-text-muted">{highlight.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Món nổi bật */}
      {featured.length > 0 ? (
        <section aria-labelledby="mon-noi-bat" className="flex flex-col gap-12">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading
              id="mon-noi-bat"
              eyebrow="Thực đơn"
              title={<AccentTitle text="Món được yêu thích" accentWords={2} />}
            />
            <Link
              href="/thuc-don"
              className="link-line shrink-0 self-start text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-primary sm:self-auto"
            >
              Xem toàn bộ thực đơn →
            </Link>
          </div>
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item, index) => (
              <MenuCard key={item.id} item={item} priority={index < 2} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Bảng thực đơn rút gọn */}
      {menu.length > 0 ? (
        <section
          aria-labelledby="thuc-don-rut-gon"
          className="full-bleed bg-cream-deep py-20 sm:py-28"
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-12">
            <SectionHeading
              id="thuc-don-rut-gon"
              eyebrow="Danh mục"
              title="Hôm nay tiệm có gì"
              align="center"
            />
            <ul className="grid gap-x-16 sm:grid-cols-2">
              {menu.map((category) => (
                <li key={category.id} className="border-b border-text/15">
                  <Link
                    href={`/thuc-don#${category.slug}`}
                    className="group flex min-h-16 items-baseline gap-4 py-5"
                  >
                    <span className="font-heading text-2xl transition-colors group-hover:text-brass-text">
                      {category.name}
                    </span>
                    <span
                      aria-hidden="true"
                      className="mb-1.5 flex-1 border-b border-dotted border-text/30"
                    />
                    <span className="text-sm tabular-nums text-text-muted">
                      {category.items.length} món
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex justify-center">
              <Link href="/dat-mon" className={buttonClassName("primary", "lg")}>
                Gửi yêu cầu đặt món
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Câu chuyện */}
      <section
        aria-labelledby="cau-chuyen"
        className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20"
      >
        <SectionHeading
          id="cau-chuyen"
          eyebrow="Câu chuyện"
          title={<AccentTitle text={shopConfig.storyTitle} accentWords={3} />}
        />
        <div className="flex flex-col gap-6">
          {leadStory ? (
            <p className="font-heading text-2xl leading-relaxed text-text sm:text-[1.7rem]">
              {leadStory}
            </p>
          ) : null}
          {restStory.map((paragraph) => (
            <p key={paragraph} className="text-lg leading-8 text-text-muted">
              {paragraph}
            </p>
          ))}
          <Link
            href="/gioi-thieu"
            className="link-line mt-2 self-start text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-primary"
          >
            Đọc thêm về tiệm →
          </Link>
        </div>
      </section>

      {/* Ghé tiệm */}
      <section aria-labelledby="dia-chi" className="grid border border-border lg:grid-cols-2">
        <div className="flex flex-col gap-6 p-8 sm:p-12">
          <SectionHeading id="dia-chi" eyebrow="Ghé tiệm" title="Hẹn gặp bạn ở tiệm" />
          <p className="text-lg">{shopConfig.address}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={shopConfig.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClassName("primary")}
            >
              Chỉ đường
            </a>
            <a href={`tel:${shopConfig.phone}`} className={buttonClassName("secondary")}>
              Gọi {formatPhoneDisplay(shopConfig.phone)}
            </a>
          </div>
        </div>
        <div className="flex flex-col gap-5 border-t border-border bg-surface p-8 sm:p-12 lg:border-l lg:border-t-0">
          <h3 className="eyebrow">Giờ mở cửa</h3>
          <OpeningHours />
        </div>
      </section>
    </div>
  );
}
