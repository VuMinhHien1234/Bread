import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { describedBy, FieldShell } from "./FormField";
import { fieldControlClass } from "./Input";

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export function Select({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
  ...rest
}: SelectProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <select
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(fieldControlClass, className)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}
