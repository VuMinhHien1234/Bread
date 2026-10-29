"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authClient } from "@/lib/auth-client";

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
      setError(
        signInError.status === RATE_LIMITED_STATUS
          ? "Bạn nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút."
          : "Email hoặc mật khẩu chưa đúng.",
      );
      setIsSubmitting(false);
      return;
    }
    router.replace("/admin");
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
