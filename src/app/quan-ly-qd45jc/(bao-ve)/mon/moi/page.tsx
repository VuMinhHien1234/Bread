import type { Metadata } from "next";
import Link from "next/link";
import { MenuItemForm } from "@/components/admin/MenuItemForm";
import { buttonClassName } from "@/components/ui/Button";
import { listCategories } from "@/server/queries/admin";
import { adminPath } from "@/lib/admin-path";

export const metadata: Metadata = { title: "Thêm món", robots: { index: false } };

export default async function NewMenuItemPage() {
  const categories = await listCategories();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Link href={adminPath("mon")} className="text-text-muted underline">
        ← Danh sách món
      </Link>
      <h1 className="text-2xl">Thêm món</h1>
      {categories.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-card border border-border bg-surface p-6">
          <p>Bạn cần có ít nhất một danh mục trước khi thêm món.</p>
          <Link href={adminPath("danh-muc")} className={buttonClassName("primary")}>
            Thêm danh mục
          </Link>
        </div>
      ) : (
        <MenuItemForm
          categories={categories.map(({ id, name }) => ({ id, name }))}
          initial={{
            categoryId: "",
            name: "",
            slug: "",
            shortDescription: "",
            description: "",
            ingredients: "",
            isSpicy: false,
            isVegetarian: false,
            isBestSeller: false,
            isNew: false,
            isFeatured: false,
            isActive: true,
            options: [{ name: "", price: 0, isDefault: true }],
          }}
        />
      )}
    </div>
  );
}
