import "server-only";
import { revalidatePath, updateTag } from "next/cache";
import { MENU_CACHE_TAG } from "@/server/cache-tags";
import { ADMIN_BASE } from "@/lib/admin-path";

/** Làm mới ngay dữ liệu thực đơn trên web khách và các trang quản trị liên quan. */
export function refreshMenu() {
  updateTag(MENU_CACHE_TAG);
  revalidatePath("/", "layout");
}

export function refreshRequests() {
  revalidatePath(ADMIN_BASE, "layout");
}
