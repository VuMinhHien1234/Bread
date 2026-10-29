import { type NextRequest, NextResponse } from "next/server";

/**
 * Chặn sớm /admin/* khi không có cookie phiên (chỉ là lớp ngoài, nhanh).
 * Kiểm tra quyền thật vẫn nằm ở layout admin và requireAdmin() trong mọi action.
 */
const LOGIN_PATH = "/admin/dang-nhap";

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

export const config = { matcher: ["/admin/:path*"] };
