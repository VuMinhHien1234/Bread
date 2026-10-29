import { formatVND } from "@/lib/money";
import { formatPhoneDisplay } from "@/lib/phone";
import { formatVietnamDateTime } from "@/lib/datetime";

/** Telegram ở chế độ HTML chỉ cần escape ba ký tự này. Mọi dữ liệu khách nhập phải qua hàm này. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export type OrderMessageInput = {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  fulfillment: "PICKUP" | "DELIVERY";
  deliveryAddress: string | null;
  requestedAt: Date | null;
  note: string | null;
  estimatedTotal: number;
  items: ReadonlyArray<{
    itemName: string;
    optionName: string;
    quantity: number;
    lineTotal: number;
  }>;
  /** true khi gửi ngoài giờ mở cửa */
  isOutsideOpeningHours: boolean;
  siteUrl: string;
};

/**
 * Số điện thoại để dạng chữ thường: Telegram tự nhận ra và cho bấm gọi.
 * Không dùng liên kết `tel:` vì Telegram chỉ chấp nhận http(s) trong liên kết của bot.
 */
export function formatOrderRequestMessage(input: OrderMessageInput): string {
  const lines: string[] = [
    `🥖 <b>YÊU CẦU ĐẶT MÓN #${escapeHtml(input.code)}</b>`,
    `👤 ${escapeHtml(input.customerName)} — ${escapeHtml(formatPhoneDisplay(input.phone))}`,
    input.fulfillment === "DELIVERY"
      ? `🛵 Giao: ${escapeHtml(input.deliveryAddress ?? "")}`
      : "🛍 Lấy tại quầy",
    input.requestedAt
      ? `⏰ ${escapeHtml(formatVietnamDateTime(input.requestedAt))}`
      : "⏰ Sớm nhất có thể",
  ];

  if (input.isOutsideOpeningHours) lines.push("🌙 Gửi ngoài giờ mở cửa");

  lines.push("");
  for (const item of input.items) {
    const name = `${item.itemName} (${item.optionName})`;
    lines.push(`• ${item.quantity} × ${escapeHtml(name)} — ${formatVND(item.lineTotal)}`);
  }

  lines.push("", `💰 Tạm tính: ${formatVND(input.estimatedTotal)} (giá tham khảo)`);
  if (input.note) lines.push(`📝 Ghi chú: ${escapeHtml(input.note)}`);
  lines.push("", `🔗 Xem: ${escapeHtml(`${input.siteUrl}/admin/yeu-cau/${input.id}`)}`);

  return lines.join("\n");
}

export type ContactMessageInput = {
  name: string;
  phone: string | null;
  email: string | null;
  message: string;
  isOutsideOpeningHours: boolean;
  siteUrl: string;
};

export function formatContactMessage(input: ContactMessageInput): string {
  const contacts = [input.phone ? formatPhoneDisplay(input.phone) : null, input.email]
    .filter((value): value is string => value !== null)
    .map(escapeHtml)
    .join(" / ");

  const lines = ["✉️ <b>TIN LIÊN HỆ MỚI</b>", `👤 ${escapeHtml(input.name)} — ${contacts}`];
  if (input.isOutsideOpeningHours) lines.push("🌙 Gửi ngoài giờ mở cửa");
  lines.push(
    `💬 ${escapeHtml(input.message)}`,
    "",
    `🔗 Xem: ${escapeHtml(`${input.siteUrl}/admin/lien-he`)}`,
  );
  return lines.join("\n");
}
