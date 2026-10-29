"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./Button";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/**
 * Hộp thoại dựa trên thẻ <dialog> của trình duyệt: có sẵn khóa focus, đóng bằng phím Esc,
 * và đọc được bằng trình đọc màn hình, không cần thêm thư viện.
 */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  // Đồng bộ trạng thái `open` của React với thẻ <dialog> (một hệ thống bên ngoài React)
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onClose={onClose}
      // Bấm vào nền mờ (chính thẻ <dialog>, không phải nội dung bên trong) thì đóng
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-[min(92vw,28rem)] rounded-card border border-border bg-surface p-6 text-text shadow-card backdrop:bg-text/50"
    >
      <h2 id="dialog-title" className="mb-4 text-xl">
        {title}
      </h2>
      <div className="mb-6">{children}</div>
      <div className="flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </dialog>
  );
}
