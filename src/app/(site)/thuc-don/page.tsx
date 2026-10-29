import type { Metadata } from "next";
import { AccentTitle } from "@/components/site/AccentTitle";
import { MenuCard } from "@/components/site/MenuCard";
import { PageHeader } from "@/components/site/PageHeader";
import { shopConfig } from "@/lib/shop-config";
import { getMenu } from "@/server/queries/public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thực đơn",
  description: `Thực đơn ${shopConfig.name}: bánh mì, đồ uống và món ăn kèm. Giá tham khảo, đặt món rồi tiệm gọi lại xác nhận.`,
  alternates: { canonical: "/thuc-don" },
};

export default async function MenuPage() {
  const menu = await getMenu();

  return (
    <div className="flex flex-col gap-16">
      <PageHeader
        eyebrow="Thực đơn"
        title={<AccentTitle text="Làm mới mỗi ngày tại tiệm" accentWords={2} />}
        description={
          <>
            Giá để bạn tham khảo, giá chốt khi tiệm gọi lại xác nhận. Món &quot;Tạm hết hôm
            nay&quot; vẫn hiện để bạn biết, nhưng chưa đặt được.
          </>
        }
      />

      {menu.length === 0 ? (
        <p className="border border-border bg-surface p-8 text-lg">
          Thực đơn đang được cập nhật. Bạn gọi trực tiếp cho tiệm nhé.
        </p>
      ) : (
        <>
          <nav
            aria-label="Danh mục"
            className="sticky top-20 z-20 -mx-5 -mt-8 flex gap-8 overflow-x-auto border-b border-border bg-bg/90 px-5 backdrop-blur-md sm:-mx-8 sm:px-8"
          >
            {menu.map((category) => (
              <a
                key={category.id}
                href={`#${category.slug}`}
                className="inline-flex min-h-14 shrink-0 items-center border-b border-transparent text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-text-muted transition-colors hover:border-brass hover:text-text"
              >
                {category.name}
              </a>
            ))}
          </nav>

          {menu.map((category, categoryIndex) => (
            <section
              key={category.id}
              id={category.slug}
              aria-labelledby={`${category.slug}-tieu-de`}
              className="flex scroll-mt-40 flex-col gap-10"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-3">
                  <span className="font-heading text-lg italic text-brass-text">
                    {String(categoryIndex + 1).padStart(2, "0")}
                  </span>
                  <h2 id={`${category.slug}-tieu-de`} className="text-4xl sm:text-5xl">
                    {category.name}
                  </h2>
                </div>
                {category.description ? (
                  <p className="max-w-md text-text-muted sm:text-right">{category.description}</p>
                ) : null}
              </div>
              <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {category.items.map((item, index) => (
                  <MenuCard key={item.id} item={item} priority={categoryIndex === 0 && index < 2} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
