import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { describedBy, FieldShell } from "./FormField";

export const fieldControlClass =
  "min-h-12 w-full rounded-button border border-border bg-surface px-4 py-2.5 text-base text-text transition-colors placeholder:text-text-muted/70 hover:border-text-muted/60 focus:border-primary focus:outline-none focus-visible:outline-none focus:ring-1 focus:ring-primary aria-[invalid=true]:border-danger";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export function Input({ id, label, hint, error, required, className, ...rest }: InputProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(fieldControlClass, className)}
        {...rest}
      />
    </FieldShell>
  );
}
