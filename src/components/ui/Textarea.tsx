import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { describedBy, FieldShell } from "./FormField";
import { fieldControlClass } from "./Input";

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export function Textarea({
  id,
  label,
  hint,
  error,
  required,
  className,
  rows = 4,
  ...rest
}: TextareaProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(fieldControlClass, "resize-y", className)}
        {...rest}
      />
    </FieldShell>
  );
}
