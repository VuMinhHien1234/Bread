"use server";

import type { ActionResult } from "@/lib/action-result";
import {
  idInputSchema,
  menuItemSchema,
  reorderWithParentSchema,
  toggleSchema,
} from "@/lib/validation/admin";
import { validationError } from "@/lib/validation/field-errors";
import { getDb } from "@/server/db";
import {
  createMenuItem as createMenuItemRecord,
  deleteMenuItem as deleteMenuItemRecord,
  reorderMenuItems as reorderMenuItemRecords,
  setActive,
  setSoldOutToday,
  updateMenuItem as updateMenuItemRecord,
} from "@/server/services/admin-menu";
import { deleteCloudinaryImage } from "@/server/services/cloudinary";
import { refreshMenu } from "./refresh";
import { runAdminAction } from "./run-admin-action";

export async function createMenuItem(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAdminAction("createMenuItem", async () => {
    const parsed = menuItemSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const result = await createMenuItemRecord(getDb(), parsed.data);
    if (result.ok) refreshMenu();
    return result;
  });
}

export async function updateMenuItem(id: unknown, input: unknown): Promise<ActionResult> {
  return runAdminAction("updateMenuItem", async () => {
    const target = idInputSchema.safeParse({ id });
    const parsed = menuItemSchema.safeParse(input);
    if (!target.success) return validationError(target.error);
    if (!parsed.success) return validationError(parsed.error);
    const result = await updateMenuItemRecord(getDb(), target.data.id, parsed.data);
    if (result.ok) refreshMenu();
    return result;
  });
}

export async function deleteMenuItem(input: unknown): Promise<ActionResult> {
  return runAdminAction("deleteMenuItem", async () => {
    const parsed = idInputSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const result = await deleteMenuItemRecord(getDb(), parsed.data.id, deleteCloudinaryImage);
    if (result.ok) refreshMenu();
    return result;
  });
}

/** Bật/tắt "Tạm hết hôm nay"; web khách thấy thay đổi ngay. */
export async function toggleSoldOut(input: unknown): Promise<ActionResult> {
  return runAdminAction("toggleSoldOut", async () => {
    const parsed = toggleSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const result = await setSoldOutToday(getDb(), parsed.data.id, parsed.data.value, new Date());
    if (result.ok) refreshMenu();
    return result;
  });
}

export async function toggleActive(input: unknown): Promise<ActionResult> {
  return runAdminAction("toggleActive", async () => {
    const parsed = toggleSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const result = await setActive(getDb(), parsed.data.id, parsed.data.value);
    if (result.ok) refreshMenu();
    return result;
  });
}

export async function reorderMenuItems(input: unknown): Promise<ActionResult> {
  return runAdminAction("reorderMenuItems", async () => {
    const parsed = reorderWithParentSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const result = await reorderMenuItemRecords(getDb(), parsed.data.parentId, parsed.data.ids);
    if (result.ok) refreshMenu();
    return result;
  });
}
