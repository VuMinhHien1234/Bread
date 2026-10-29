import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const getServerEnv = vi.fn();
vi.mock("@/lib/env", () => ({ getServerEnv: () => getServerEnv() }));

const { sendTelegramMessage } = await import("./telegram");
const { escapeHtml, formatContactMessage, formatOrderRequestMessage } =
  await import("./telegram-format");

const okResponse = () =>
  new Response(JSON.stringify({ ok: true, result: { message_id: 42 } }), { status: 200 });
const errorResponse = (status: number, description: string) =>
  new Response(JSON.stringify({ ok: false, description }), { status });

const noSleep = () => Promise.resolve();

describe("escapeHtml", () => {
  it("escape & < > để khách không chèn được thẻ HTML vào tin", () => {
    expect(escapeHtml(`<b>"A" & B</b>`)).toBe(`&lt;b&gt;"A" &amp; B&lt;/b&gt;`);
  });
});

describe("formatOrderRequestMessage", () => {
  const base = {
    id: "req-1",
    code: "TL-1007-023",
    customerName: "Nguyễn Văn A",
    phone: "0901234567",
    fulfillment: "PICKUP" as const,
    deliveryAddress: null,
    requestedAt: null,
    note: null,
    estimatedTotal: 90000,
    items: [
      { itemName: "Bánh mì thịt nướng", optionName: "Đặc biệt", quantity: 2, lineTotal: 70000 },
      { itemName: "Cà phê sữa đá", optionName: "Thường", quantity: 1, lineTotal: 20000 },
    ],
    isOutsideOpeningHours: false,
    siteUrl: "https://example.vn",
  };

  it("dựng tin theo mẫu: mã, khách, món, tạm tính, liên kết quản trị", () => {
    const text = formatOrderRequestMessage(base);
    expect(text).toContain("YÊU CẦU ĐẶT MÓN #TL-1007-023");
    expect(text).toContain("Nguyễn Văn A — 0901 234 567");
    expect(text).toContain("🛍 Lấy tại quầy");
    expect(text).toContain("⏰ Sớm nhất có thể");
    expect(text).toContain("• 2 × Bánh mì thịt nướng (Đặc biệt) — 70.000₫");
    expect(text).toContain("💰 Tạm tính: 90.000₫ (giá tham khảo)");
    expect(text).toContain("https://example.vn/admin/yeu-cau/req-1");
  });

  it("hiện địa chỉ khi giao, giờ hẹn, ghi chú và cờ ngoài giờ", () => {
    const text = formatOrderRequestMessage({
      ...base,
      fulfillment: "DELIVERY",
      deliveryAddress: "12 Ngõ 5, Láng Hạ",
      requestedAt: new Date("2026-10-08T00:30:00Z"), // 07:30 giờ Việt Nam, thứ Năm
      note: "ít hành",
      isOutsideOpeningHours: true,
    });
    expect(text).toContain("🛵 Giao: 12 Ngõ 5, Láng Hạ");
    expect(text).toContain("⏰ 07:30 thứ Năm 08/10");
    expect(text).toContain("📝 Ghi chú: ít hành");
    expect(text).toContain("🌙 Gửi ngoài giờ mở cửa");
  });

  it("escape dữ liệu khách nhập", () => {
    const text = formatOrderRequestMessage({ ...base, customerName: "<script>", note: "a & b" });
    expect(text).toContain("&lt;script&gt;");
    expect(text).toContain("a &amp; b");
    expect(text).not.toContain("<script>");
  });
});

describe("formatContactMessage", () => {
  it("gộp SĐT và email, bỏ phần không có", () => {
    const text = formatContactMessage({
      name: "Trần Thị B",
      phone: null,
      email: "b@gmail.com",
      message: "Tiệm có nhận đặt tiệc không?",
      isOutsideOpeningHours: false,
      siteUrl: "https://example.vn",
    });
    expect(text).toContain("Trần Thị B — b@gmail.com");
    expect(text).toContain("https://example.vn/admin/lien-he");
  });
});

describe("sendTelegramMessage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getServerEnv.mockReturnValue({ TELEGRAM_BOT_TOKEN: "123:TOKEN", TELEGRAM_CHAT_ID: "-100123" });
  });

  it("thiếu cấu hình thì trả lỗi chứ không ném, để yêu cầu của khách không bị hỏng", async () => {
    getServerEnv.mockImplementation(() => {
      throw new Error("Biến môi trường chưa đúng:\n- TELEGRAM_BOT_TOKEN: thiếu");
    });
    const fetchFn = vi.fn();
    const result = await sendTelegramMessage("x", { fetchFn, sleep: noSleep });
    expect(result).toEqual({ ok: false, error: "Telegram chưa được cấu hình" });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("trả message id khi Telegram nhận tin", async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse());
    const result = await sendTelegramMessage("xin chào", { fetchFn, sleep: noSleep });
    expect(result).toEqual({ ok: true, messageId: 42 });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("thử lại đúng một lần khi lỗi mạng rồi thành công", async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(okResponse());
    const result = await sendTelegramMessage("x", { fetchFn, sleep: noSleep });
    expect(result.ok).toBe(true);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("không thử lại với lỗi 4xx như sai chat id", async () => {
    const fetchFn = vi.fn().mockResolvedValue(errorResponse(400, "Bad Request: chat not found"));
    const result = await sendTelegramMessage("x", { fetchFn, sleep: noSleep });
    expect(result).toEqual({ ok: false, error: "Telegram 400: Bad Request: chat not found" });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("không bao giờ ném lỗi và không để lộ token trong thông báo lỗi", async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValue(
        new Error("fetch failed https://api.telegram.org/bot123:TOKEN/sendMessage"),
      );
    const result = await sendTelegramMessage("x", { fetchFn, sleep: noSleep });
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("TOKEN");
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
