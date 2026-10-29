import type { Metadata } from "next";
import { AccentTitle } from "@/components/site/AccentTitle";
import { OrderForm } from "@/components/site/OrderForm";
import { PageHeader } from "@/components/site/PageHeader";
import { formatPhoneDisplay } from "@/lib/phone";
import { shopConfig } from "@/lib/shop-config";
import { getMenu } from "@/server/queries/public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Đặt món",
  description:
    "Chọn món và gửi yêu cầu đặt món. Tiệm sẽ gọi lại xác nhận, không cần thanh toán trước.",
  alternates: { canonical: "/dat-mon" },
};

type Props = { searchParams: Promise<{ mon?: string | string[] }> };

const steps = ["Chọn món và số lượng", "Để lại tên và số điện thoại", "Tiệm gọi lại xác nhận"];

export default async function OrderPage({ searchParams }: Props) {
  const [menu, { mon }] = await Promise.all([getMenu(), searchParams]);

  return (
    <div className="flex flex-col gap-14">
      <PageHeader
        eyebrow="Đặt món"
        title={<AccentTitle text="Gửi yêu cầu, tiệm gọi lại" accentWords={3} />}
        description="Giá chỉ để tham khảo, bạn không cần thanh toán trước."
      >
        <ol className="rise rise-delay-3 mt-2 grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step} className="flex items-baseline gap-3 border-t border-border pt-4">
              <span className="font-heading text-lg italic text-brass-text">0{index + 1}</span>
              <span className="text-text-muted">{step}</span>
            </li>
          ))}
        </ol>
      </PageHeader>

      <div className="grid gap-12 lg:grid-cols-[1fr_18rem] lg:gap-16">
        <div className="min-w-0">
          {menu.length === 0 ? (
            <p className="border border-border bg-surface p-8 text-lg">
              Thực đơn đang được cập nhật, bạn gọi trực tiếp cho tiệm nhé.
            </p>
          ) : (
            <OrderForm menu={menu} preselectSlug={Array.isArray(mon) ? mon[0] : mon} />
          )}
        </div>
        <aside className="hidden flex-col gap-4 self-start border border-border bg-surface p-7 lg:sticky lg:top-28 lg:flex">
          <p className="eyebrow">Cần gấp?</p>
          <p className="leading-relaxed text-text-muted">
            Gọi thẳng cho tiệm để đặt nhanh hoặc hỏi món.
          </p>
          <a
            href={`tel:${shopConfig.phone}`}
            className="link-line self-start font-heading text-3xl tabular-nums text-primary"
          >
            {formatPhoneDisplay(shopConfig.phone)}
          </a>
        </aside>
      </div>
    </div>
  );
}
