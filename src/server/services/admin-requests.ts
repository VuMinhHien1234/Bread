import { asc, eq } from "drizzle-orm";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { isOpenAt } from "@/lib/shop-config";
import { contactMessage, orderRequest, orderRequestItem } from "@/server/db/schema";
import type { AppDb } from "@/server/db/types";
import type { TelegramResult } from "./telegram";
import { formatContactMessage, formatOrderRequestMessage } from "./telegram-format";

const TELEGRAM_ERROR_MAX = 500;

export async function updateOrderRequestStatus(
  db: AppDb,
  input: {
    id: string;
    status: "NEW" | "CALLED" | "DONE" | "CANCELLED";
    adminNote: string | null;
  },
): Promise<ActionResult> {
  const updated = await db
    .update(orderRequest)
    .set({ status: input.status, adminNote: input.adminNote })
    .where(eq(orderRequest.id, input.id))
    .returning({ id: orderRequest.id });
  return updated.length === 0 ? actionError("Không tìm thấy yêu cầu.") : actionOk(undefined);
}

export async function updateContactStatus(
  db: AppDb,
  input: { id: string; status: "NEW" | "HANDLED" },
): Promise<ActionResult> {
  const updated = await db
    .update(contactMessage)
    .set({ status: input.status })
    .where(eq(contactMessage.id, input.id))
    .returning({ id: contactMessage.id });
  return updated.length === 0 ? actionError("Không tìm thấy tin liên hệ.") : actionOk(undefined);
}

export type RetryDeps = {
  db: AppDb;
  sendTelegram: (text: string) => Promise<TelegramResult>;
  siteUrl: string;
  now: Date;
};

/** Gửi lại tin Telegram cho yêu cầu hoặc tin liên hệ đã lưu nhưng chưa báo được. */
export async function retryTelegram(
  deps: RetryDeps,
  kind: "order" | "contact",
  id: string,
): Promise<ActionResult> {
  const text = kind === "order" ? await buildOrderText(deps, id) : await buildContactText(deps, id);
  if (text === null) return actionError("Không tìm thấy mục cần gửi lại.");

  const result = await deps.sendTelegram(text);
  if (!result.ok) {
    await saveTelegramError(deps.db, kind, id, result.error);
    return actionError("Vẫn chưa gửi được Telegram. Bạn kiểm tra bot rồi thử lại nhé.");
  }
  if (kind === "order") {
    await deps.db
      .update(orderRequest)
      .set({ telegramSentAt: deps.now, telegramMessageId: result.messageId, telegramError: null })
      .where(eq(orderRequest.id, id));
  } else {
    await deps.db
      .update(contactMessage)
      .set({ telegramSentAt: deps.now, telegramError: null })
      .where(eq(contactMessage.id, id));
  }
  return actionOk(undefined);
}

async function saveTelegramError(db: AppDb, kind: "order" | "contact", id: string, error: string) {
  const telegramError = error.slice(0, TELEGRAM_ERROR_MAX);
  if (kind === "order") {
    await db.update(orderRequest).set({ telegramError }).where(eq(orderRequest.id, id));
  } else {
    await db.update(contactMessage).set({ telegramError }).where(eq(contactMessage.id, id));
  }
}

async function buildOrderText({ db, siteUrl, now }: RetryDeps, id: string) {
  const [order] = await db.select().from(orderRequest).where(eq(orderRequest.id, id)).limit(1);
  if (!order) return null;
  const items = await db
    .select()
    .from(orderRequestItem)
    .where(eq(orderRequestItem.orderRequestId, id))
    .orderBy(asc(orderRequestItem.itemName));
  return formatOrderRequestMessage({
    id: order.id,
    code: order.code,
    customerName: order.customerName,
    phone: order.phone,
    fulfillment: order.fulfillment,
    deliveryAddress: order.deliveryAddress,
    requestedAt: order.requestedAt,
    note: order.note,
    estimatedTotal: order.estimatedTotal,
    items,
    // Ngoài giờ tính theo lúc khách gửi, không phải lúc tiệm gửi lại
    isOutsideOpeningHours: !isOpenAt(order.createdAt ?? now),
    siteUrl,
  });
}

async function buildContactText({ db, siteUrl, now }: RetryDeps, id: string) {
  const [message] = await db
    .select()
    .from(contactMessage)
    .where(eq(contactMessage.id, id))
    .limit(1);
  if (!message) return null;
  return formatContactMessage({
    name: message.name,
    phone: message.phone,
    email: message.email,
    message: message.message,
    isOutsideOpeningHours: !isOpenAt(message.createdAt ?? now),
    siteUrl,
  });
}
