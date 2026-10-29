"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { adminPath } from "@/lib/admin-path";
import { cn } from "@/lib/cn";
import { formatVND } from "@/lib/money";
import { SoldOutPill, useSoldOut } from "./SoldOutToggle";

export type MenuItemRowData = {
  id: string;
  name: string;
  categoryName: string;
  isActive: boolean;
  isSoldOutToday: boolean;
  minPrice: number | null;
};

/**
 * Một dòng món: nền xanh khi đang bán, nền đỏ khi tạm hết.
 * Thấy ngay giá, trạng thái, và gạt công tắc "Tạm hết hôm nay" một chạm.
 */
export function MenuItemRow({ item }: { item: MenuItemRowData }) {
  const { soldOut, toggle, isPending } = useSoldOut(item);

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-card border border-l-4 p-3 transition-colors",
        soldOut
          ? "border-danger/40 border-l-danger bg-danger/15"
          : "border-accent-green/40 border-l-accent-green bg-accent-green/20",
      )}
    >
      <Link
        href={adminPath(`mon/${item.id}`)}
        className="flex min-w-0 flex-1 flex-col gap-1 rounded-button hover:opacity-80"
      >
        <span className="flex flex-wrap items-center gap-2">
          <strong className="truncate">{item.name}</strong>
          <SoldOutPill soldOut={soldOut} />
          {item.isActive ? null : <Badge tone="neutral">Đang ẩn</Badge>}
        </span>
        <span className="text-sm text-text-muted">
          {item.categoryName} · {item.minPrice === null ? "Chưa có giá" : formatVND(item.minPrice)}
        </span>
      </Link>
      <Switch
        tone="status"
        checked={soldOut}
        onChange={(next) => void toggle(next)}
        disabled={isPending}
        label={`Tạm hết hôm nay: ${item.name}`}
      />
    </li>
  );
}
