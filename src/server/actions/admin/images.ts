"use server";

import type { ActionResult } from "@/lib/action-result";
import { idInputSchema, imageInputSchema, reorderWithParentSchema } from "@/lib/validation/admin";
import { validationError } from "@/lib/validation/field-errors";
import { getDb } from "@/server/db";
import {
  addMenuItemImage as addImageRecord,
  deleteMenuItemImage as deleteImageRecord,
  reorderImages as reorderImageRecords,
  setPrimaryImage as setPrimaryImageRecord,
} from "@/server/services/admin-images";
import {
  createUploadSignature,
  deleteCloudinaryImage,
  type UploadSignature,
} from "@/server/services/cloudinary";
import { refreshMenu } from "./refresh";
import { runAdminAction } from "./run-admin-action";
import { actionOk } from "@/lib/action-result";

/** Chữ ký để trình duyệt tải ảnh thẳng lên Cloudinary; API secret không bao giờ rời server. */
export async function getUploadSignature(): Promise<ActionResult<UploadSignature>> {
  return runAdminAction("getUploadSignature", () =>
    Promise.resolve(actionOk(createUploadSignature())),
  );
}

export async function addMenuItemImage(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAdminAction("addMenuItemImage", async () => {
    const parsed = imageInputSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const result = await addImageRecord(getDb(), parsed.data);
    if (result.ok) refreshMenu();
    return result;
  });
}

export async function deleteMenuItemImage(input: unknown): Promise<ActionResult> {
  return runAdminAction("deleteMenuItemImage", async () => {
    const parsed = idInputSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const result = await deleteImageRecord(getDb(), parsed.data.id, deleteCloudinaryImage);
    if (result.ok) refreshMenu();
    return result;
  });
}

export async function setPrimaryImage(input: unknown): Promise<ActionResult> {
  return runAdminAction("setPrimaryImage", async () => {
    const parsed = idInputSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const result = await setPrimaryImageRecord(getDb(), parsed.data.id);
    if (result.ok) refreshMenu();
    return result;
  });
}

export async function reorderImages(input: unknown): Promise<ActionResult> {
  return runAdminAction("reorderImages", async () => {
    const parsed = reorderWithParentSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const result = await reorderImageRecords(getDb(), parsed.data.parentId, parsed.data.ids);
    if (result.ok) refreshMenu();
    return result;
  });
}
