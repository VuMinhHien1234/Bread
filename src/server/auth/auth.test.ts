import { beforeAll, describe, expect, it, vi } from "vitest";
import { createTestDb } from "@/server/db/test-helpers";
import { createAuth } from "./auth";

vi.mock("server-only", () => ({}));
vi.mock("better-auth/next-js", () => ({ nextCookies: () => ({ id: "next-cookies" }) }));

const EMAIL = "chu@tiem.vn";
const PASSWORD = "mat-khau-du-dai-123";

const db = await createTestDb();
const auth = createAuth({
  db,
  baseURL: "http://localhost:3000",
  secret: "test-secret-test-secret-test-secret-12",
});

/** Tạo admin đúng như script `admin:create` (đăng ký công khai đã tắt nên đi qua adapter nội bộ). */
async function createAdmin() {
  const ctx = await auth.$context;
  const created = await ctx.internalAdapter.createUser(
    { email: EMAIL, name: "Chủ tiệm", emailVerified: true, role: "ADMIN" },
    { method: "email-password" },
  );
  await ctx.internalAdapter.linkAccount({
    userId: created.id,
    providerId: "credential",
    accountId: created.id,
    password: await ctx.password.hash(PASSWORD),
  });
}

beforeAll(createAdmin);

function signIn(email: string, password: string, ip = "1.1.1.1") {
  return auth.api.signInEmail({
    body: { email, password },
    headers: new Headers({ "x-forwarded-for": ip }),
    returnHeaders: true,
  });
}

describe("đăng nhập quản trị (Better Auth + Drizzle)", () => {
  it("đăng nhập đúng email và mật khẩu, nhận cookie phiên, user có role ADMIN", async () => {
    const { headers, response } = await signIn(EMAIL, PASSWORD);
    expect(response.user.email).toBe(EMAIL);
    expect(headers.get("set-cookie")).toContain("session_token");

    const cookie = headers.get("set-cookie")?.split(";")[0] ?? "";
    const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
    expect(session?.user).toMatchObject({ email: EMAIL, role: "ADMIN" });
  });

  it("sai mật khẩu hoặc sai email bị từ chối", async () => {
    await expect(signIn(EMAIL, "sai-mat-khau-12345", "2.2.2.2")).rejects.toThrow();
    await expect(signIn("khac@tiem.vn", PASSWORD, "2.2.2.2")).rejects.toThrow();
  });

  it("đăng ký công khai bị chặn", async () => {
    await expect(
      auth.api.signUpEmail({
        body: { email: "ke-la@x.vn", password: "mat-khau-du-dai-123", name: "Kẻ lạ" },
      }),
    ).rejects.toThrow();
  });

  it("không tự đặt được role qua dữ liệu gửi lên", async () => {
    const fields = (await auth.$context).options.user?.additionalFields;
    expect(fields?.["role"]?.input).toBe(false);
  });

  it("khóa tạm sau 5 lần đăng nhập sai liên tiếp từ cùng một địa chỉ", async () => {
    const attempt = () =>
      auth.handler(
        new Request("http://localhost:3000/api/auth/sign-in/email", {
          method: "POST",
          headers: { "content-type": "application/json", "x-forwarded-for": "9.9.9.9" },
          body: JSON.stringify({ email: EMAIL, password: "sai-mat-khau-12345" }),
        }),
      );
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) statuses.push((await attempt()).status);
    expect(statuses.slice(0, 5).every((status) => status === 401)).toBe(true);
    expect(statuses.slice(5)).toEqual([429, 429]);
  });
});
