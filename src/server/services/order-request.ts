import { eq, inArray } from "drizzle-orm";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { looksLikeBot } from "@/lib/validation/common";
import { validationError } from "@/lib/validation/field-errors";
import { createOrderRequestSchema, type OrderRequestInput } from "@/lib/validation/order-request";
import { isOpenAt, orderRules } from "@/lib/shop-config";
import { menuItem, menuItemOption, orderRequest, orderRequestItem } from "@/server/db/schema";
import type { AppDb } from "@/server/db/types";
import { logServerError } from "@/server/log";
import { isUniqueViolation, nextOrderCode } from "./order-code";
import { consumeRateLimit } from "./rate-limit";
import { formatOrderRequestMessage } from "./telegram-format";
import type { TelegramResult } from "./telegram";

const CODE_RETRIES = 3;
const TELEGRAM_ERROR_MAX = 500;

export type OrderRequestReceipt = {
  code: string;
  estimatedTotal: number;
  /** Khách đang gửi trong giờ mở cửa hay ngoài giờ (để hiện lời nhắn phù hợp) */
  isOpenNow: boolean;
};

export type OrderRequestDeps = {
  db: AppDb;
  /** Hàm gửi Telegram; tách ra để test không gọi mạng thật */
  sendTelegram: (text: string) => Promise<TelegramResult>;
  ipHash: string;
  siteUrl: string;
  now?: () => Date;
};

type PricedLine = {
  menuItemId: string;
  menuItemOptionId: string;
  itemName: string;
  optionName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

type PricingResult = { ok: true; lines: PricedLine[] } | { ok: false; error: string };

/**
 * Giá và tình trạng món luôn đọc lại từ database; dữ liệu khách gửi chỉ gồm id và số lượng.
 */
async function priceLines(db: AppDb, items: OrderRequestInput["items"]): Promise<PricingResult> {
  const itemIds = [...new Set(items.map((line) => line.menuItemId))];
  const optionIds = items.map((line) => line.optionId);

  const [menuItems, options] = await Promise.all([
    db.select().from(menuItem).where(inArray(menuItem.id, itemIds)),
    db.select().from(menuItemOption).where(inArray(menuItemOption.id, optionIds)),
  ]);
  const itemById = new Map(menuItems.map((row) => [row.id, row]));
  const optionById = new Map(options.map((row) => [row.id, row]));

  const lines: PricedLine[] = [];
  for (const line of items) {
    const item = itemById.get(line.menuItemId);
    const option = optionById.get(line.optionId);
    if (!item || !item.isActive || !option || option.menuItemId !== item.id) {
      return {
        ok: false,
        error: "Có món không còn trong thực đơn. Bạn tải lại trang và chọn lại nhé.",
      };
    }
    if (item.isSoldOutToday) {
      return {
        ok: false,
        error: `Món "${item.name}" hôm nay đã hết, bạn bỏ món này giúp tiệm nhé.`,
      };
    }
    lines.push({
      menuItemId: item.id,
      menuItemOptionId: option.id,
      itemName: item.name,
      optionName: option.name,
      unitPrice: option.price,
      quantity: line.quantity,
      lineTotal: option.price * line.quantity,
    });
  }
  return { ok: true, lines };
}

async function saveOrderRequest(
  db: AppDb,
  input: OrderRequestInput,
  lines: PricedLine[],
  estimatedTotal: number,
  ipHash: string,
  now: Date,
) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const code = await nextOrderCode(tx, now);
        const [created] = await tx
          .insert(orderRequest)
          .values({
            code,
            customerName: input.customerName,
            phone: input.phone,
            fulfillment: input.fulfillment,
            deliveryAddress: input.deliveryAddress,
            requestedAt: input.requestedAt,
            note: input.note,
            estimatedTotal,
            ipHash,
          })
          .returning();
        if (!created) throw new Error("Không tạo được yêu cầu đặt món");
        await tx
          .insert(orderRequestItem)
          .values(lines.map((line) => ({ ...line, orderRequestId: created.id })));
        return created;
      });
    } catch (error) {
      if (!isUniqueViolation(error) || attempt >= CODE_RETRIES) throw error;
    }
  }
}

/** Gửi Telegram sau khi đã lưu; lỗi chỉ được ghi lại, không làm hỏng yêu cầu của khách. */
async function notifyTelegram(
  deps: OrderRequestDeps,
  created: typeof orderRequest.$inferSelect,
  lines: PricedLine[],
  now: Date,
) {
  const text = formatOrderRequestMessage({
    id: created.id,
    code: created.code,
    customerName: created.customerName,
    phone: created.phone,
    fulfillment: created.fulfillment,
    deliveryAddress: created.deliveryAddress,
    requestedAt: created.requestedAt,
    note: created.note,
    estimatedTotal: created.estimatedTotal,
    items: lines,
    isOutsideOpeningHours: !isOpenAt(now),
    siteUrl: deps.siteUrl,
  });
  const result = await deps.sendTelegram(text);
  const update = result.ok
    ? { telegramSentAt: now, telegramMessageId: result.messageId, telegramError: null }
    : { telegramError: result.error.slice(0, TELEGRAM_ERROR_MAX) };
  await deps.db.update(orderRequest).set(update).where(eq(orderRequest.id, created.id));
}

/**
 * Luồng đặt món (TASK-BE 6.1): kiểm tra → chống spam → tính giá ở server → lưu → báo Telegram.
 * Không bao giờ ném lỗi; mọi kết quả trả về dạng `ActionResult`.
 */
export async function submitOrderRequest(
  deps: OrderRequestDeps,
  rawInput: unknown,
): Promise<ActionResult<OrderRequestReceipt>> {
  const now = (deps.now ?? (() => new Date()))();
  const isOpenNow = isOpenAt(now);

  const parsed = createOrderRequestSchema(now).safeParse(rawInput);
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  // Bot nhận kết quả "thành công" giả để không biết đã bị chặn; không lưu, không báo Telegram.
  if (looksLikeBot(input, now, orderRules.minFillSeconds)) {
    return actionOk({ code: "TL-0000-000", estimatedTotal: 0, isOpenNow });
  }

  try {
    const limit = await consumeRateLimit(
      deps.db,
      `order:${deps.ipHash}`,
      {
        limit: orderRules.rateLimit.orderRequestsPerWindow,
        windowMinutes: orderRules.rateLimit.windowMinutes,
      },
      now,
    );
    if (!limit.allowed) {
      return actionError("Bạn gửi hơi nhiều lần, vui lòng gọi trực tiếp cho tiệm nhé.");
    }

    const priced = await priceLines(deps.db, input.items);
    if (!priced.ok) return actionError(priced.error);
    const estimatedTotal = priced.lines.reduce((sum, line) => sum + line.lineTotal, 0);

    const created = await saveOrderRequest(
      deps.db,
      input,
      priced.lines,
      estimatedTotal,
      deps.ipHash,
      now,
    );

    try {
      await notifyTelegram(deps, created, priced.lines, now);
    } catch (error) {
      logServerError("submitOrderRequest.telegram", error);
    }

    return actionOk({ code: created.code, estimatedTotal, isOpenNow });
  } catch (error) {
    logServerError("submitOrderRequest", error);
    return actionError("Chưa gửi được yêu cầu. Bạn thử lại hoặc gọi trực tiếp cho tiệm nhé.");
  }
}
