import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/site/Logo";
import { getOptionalAdminSession } from "@/server/auth/session";

export const metadata: Metadata = { title: "Đăng nhập quản trị", robots: { index: false } };

// Trang quản trị luôn đọc phiên đăng nhập theo từng request, không dựng sẵn lúc build
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  // Đã đăng nhập rồi thì vào thẳng trang quản trị
  if (await getOptionalAdminSession()) redirect("/admin");

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="flex w-full max-w-md flex-col gap-8 border border-border bg-surface p-8 shadow-card sm:p-10">
        <Logo />
        <div className="flex flex-col gap-2 border-t border-border pt-8">
          <p className="eyebrow">Quản trị</p>
          <h1 className="text-4xl">Đăng nhập</h1>
          <p className="text-text-muted">Quản lý thực đơn và yêu cầu đặt món của tiệm.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
