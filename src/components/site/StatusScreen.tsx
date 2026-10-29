import type { ReactNode } from "react";

/** Khung trang trạng thái (404, lỗi): con số/biểu tượng lớn in nghiêng + tiêu đề + nút. */
export function StatusScreen({
  mark,
  title,
  description,
  children,
}: {
  mark: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-5 text-center">
      <p aria-hidden="true" className="font-heading text-8xl italic text-brass-text/80">
        {mark}
      </p>
      <div className="ornament w-40" aria-hidden="true">
        <span className="size-1.5 rotate-45 bg-brass" />
      </div>
      <h1 className="text-4xl sm:text-5xl">{title}</h1>
      <p className="max-w-md text-lg leading-relaxed text-text-muted">{description}</p>
      <div className="flex flex-col gap-3 pt-2 sm:flex-row">{children}</div>
    </main>
  );
}
