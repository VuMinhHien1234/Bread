"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { orderStatuses, orderStatusLabel, type OrderStatus } from "@/lib/admin-labels";
import { cn } from "@/lib/cn";
import { updateOrderRequestStatus } from "@/server/actions/admin/requests";
import { useAdminAction } from "./use-admin-action";

type Props = { id: string; status: OrderStatus; adminNote: string | null };

/** Đổi trạng thái yêu cầu bằng các nút lớn (dễ bấm trên điện thoại) kèm ghi chú nội bộ. */
export function OrderStatusForm({ id, status, adminNote }: Props) {
  const { run, isPending } = useAdminAction();
  const [selected, setSelected] = useState(status);
  const [note, setNote] = useState(adminNote ?? "");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void run(
          () => updateOrderRequestStatus({ id, status: selected, adminNote: note }),
          "Đã lưu",
        );
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-semibold">Trạng thái</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {orderStatuses.map((entry) => (
            <label
              key={entry}
              className={cn(
                "flex min-h-12 cursor-pointer items-center justify-center rounded-button border-2 px-3 font-semibold",
                selected === entry ? "border-primary bg-primary/10" : "border-border bg-surface",
              )}
            >
              <input
                type="radio"
                name="status"
                value={entry}
                checked={selected === entry}
                onChange={() => setSelected(entry)}
                className="sr-only"
              />
              {orderStatusLabel[entry]}
            </label>
          ))}
        </div>
      </fieldset>
      <Textarea
        id="adminNote"
        label="Ghi chú nội bộ"
        hint="Chỉ tiệm thấy, khách không thấy."
        rows={2}
        maxLength={500}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <Button type="submit" isLoading={isPending}>
        Lưu
      </Button>
    </form>
  );
}
