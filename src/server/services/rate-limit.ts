import { sql } from "drizzle-orm";
import type { AppDb } from "@/server/db/types";
import { formRateLimit } from "@/server/db/schema";

const MS_PER_MINUTE = 60_000;

export type RateLimitRule = { limit: number; windowMinutes: number };

/**
 * Đếm một lần gửi form theo `key` và cho biết có còn được phép không.
 * Một câu lệnh duy nhất (chèn hoặc cộng dồn) nên hai request đồng thời không đếm sai.
 * Hết cửa sổ thời gian thì bắt đầu đếm lại từ 1.
 */
export async function consumeRateLimit(
  db: AppDb,
  key: string,
  rule: RateLimitRule,
  now: Date = new Date(),
): Promise<{ allowed: boolean; count: number }> {
  const windowCutoff = new Date(now.getTime() - rule.windowMinutes * MS_PER_MINUTE);
  const expired = sql`${formRateLimit.windowStart} < ${windowCutoff.toISOString()}::timestamptz`;

  const [row] = await db
    .insert(formRateLimit)
    .values({ key, count: 1, windowStart: now })
    .onConflictDoUpdate({
      target: formRateLimit.key,
      set: {
        count: sql`CASE WHEN ${expired} THEN 1 ELSE ${formRateLimit.count} + 1 END`,
        windowStart: sql`CASE WHEN ${expired} THEN ${now.toISOString()}::timestamptz ELSE ${formRateLimit.windowStart} END`,
      },
    })
    .returning({ count: formRateLimit.count });

  const count = row?.count ?? 1;
  return { allowed: count <= rule.limit, count };
}
