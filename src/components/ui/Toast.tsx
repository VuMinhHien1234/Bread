"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error";
type ToastItem = { id: number; message: string; tone: ToastTone };

const DISPLAY_MS = 4_000;

const ToastContext = createContext<((message: string, tone?: ToastTone) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef<number[]>([]);

  const show = useCallback((message: string, tone: ToastTone = "success") => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message, tone }]);
    timers.current.push(
      window.setTimeout(
        () => setToasts((current) => current.filter((toast) => toast.id !== id)),
        DISPLAY_MS,
      ),
    );
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* aria-live: trình đọc màn hình đọc thông báo mới mà không cần chuyển focus */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto rounded-button px-4 py-3 font-medium shadow-card",
              toast.tone === "success"
                ? "bg-accent-green text-primary-foreground"
                : "bg-danger text-danger-foreground",
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Hiện thông báo ngắn: `const toast = useToast(); toast("Đã lưu"); toast("Lỗi", "error")`. */
export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast phải dùng bên trong <ToastProvider>");
  return show;
}
