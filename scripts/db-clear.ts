/**
 * XÓA TOÀN BỘ dữ liệu nghiệp vụ trong database ở .env: danh mục, món, lựa chọn giá, ảnh món
 * (cả ảnh trên Cloudinary), yêu cầu đặt món, tin liên hệ, bộ đếm chống spam.
 * GIỮ LẠI tài khoản quản trị để vẫn đăng nhập được. Không hoàn tác được.
 *   npm run db:clear              → chỉ in ra sẽ xóa bao nhiêu, không xóa
 *   npm run db:clear -- --yes     → xóa thật
 */
import { count } from "drizzle-orm";
import { getServerEnv } from "@/lib/env";
import { getDb } from "@/server/db";
import {
  category,
  contactMessage,
  formRateLimit,
  menuItem,
  menuItemImage,
  menuItemOption,
  orderRequest,
  orderRequestItem,
} from "@/server/db/schema";
import { deleteCloudinaryImage } from "@/server/services/cloudinary";

const confirmed = process.argv.includes("--yes");
const db = getDb();
const host = new URL(getServerEnv().DATABASE_URL).host;

// Thứ tự xóa: bảng con trước, bảng cha sau (khóa ngoại)
const tables = [
  { label: "Dòng món trong yêu cầu", table: orderRequestItem },
  { label: "Yêu cầu đặt món", table: orderRequest },
  { label: "Tin liên hệ", table: contactMessage },
  { label: "Bộ đếm chống spam", table: formRateLimit },
  { label: "Ảnh món", table: menuItemImage },
  { label: "Lựa chọn giá", table: menuItemOption },
  { label: "Món", table: menuItem },
  { label: "Danh mục", table: category },
] as const;

console.log(`Database: ${host}`);
for (const { label, table } of tables) {
  const [row] = await db.select({ total: count() }).from(table);
  console.log(`  ${label}: ${row?.total ?? 0}`);
}
console.log("  (Giữ lại: tài khoản quản trị)");

if (!confirmed) {
  console.log("\nChưa xóa gì. Chắc chắn muốn xóa hết thì chạy: npm run db:clear -- --yes");
  process.exit(0);
}

const images = await db.select({ publicId: menuItemImage.publicId }).from(menuItemImage);
let cloudFailed = 0;
for (const { publicId } of images) {
  if (!(await deleteCloudinaryImage(publicId).catch(() => false))) cloudFailed += 1;
}

await db.transaction(async (tx) => {
  for (const { table } of tables) await tx.delete(table);
});

console.log(
  `\nĐã xóa hết dữ liệu. Ảnh trên Cloudinary: xóa ${images.length - cloudFailed}/${images.length}.`,
);
if (cloudFailed > 0) {
  console.log("Một số ảnh chưa xóa được trên Cloudinary — xóa tay trong Media Library nếu cần.");
}
process.exit(0);
