"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  createCategory,
  deleteCategory,
  reorderCategories,
  updateCategory,
} from "@/server/actions/admin/categories";
import { useAdminAction } from "./use-admin-action";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  itemCount: number;
};

type Editing = { mode: "create" } | { mode: "edit"; category: CategoryRow } | null;

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const { run, isPending } = useAdminAction();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);

  function move(index: number, direction: -1 | 1) {
    const ids = categories.map((category) => category.id);
    const target = index + direction;
    const [moved] = ids.splice(index, 1);
    if (moved === undefined || target < 0 || target > ids.length) return;
    ids.splice(target, 0, moved);
    void run(() => reorderCategories({ ids }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button onClick={() => setEditing({ mode: "create" })}>Thêm danh mục</Button>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-card border border-border bg-surface p-6 text-text-muted">
          Chưa có danh mục nào. Thêm danh mục đầu tiên (ví dụ &quot;Bánh mì&quot;, &quot;Đồ
          uống&quot;).
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {categories.map((category, index) => (
            <li
              key={category.id}
              className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card"
            >
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-lg">{category.name}</strong>
                <Badge tone="neutral">{category.itemCount} món</Badge>
                {category.isActive ? null : <Badge tone="danger">Đang ẩn</Badge>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  disabled={index === 0 || isPending}
                  aria-label={`Đưa ${category.name} lên`}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  disabled={index === categories.length - 1 || isPending}
                  aria-label={`Đưa ${category.name} xuống`}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </Button>
                <Button variant="secondary" onClick={() => setEditing({ mode: "edit", category })}>
                  Sửa
                </Button>
                <Button variant="ghost" onClick={() => setDeleting(category)}>
                  Xóa
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === "edit" ? "Sửa danh mục" : "Thêm danh mục"}
      >
        {editing ? (
          <CategoryForm
            key={editing.mode === "edit" ? editing.category.id : "moi"}
            category={editing.mode === "edit" ? editing.category : undefined}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Dialog>

      <Dialog open={deleting !== null} onClose={() => setDeleting(null)} title="Xóa danh mục?">
        <p className="mb-4">
          Xóa danh mục <strong>{deleting?.name}</strong>? Danh mục còn món thì chưa xóa được.
        </p>
        <Button
          variant="danger"
          isLoading={isPending}
          onClick={async () => {
            if (!deleting) return;
            const result = await run(() => deleteCategory({ id: deleting.id }), "Đã xóa danh mục");
            if (result.ok) setDeleting(null);
          }}
        >
          Xóa danh mục
        </Button>
      </Dialog>
    </div>
  );
}

function CategoryForm({
  category,
  onDone,
}: {
  category?: CategoryRow | undefined;
  onDone: () => void;
}) {
  const { run, isPending } = useAdminAction();
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      name: String(form.get("name") ?? ""),
      slug: String(form.get("slug") ?? ""),
      description: String(form.get("description") ?? ""),
      isActive: form.get("isActive") === "on",
    };
    setErrors({});
    const result = await run<unknown>(
      () => (category ? updateCategory(category.id, input) : createCategory(input)),
      "Đã lưu danh mục",
    );
    if (result.ok) onDone();
    else setErrors(result.fieldErrors ?? {});
  }

  const errorOf = (name: string) => (errors[name] ? { error: errors[name] } : {});
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <Input
        id="cat-name"
        name="name"
        label="Tên danh mục"
        defaultValue={category?.name}
        required
        maxLength={80}
        {...errorOf("name")}
      />
      <Input
        id="cat-slug"
        name="slug"
        label="Đường dẫn"
        hint="Để trống thì tự tạo từ tên."
        defaultValue={category?.slug}
        {...errorOf("slug")}
      />
      <Textarea
        id="cat-description"
        name="description"
        label="Mô tả (không bắt buộc)"
        rows={2}
        defaultValue={category?.description ?? ""}
        maxLength={300}
        {...errorOf("description")}
      />
      <Checkbox
        id="cat-active"
        name="isActive"
        label="Hiện trên web"
        defaultChecked={category?.isActive ?? true}
      />
      <Button type="submit" isLoading={isPending}>
        Lưu
      </Button>
    </form>
  );
}
