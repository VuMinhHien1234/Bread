import type { Metadata } from "next";
import Link from "next/link";
import { MenuItemRow } from "@/components/admin/MenuItemRow";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listCategories, listMenuItems } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Món", robots: { index: false } };

type Props = { searchParams: Promise<{ "danh-muc"?: string; q?: string }> };

export default async function MenuItemsPage({ searchParams }: Props) {
  const params = await searchParams;
  const categoryId = params["danh-muc"] || undefined;
  const q = params.q?.trim() || undefined;

  const [categories, items] = await Promise.all([
    listCategories(),
    listMenuItems({ ...(categoryId ? { categoryId } : {}), ...(q ? { q } : {}) }),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">Món</h1>
        <Link href="/admin/mon/moi" className={buttonClassName("primary")}>
          Thêm món
        </Link>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <Select id="danh-muc" name="danh-muc" label="Danh mục" defaultValue={categoryId ?? ""}>
          <option value="">Tất cả</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Input id="q" name="q" type="search" label="Tìm theo tên" defaultValue={q ?? ""} />
        <Button type="submit" variant="secondary">
          Lọc
        </Button>
      </form>

      {items.length === 0 ? (
        <p className="rounded-card border border-border bg-surface p-6 text-text-muted">
          {categoryId || q
            ? "Không có món nào khớp."
            : "Chưa có món nào. Thêm danh mục trước, rồi thêm món."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <MenuItemRow
              key={item.id}
              item={{
                id: item.id,
                name: item.name,
                categoryName: item.categoryName,
                isActive: item.isActive,
                isSoldOutToday: item.isSoldOutToday,
                minPrice: item.minPrice,
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
