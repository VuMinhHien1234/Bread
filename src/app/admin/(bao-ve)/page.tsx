import type { Metadata } from "next";
import Link from "next/link";
import { OrderRows } from "@/components/admin/OrderRows";
import { buttonClassName } from "@/components/ui/Button";
import { listContactMessages, listOrderRequests } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Quản trị", robots: { index: false } };
const LATEST_COUNT = 5;

export default async function AdminHomePage() {
  const [newOrders, latest, newMessages] = await Promise.all([
    listOrderRequests({ status: "NEW" }),
    listOrderRequests(),
    listContactMessages({ status: "NEW" }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Xin chào chủ tiệm</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/yeu-cau?trang-thai=NEW"
          className="rounded-card border border-border bg-surface p-5 shadow-card"
        >
          <p className="text-4xl font-bold text-primary">{newOrders.total}</p>
          <p className="text-text-muted">yêu cầu đặt món mới</p>
        </Link>
        <Link
          href="/admin/lien-he?trang-thai=NEW"
          className="rounded-card border border-border bg-surface p-5 shadow-card"
        >
          <p className="text-4xl font-bold text-primary">{newMessages.total}</p>
          <p className="text-text-muted">tin liên hệ mới</p>
        </Link>
      </div>

      <section aria-labelledby="moi-nhat" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="moi-nhat" className="text-xl">
            Yêu cầu mới nhất
          </h2>
          <Link href="/admin/yeu-cau" className="font-medium text-primary underline">
            Xem tất cả
          </Link>
        </div>
        <OrderRows rows={latest.rows.slice(0, LATEST_COUNT)} />
      </section>

      <Link href="/admin/mon" className={buttonClassName("secondary", "lg")}>
        Quản lý món và bật &quot;Tạm hết hôm nay&quot;
      </Link>
    </div>
  );
}
