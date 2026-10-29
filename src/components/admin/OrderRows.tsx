import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatVietnamDateTime } from "@/lib/datetime";
import { formatVND } from "@/lib/money";
import { formatPhoneDisplay } from "@/lib/phone";
import {
  fulfillmentLabel,
  orderStatusLabel,
  orderStatusTone,
  type OrderStatus,
} from "@/lib/admin-labels";
import { ADMIN_BASE } from "@/lib/admin-path";

export type OrderRowData = {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  fulfillment: "PICKUP" | "DELIVERY";
  status: OrderStatus;
  estimatedTotal: number;
  requestedAt: Date | null;
  createdAt: Date;
  telegramFailed: boolean;
  itemCount: number;
};

/** Danh sách yêu cầu: mỗi dòng là một thẻ bấm được; nút gọi nhanh nằm cạnh để không phải mở chi tiết. */
export function OrderRows({ rows }: { rows: OrderRowData[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-card border border-border bg-surface p-6 text-text-muted">
        Chưa có yêu cầu nào.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex items-stretch gap-2 rounded-card border border-border bg-surface shadow-card"
        >
          <Link
            href={`${ADMIN_BASE}/yeu-cau/${row.id}`}
            className="flex min-w-0 flex-1 flex-col gap-1 p-4"
          >
            <span className="flex flex-wrap items-center gap-2">
              <strong>{row.code}</strong>
              <Badge tone={orderStatusTone[row.status]}>{orderStatusLabel[row.status]}</Badge>
              {row.telegramFailed ? <Badge tone="danger">Telegram lỗi</Badge> : null}
            </span>
            <span className="truncate font-medium">{row.customerName}</span>
            <span className="text-sm text-text-muted">
              {row.itemCount} món · {formatVND(row.estimatedTotal)} ·{" "}
              {fulfillmentLabel[row.fulfillment]} ·{" "}
              {row.requestedAt ? formatVietnamDateTime(row.requestedAt) : "Sớm nhất có thể"}
            </span>
            <span className="text-xs text-text-muted">
              Gửi lúc {formatVietnamDateTime(row.createdAt)}
            </span>
          </Link>
          <a
            href={`tel:${row.phone}`}
            aria-label={`Gọi ${row.customerName} ${formatPhoneDisplay(row.phone)}`}
            className="flex min-w-16 items-center justify-center rounded-r-card bg-primary px-3 font-semibold text-primary-foreground"
          >
            Gọi
          </a>
        </li>
      ))}
    </ul>
  );
}
