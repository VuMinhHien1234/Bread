"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { buttonClassName } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";
import { siteNavLinks } from "./nav-links";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Hàng liên kết trên màn hình rộng; mục đang xem có gạch chân đồng thau. */
export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu chính" className="hidden items-center gap-9 md:flex">
      {siteNavLinks.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "link-line py-1 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] transition-colors",
              active ? "text-text" : "text-text-muted hover:text-text",
            )}
          >
            {link.label}
          </Link>
        );
      })}
      <Link href="/dat-mon" className={buttonClassName("primary")}>
        Đặt món
      </Link>
    </nav>
  );
}

/** Menu điện thoại: nút mở một tấm phủ toàn màn hình; tự đóng khi chuyển trang hoặc bấm Esc. */
export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const panelId = useId();

  // Chuyển sang trang khác thì đóng menu (so sánh trong lúc render, không cần effect)
  if (open && openedAt !== pathname) {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const toggle = (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={panelId}
      onClick={() => {
        setOpenedAt(pathname);
        setOpen((value) => !value);
      }}
      className="flex min-h-11 items-center gap-3 text-[0.75rem] font-semibold uppercase tracking-[0.2em]"
    >
      {open ? "Đóng" : "Menu"}
      <span aria-hidden="true" className="relative block h-3 w-6">
        <span
          className={cn(
            "absolute left-0 h-px w-6 bg-current transition-transform duration-300",
            open ? "top-1.5 rotate-45" : "top-0",
          )}
        />
        <span
          className={cn(
            "absolute left-0 h-px w-6 bg-current transition-transform duration-300",
            open ? "top-1.5 -rotate-45" : "top-3",
          )}
        />
      </span>
    </button>
  );

  // Tấm phủ gắn thẳng vào <body>: header có backdrop-blur nên phần tử fixed bên trong sẽ bị giới hạn trong header
  const panel = (
    <div
      id={panelId}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg px-5 pb-10"
    >
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-border/70">
        <Logo />
        {toggle}
      </div>
      <nav aria-label="Menu chính" className="mt-6 flex flex-col">
        {siteNavLinks.map((link, index) => {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={cn(
                "rise flex items-baseline justify-between border-b border-border py-5 font-heading text-4xl",
                active ? "text-primary" : "text-text",
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {link.label}
              <span aria-hidden="true" className="text-base text-brass-text">
                0{index + 1}
              </span>
            </Link>
          );
        })}
      </nav>
      <Link
        href="/dat-mon"
        onClick={() => setOpen(false)}
        className={cn(buttonClassName("primary", "lg"), "mt-10 w-full")}
      >
        Đặt món
      </Link>
    </div>
  );

  return (
    <div className="md:hidden">
      {toggle}
      {open ? createPortal(panel, document.body) : null}
    </div>
  );
}
