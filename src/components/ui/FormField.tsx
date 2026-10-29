import type { ReactNode } from "react";

/** Id của dòng gợi ý và dòng lỗi, để gắn `aria-describedby` vào ô nhập. */
export function fieldMessageIds(id: string) {
  return { hint: `${id}-hint`, error: `${id}-error` };
}

type FieldShellProps = {
  id: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  children: ReactNode;
};

/** Khung dùng chung cho Input / Textarea: nhãn, gợi ý, thông báo lỗi dưới ô. */
export function FieldShell({ id, label, hint, error, required, children }: FieldShellProps) {
  const ids = fieldMessageIds(id);
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-text"
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="text-danger">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={ids.hint} className="text-sm text-text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={ids.error} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Giá trị `aria-describedby` đúng với việc đang hiện lỗi hay gợi ý. */
export function describedBy(id: string, hint?: string, error?: string): string | undefined {
  const ids = fieldMessageIds(id);
  if (error) return ids.error;
  if (hint) return ids.hint;
  return undefined;
}
