import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id"> & {
  id: string;
  label: string;
};

/** Ô tích có vùng bấm 44px (cả dòng chữ cũng bấm được). */
export function Checkbox({ id, label, className, ...rest }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn("flex min-h-11 cursor-pointer items-center gap-3", className)}
    >
      <input id={id} type="checkbox" className="size-5 accent-primary" {...rest} />
      <span>{label}</span>
    </label>
  );
}
