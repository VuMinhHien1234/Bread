"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/cn";
import { toggleSoldOut } from "@/server/actions/admin/menu-items";
import { useAdminAction } from "./use-admin-action";

/** Trạng thái "Tạm hết hôm nay" của một món: đổi ngay trên màn hình, lỗi thì trả lại. */
export function useSoldOut(item: { id: string; name: string; isSoldOutToday: boolean }) {
  const { run, isPending } = useAdminAction();
  const [soldOut, setSoldOut] = useState(item.isSoldOutToday);

  async function toggle(next: boolean) {
    setSoldOut(next);
    const result = await run(
      () => toggleSoldOut({ id: item.id, value: next }),
      next ? `Đã báo hết: ${item.name}` : `Đã bán lại: ${item.name}`,
    );
    if (!result.ok) setSoldOut(!next);
  }

  return { soldOut, toggle, isPending };
}

/** Nhãn trạng thái: nền xanh "Đang bán", nền đỏ "Tạm hết". */
export function SoldOutPill({ soldOut, className }: { soldOut: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        soldOut ? "bg-danger text-danger-foreground" : "bg-accent-green text-primary-foreground",
        className,
      )}
    >
      {soldOut ? "Tạm hết" : "Đang bán"}
    </span>
  );
}

/** Công tắc + nhãn, dùng ở trang chi tiết món. */
export function SoldOutToggle(item: { id: string; name: string; isSoldOutToday: boolean }) {
  const { soldOut, toggle, isPending } = useSoldOut(item);
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-card border p-4",
        soldOut ? "border-danger/40 bg-danger/15" : "border-accent-green/40 bg-accent-green/20",
      )}
    >
      <div className="flex flex-col gap-1">
        <SoldOutPill soldOut={soldOut} className="self-start" />
        <p className="text-sm text-text-muted">
          {soldOut
            ? "Khách vẫn thấy món nhưng không đặt được. Gạt công tắc để bán lại."
            : "Gạt công tắc khi món hết trong ngày."}
        </p>
      </div>
      <Switch
        tone="status"
        checked={soldOut}
        onChange={(next) => void toggle(next)}
        disabled={isPending}
        label={`Tạm hết hôm nay: ${item.name}`}
      />
    </div>
  );
}
