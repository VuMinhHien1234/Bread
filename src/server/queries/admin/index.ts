import "server-only";
import { getDb } from "@/server/db";
import { requireAdmin } from "@/server/auth/session";
import { loadCategories, loadMenuItemForEdit, loadMenuItems } from "./menu";
import {
  loadContactMessages,
  loadNewRequestCount,
  loadOrderRequest,
  loadOrderRequests,
} from "./requests";

/**
 * Mọi query quản trị gọi `requireAdmin()` ở dòng đầu tiên (TASK-BE mục 3),
 * không dựa vào layout hay middleware một mình.
 */
export async function listCategories() {
  await requireAdmin();
  return loadCategories(getDb());
}

export async function listMenuItems(filter?: { categoryId?: string; q?: string }) {
  await requireAdmin();
  return loadMenuItems(getDb(), filter);
}

export async function getMenuItemForEdit(id: string) {
  await requireAdmin();
  return loadMenuItemForEdit(getDb(), id);
}

export async function listOrderRequests(options?: Parameters<typeof loadOrderRequests>[1]) {
  await requireAdmin();
  return loadOrderRequests(getDb(), options);
}

export async function getOrderRequest(id: string) {
  await requireAdmin();
  return loadOrderRequest(getDb(), id);
}

export async function countNewRequests() {
  await requireAdmin();
  return loadNewRequestCount(getDb());
}

export async function listContactMessages(options?: Parameters<typeof loadContactMessages>[1]) {
  await requireAdmin();
  return loadContactMessages(getDb(), options);
}
