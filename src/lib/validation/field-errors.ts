import type { ZodError } from "zod";
import { actionError } from "@/lib/action-result";

/** Lấy thông báo đầu tiên của mỗi ô, khoá theo đường dẫn ("customerName", "items.0.quantity"). */
export function toFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export const VALIDATION_ERROR_MESSAGE = "Vui lòng kiểm tra lại thông tin đã nhập.";

/** Kết quả chuẩn khi dữ liệu không hợp lệ (CODING-RULES mục 6). */
export function validationError(error: ZodError) {
  return actionError(VALIDATION_ERROR_MESSAGE, toFieldErrors(error));
}
