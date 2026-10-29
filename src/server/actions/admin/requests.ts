"use server";

import type { ActionResult } from "@/lib/action-result";
import {
  contactStatusSchema,
  orderStatusSchema,
  retryTelegramSchema,
} from "@/lib/validation/admin";
import { getServerEnv } from "@/lib/env";
import { validationError } from "@/lib/validation/field-errors";
import { getDb } from "@/server/db";
import {
  retryTelegram as retryTelegramMessage,
  updateContactStatus as updateContactStatusRecord,
  updateOrderRequestStatus as updateOrderStatusRecord,
} from "@/server/services/admin-requests";
import { sendTelegramMessage } from "@/server/services/telegram";
import { refreshRequests } from "./refresh";
import { runAdminAction } from "./run-admin-action";

export async function updateOrderRequestStatus(input: unknown): Promise<ActionResult> {
  return runAdminAction("updateOrderRequestStatus", async () => {
    const parsed = orderStatusSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const result = await updateOrderStatusRecord(getDb(), parsed.data);
    if (result.ok) refreshRequests();
    return result;
  });
}

export async function updateContactStatus(input: unknown): Promise<ActionResult> {
  return runAdminAction("updateContactStatus", async () => {
    const parsed = contactStatusSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const result = await updateContactStatusRecord(getDb(), parsed.data);
    if (result.ok) refreshRequests();
    return result;
  });
}

/** Gửi lại tin Telegram cho yêu cầu hoặc tin liên hệ có `telegram_error`. */
export async function retryTelegram(input: unknown): Promise<ActionResult> {
  return runAdminAction("retryTelegram", async () => {
    const parsed = retryTelegramSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const result = await retryTelegramMessage(
      {
        db: getDb(),
        sendTelegram: sendTelegramMessage,
        siteUrl: getServerEnv().NEXT_PUBLIC_SITE_URL,
        now: new Date(),
      },
      parsed.data.kind,
      parsed.data.id,
    );
    if (result.ok) refreshRequests();
    return result;
  });
}
