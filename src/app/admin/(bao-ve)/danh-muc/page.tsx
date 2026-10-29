import type { Metadata } from "next";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { listCategories } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Danh mục", robots: { index: false } };

export default async function CategoriesPage() {
  const categories = await listCategories();
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl">Danh mục</h1>
      <CategoryManager
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          isActive: category.isActive,
          itemCount: category.itemCount,
        }))}
      />
    </div>
  );
}
