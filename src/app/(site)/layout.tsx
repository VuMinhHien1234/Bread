import type { ReactNode } from "react";
import { FloatingContact } from "@/components/site/FloatingContact";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#noi-dung"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Bỏ qua menu
      </a>
      <SiteHeader />
      <main id="noi-dung" className="mx-auto w-full max-w-6xl px-5 pb-8 pt-10 sm:px-8 sm:pt-16">
        {children}
      </main>
      <SiteFooter />
      <FloatingContact />
    </>
  );
}
