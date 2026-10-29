import "server-only";

/**
 * Ghi lỗi kỹ thuật ở phía server. Chỉ ghi tên và thông điệp lỗi, không ghi dữ liệu khách
 * (SĐT, địa chỉ, mật khẩu, token) — CODING-RULES mục 7.
 */
export function logServerError(scope: string, error: unknown): void {
  const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error(`[${scope}] ${detail}`);
}
