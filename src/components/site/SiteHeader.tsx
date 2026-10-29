import { Logo } from "./Logo";
import { DesktopNav, MobileNav } from "./SiteNav";

/**
 * Header dính đầu trang. Màn hình rộng: hàng liên kết + nút Đặt món;
 * điện thoại: nút Menu mở tấm phủ toàn màn hình.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <Logo />
        <DesktopNav />
        <MobileNav />
      </div>
    </header>
  );
}
