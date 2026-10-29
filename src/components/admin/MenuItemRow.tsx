"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { formatVND } from "@/lib/money";
import { toggleSoldOut } from "@/server/actions/admin/menu-items";
import { useAdminAction } from "./use-admin-action";

export type MenuItemRowData = {
  id: string;
  name: string;
  categoryName: string;
  isActive: boolean;
  isSoldOutToday: boolean;
  minPrice: number | null;
};

/** Một dòng món: thấy ngay giá, trạng thái, và gạt công tắc "Tạm hết hôm nay" một chạm. */
export function MenuItemRow({ item }: { item: MenuItemRowData }) {
  const { run, isPending } = useAdminAction();
  const [soldOut, setSoldOut] = useState(item.isSoldOutToday);

  async function handleToggle(next: boolean) {
    setSoldOut(next); // đổi ngay trên màn hình, lỗi thì trả lại
    const result = await run(
      () => toggleSoldOut({ id: item.id, value: next }),
      next ? `Đã báo hết: ${item.name}` : `Đã bán lại: ${item.name}`,
    );
    if (!result.ok) setSoldOut(!next);
  }

  return (
    <li className="flex items-center gap-3 rounded-card border border-border bg-surface p-3 shadow-card">
      <Link href={`/admin/mon/${item.id}`} className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2">
          <strong className="truncate">{item.name}</strong>
          {item.isActive ? null : <Badge tone="danger">Đang ẩn</Badge>}
        </span>
        <span className="text-sm text-text-muted">
          {item.categoryName} · {item.minPrice === null ? "Chưa có giá" : formatVND(item.minPrice)}
        </span>
      </Link>
      <div className="flex shrink-0 flex-col items-center gap-0.5">
        <Switch
          checked={soldOut}
          onChange={handleToggle}
          disabled={isPending}
          label={`Tạm hết hôm nay: ${item.name}`}
        />
        <span className="text-xs text-text-muted">{soldOut ? "Tạm hết" : "Đang bán"}</span>
      </div>
    </li>
  );
}
