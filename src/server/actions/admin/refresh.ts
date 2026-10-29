import "server-only";
import { revalidatePath, updateTag } from "next/cache";
import { MENU_CACHE_TAG } from "@/server/cache-tags";

/** Làm mới ngay dữ liệu thực đơn trên web khách và các trang quản trị liên quan. */
export function refreshMenu() {
  updateTag(MENU_CACHE_TAG);
  revalidatePath("/", "layout");
}

export function refreshRequests() {
  revalidatePath("/admin", "layout");
}
