"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { ADMIN_BASE, adminPath } from "@/lib/admin-path";

const links = [
  { href: ADMIN_BASE, label: "Tổng quan", exact: true },
  { href: adminPath("yeu-cau"), label: "Yêu cầu", showNewCount: true },
  { href: adminPath("mon"), label: "Món" },
  { href: adminPath("danh-muc"), label: "Danh mục" },
  { href: adminPath("lien-he"), label: "Liên hệ" },
] as const;

type Props = { newRequestCount: number };

/** Hàng thẻ cuộn ngang, mỗi thẻ cao 44px để dễ bấm trên điện thoại. */
export function AdminNav({ newRequestCount }: Props) {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu quản trị" className="-mx-4 flex gap-2 overflow-x-auto px-4 py-3">
      {links.map((link) => {
        const active = "exact" in link ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-button px-4 font-semibold",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-text hover:bg-border/50",
            )}
          >
            {link.label}
            {"showNewCount" in link && newRequestCount > 0 ? (
              <Badge tone={active ? "yellow" : "primary"}>{newRequestCount}</Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
