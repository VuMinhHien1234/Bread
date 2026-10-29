"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    await authClient.signOut();
    router.replace("/admin/dang-nhap");
    router.refresh();
  }

  return (
    <Button variant="ghost" onClick={handleClick} isLoading={isPending}>
      Đăng xuất
    </Button>
  );
}
