import { z } from "zod";
import { slugify } from "@/lib/slug";
import { requiredText } from "./common";

const MAX_PRICE_VND = 10_000_000;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const idSchema = z.string().min(1, "Thiếu mã.");
const textOrNull = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} tối đa ${max} ký tự.`)
    .nullish()
    .transform((value) => (value === "" || value == null ? null : value));

/** Đường dẫn: để trống thì tự sinh từ tên (bỏ dấu, đ → d); gõ tay thì phải đúng dạng. */
const slugInput = z.string().trim().max(140).nullish();

function resolveSlug(slug: string | null | undefined, name: string, ctx: z.RefinementCtx): string {
  const resolved = slug ? slug : slugify(name);
  if (!SLUG_PATTERN.test(resolved)) {
    ctx.addIssue({
      code: "custom",
      path: ["slug"],
      message: "Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang.",
    });
  }
  return resolved;
}

export const categorySchema = z
  .object({
    name: requiredText("Tên danh mục", 1, 80),
    slug: slugInput,
    description: textOrNull(300, "Mô tả"),
    isActive: z.boolean().default(true),
  })
  .transform((value, ctx) => ({ ...value, slug: resolveSlug(value.slug, value.name, ctx) }));
export type CategoryInput = z.output<typeof categorySchema>;

const optionSchema = z.object({
  /** Có id = sửa lựa chọn cũ; không có = thêm mới */
  id: z.string().min(1).optional(),
  name: requiredText("Tên lựa chọn", 1, 60),
  price: z
    .number({ error: "Giá chưa đúng." })
    .int("Giá phải là số nguyên (đồng).")
    .min(0, "Giá không được âm.")
    .max(MAX_PRICE_VND, "Giá tối đa 10.000.000đ."),
  isDefault: z.boolean().default(false),
});

export const menuItemSchema = z
  .object({
    categoryId: idSchema,
    name: requiredText("Tên món", 1, 120),
    slug: slugInput,
    shortDescription: textOrNull(200, "Mô tả ngắn"),
    description: textOrNull(5000, "Mô tả"),
    ingredients: textOrNull(2000, "Thành phần"),
    isSpicy: z.boolean().default(false),
    isVegetarian: z.boolean().default(false),
    isBestSeller: z.boolean().default(false),
    isNew: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    isActive: z.boolean().default(true),
    options: z
      .array(optionSchema)
      .min(1, "Món cần ít nhất một lựa chọn có giá.")
      .max(10, "Tối đa 10 lựa chọn."),
  })
  .transform((value, ctx) => {
    const defaults = value.options.filter((option) => option.isDefault).length;
    if (defaults > 1) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Chỉ chọn một lựa chọn mặc định.",
      });
    }
    // Không chọn mặc định thì lấy lựa chọn đầu tiên
    const options = value.options.map((option, index) => ({
      ...option,
      isDefault: defaults === 0 ? index === 0 : option.isDefault,
    }));
    return { ...value, options, slug: resolveSlug(value.slug, value.name, ctx) };
  });
export type MenuItemInput = z.output<typeof menuItemSchema>;

export const toggleSchema = z.object({ id: idSchema, value: z.boolean() });
export const idInputSchema = z.object({ id: idSchema });
export const reorderSchema = z.object({ ids: z.array(idSchema).min(1).max(500) });
/** Sắp xếp món trong một danh mục, hoặc ảnh trong một món: cần biết mục cha. */
export const reorderWithParentSchema = reorderSchema.extend({ parentId: idSchema });

export const imageInputSchema = z.object({
  menuItemId: idSchema,
  publicId: z.string().min(1).max(255),
  url: z.url().max(1000).startsWith("https://", "Địa chỉ ảnh phải bắt đầu bằng https://"),
  width: z.number().int().positive().max(20_000),
  height: z.number().int().positive().max(20_000),
  alt: textOrNull(200, "Mô tả ảnh"),
});

export const orderStatusSchema = z.object({
  id: idSchema,
  status: z.enum(["NEW", "CALLED", "DONE", "CANCELLED"], { error: "Trạng thái chưa đúng." }),
  adminNote: textOrNull(500, "Ghi chú"),
});

export const contactStatusSchema = z.object({
  id: idSchema,
  status: z.enum(["NEW", "HANDLED"], { error: "Trạng thái chưa đúng." }),
});

export const retryTelegramSchema = z.object({
  kind: z.enum(["order", "contact"]),
  id: idSchema,
});
