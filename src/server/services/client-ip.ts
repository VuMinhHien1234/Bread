import { createHash } from "node:crypto";

/**
 * Netlify gửi IP thật của khách trong `x-nf-client-connection-ip`;
 * nếu không có thì lấy địa chỉ đầu tiên trong `x-forwarded-for`.
 */
export function getClientIp(headers: Pick<Headers, "get">): string {
  const netlifyIp = headers.get("x-nf-client-connection-ip");
  if (netlifyIp) return netlifyIp.trim();
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

/** Băm IP kèm muối để đếm giới hạn gửi mà không lưu IP thô (master plan: riêng tư). */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
