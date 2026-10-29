"use client";

import { StatusScreen } from "@/components/site/StatusScreen";
import { Button, buttonClassName } from "@/components/ui/Button";
import { shopConfig } from "@/lib/shop-config";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusScreen
      mark="Ôi…"
      title="Có lỗi xảy ra"
      description="Xin lỗi bạn, trang vừa gặp sự cố. Bạn thử lại, hoặc gọi trực tiếp cho tiệm nhé."
    >
      <Button onClick={reset}>Thử lại</Button>
      <a href={`tel:${shopConfig.phone}`} className={buttonClassName("secondary")}>
        Gọi tiệm
      </a>
    </StatusScreen>
  );
}
