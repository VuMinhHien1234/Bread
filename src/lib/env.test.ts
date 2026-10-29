import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env";

const validEnv = {
  DATABASE_URL: "postgres://user:pass@localhost:5432/db",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
  CLOUDINARY_CLOUD_NAME: "demo",
  CLOUDINARY_API_KEY: "key",
  CLOUDINARY_API_SECRET: "secret",
  CLOUDINARY_FOLDER: "banh-mi-thanh-long-dev",
  TELEGRAM_BOT_TOKEN: "123:abc",
  TELEGRAM_CHAT_ID: "-1001234567890",
  IP_HASH_SALT: "b".repeat(16),
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
};

describe("parseServerEnv", () => {
  it("chấp nhận cấu hình đầy đủ", () => {
    expect(parseServerEnv(validEnv).CLOUDINARY_FOLDER).toBe("banh-mi-thanh-long-dev");
  });

  it("coi biến tùy chọn để trống là chưa đặt", () => {
    const env = parseServerEnv({ ...validEnv, NEXT_PUBLIC_GA_ID: "", TELEGRAM_WEBHOOK_SECRET: "" });
    expect(env.NEXT_PUBLIC_GA_ID).toBeUndefined();
    expect(env.TELEGRAM_WEBHOOK_SECRET).toBeUndefined();
  });

  it("báo rõ tên biến bị thiếu", () => {
    expect(() => parseServerEnv({ ...validEnv, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });

  it("từ chối secret quá ngắn và chat id không phải số", () => {
    expect(() => parseServerEnv({ ...validEnv, BETTER_AUTH_SECRET: "short" })).toThrow(
      /BETTER_AUTH_SECRET/,
    );
    expect(() => parseServerEnv({ ...validEnv, TELEGRAM_CHAT_ID: "abc" })).toThrow(
      /TELEGRAM_CHAT_ID/,
    );
  });
});

describe("getSiteUrl", () => {
  it("dùng NEXT_PUBLIC_SITE_URL khi có và mặc định localhost khi không", async () => {
    const { getSiteUrl } = await import("./env");
    const original = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.vn";
    expect(getSiteUrl()).toBe("https://example.vn");
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(getSiteUrl()).toBe("http://localhost:3000");
    if (original !== undefined) process.env.NEXT_PUBLIC_SITE_URL = original;
  });
});
