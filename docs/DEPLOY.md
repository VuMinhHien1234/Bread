# Hướng dẫn triển khai (Netlify + Neon)

## 1. Tạo dịch vụ
1. **Neon**: tạo project, copy chuỗi kết nối (pooled) → `DATABASE_URL`.
2. **Cloudinary**: lấy cloud name, API key, API secret → `CLOUDINARY_*`.
3. **Telegram**: tạo bot với @BotFather → `TELEGRAM_BOT_TOKEN`; thêm bot vào nhóm của tiệm, chạy `npm run telegram:chat-id` để lấy `TELEGRAM_CHAT_ID`, rồi `npm run telegram:test`.

## 2. Biến môi trường
Điền theo `.env.example` ở máy (`.env`) và trong Netlify → Site settings → Environment variables. `BETTER_AUTH_URL` và `NEXT_PUBLIC_SITE_URL` là địa chỉ web thật. `BETTER_AUTH_SECRET` và `IP_HASH_SALT` phải là chuỗi ngẫu nhiên dài (`openssl rand -base64 32`).

## 3. Khởi tạo database (chạy ở máy, trỏ vào Neon)
```
npm run db:migrate
npm run admin:create -- --email chu@tiem.vn   # đặt ADMIN_PASSWORD trước khi chạy
```
`db:seed` chỉ dùng thử, không chạy trên web thật (sẽ thay dữ liệu thực đơn).

## 4. GitHub + Netlify (CI/CD)
1. Tạo repo GitHub, đẩy code lên nhánh `main` (dự án dùng **npm** — chỉ giữ `package-lock.json`, không dùng pnpm/yarn).
2. **CI** (`.github/workflows/ci.yml`) tự chạy mỗi lần push/PR: Prettier → typecheck → lint → test → build. Không cần secret. Bật Settings → Branches → bảo vệ `main`, yêu cầu check "Typecheck · Lint · Test · Build" xanh trước khi merge.
3. **Netlify**: Add new site → Import from GitHub → chọn repo. Netlify đọc `netlify.toml` (Node 22, `npm run build`) và tự nhận Next.js. Điền biến môi trường (mục 2) **trước** lần deploy đầu.
   - Push `main` → bản chính thức; mỗi pull request → bản xem trước (Deploy Preview).
   - Nếu không muốn bản xem trước gửi tin Telegram thật, đặt biến riêng cho ngữ cảnh "Deploy Previews" (TELEGRAM_CHAT_ID của nhóm thử).
4. **Migration**: khi có migration mới, vào Actions → "Migration database" → Run workflow, gõ `migrate` (cần secret `DATABASE_URL`). Hoặc chạy `npm run db:migrate` ở máy.
5. Sau khi deploy xong, thử: đặt món → tin nhắn Telegram → đăng nhập `/admin/dang-nhap`.

## 5. Sao lưu hằng tuần (GitHub Actions → Google Drive)
File `.github/workflows/backup.yml` (chạy 03:00 sáng Chủ nhật giờ VN, giữ khoảng 3 tháng). Cần:
- Secret `DATABASE_URL` (chuỗi kết nối Neon).
- Secret `RCLONE_CONFIG`: nội dung `rclone.conf` có remote tên `gdrive` (chạy `rclone config` ở máy, chọn Google Drive, rồi `cat ~/.config/rclone/rclone.conf`).
- (Tuỳ chọn) biến `GDRIVE_FOLDER`: tên thư mục trên Drive.
Chạy thử bằng nút "Run workflow". Khôi phục: `gunzip -c file.sql.gz | psql "$DATABASE_URL"`.
Sao lưu thủ công: `npm run db:backup` (cần `pg_dump`).

## 6. Trước khi mở web cho khách
Thay mọi giá trị TẠM trong `src/lib/shop-config.ts` (số điện thoại, Zalo, Telegram, địa chỉ, link Google Maps + link nhúng bản đồ, giờ mở cửa, câu chuyện, 3 điểm mạnh `highlights`, ảnh lớn trang chủ `heroImage`, giấy phép), đọc lại trang Chính sách bảo mật, và đổi ảnh chia sẻ `src/app/opengraph-image.png` nếu muốn.

## 7. Font
Font tự host trong `src/app/fonts/` (Newsreader cho tiêu đề, Source Sans 3 cho nội dung — giấy phép SIL OFL, file kèm theo), đã cắt còn Latin + tiếng Việt. Build không cần gọi Google Fonts.
