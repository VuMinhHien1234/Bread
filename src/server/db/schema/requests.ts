import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { menuItem, menuItemOption } from "./menu";
import { createdAt, primaryId, updatedAt } from "./shared";

export const fulfillmentType = pgEnum("fulfillment_type", ["PICKUP", "DELIVERY"]);
export const orderRequestStatus = pgEnum("order_request_status", [
  "NEW",
  "CALLED",
  "DONE",
  "CANCELLED",
]);
export const contactStatus = pgEnum("contact_status", ["NEW", "HANDLED"]);

/** Yêu cầu đặt món — KHÔNG phải đơn hàng đã chốt (master plan B4). */
export const orderRequest = pgTable(
  "order_request",
  {
    id: primaryId(),
    /** Mã dễ đọc, ví dụ TL-1007-023 */
    code: varchar("code", { length: 20 }).notNull().unique(),
    customerName: varchar("customer_name", { length: 80 }).notNull(),
    phone: varchar("phone", { length: 15 }).notNull(),
    fulfillment: fulfillmentType("fulfillment").notNull(),
    deliveryAddress: varchar("delivery_address", { length: 300 }),
    /** Giờ khách muốn nhận; null nghĩa là "sớm nhất có thể" */
    requestedAt: timestamp("requested_at", { withTimezone: true }),
    note: varchar("note", { length: 500 }),
    /** Tổng tham khảo do server tính từ giá trong DB */
    estimatedTotal: integer("estimated_total").notNull(),
    status: orderRequestStatus("status").notNull().default("NEW"),
    adminNote: varchar("admin_note", { length: 500 }),
    telegramSentAt: timestamp("telegram_sent_at", { withTimezone: true }),
    telegramMessageId: bigint("telegram_message_id", { mode: "number" }),
    telegramError: varchar("telegram_error", { length: 500 }),
    /** SHA-256(IP + muối); không lưu IP thô */
    ipHash: varchar("ip_hash", { length: 64 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    check(
      "order_request_delivery_address_check",
      sql`${table.fulfillment} <> 'DELIVERY' OR ${table.deliveryAddress} IS NOT NULL`,
    ),
    index("order_request_status_idx").on(table.status, table.createdAt.desc()),
    index("order_request_created_idx").on(table.createdAt.desc()),
    index("order_request_phone_idx").on(table.phone),
  ],
);

/** Dòng món trong yêu cầu; lưu bản chụp tên + giá để sửa thực đơn sau này không làm sai lịch sử. */
export const orderRequestItem = pgTable(
  "order_request_item",
  {
    id: primaryId(),
    orderRequestId: text("order_request_id")
      .notNull()
      .references(() => orderRequest.id, { onDelete: "cascade" }),
    menuItemId: text("menu_item_id").references(() => menuItem.id, { onDelete: "set null" }),
    menuItemOptionId: text("menu_item_option_id").references(() => menuItemOption.id, {
      onDelete: "set null",
    }),
    itemName: varchar("item_name", { length: 120 }).notNull(),
    optionName: varchar("option_name", { length: 60 }).notNull(),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: integer("line_total").notNull(),
  },
  (table) => [
    check("order_request_item_quantity_check", sql`${table.quantity} BETWEEN 1 AND 50`),
    index("order_request_item_request_idx").on(table.orderRequestId),
    index("order_request_item_menu_item_idx").on(table.menuItemId),
  ],
);

export const contactMessage = pgTable(
  "contact_message",
  {
    id: primaryId(),
    name: varchar("name", { length: 80 }).notNull(),
    phone: varchar("phone", { length: 15 }),
    email: varchar("email", { length: 120 }),
    message: varchar("message", { length: 1000 }).notNull(),
    status: contactStatus("status").notNull().default("NEW"),
    telegramSentAt: timestamp("telegram_sent_at", { withTimezone: true }),
    telegramError: varchar("telegram_error", { length: 500 }),
    ipHash: varchar("ip_hash", { length: 64 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    check(
      "contact_message_contact_check",
      sql`${table.phone} IS NOT NULL OR ${table.email} IS NOT NULL`,
    ),
    index("contact_message_status_idx").on(table.status, table.createdAt.desc()),
  ],
);

/** Đếm số lần gửi form theo IP đã băm; Netlify chạy serverless nên không giữ được trong bộ nhớ. */
export const formRateLimit = pgTable("form_rate_limit", {
  key: varchar("key", { length: 120 }).primaryKey(),
  count: integer("count").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
});
