import { cn } from "@/lib/cn";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Tên đọc cho trình đọc màn hình, ví dụ "Tạm hết hôm nay: Bánh mì thịt" */
  label: string;
  disabled?: boolean;
};

/** Công tắc bật/tắt một chạm; vùng bấm 44px cao. */
export function Switch({ checked, onChange, label, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-11 w-[4.5rem] shrink-0 items-center rounded-full border-2 transition-colors disabled:opacity-50",
        checked ? "border-danger bg-danger" : "border-border bg-border/60",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute size-8 rounded-full bg-surface shadow-card transition-transform",
          checked ? "translate-x-8" : "translate-x-1",
        )}
      />
    </button>
  );
}
