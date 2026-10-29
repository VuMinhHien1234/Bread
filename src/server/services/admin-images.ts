import { and, asc, count, eq } from "drizzle-orm";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { menuItem, menuItemImage } from "@/server/db/schema";
import type { AppDb } from "@/server/db/types";
import { logServerError } from "@/server/log";

type NewImage = {
  menuItemId: string;
  publicId: string;
  url: string;
  width: number;
  height: number;
  alt: string | null;
};

/** Ảnh đầu tiên của món tự thành ảnh chính. */
export async function addMenuItemImage(
  db: AppDb,
  input: NewImage,
): Promise<ActionResult<{ id: string }>> {
  const [item] = await db
    .select({ id: menuItem.id })
    .from(menuItem)
    .where(eq(menuItem.id, input.menuItemId))
    .limit(1);
  if (!item) return actionError("Không tìm thấy món.");

  const [existing] = await db
    .select({ total: count() })
    .from(menuItemImage)
    .where(eq(menuItemImage.menuItemId, input.menuItemId));
  const total = existing?.total ?? 0;

  const [created] = await db
    .insert(menuItemImage)
    .values({ ...input, isPrimary: total === 0, sortOrder: total })
    .returning({ id: menuItemImage.id });
  if (!created) throw new Error("Không lưu được ảnh");
  return actionOk({ id: created.id });
}

export async function setPrimaryImage(db: AppDb, imageId: string): Promise<ActionResult> {
  return db.transaction(async (tx) => {
    const [image] = await tx
      .select({ menuItemId: menuItemImage.menuItemId })
      .from(menuItemImage)
      .where(eq(menuItemImage.id, imageId))
      .limit(1);
    if (!image) return actionError("Không tìm thấy ảnh.");
    await tx
      .update(menuItemImage)
      .set({ isPrimary: false })
      .where(eq(menuItemImage.menuItemId, image.menuItemId));
    await tx.update(menuItemImage).set({ isPrimary: true }).where(eq(menuItemImage.id, imageId));
    return actionOk(undefined);
  });
}

/** Xóa ảnh; nếu đó là ảnh chính thì ảnh kế tiếp được lên thay. Cloudinary xóa sau khi DB xong. */
export async function deleteMenuItemImage(
  db: AppDb,
  imageId: string,
  deleteImage: (publicId: string) => Promise<boolean>,
): Promise<ActionResult> {
  const removed = await db.transaction(async (tx) => {
    const [image] = await tx.delete(menuItemImage).where(eq(menuItemImage.id, imageId)).returning();
    if (image?.isPrimary) {
      const [next] = await tx
        .select({ id: menuItemImage.id })
        .from(menuItemImage)
        .where(eq(menuItemImage.menuItemId, image.menuItemId))
        .orderBy(asc(menuItemImage.sortOrder))
        .limit(1);
      if (next) {
        await tx
          .update(menuItemImage)
          .set({ isPrimary: true })
          .where(eq(menuItemImage.id, next.id));
      }
    }
    return image;
  });
  if (!removed) return actionError("Không tìm thấy ảnh.");

  try {
    if (!(await deleteImage(removed.publicId))) {
      logServerError("deleteMenuItemImage", `Cloudinary từ chối xóa ${removed.publicId}`);
    }
  } catch (error) {
    logServerError("deleteMenuItemImage", error);
  }
  return actionOk(undefined);
}

export async function reorderImages(
  db: AppDb,
  menuItemId: string,
  ids: string[],
): Promise<ActionResult> {
  await db.transaction(async (tx) => {
    for (const [index, id] of ids.entries()) {
      await tx
        .update(menuItemImage)
        .set({ sortOrder: index })
        .where(and(eq(menuItemImage.id, id), eq(menuItemImage.menuItemId, menuItemId)));
    }
  });
  return actionOk(undefined);
}
