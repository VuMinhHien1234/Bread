"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authClient } from "@/lib/auth-client";
import { ADMIN_BASE } from "@/lib/admin-path";

const RATE_LIMITED_STATUS = 429;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setError(undefined);

    const { error: signInError } = await authClient.signIn.email({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });

    if (signInError) {
      setError(describeSignInError(signInError));
      setIsSubmitting(false);
      return;
    }
    router.replace(ADMIN_BASE);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Input id="email" name="email" type="email" label="Email" autoComplete="username" required />
      <Input
        id="password"
        name="password"
        type="password"
        label="Mật khẩu"
        autoComplete="current-password"
        required
        {...(error ? { error } : {})}
      />
      <Button type="submit" size="lg" isLoading={isSubmitting}>
        Đăng nhập
      </Button>
    </form>
  );
}

const INVALID_CREDENTIALS_STATUS = 401;
const FORBIDDEN_STATUS = 403;

/** Tách rõ "sai mật khẩu" với lỗi cấu hình/máy chủ để dễ tìm nguyên nhân. */
function describeSignInError(error: { status?: number; message?: string | undefined }): string {
  if (error.status === RATE_LIMITED_STATUS) {
    return "Bạn nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.";
  }
  if (error.status === INVALID_CREDENTIALS_STATUS) return "Email hoặc mật khẩu chưa đúng.";
  if (error.status === FORBIDDEN_STATUS) {
    return `Địa chỉ trang (${window.location.origin}) không khớp BETTER_AUTH_URL trong cấu hình. Mở đúng địa chỉ đó hoặc sửa biến này.`;
  }
  return `Không đăng nhập được (lỗi ${error.status ?? "mạng"}${error.message ? `: ${error.message}` : ""}). Thử lại hoặc báo người quản lý web.`;
}
