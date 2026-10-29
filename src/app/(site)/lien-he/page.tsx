import type { Metadata } from "next";
import { AccentTitle } from "@/components/site/AccentTitle";
import { ContactForm } from "@/components/site/ContactForm";
import { OpeningHours } from "@/components/site/OpeningHours";
import { PageHeader } from "@/components/site/PageHeader";
import { buttonClassName } from "@/components/ui/Button";
import { formatPhoneDisplay } from "@/lib/phone";
import { shopConfig } from "@/lib/shop-config";

export const metadata: Metadata = {
  title: "Liên hệ",
  description: `Địa chỉ, giờ mở cửa, số điện thoại, Zalo và Telegram của ${shopConfig.name}. Gửi tin nhắn cho tiệm.`,
  alternates: { canonical: "/lien-he" },
};

const labelClass = "eyebrow";

export default function ContactPage() {
  return (
    <div className="flex flex-col gap-16">
      <PageHeader
        eyebrow="Liên hệ"
        title={<AccentTitle text="Tiệm luôn sẵn lòng lắng nghe" accentWords={2} />}
        description="Gọi, nhắn Zalo, Telegram hoặc để lại lời nhắn bên dưới — tiệm sẽ trả lời bạn sớm nhất."
      />

      <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="flex flex-col gap-12">
          <section aria-labelledby="thong-tin-tiem" className="flex flex-col gap-5">
            <h2 id="thong-tin-tiem" className={labelClass}>
              Thông tin tiệm
            </h2>
            <p className="font-heading text-2xl leading-snug">{shopConfig.address}</p>
            <a
              href={`tel:${shopConfig.phone}`}
              className="link-line self-start font-heading text-4xl tabular-nums text-primary"
            >
              {formatPhoneDisplay(shopConfig.phone)}
            </a>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href={`tel:${shopConfig.phone}`} className={buttonClassName("primary")}>
                Gọi ngay
              </a>
              <a
                href={shopConfig.zalo}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName("secondary")}
              >
                Zalo
              </a>
              <a
                href={shopConfig.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName("secondary")}
              >
                Telegram
              </a>
            </div>
          </section>

          <section
            aria-labelledby="gio-mo-cua"
            className="flex flex-col gap-5 border-t border-border pt-10"
          >
            <h2 id="gio-mo-cua" className={labelClass}>
              Giờ mở cửa
            </h2>
            <OpeningHours />
          </section>

          <section
            aria-labelledby="ban-do"
            className="flex flex-col gap-5 border-t border-border pt-10"
          >
            <h2 id="ban-do" className={labelClass}>
              Bản đồ
            </h2>
            {shopConfig.mapsEmbedUrl ? (
              <iframe
                title={`Bản đồ ${shopConfig.name}`}
                src={shopConfig.mapsEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="aspect-[4/3] w-full border border-border grayscale-[0.4]"
              />
            ) : null}
            <a
              href={shopConfig.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-line self-start text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-primary"
            >
              Mở trên Google Maps →
            </a>
          </section>
        </div>

        <section
          aria-labelledby="gui-tin"
          className="flex flex-col gap-6 self-start border border-border bg-surface p-6 shadow-card sm:p-10"
        >
          <div className="flex flex-col gap-2">
            <p className="eyebrow">Lời nhắn</p>
            <h2 id="gui-tin" className="text-3xl sm:text-4xl">
              Gửi tin nhắn cho tiệm
            </h2>
          </div>
          <ContactForm />
        </section>
      </div>
    </div>
  );
}
