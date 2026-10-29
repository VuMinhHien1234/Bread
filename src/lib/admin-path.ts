/**
 * Đường dẫn trang quản trị — cố ý KHÔNG dùng "/admin" cho khó đoán.
 * Muốn đổi: sửa ADMIN_SEGMENT ở đây, đổi tên thư mục src/app/<ADMIN_SEGMENT> cho trùng,
 * và sửa chuỗi matcher trong src/proxy.ts (Next.js bắt buộc matcher là chuỗi cố định).
 * Có test kiểm tra ba chỗ này khớp nhau (admin-path.test.ts).
 * Lưu ý: giấu đường dẫn chỉ là lớp phụ; bảo vệ thật là mật khẩu + khóa sau 5 lần sai + requireAdmin().
 */
export const ADMIN_SEGMENT = "quan-ly-qd45jc";

export const ADMIN_BASE = `/${ADMIN_SEGMENT}`;

/** adminPath() → "/quan-ly-…", adminPath("mon/moi") → "/quan-ly-…/mon/moi" */
export function adminPath(subPath = ""): string {
  const clean = subPath.replace(/^\/+/, "");
  return clean ? `${ADMIN_BASE}/${clean}` : ADMIN_BASE;
}

export const ADMIN_LOGIN_PATH = adminPath("dang-nhap");
