import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { shopConfig } from "@/lib/shop-config";
import { requireAdminPage } from "@/server/auth/session";
import { countNewRequests } from "@/server/queries/admin";

/**
 * Mọi trang trong nhóm này yêu cầu đăng nhập. Mỗi action/query vẫn tự kiểm tra quyền riêng,
 * layout chỉ là lớp chuyển hướng cho người dùng (TASK-BE mục 3).
 */
// Trang quản trị luôn đọc phiên đăng nhập theo từng request, không dựng sẵn lúc build
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminPage();
  const newRequestCount = await countNewRequests();

  return (
    <div className="mx-auto min-h-dvh w-full max-w-5xl px-4 py-4">
      <header className="flex items-center justify-between gap-3">
        <p className="font-heading text-2xl text-primary">
          {shopConfig.name}{" "}
          <span className="hidden text-base italic text-brass-text sm:inline">· Quản trị</span>
        </p>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-text-muted sm:inline">{session.user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <AdminNav newRequestCount={newRequestCount} />
      <main className="border-t border-border py-6">{children}</main>
    </div>
  );
}
