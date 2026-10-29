"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { createMenuItem, deleteMenuItem, updateMenuItem } from "@/server/actions/admin/menu-items";
import { useAdminAction } from "./use-admin-action";

export type MenuItemFormValues = {
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  ingredients: string;
  isSpicy: boolean;
  isVegetarian: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  isFeatured: boolean;
  isActive: boolean;
  options: Array<{ id?: string; name: string; price: number; isDefault: boolean }>;
};

type OptionState = { key: string; id?: string; name: string; price: string; isDefault: boolean };

type Props = {
  categories: Array<{ id: string; name: string }>;
  /** Có `itemId` = đang sửa món cũ; không có = thêm món mới */
  itemId?: string;
  initial: MenuItemFormValues;
};

const flags = [
  { name: "isSpicy", label: "Món cay" },
  { name: "isVegetarian", label: "Món chay" },
  { name: "isBestSeller", label: "Bán chạy" },
  { name: "isNew", label: "Món mới" },
  { name: "isFeatured", label: "Nổi bật (hiện ở trang chủ)" },
  { name: "isActive", label: "Hiện trên web" },
] as const;

export function MenuItemForm({ categories, itemId, initial }: Props) {
  const router = useRouter();
  const { run, isPending } = useAdminAction();
  const nextKey = useRef(initial.options.length);
  const [options, setOptions] = useState<OptionState[]>(() =>
    initial.options.map((option, index) => ({
      key: `o${index}`,
      ...(option.id ? { id: option.id } : {}),
      name: option.name,
      price: String(option.price),
      isDefault: option.isDefault,
    })),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  function updateOption(key: string, patch: Partial<OptionState>) {
    setOptions((current) =>
      current.map((option) => (option.key === key ? { ...option, ...patch } : option)),
    );
  }

  function addOption() {
    const key = `n${nextKey.current++}`;
    setOptions((current) => [...current, { key, name: "", price: "", isDefault: false }]);
  }

  function moveOption(index: number, direction: -1 | 1) {
    setOptions((current) => {
      const next = [...current];
      const target = index + direction;
      const [moved] = next.splice(index, 1);
      if (!moved || target < 0 || target > next.length) return current;
      next.splice(target, 0, moved);
      return next;
    });
  }

  function setDefault(key: string) {
    setOptions((current) =>
      current.map((option) => ({ ...option, isDefault: option.key === key })),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "");
    const input = {
      categoryId: text("categoryId"),
      name: text("name"),
      slug: text("slug"),
      shortDescription: text("shortDescription"),
      description: text("description"),
      ingredients: text("ingredients"),
      ...Object.fromEntries(flags.map((flag) => [flag.name, form.get(flag.name) === "on"])),
      options: options.map((option) => ({
        ...(option.id ? { id: option.id } : {}),
        name: option.name,
        // Bỏ dấu chấm/phẩy ngăn cách hàng nghìn khách hay gõ; để trống thì thành NaN và bị server báo lỗi
        price:
          option.price.trim() === "" ? Number.NaN : Number(option.price.replace(/[.,\s]/g, "")),
        isDefault: option.isDefault,
      })),
    };

    setErrors({});
    const result = await run<unknown>(
      () => (itemId ? updateMenuItem(itemId, input) : createMenuItem(input)),
      itemId ? "Đã lưu món" : "Đã tạo món. Bạn thêm ảnh ở bên dưới nhé.",
    );
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      return;
    }
    if (!itemId && typeof result.data === "object" && result.data !== null && "id" in result.data) {
      router.push(`/admin/mon/${String((result.data as { id: unknown }).id)}`);
    }
  }

  const errorOf = (name: string) => (errors[name] ? { error: errors[name] } : {});
  const optionsError = errors["options"];

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <Select
        id="categoryId"
        name="categoryId"
        label="Danh mục"
        defaultValue={initial.categoryId}
        required
        {...errorOf("categoryId")}
      >
        <option value="" disabled>
          Chọn danh mục
        </option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
      <Input
        id="name"
        name="name"
        label="Tên món"
        defaultValue={initial.name}
        required
        maxLength={120}
        {...errorOf("name")}
      />
      <Input
        id="slug"
        name="slug"
        label="Đường dẫn"
        hint="Để trống thì tự tạo từ tên món."
        defaultValue={initial.slug}
        {...errorOf("slug")}
      />
      <Input
        id="shortDescription"
        name="shortDescription"
        label="Mô tả ngắn"
        hint="Hiện dưới tên món ở danh sách."
        defaultValue={initial.shortDescription}
        maxLength={200}
        {...errorOf("shortDescription")}
      />
      <Textarea
        id="description"
        name="description"
        label="Mô tả"
        defaultValue={initial.description}
        {...errorOf("description")}
      />
      <Textarea
        id="ingredients"
        name="ingredients"
        label="Thành phần"
        rows={3}
        defaultValue={initial.ingredients}
        {...errorOf("ingredients")}
      />

      <fieldset className="flex flex-col">
        <legend className="mb-1 font-semibold">Nhãn và hiển thị</legend>
        {flags.map((flag) => (
          <Checkbox
            key={flag.name}
            id={flag.name}
            name={flag.name}
            label={flag.label}
            defaultChecked={initial[flag.name]}
          />
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-semibold">Lựa chọn và giá (VND)</legend>
        <p className="text-sm text-text-muted">
          Cần ít nhất một lựa chọn. Chọn một lựa chọn làm mặc định.
        </p>
        {optionsError ? (
          <p role="alert" className="font-medium text-danger">
            {optionsError}
          </p>
        ) : null}
        {options.map((option, index) => (
          <div
            key={option.key}
            className="flex flex-col gap-2 rounded-card border border-border bg-surface p-3"
          >
            <div className="grid grid-cols-[1fr_8rem] gap-2">
              <Input
                id={`option-name-${option.key}`}
                label="Tên lựa chọn"
                value={option.name}
                onChange={(event) => updateOption(option.key, { name: event.target.value })}
                placeholder="Thường, Đặc biệt…"
                maxLength={60}
                {...errorOf(`options.${index}.name`)}
              />
              <Input
                id={`option-price-${option.key}`}
                label="Giá"
                inputMode="numeric"
                value={option.price}
                onChange={(event) => updateOption(option.key, { price: event.target.value })}
                placeholder="25000"
                {...errorOf(`options.${index}.price`)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex min-h-11 cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="defaultOption"
                  checked={option.isDefault}
                  onChange={() => setDefault(option.key)}
                  className="size-5 accent-primary"
                />
                Mặc định
              </label>
              <Button
                variant="ghost"
                disabled={index === 0}
                aria-label="Đưa lựa chọn lên"
                onClick={() => moveOption(index, -1)}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                disabled={index === options.length - 1}
                aria-label="Đưa lựa chọn xuống"
                onClick={() => moveOption(index, 1)}
              >
                ↓
              </Button>
              <Button
                variant="ghost"
                disabled={options.length <= 1}
                onClick={() =>
                  setOptions((current) => current.filter((entry) => entry.key !== option.key))
                }
              >
                Xóa
              </Button>
            </div>
          </div>
        ))}
        <div>
          <Button variant="secondary" onClick={addOption}>
            Thêm lựa chọn
          </Button>
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" isLoading={isPending}>
          {itemId ? "Lưu món" : "Tạo món"}
        </Button>
        {itemId ? (
          <Button variant="ghost" size="lg" onClick={() => setConfirmDelete(true)}>
            Xóa món
          </Button>
        ) : null}
      </div>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Xóa món?">
        <p className="mb-4">
          Món và ảnh của món sẽ bị xóa. Các yêu cầu đặt món cũ vẫn giữ nguyên tên và giá lúc đặt.
        </p>
        <Button
          variant="danger"
          isLoading={isPending}
          onClick={async () => {
            if (!itemId) return;
            const result = await run(() => deleteMenuItem({ id: itemId }), "Đã xóa món");
            if (result.ok) router.push("/admin/mon");
          }}
        >
          Xóa món
        </Button>
      </Dialog>
    </form>
  );
}
