import type { Metadata } from "next";
import Link from "next/link";
import { OrderRows } from "@/components/admin/OrderRows";
import { Pagination } from "@/components/admin/Pagination";
import { cn } from "@/lib/cn";
import { isOrderStatus, orderStatuses, orderStatusLabel } from "@/lib/admin-labels";
import { listOrderRequests } from "@/server/queries/admin";
import { ADMIN_BASE, adminPath } from "@/lib/admin-path";

export const metadata: Metadata = { title: "Yêu cầu đặt món", robots: { index: false } };

type Props = { searchParams: Promise<{ "trang-thai"?: string; trang?: string }> };

export default async function OrderRequestsPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = isOrderStatus(params["trang-thai"]) ? params["trang-thai"] : undefined;
  const result = await listOrderRequests({
    ...(status ? { status } : {}),
    page: Number(params.trang ?? 1),
  });

  const hrefFor = (page: number) => {
    const query = new URLSearchParams();
    if (status) query.set("trang-thai", status);
    if (page > 1) query.set("trang", String(page));
    const text = query.toString();
    return text ? `${ADMIN_BASE}/yeu-cau?${text}` : adminPath("yeu-cau");
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl">Yêu cầu đặt món</h1>
      <nav aria-label="Lọc theo trạng thái" className="-mx-4 flex gap-2 overflow-x-auto px-4">
        {[undefined, ...orderStatuses].map((entry) => (
          <Link
            key={entry ?? "all"}
            href={entry ? `${ADMIN_BASE}/yeu-cau?trang-thai=${entry}` : adminPath("yeu-cau")}
            aria-current={entry === status ? "true" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-full border-2 px-4 font-semibold",
              entry === status ? "border-primary bg-primary/10" : "border-border bg-surface",
            )}
          >
            {entry ? orderStatusLabel[entry] : "Tất cả"}
          </Link>
        ))}
      </nav>
      <OrderRows rows={result.rows} />
      <Pagination page={result.page} pageCount={result.pageCount} hrefFor={hrefFor} />
    </div>
  );
}
