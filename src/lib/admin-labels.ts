import type { BadgeTone } from "@/components/ui/Badge";

export type OrderStatus = "NEW" | "CALLED" | "DONE" | "CANCELLED";
export type ContactStatus = "NEW" | "HANDLED";

export const orderStatusLabel: Record<OrderStatus, string> = {
  NEW: "Mới",
  CALLED: "Đã gọi",
  DONE: "Xong",
  CANCELLED: "Hủy",
};

export const orderStatusTone: Record<OrderStatus, BadgeTone> = {
  NEW: "primary",
  CALLED: "yellow",
  DONE: "green",
  CANCELLED: "neutral",
};

export const contactStatusLabel: Record<ContactStatus, string> = {
  NEW: "Mới",
  HANDLED: "Đã xử lý",
};

export const orderStatuses = Object.keys(orderStatusLabel) as OrderStatus[];

export function isOrderStatus(value: string | undefined): value is OrderStatus {
  return value !== undefined && value in orderStatusLabel;
}

export function isContactStatus(value: string | undefined): value is ContactStatus {
  return value !== undefined && value in contactStatusLabel;
}

export const fulfillmentLabel = { PICKUP: "Lấy tại quầy", DELIVERY: "Giao hàng" } as const;
