import { z } from "zod";
import { normalizeVietnamPhone } from "@/lib/phone";

/** Ô văn bản: cắt khoảng trắng hai đầu rồi kiểm tra độ dài. */
export function requiredText(label: string, min: number, max: number) {
  return z
    .string({ error: `Vui lòng nhập ${label}.` })
    .trim()
    .min(min, `${label} cần ít nhất ${min} ký tự.`)
    .max(max, `${label} tối đa ${max} ký tự.`);
}

/** Ô tùy chọn: để trống coi như không có (trả null). */
export function optionalText(label: string, max: number) {
  return z
    .string()
    .trim()
    .max(max, `${label} tối đa ${max} ký tự.`)
    .transform((value) => (value === "" ? null : value))
    .nullish()
    .transform((value) => value ?? null);
}

export const phoneSchema = z
  .string({ error: "Vui lòng nhập số điện thoại." })
  .refine((value) => normalizeVietnamPhone(value) !== null, {
    message: "Số điện thoại chưa đúng, bạn kiểm tra lại nhé.",
  })
  // refine báo lỗi mà không dừng hẳn, nhờ vậy các ô khác vẫn được kiểm tra và báo lỗi cùng lúc
  .transform((value) => normalizeVietnamPhone(value) ?? value);

/** Ô bẫy cho bot: người thật không thấy nên luôn để trống. Việc xử lý nằm ở action. */
export const honeypotFields = {
  website: z.string().max(200).optional(),
  /** Thời điểm mở form (mili-giây từ 1970) để phát hiện form gửi quá nhanh. */
  startedAt: z.number().int().nonnegative(),
};

export function looksLikeBot(
  input: { website?: string | undefined; startedAt: number },
  now: Date,
  minFillSeconds: number,
): boolean {
  if (input.website !== undefined && input.website.trim() !== "") return true;
  return now.getTime() - input.startedAt < minFillSeconds * 1000;
}
