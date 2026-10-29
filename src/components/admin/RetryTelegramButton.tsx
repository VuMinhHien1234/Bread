"use client";

import { Button } from "@/components/ui/Button";
import { retryTelegram } from "@/server/actions/admin/requests";
import { useAdminAction } from "./use-admin-action";

/** Gửi lại tin Telegram cho mục đã lưu nhưng chưa báo được (có `telegram_error`). */
export function RetryTelegramButton({ kind, id }: { kind: "order" | "contact"; id: string }) {
  const { run, isPending } = useAdminAction();
  return (
    <Button
      variant="secondary"
      isLoading={isPending}
      onClick={() => void run(() => retryTelegram({ kind, id }), "Đã gửi lại Telegram")}
    >
      Gửi lại Telegram
    </Button>
  );
}
