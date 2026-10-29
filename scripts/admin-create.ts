/**
 * Tạo (hoặc đặt lại mật khẩu) tài khoản quản trị duy nhất.
 *   npm run admin:create -- --email chu@tiem.vn --name "Chủ tiệm"
 *   npm run admin:create -- --email chu@tiem.vn --reset-password
 * Mật khẩu lấy từ biến ADMIN_PASSWORD; nếu không có, script tạo mật khẩu ngẫu nhiên và in ra MỘT lần.
 * Không nhận mật khẩu qua tham số dòng lệnh để nó không nằm trong lịch sử shell.
 */
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import { eq } from "drizzle-orm";
import { getAuth } from "@/server/auth/auth";
import { getDb } from "@/server/db";
import { user } from "@/server/db/schema";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string", default: "Chủ tiệm" },
    "reset-password": { type: "boolean", default: false },
  },
});

async function main() {
  const email = values.email?.trim().toLowerCase();
  if (!email) throw new Error("Thiếu --email. Ví dụ: npm run admin:create -- --email chu@tiem.vn");

  const generated = !process.env.ADMIN_PASSWORD;
  const password = process.env.ADMIN_PASSWORD ?? randomBytes(15).toString("base64url");
  if (password.length < 12) throw new Error("Mật khẩu cần ít nhất 12 ký tự.");

  const db = getDb();
  const ctx = await getAuth().$context;
  const existing = await ctx.internalAdapter.findUserByEmail(email);
  const hash = await ctx.password.hash(password);

  if (existing) {
    if (!values["reset-password"]) {
      throw new Error(`Tài khoản ${email} đã có. Thêm --reset-password nếu muốn đặt lại mật khẩu.`);
    }
    await ctx.internalAdapter.updatePassword(existing.user.id, hash);
    console.log(`Đã đặt lại mật khẩu cho ${email}.`);
  } else {
    const admins = await db.select({ email: user.email }).from(user).where(eq(user.role, "ADMIN"));
    if (admins.length > 0) {
      const current = admins.map((admin) => admin.email).join(", ");
      throw new Error(
        `Đã có tài khoản quản trị: ${current}. Dự án chỉ dùng 1 tài khoản — đặt lại mật khẩu bằng:\n` +
          `  npm run admin:create -- --email ${admins[0]?.email ?? "<email>"} --reset-password`,
      );
    }
    const created = await ctx.internalAdapter.createUser(
      { email, name: values.name ?? "Chủ tiệm", emailVerified: true, role: "ADMIN" },
      { method: "email-password" },
    );
    await ctx.internalAdapter.linkAccount({
      userId: created.id,
      providerId: "credential",
      accountId: created.id,
      password: hash,
    });
    console.log(`Đã tạo tài khoản quản trị ${email}.`);
  }

  if (generated) {
    console.log(`Mật khẩu (chỉ hiện một lần, hãy lưu lại): ${password}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
