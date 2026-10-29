import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { RetryTelegramButton } from "@/components/admin/RetryTelegramButton";
import { Badge } from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";
import { fulfillmentLabel, orderStatusLabel, orderStatusTone } from "@/lib/admin-labels";
import { formatVietnamDateTime } from "@/lib/datetime";
import { formatVND } from "@/lib/money";
import { formatPhoneDisplay } from "@/lib/phone";
import { getOrderRequest } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Chi tiết yêu cầu", robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

export default async function OrderRequestPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderRequest(id);
  if (!order) notFound();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Link href="/admin/yeu-cau" className="text-text-muted underline">
        ← Danh sách yêu cầu
      </Link>

      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl">{order.code}</h1>
        <Badge tone={orderStatusTone[order.status]}>{orderStatusLabel[order.status]}</Badge>
      </header>

      <section className="flex flex-col gap-2 rounded-card border border-border bg-surface p-5">
        <p className="text-lg font-semibold">{order.customerName}</p>
        <a href={`tel:${order.phone}`} className={buttonClassName("primary", "lg")}>
          Gọi {formatPhoneDisplay(order.phone)}
        </a>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-text-muted">Cách nhận</dt>
          <dd>{fulfillmentLabel[order.fulfillment]}</dd>
          {order.deliveryAddress ? (
            <>
              <dt className="text-text-muted">Địa chỉ</dt>
              <dd>{order.deliveryAddress}</dd>
            </>
          ) : null}
          <dt className="text-text-muted">Giờ nhận</dt>
          <dd>
            {order.requestedAt ? formatVietnamDateTime(order.requestedAt) : "Sớm nhất có thể"}
          </dd>
          <dt className="text-text-muted">Gửi lúc</dt>
          <dd>{formatVietnamDateTime(order.createdAt)}</dd>
          {order.note ? (
            <>
              <dt className="text-text-muted">Ghi chú</dt>
              <dd>{order.note}</dd>
            </>
          ) : null}
        </dl>
      </section>

      <section aria-labelledby="cac-mon" className="flex flex-col gap-2">
        <h2 id="cac-mon" className="text-xl">
          Các món
        </h2>
        <ul className="divide-y divide-border rounded-card border border-border bg-surface">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span>
                {item.quantity} × {item.itemName} ({item.optionName})
              </span>
              <span className="font-medium">{formatVND(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <p className="text-right text-lg">
          Tạm tính: <strong>{formatVND(order.estimatedTotal)}</strong>{" "}
          <span className="text-sm text-text-muted">(giá tham khảo)</span>
        </p>
      </section>

      <section aria-labelledby="telegram" className="flex flex-col gap-2">
        <h2 id="telegram" className="text-xl">
          Telegram
        </h2>
        {order.telegramSentAt ? (
          <p className="text-accent-green">
            Đã báo vào nhóm lúc {formatVietnamDateTime(order.telegramSentAt)}.
          </p>
        ) : (
          <>
            <p className="font-medium text-danger">
              Chưa báo được vào nhóm Telegram
              {order.telegramError ? ` (${order.telegramError})` : ""}.
            </p>
            <div>
              <RetryTelegramButton kind="order" id={order.id} />
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="xu-ly" className="flex flex-col gap-2">
        <h2 id="xu-ly" className="text-xl">
          Xử lý
        </h2>
        <OrderStatusForm id={order.id} status={order.status} adminNote={order.adminNote} />
      </section>
    </div>
  );
}
