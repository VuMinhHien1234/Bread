import type { Metadata } from "next";
import Link from "next/link";
import { AccentTitle } from "@/components/site/AccentTitle";
import { OpeningHours } from "@/components/site/OpeningHours";
import { PageHeader } from "@/components/site/PageHeader";
import { buttonClassName } from "@/components/ui/Button";
import { shopConfig } from "@/lib/shop-config";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description: `Câu chuyện của ${shopConfig.name}: bánh mì nướng trong ngày, nhân chuẩn bị từ sáng sớm.`,
  alternates: { canonical: "/gioi-thieu" },
};

export default function AboutPage() {
  const [leadStory, ...restStory] = shopConfig.story;
  return (
    <article className="flex flex-col gap-20">
      <PageHeader
        eyebrow={`Về ${shopConfig.name}`}
        title={<AccentTitle text={shopConfig.storyTitle} accentWords={3} />}
      />

      <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
        <div className="flex flex-col gap-6">
          {leadStory ? (
            <p className="font-heading text-2xl leading-relaxed sm:text-3xl sm:leading-relaxed">
              {leadStory}
            </p>
          ) : null}
          {restStory.map((paragraph) => (
            <p key={paragraph} className="text-lg leading-8 text-text-muted">
              {paragraph}
            </p>
          ))}
        </div>

        <aside
          aria-labelledby="gio-mo-cua"
          className="flex flex-col gap-5 self-start border border-border bg-surface p-8"
        >
          <h2 id="gio-mo-cua" className="eyebrow">
            Giờ mở cửa
          </h2>
          <OpeningHours />
          <p className="border-t border-border pt-5 text-text-muted">{shopConfig.address}</p>
        </aside>
      </div>

      <section aria-label="Điểm đặc biệt của tiệm">
        <ol className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
          {shopConfig.highlights.map((highlight, index) => (
            <li key={highlight.title} className="flex flex-col gap-3 bg-bg p-8">
              <span className="font-heading text-lg italic text-brass-text">0{index + 1}</span>
              <h2 className="text-2xl">{highlight.title}</h2>
              <p className="leading-relaxed text-text-muted">{highlight.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/thuc-don" className={buttonClassName("primary", "lg")}>
          Xem thực đơn
        </Link>
        <Link href="/lien-he" className={buttonClassName("secondary", "lg")}>
          Liên hệ tiệm
        </Link>
      </div>
    </article>
  );
}
