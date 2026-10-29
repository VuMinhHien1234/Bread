import { cn } from "@/lib/cn";

/**
 * Tiêu đề có vài chữ cuối in nghiêng màu đồng thau (kiểu tạp chí).
 * `accentWords`: số chữ cuối được nhấn; câu quá ngắn thì không nhấn.
 */
export function AccentTitle({
  text,
  accentWords = 2,
  accentClassName,
}: {
  text: string;
  accentWords?: number;
  accentClassName?: string;
}) {
  const words = text.trim().split(/\s+/);
  if (words.length <= accentWords) return <>{text}</>;
  const head = words.slice(0, -accentWords).join(" ");
  const tail = words.slice(-accentWords).join(" ");
  return (
    <>
      {head} <em className={cn("font-normal italic text-brass-text", accentClassName)}>{tail}</em>
    </>
  );
}
