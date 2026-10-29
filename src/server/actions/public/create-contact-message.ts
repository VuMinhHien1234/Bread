"use server";

import { headers } from "next/headers";
import type { ActionResult } from "@/lib/action-result";
import { getServerEnv } from "@/lib/env";
import { getDb } from "@/server/db";
import { submitContactMessage } from "@/server/services/contact-message";
import { getClientIp, hashIp } from "@/server/services/client-ip";
import { sendTelegramMessage } from "@/server/services/telegram";

/** Khách gửi tin liên hệ. Nghiệp vụ nằm ở `submitContactMessage`. */
export async function createContactMessage(
  input: unknown,
): Promise<ActionResult<{ isOpenNow: boolean }>> {
  const env = getServerEnv();
  return submitContactMessage(
    {
      db: getDb(),
      sendTelegram: sendTelegramMessage,
      ipHash: hashIp(getClientIp(await headers()), env.IP_HASH_SALT),
      siteUrl: env.NEXT_PUBLIC_SITE_URL,
    },
    input,
  );
}
