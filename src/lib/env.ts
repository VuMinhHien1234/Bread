import { z } from "zod";

/** Biến để trống trong .env (ví dụ "NEXT_PUBLIC_GA_ID=") được coi như chưa đặt. */
const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET cần ít nhất 32 ký tự"),
  BETTER_AUTH_URL: z.url(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_FOLDER: z.string().min(1),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_CHAT_ID: z.string().regex(/^-?\d+$/, "TELEGRAM_CHAT_ID phải là số (nhóm là số âm)"),
  TELEGRAM_WEBHOOK_SECRET: optionalString,
  IP_HASH_SALT: z.string().min(16, "IP_HASH_SALT cần ít nhất 16 ký tự"),
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_GA_ID: optionalString,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Kiểm tra một object biến môi trường; ném lỗi tiếng Việt nêu rõ biến nào sai. */
export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Biến môi trường chưa đúng:\n${problems}\nXem .env.example để biết cách điền.`);
  }
  return result.data;
}

let cachedEnv: ServerEnv | undefined;

/**
 * Đọc biến môi trường phía server. Kiểm tra lười (lần gọi đầu) để `next build`
 * không bị vỡ ở những trang không cần tới biến.
 */
export function getServerEnv(): ServerEnv {
  cachedEnv ??= parseServerEnv(process.env);
  return cachedEnv;
}

/**
 * URL gốc của website (biến công khai nên dùng được ở cả client và server, và không bắt buộc
 * khi build). Dùng cho metadata SEO và liên kết trong tin Telegram.
 */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
