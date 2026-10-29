import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./auth";
import { ADMIN_LOGIN_PATH } from "@/lib/admin-path";

export { ADMIN_LOGIN_PATH };

/** Ném ra khi chưa đăng nhập hoặc không phải quản trị viên; server action bắt lại và trả `ActionResult`. */
export class UnauthorizedError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

async function getAdminSession() {
  // Đọc headers() TRƯỚC khi tạo auth: Next biết trang là động và không prerender lúc build
  // (build trên CI/Netlify không cần biến môi trường thật).
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

/**
 * Dùng ở dòng đầu tiên của MỌI admin action và admin query (TASK-BE mục 3).
 * Không dựa vào middleware hay layout một mình, vì action có thể bị gọi trực tiếp.
 */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

/** Trả session nếu đã đăng nhập với quyền quản trị, không thì `null` (không chuyển hướng). */
export async function getOptionalAdminSession() {
  return getAdminSession();
}

/** Dùng trong page / layout của trang quản trị: chưa đăng nhập thì chuyển về trang đăng nhập. */
export async function requireAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect(ADMIN_LOGIN_PATH);
  return session;
}
