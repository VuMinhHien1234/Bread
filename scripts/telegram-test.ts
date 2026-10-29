/** Gửi một tin thử vào nhóm Telegram để kiểm tra TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID. */
import { sendTelegramMessage } from "@/server/services/telegram";

const result = await sendTelegramMessage(
  "✅ Bánh Mì Thanh Long: tin thử từ dự án. Kết nối Telegram hoạt động.",
);
if (result.ok) {
  console.log(`Đã gửi (message id ${result.messageId}). Kiểm tra nhóm Telegram.`);
} else {
  console.error(`Gửi lỗi: ${result.error}`);
  process.exit(1);
}
