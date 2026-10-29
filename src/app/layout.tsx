import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { getSiteUrl } from "@/lib/env";
import { shopConfig } from "@/lib/shop-config";
import "./globals.css";

/*
 * Font tự host (không gọi Google Fonts lúc build → CI/Netlify build ổn định).
 * Đã cắt chỉ còn Latin + tiếng Việt đầy đủ dấu. Giấy phép SIL OFL: xem src/app/fonts/OFL-*.txt
 * - Newsreader: tiêu đề, có chân, nét mềm tự nhiên (trục opsz 20–72, độ đậm 400–600)
 * - Source Sans 3 (đổi tên nội bộ theo điều khoản OFL): chữ nội dung, dễ đọc trên điện thoại
 */
const display = localFont({
  src: [
    { path: "./fonts/newsreader.woff2", weight: "400 600", style: "normal" },
    { path: "./fonts/newsreader-italic.woff2", weight: "400 500", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const body = localFont({
  src: [{ path: "./fonts/source-sans-3.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: shopConfig.name, template: `%s | ${shopConfig.name}` },
  description:
    "Bánh mì nóng giòn mỗi ngày. Xem thực đơn và gửi yêu cầu đặt món, tiệm sẽ gọi lại xác nhận.",
  applicationName: shopConfig.name,
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: shopConfig.name,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f1e8",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${display.variable} ${body.variable}`}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
