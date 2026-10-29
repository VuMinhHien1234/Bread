import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageManager } from "@/components/admin/ImageManager";
import { MenuItemForm } from "@/components/admin/MenuItemForm";
import { getMenuItemForEdit, listCategories } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Sửa món", robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

export default async function EditMenuItemPage({ params }: Props) {
  const { id } = await params;
  const [item, categories] = await Promise.all([getMenuItemForEdit(id), listCategories()]);
  if (!item) notFound();

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link href="/admin/mon" className="text-text-muted underline">
          ← Danh sách món
        </Link>
        <h1 className="text-2xl">{item.name}</h1>
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
      </div>
      <ImageManager
        menuItemId={item.id}
        images={item.images.map((image) => ({
          id: image.id,
          url: image.url,
          alt: image.alt,
          isPrimary: image.isPrimary,
        }))}
      />
    </div>
  );
}
