import Link from "next/link";
import { shopConfig } from "@/lib/shop-config";
import { formatPhoneDisplay } from "@/lib/phone";
import { Logo } from "./Logo";
import { OpeningHours } from "./OpeningHours";
import { siteNavLinks } from "./nav-links";

const headingClass =
  "font-body text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-brass";

export function SiteFooter() {
  const { legal } = shopConfig;
  const legalLines = [
    legal.businessRegistration && `Số đăng ký hộ kinh doanh: ${legal.businessRegistration}`,
    legal.foodSafetyCertificate &&
      `Giấy chứng nhận an toàn thực phẩm: ${legal.foodSafetyCertificate}`,
  ].filter((line): line is string => Boolean(line));

  return (
    // pb-28: chừa chỗ cho thanh liên hệ nổi ở đáy màn hình điện thoại
    <footer className="grain mt-24 bg-ink pb-24 text-ivory md:pb-0">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col gap-6 border-b border-ivory/10 py-14 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-5">
            <Logo tone="light" />
            <p className="max-w-md font-heading text-3xl leading-snug text-ivory/90">
              {shopConfig.tagline}
            </p>
          </div>
          <Link
            href="/dat-mon"
            className="link-line self-start text-[0.8125rem] font-semibold uppercase tracking-[0.18em] text-brass md:self-auto"
          >
            Gửi yêu cầu đặt món →
          </Link>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <section className="flex flex-col gap-4">
            <h2 className={headingClass}>Ghé tiệm</h2>
            <address className="flex flex-col gap-2 not-italic text-ivory/75">
              <span>{shopConfig.address}</span>
              <a
                href={shopConfig.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-line self-start text-ivory"
              >
                Chỉ đường
              </a>
            </address>
          </section>
          <section className="flex flex-col gap-4">
            <h2 className={headingClass}>Liên hệ</h2>
            <div className="flex flex-col gap-2 text-ivory/75">
              <a href={`tel:${shopConfig.phone}`} className="link-line self-start text-ivory">
                {formatPhoneDisplay(shopConfig.phone)}
              </a>
              <a
                href={shopConfig.zalo}
                target="_blank"
                rel="noopener noreferrer"
                className="link-line self-start"
              >
                Zalo
              </a>
              <a
                href={shopConfig.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="link-line self-start"
              >
                Telegram
              </a>
            </div>
          </section>
          <section className="flex flex-col gap-4">
            <h2 className={headingClass}>Giờ mở cửa</h2>
            <div className="text-sm text-ivory/75 [&_dd]:text-ivory [&_dt]:text-ivory/60">
              <OpeningHours compact />
            </div>
          </section>
          <nav aria-label="Liên kết chân trang" className="flex flex-col gap-4">
            <h2 className={headingClass}>Khám phá</h2>
            <ul className="flex flex-col gap-2">
              {siteNavLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="link-line text-ivory/75 hover:text-ivory">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/chinh-sach-bao-mat"
                  className="link-line text-ivory/75 hover:text-ivory"
                >
                  Chính sách bảo mật
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-1 border-t border-ivory/10 py-6 text-xs tracking-wide text-ivory/50 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {shopConfig.name}
          </p>
          {legalLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </footer>
  );
}
