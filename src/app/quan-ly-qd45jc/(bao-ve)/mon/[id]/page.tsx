import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageManager } from "@/components/admin/ImageManager";
import { MenuItemForm } from "@/components/admin/MenuItemForm";
import { MenuItemPreview } from "@/components/admin/MenuItemPreview";
import { SoldOutToggle } from "@/components/admin/SoldOutToggle";
import { adminPath } from "@/lib/admin-path";
import { getMenuItemForEdit, listCategories } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Sửa món", robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

export default async function EditMenuItemPage({ params }: Props) {
  const { id } = await params;
  const [item, categories] = await Promise.all([getMenuItemForEdit(id), listCategories()]);
  if (!item) notFound();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Link href={adminPath("mon")} className="text-text-muted underline">
            ← Danh sách món
          </Link>
          <h1 className="text-3xl">{item.name}</h1>
          <SoldOutToggle id={item.id} name={item.name} isSoldOutToday={item.isSoldOutToday} />
        </div>

        {/* Ảnh ở trên cùng; xem và sửa ảnh ngay trong khung này */}
        <ImageManager
          menuItemId={item.id}
          images={item.images.map((image) => ({
            id: image.id,
            url: image.url,
            alt: image.alt,
            isPrimary: image.isPrimary,
          }))}
        />

        <section aria-labelledby="thong-tin-mon" className="flex flex-col gap-4">
          <h2 id="thong-tin-mon" className="text-xl">
            Thông tin món
          </h2>
          <MenuItemForm
            itemId={item.id}
            categories={categories.map(({ id: categoryId, name }) => ({ id: categoryId, name }))}
            initial={{
              categoryId: item.categoryId,
              name: item.name,
              slug: item.slug,
              shortDescription: item.shortDescription ?? "",
              description: item.description ?? "",
              ingredients: item.ingredients ?? "",
              isSpicy: item.isSpicy,
              isVegetarian: item.isVegetarian,
              isBestSeller: item.isBestSeller,
              isNew: item.isNew,
              isFeatured: item.isFeatured,
              isActive: item.isActive,
              options: item.options.map((option) => ({
                id: option.id,
                name: option.name,
                price: option.price,
                isDefault: option.isDefault,
              })),
            }}
          />
        </section>
      </div>

      {/* Màn hình rộng: cột phải dính khi cuộn; điện thoại: nằm cuối trang, ngay dưới nút Lưu */}
      <aside className="lg:sticky lg:top-4">
        <MenuItemPreview item={item} />
      </aside>
    </div>
  );
}
