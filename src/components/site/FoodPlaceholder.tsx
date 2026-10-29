/** Hình giữ chỗ khi món chưa có ảnh: ổ bánh vẽ nét mảnh màu đồng thau trên nền kem đậm, khung viền kép. */
export function FoodPlaceholder() {
  return (
    <div
      role="img"
      aria-label="Chưa có ảnh món"
      className="flex size-full items-center justify-center bg-cream-deep"
    >
      <div className="absolute inset-3 border border-brass/40" aria-hidden="true" />
      <svg viewBox="0 0 120 80" className="w-2/5 text-brass-text/70" aria-hidden="true">
        <path
          d="M14 50c0-15 20-27 46-27s46 12 46 27c0 4-3 7-7 7H21c-4 0-7-3-7-7z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path
          d="M38 36l6 10M56 32l5 12M74 36l6 10"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path d="M30 66h60" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1 4" />
      </svg>
    </div>
  );
}
