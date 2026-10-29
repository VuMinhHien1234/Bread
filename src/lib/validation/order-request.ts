import { z } from "zod";
import { orderRules } from "@/lib/shop-config";
import { honeypotFields, optionalText, phoneSchema, requiredText } from "./common";

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;
const ADDRESS_MIN = 5;
const ADDRESS_MAX = 300;

const lineSchema = z.object({
  menuItemId: z.string().min(1),
  optionId: z.string().min(1),
  quantity: z
    .number({ error: "Số lượng chưa đúng." })
    .int("Số lượng phải là số nguyên.")
    .min(1, "Số lượng tối thiểu là 1.")
    .max(orderRules.maxQuantityPerItem, `Mỗi món tối đa ${orderRules.maxQuantityPerItem}.`),
});

export type OrderLine = z.infer<typeof lineSchema>;

/** Gộp các dòng trùng món + lựa chọn; báo lỗi nếu số lượng gộp vượt mức cho phép. */
function mergeLines(lines: OrderLine[], ctx: z.RefinementCtx): OrderLine[] {
  const merged = new Map<string, OrderLine>();
  for (const line of lines) {
    const key = `${line.menuItemId}:${line.optionId}`;
    const existing = merged.get(key);
    merged.set(key, existing ? { ...line, quantity: existing.quantity + line.quantity } : line);
  }
  const result = [...merged.values()];
  if (result.some((line) => line.quantity > orderRules.maxQuantityPerItem)) {
    ctx.addIssue({
      code: "custom",
      path: ["items"],
      message: `Mỗi món tối đa ${orderRules.maxQuantityPerItem}.`,
    });
  }
  return result;
}

/**
 * Giờ nhận phụ thuộc "bây giờ", nên schema được tạo theo từng lần kiểm tra.
 * Dùng chung cho form (trình duyệt) và action (server).
 */
export function createOrderRequestSchema(now: Date) {
  const earliest = now.getTime() + orderRules.minLeadMinutes * MS_PER_MINUTE;
  const latest = now.getTime() + orderRules.maxScheduleDays * MS_PER_DAY;

  return z
    .object({
      items: z
        .array(lineSchema, { error: "Bạn chưa chọn món nào." })
        .min(1, "Bạn chưa chọn món nào.")
        .max(orderRules.maxLinesPerRequest, `Tối đa ${orderRules.maxLinesPerRequest} dòng món.`)
        .transform((lines, ctx) => mergeLines(lines, ctx)),
      customerName: requiredText("Tên", 2, 80),
      phone: phoneSchema,
      fulfillment: z.enum(["PICKUP", "DELIVERY"], { error: "Vui lòng chọn cách nhận món." }),
      deliveryAddress: optionalText("Địa chỉ", ADDRESS_MAX),
      /** Chuỗi ISO; bỏ trống nghĩa là "sớm nhất có thể". */
      requestedAt: z
        .string()
        .nullish()
        .transform((value, ctx) => {
          if (value === null || value === undefined || value === "") return null;
          const time = new Date(value);
          if (Number.isNaN(time.getTime())) {
            ctx.addIssue({ code: "custom", message: "Giờ nhận chưa đúng." });
            return z.NEVER;
          }
          if (time.getTime() < earliest) {
            ctx.addIssue({
              code: "custom",
              message: `Giờ nhận cần sau hiện tại ít nhất ${orderRules.minLeadMinutes} phút.`,
            });
          } else if (time.getTime() > latest) {
            ctx.addIssue({
              code: "custom",
              message: `Chỉ nhận hẹn trong ${orderRules.maxScheduleDays} ngày tới.`,
            });
          }
          return time;
        }),
      note: optionalText("Ghi chú", 500),
      ...honeypotFields,
    })
    .superRefine((value, ctx) => {
      if (value.fulfillment !== "DELIVERY") return;
      if (value.deliveryAddress === null || value.deliveryAddress.length < ADDRESS_MIN) {
        ctx.addIssue({
          code: "custom",
          path: ["deliveryAddress"],
          message: "Vui lòng nhập địa chỉ giao hàng.",
        });
      }
    })
    .transform((value) => ({
      ...value,
      // Lấy tại quầy thì bỏ địa chỉ nếu khách lỡ nhập trước đó
      deliveryAddress: value.fulfillment === "DELIVERY" ? value.deliveryAddress : null,
    }));
}

export type OrderRequestInput = z.output<ReturnType<typeof createOrderRequestSchema>>;
