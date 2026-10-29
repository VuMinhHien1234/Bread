"use server";

import type { ActionResult } from "@/lib/action-result";
import { categorySchema, idInputSchema, reorderSchema } from "@/lib/validation/admin";
import { validationError } from "@/lib/validation/field-errors";
import { getDb } from "@/server/db";
import {
  createCategory as createCategoryRecord,
  deleteCategory as deleteCategoryRecord,
  reorderCategories as reorderCategoryRecords,
  updateCategory as updateCategoryRecord,
} from "@/server/services/admin-categories";
import { refreshMenu } from "./refresh";
import { runAdminAction } from "./run-admin-action";

export async function createCategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAdminAction("createCategory", async () => {
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const result = await createCategoryRecord(getDb(), parsed.data);
    if (result.ok) refreshMenu();
    return result;
  });
}

export async function updateCategory(id: unknown, input: unknown): Promise<ActionResult> {
  return runAdminAction("updateCategory", async () => {
    const target = idInputSchema.safeParse({ id });
    const parsed = categorySchema.safeParse(input);
    if (!target.success) return validationError(target.error);
    if (!parsed.success) return validationError(parsed.error);
    const result = await updateCategoryRecord(getDb(), target.data.id, parsed.data);
    if (result.ok) refreshMenu();
    return result;
  });
}

export async function deleteCategory(input: unknown): Promise<ActionResult> {
  return runAdminAction("deleteCategory", async () => {
    const parsed = idInputSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const result = await deleteCategoryRecord(getDb(), parsed.data.id);
    if (result.ok) refreshMenu();
    return result;
  });
}

export async function reorderCategories(input: unknown): Promise<ActionResult> {
  return runAdminAction("reorderCategories", async () => {
    const parsed = reorderSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const result = await reorderCategoryRecords(getDb(), parsed.data.ids);
    if (result.ok) refreshMenu();
    return result;
  });
}
