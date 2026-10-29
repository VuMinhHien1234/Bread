import { eq } from "drizzle-orm";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { looksLikeBot } from "@/lib/validation/common";
import { contactSchema } from "@/lib/validation/contact";
import { validationError } from "@/lib/validation/field-errors";
import { isOpenAt, orderRules } from "@/lib/shop-config";
import { contactMessage } from "@/server/db/schema";
import { logServerError } from "@/server/log";
import { consumeRateLimit } from "./rate-limit";
import { formatContactMessage } from "./telegram-format";
import type { OrderRequestDeps } from "./order-request";

const TELEGRAM_ERROR_MAX = 500;

/** Luồng gửi tin liên hệ (TASK-BE 6.2); cùng khuôn với `submitOrderRequest`. */
export async function submitContactMessage(
  deps: OrderRequestDeps,
  rawInput: unknown,
): Promise<ActionResult<{ isOpenNow: boolean }>> {
  const now = (deps.now ?? (() => new Date()))();
  const isOpenNow = isOpenAt(now);

  const parsed = contactSchema.safeParse(rawInput);
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  if (looksLikeBot(input, now, orderRules.minFillSeconds)) return actionOk({ isOpenNow });

  try {
    const limit = await consumeRateLimit(
      deps.db,
      `contact:${deps.ipHash}`,
      {
        limit: orderRules.rateLimit.contactMessagesPerWindow,
        windowMinutes: orderRules.rateLimit.windowMinutes,
      },
      now,
    );
    if (!limit.allowed) {
      return actionError("Bạn gửi hơi nhiều lần, vui lòng gọi trực tiếp cho tiệm nhé.");
    }

    const [created] = await deps.db
      .insert(contactMessage)
      .values({
        name: input.name,
        phone: input.phone,
        email: input.email,
        message: input.message,
        ipHash: deps.ipHash,
      })
      .returning();
    if (!created) throw new Error("Không lưu được tin liên hệ");

    try {
      const result = await deps.sendTelegram(
        formatContactMessage({
          name: created.name,
          phone: created.phone,
          email: created.email,
          message: created.message,
          isOutsideOpeningHours: !isOpenNow,
          siteUrl: deps.siteUrl,
        }),
      );
      const update = result.ok
        ? { telegramSentAt: now, telegramError: null }
        : { telegramError: result.error.slice(0, TELEGRAM_ERROR_MAX) };
      await deps.db.update(contactMessage).set(update).where(eq(contactMessage.id, created.id));
    } catch (error) {
      logServerError("submitContactMessage.telegram", error);
    }

    return actionOk({ isOpenNow });
  } catch (error) {
    logServerError("submitContactMessage", error);
    return actionError("Chưa gửi được tin nhắn. Bạn thử lại hoặc gọi trực tiếp cho tiệm nhé.");
  }
}
