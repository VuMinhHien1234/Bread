"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";
import { adminPath } from "@/lib/admin-path";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    await authClient.signOut();
    router.replace(adminPath("dang-nhap"));
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      isLoading={isPending}
      className="whitespace-nowrap"
    >
      Đăng xuất
    </Button>
  );
}
