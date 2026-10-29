import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getServerEnv } from "@/lib/env";
import { getDb } from "@/server/db";
import * as schema from "@/server/db/schema";
import type { AppDb } from "@/server/db/types";

type AuthConfig = { db: AppDb; baseURL: string; secret: string };

/** Nhận `db` vào để test đăng nhập trên Postgres thật trong bộ nhớ (PGlite). */
export function createAuth({ db, baseURL, secret }: AuthConfig) {
  return betterAuth({
    baseURL,
    secret,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      // Chỉ có một tài khoản quản trị, tạo bằng `npm run admin:create` — không cho đăng ký công khai.
      // Better Auth chặn cả API phía server khi bật cờ này, nên script dùng adapter nội bộ.
      disableSignUp: true,
    },
    user: {
      additionalFields: {
        // `input: false`: khách không tự đặt được role qua request
        role: { type: "string", required: false, defaultValue: "ADMIN", input: false },
      },
    },
    rateLimit: {
      enabled: true,
      // Lưu trong DB vì Netlify chạy serverless, bộ nhớ không dùng chung giữa các lần gọi
      storage: "database",
      customRules: {
        "/sign-in/email": { window: 15 * 60, max: 5 },
      },
    },
    // nextCookies phải đứng cuối danh sách plugin
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof createAuth>;
let cachedAuth: Auth | undefined;

/** Tạo ở lần gọi đầu để `next build` không cần biến môi trường thật. */
export function getAuth(): Auth {
  const env = getServerEnv();
  cachedAuth ??= createAuth({
    db: getDb(),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
  });
  return cachedAuth;
}
