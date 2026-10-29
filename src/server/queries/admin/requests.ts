import { asc, count, desc, eq } from "drizzle-orm";
import { contactMessage, orderRequest, orderRequestItem } from "@/server/db/schema";
import type { AppDb } from "@/server/db/types";

export const ADMIN_PAGE_SIZE = 20;

export type Page<T> = { rows: T[]; page: number; pageCount: number; total: number };

function pageOf<T>(rows: T[], total: number, page: number): Page<T> {
  return { rows, page, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

/** Số trang hợp lệ: số nguyên ≥ 1 (đầu vào từ địa chỉ trang nên có thể là rác). */
function safePage(page: number): number {
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export type OrderRequestStatus = (typeof orderRequest.$inferSelect)["status"];
export type ContactStatus = (typeof contactMessage.$inferSelect)["status"];

export async function loadOrderRequests(
  db: AppDb,
  { status, page = 1 }: { status?: OrderRequestStatus; page?: number } = {},
) {
  const current = safePage(page);
  const where = status ? eq(orderRequest.status, status) : undefined;

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: orderRequest.id,
        code: orderRequest.code,
        customerName: orderRequest.customerName,
        phone: orderRequest.phone,
        fulfillment: orderRequest.fulfillment,
        status: orderRequest.status,
        estimatedTotal: orderRequest.estimatedTotal,
        requestedAt: orderRequest.requestedAt,
        createdAt: orderRequest.createdAt,
        telegramFailed: orderRequest.telegramError,
        itemCount: count(orderRequestItem.id),
      })
      .from(orderRequest)
      .leftJoin(orderRequestItem, eq(orderRequestItem.orderRequestId, orderRequest.id))
      .where(where)
      .groupBy(orderRequest.id)
      .orderBy(desc(orderRequest.createdAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset((current - 1) * ADMIN_PAGE_SIZE),
    db.select({ total: count() }).from(orderRequest).where(where),
  ]);
  return pageOf(
    rows.map(({ telegramFailed, ...row }) => ({ ...row, telegramFailed: telegramFailed !== null })),
    totalRow?.total ?? 0,
    current,
  );
}

export async function loadOrderRequest(db: AppDb, id: string) {
  const [order] = await db.select().from(orderRequest).where(eq(orderRequest.id, id)).limit(1);
  if (!order) return null;
  const items = await db
    .select()
    .from(orderRequestItem)
    .where(eq(orderRequestItem.orderRequestId, id))
    .orderBy(asc(orderRequestItem.itemName));
  return { ...order, items };
}

/** Số yêu cầu mới, hiện thành chấm đỏ trên menu quản trị. */
export async function loadNewRequestCount(db: AppDb): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(orderRequest)
    .where(eq(orderRequest.status, "NEW"));
  return row?.total ?? 0;
}

export async function loadContactMessages(
  db: AppDb,
  { status, page = 1 }: { status?: ContactStatus; page?: number } = {},
) {
  const current = safePage(page);
  const where = status ? eq(contactMessage.status, status) : undefined;
  const [rows, [totalRow]] = await Promise.all([
    db
      .select()
      .from(contactMessage)
      .where(where)
      .orderBy(desc(contactMessage.createdAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset((current - 1) * ADMIN_PAGE_SIZE),
    db.select({ total: count() }).from(contactMessage).where(where),
  ]);
  return pageOf(
    // Không đưa ip_hash ra trang quản trị
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      message: row.message,
      status: row.status,
      telegramError: row.telegramError,
      createdAt: row.createdAt,
    })),
    totalRow?.total ?? 0,
    current,
  );
}
