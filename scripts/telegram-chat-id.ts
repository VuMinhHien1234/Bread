export {};

/**
 * In các chat id mà bot nhận được gần đây, để lấy TELEGRAM_CHAT_ID (task G0.6).
 * Trước khi chạy: thêm bot vào nhóm và gửi một tin bất kỳ vào nhóm đó.
 */
type Update = {
  message?: { chat: { id: number; title?: string; type: string; first_name?: string } };
};

// Chỉ cần token (chưa có TELEGRAM_CHAT_ID lúc chạy script này nên không kiểm tra toàn bộ biến)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
  console.error("Thiếu TELEGRAM_BOT_TOKEN trong file .env.");
  process.exit(1);
}
const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
const data = (await response.json()) as { ok: boolean; description?: string; result?: Update[] };

if (!data.ok) {
  console.error(`Telegram báo lỗi: ${data.description ?? "không rõ"}`);
  process.exit(1);
}

const chats = new Map<number, string>();
for (const update of data.result ?? []) {
  const chat = update.message?.chat;
  if (chat) chats.set(chat.id, `${chat.title ?? chat.first_name ?? "(không tên)"} [${chat.type}]`);
}

if (chats.size === 0) {
  console.log("Chưa thấy cuộc trò chuyện nào. Gửi một tin vào nhóm có bot rồi chạy lại.");
} else {
  for (const [id, label] of chats) console.log(`${id}\t${label}`);
}
