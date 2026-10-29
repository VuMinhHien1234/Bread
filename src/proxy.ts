import { type NextRequest, NextResponse } from "next/server";
import { ADMIN_LOGIN_PATH } from "@/lib/admin-path";

/**
 * Chặn sớm trang quản trị (xem src/lib/admin-path.ts) khi không có cookie phiên (chỉ là lớp ngoài, nhanh).
 * Kiểm tra quyền thật vẫn nằm ở layout admin và requireAdmin() trong mọi action.
 */
const LOGIN_PATH = ADMIN_LOGIN_PATH;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === LOGIN_PATH) return NextResponse.next();

  const hasSession =
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token");
  if (hasSession) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.search = "";
  return NextResponse.redirect(url);
}

// Phải là chuỗi cố định (Next.js đọc lúc build) — giữ trùng với ADMIN_SEGMENT, có test kiểm tra
export const config = { matcher: ["/quan-ly-qd45jc/:path*"] };
