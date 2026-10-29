"use client";

import { Button } from "@/components/ui/Button";
import type { ContactStatus } from "@/lib/admin-labels";
import { updateContactStatus } from "@/server/actions/admin/requests";
import { useAdminAction } from "./use-admin-action";

export function ContactStatusButton({ id, status }: { id: string; status: ContactStatus }) {
  const { run, isPending } = useAdminAction();
  const next: ContactStatus = status === "NEW" ? "HANDLED" : "NEW";
  return (
    <Button
      variant={status === "NEW" ? "primary" : "ghost"}
      isLoading={isPending}
      onClick={() =>
        void run(
          () => updateContactStatus({ id, status: next }),
          next === "HANDLED" ? "Đã đánh dấu xử lý" : "Đã đánh dấu chưa xử lý",
        )
      }
    >
      {status === "NEW" ? "Đánh dấu đã xử lý" : "Đánh dấu chưa xử lý"}
    </Button>
  );
}
