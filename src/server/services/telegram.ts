import "server-only";
import { getServerEnv } from "@/lib/env";

/** Khách không nên chờ lâu: tổng thời gian gửi tối đa 5 giây (TASK-BE mục 8). */
const TOTAL_TIMEOUT_MS = 5_000;
const RETRY_DELAY_MS = 1_000;

export type TelegramResult = { ok: true; messageId: number } | { ok: false; error: string };

type TelegramResponse = {
  ok: boolean;
  description?: string;
  result?: { message_id: number };
};

type SendOptions = {
  /** Chỉ dùng trong test để thay `fetch` thật */
  fetchFn?: typeof fetch;
  /** Chỉ dùng trong test để không phải chờ thật */
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type Attempt = { result: TelegramResult; retryable: boolean };

async function attemptSend(
  text: string,
  fetchFn: typeof fetch,
  timeoutMs: number,
): Promise<Attempt> {
  // Đọc cấu hình trong try: thiếu biến môi trường cũng không được làm hỏng luồng đặt món của khách
  try {
    const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = getServerEnv();
    const response = await fetchFn(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: "HTML",
          link_preview_options: { is_disabled: true },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      },
    );
    const data = (await response.json()) as TelegramResponse;
    if (data.ok && data.result) {
      return { result: { ok: true, messageId: data.result.message_id }, retryable: false };
    }
    // 429 và 5xx là lỗi tạm thời; 4xx khác (sai token, sai chat id, lỗi cú pháp) thử lại cũng vô ích
    const retryable = response.status === 429 || response.status >= 500;
    return {
      result: {
        ok: false,
        error: `Telegram ${response.status}: ${data.description ?? "không rõ lỗi"}`,
      },
      retryable,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Biến môi trường")) {
      return { result: { ok: false, error: "Telegram chưa được cấu hình" }, retryable: false };
    }
    // Không đưa nguyên thông điệp lỗi vào kết quả vì đường dẫn gọi API chứa token của bot
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return {
      result: {
        ok: false,
        error: timedOut ? "Telegram quá thời gian chờ" : "Không kết nối được Telegram",
      },
      retryable: true,
    };
  }
}

/**
 * Gửi một tin vào nhóm của tiệm. Không bao giờ ném lỗi: người gọi lưu `error` vào DB
 * (cột telegram_error) và vẫn báo thành công cho khách.
 * Lỗi tạm thời được thử lại một lần sau 1 giây nếu còn đủ thời gian.
 */
export async function sendTelegramMessage(
  text: string,
  { fetchFn = fetch, sleep = defaultSleep }: SendOptions = {},
): Promise<TelegramResult> {
  const startedAt = Date.now();

  const first = await attemptSend(text, fetchFn, TOTAL_TIMEOUT_MS);
  if (first.result.ok || !first.retryable) return first.result;

  const remaining = TOTAL_TIMEOUT_MS - (Date.now() - startedAt) - RETRY_DELAY_MS;
  if (remaining <= 0) return first.result;

  await sleep(RETRY_DELAY_MS);
  const second = await attemptSend(text, fetchFn, remaining);
  return second.result;
}
