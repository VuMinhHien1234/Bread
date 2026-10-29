"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import type { ActionResult } from "@/lib/action-result";

/**
 * Chạy một server action từ giao diện quản trị: báo "đang xử lý", hiện thông báo kết quả
 * và tải lại dữ liệu trang khi thành công.
 */
export function useAdminAction() {
  const router = useRouter();
  const toast = useToast();
  const [isPending, setIsPending] = useState(false);

  async function run<T>(
    action: () => Promise<ActionResult<T>>,
    successMessage?: string,
  ): Promise<ActionResult<T>> {
    setIsPending(true);
    try {
      const result = await action();
      if (result.ok) {
        if (successMessage) toast(successMessage);
        router.refresh();
      } else {
        toast(result.error, "error");
      }
      return result;
    } finally {
      setIsPending(false);
    }
  }

  return { run, isPending };
}
