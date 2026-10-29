/**
 * Chèn dữ liệu mẫu vào database trong .env.
 * Từ chối chạy khi NODE_ENV=production trừ khi có --force (TASK-DB mục 6).
 */
import { getServerEnv } from "@/lib/env";
import { getDb } from "@/server/db";
import { seedDatabase } from "@/server/db/seed";

const force = process.argv.includes("--force");
if (process.env.NODE_ENV === "production" && !force) {
  console.error(
    "Đang ở môi trường production. Thêm --force nếu bạn chắc chắn muốn chèn dữ liệu mẫu.",
  );
  process.exit(1);
}

const host = new URL(getServerEnv().DATABASE_URL).host;
console.log(`Chèn dữ liệu mẫu vào database: ${host}`);
await seedDatabase(getDb());
console.log("Xong. Chạy lại lệnh này sẽ thay dữ liệu mẫu cũ bằng dữ liệu mới.");
process.exit(0);
