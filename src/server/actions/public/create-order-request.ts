"use server";

import { headers } from "next/headers";
import type { ActionResult } from "@/lib/action-result";
import { getServerEnv } from "@/lib/env";
import { getDb } from "@/server/db";
import { submitOrderRequest, type OrderRequestReceipt } from "@/server/services/order-request";
import { getClientIp, hashIp } from "@/server/services/client-ip";
import { sendTelegramMessage } from "@/server/services/telegram";

/** Khách gửi yêu cầu đặt món. Toàn bộ nghiệp vụ nằm ở `submitOrderRequest` để test được. */
export async function createOrderRequest(
  input: unknown,
): Promise<ActionResult<OrderRequestReceipt>> {
  const env = getServerEnv();
  return submitOrderRequest(
    {
      db: getDb(),
      sendTelegram: sendTelegramMessage,
      ipHash: hashIp(getClientIp(await headers()), env.IP_HASH_SALT),
      siteUrl: env.NEXT_PUBLIC_SITE_URL,
    },
    input,
  );
}
