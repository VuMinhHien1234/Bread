import { like, desc } from "drizzle-orm";
import { formatVietnamMonthDay } from "@/lib/datetime";
import { orderRequest } from "@/server/db/schema";
import type { AppDb } from "@/server/db/types";

const CODE_PREFIX = "TL";
const SEQUENCE_DIGITS = 3;

/**
 * Mã dễ đọc cho khách và tiệm: TL-MMDD-NNN, số thứ tự đếm lại mỗi ngày theo giờ Việt Nam.
 * Hai yêu cầu gửi cùng lúc có thể ra cùng mã; cột `code` là UNIQUE nên người gọi thử lại.
 */
export async function nextOrderCode(db: AppDb, now: Date): Promise<string> {
  const prefix = `${CODE_PREFIX}-${formatVietnamMonthDay(now)}-`;
  const [latest] = await db
    .select({ code: orderRequest.code })
    .from(orderRequest)
    .where(like(orderRequest.code, `${prefix}%`))
    .orderBy(desc(orderRequest.code))
    .limit(1);

  const lastSequence = latest ? Number(latest.code.slice(prefix.length)) : 0;
  const next = Number.isFinite(lastSequence) ? lastSequence + 1 : 1;
  return `${prefix}${String(next).padStart(SEQUENCE_DIGITS, "0")}`;
}

const UNIQUE_VIOLATION = "23505";

/** Lỗi trùng khóa duy nhất của Postgres, kể cả khi ORM bọc lỗi gốc trong `cause`. */
export function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { code, cause } = error as { code?: unknown; cause?: unknown };
  return code === UNIQUE_VIOLATION || (cause !== undefined && isUniqueViolation(cause));
}
