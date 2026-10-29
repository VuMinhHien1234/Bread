"use client";

import { Button } from "./Button";

type StepperProps = {
  label: string;
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
};

/** Nút − / + chỉnh số lượng; vùng bấm 44px để dễ chạm trên điện thoại. */
export function Stepper({ label, value, min = 0, max, onChange }: StepperProps) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <Button
        variant="secondary"
        className="min-w-11 px-0 text-lg tracking-normal"
        aria-label={`Giảm ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </Button>
      <output aria-live="polite" className="w-9 text-center font-heading text-xl tabular-nums">
        {value}
      </output>
      <Button
        variant="secondary"
        className="min-w-11 px-0 text-lg tracking-normal"
        aria-label={`Tăng ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </Button>
    </div>
  );
}
