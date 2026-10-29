import "server-only";
import { actionError, type ActionResult } from "@/lib/action-result";
import { logServerError } from "@/server/log";
import { requireAdmin, UnauthorizedError } from "@/server/auth/session";

export const UNAUTHORIZED_MESSAGE = "Phiên đăng nhập đã hết hạn, bạn đăng nhập lại nhé.";
export const GENERIC_ERROR_MESSAGE = "Không lưu được, bạn thử lại nhé.";

/**
 * Khuôn chung của mọi admin action (CODING-RULES mục 6): kiểm tra quyền TRƯỚC khi làm gì khác,
 * rồi chạy `handler`, bắt lỗi bất ngờ để không ném ra trình duyệt.
 * Chưa đăng nhập thì `handler` không bao giờ được gọi.
 */
export async function runAdminAction<T>(
  scope: string,
  handler: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) return actionError(UNAUTHORIZED_MESSAGE);
    logServerError(`${scope}.auth`, error);
    return actionError(GENERIC_ERROR_MESSAGE);
  }

  try {
    return await handler();
  } catch (error) {
    logServerError(scope, error);
    return actionError(GENERIC_ERROR_MESSAGE);
  }
}
