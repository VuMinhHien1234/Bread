import { cn } from "@/lib/cn";
import { shopConfig } from "@/lib/shop-config";

const DAY_NAMES = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

type Row = { key: string; label: string; hours: string };

function hoursFor(day: number) {
  const rule = shopConfig.openingHours.find((entry) => entry.days.includes(day));
  return rule ? `${rule.open} – ${rule.close}` : "Nghỉ";
}

/** Gộp các ngày liền nhau có cùng giờ: "Thứ hai – Chủ nhật · 06:00 – 20:00". */
function compactRows(): Row[] {
  const rows: Row[] = [];
  let start = 0;
  for (let index = 1; index <= WEEK_ORDER.length; index += 1) {
    const prev = WEEK_ORDER[index - 1] ?? 0;
    const current = WEEK_ORDER[index];
    if (current !== undefined && hoursFor(current) === hoursFor(prev)) continue;
    const first = WEEK_ORDER[start] ?? 0;
    const label =
      first === prev ? (DAY_NAMES[first] ?? "") : `${DAY_NAMES[first]} – ${DAY_NAMES[prev]}`;
    rows.push({ key: `${first}-${prev}`, label, hours: hoursFor(prev) });
    start = index;
  }
  return rows;
}

/** Giờ mở cửa trong tuần, đọc từ `shopConfig.openingHours`. `compact` gộp các ngày giống nhau. */
export function OpeningHours({ compact = false }: { compact?: boolean }) {
  const rows: Row[] = compact
    ? compactRows()
    : WEEK_ORDER.map((day) => ({
        key: String(day),
        label: DAY_NAMES[day] ?? "",
        hours: hoursFor(day),
      }));

  return (
    <dl className={cn("grid gap-y-2", compact ? "grid-cols-1" : "grid-cols-[auto_1fr] gap-x-8")}>
      {rows.map((row) => (
        <div key={row.key} className={compact ? "flex flex-col" : "contents"}>
          <dt className="text-text-muted">{row.label}</dt>
          <dd className="font-medium tabular-nums">{row.hours}</dd>
        </div>
      ))}
    </dl>
  );
}
