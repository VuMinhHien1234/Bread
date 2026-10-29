# Bánh Mì Thanh Long

Website giới thiệu món và nhận **yêu cầu đặt món** cho tiệm bánh mì (không bán hàng online). Yêu cầu của khách được lưu vào database và báo ngay về nhóm Telegram của tiệm.

Quy tắc làm việc và tài liệu: xem `AGENTS.md` và thư mục `docs/`. Tiến độ: `docs/PROGRESS.md`.

## Chạy trên máy

Cần Node.js 20.9 trở lên.

```bash
npm install
cp .env.example .env        # rồi điền giá trị thật vào .env
npm run db:migrate          # tạo bảng trên database Neon
npm run db:seed             # (tuỳ chọn) dữ liệu mẫu để xem thử
npm run admin:create -- --email ban@example.com   # tạo tài khoản quản trị, mật khẩu in ra một lần
npm run dev                 # http://localhost:3000
```

Lấy `TELEGRAM_CHAT_ID`: thêm bot vào nhóm, gửi một tin vào nhóm, rồi chạy `npm run telegram:chat-id`.
Thử kết nối Telegram: `npm run telegram:test`.

## Kiểm tra trước khi nộp

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Các bài kiểm tra database chạy trên Postgres giả lập trong bộ nhớ (PGlite), không cần database thật.
