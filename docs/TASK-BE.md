# TASK-BE — Server / Backend Bánh Mì Thanh Long

> Dựa trên `00-MASTER-PLAN` v1.0. Đọc cùng `01-TECH-STANDARDS.md`, `04-SERVER-LAYER.md`, `07-TELEGRAM-DAT-MON.md`, `08-SECURITY-SEO.md`. Schema: `TASK-DB.md`.
> Liên quan kế hoạch task: **G1.10 – G1.14**, **G2.1 – G2.10** (phần server), **G3.8 – G3.13**, **G5.1 – G5.3**, **G5.9**, **G6.2 – G6.4**.

“Backend” ở dự án này **không phải server riêng**: là phần chạy phía server trong cùng dự án Next.js (App Router) — query, server action, route handler, thư viện dùng chung.

---

## 1. Cấu trúc thư mục server

Giữ cấu trúc của code Lamora nếu đã có; nếu chưa có, dùng:

```
src/
  server/
    db/                 # client ORM, schema, seed
    auth/               # cấu hình Better Auth, requireAdmin()
    queries/
      public/           # đọc dữ liệu cho web khách (menu, món)
      admin/            # đọc dữ liệu cho trang quản trị
    actions/
      public/           # createOrderRequest, createContactMessage
      admin/            # CRUD danh mục, món, ảnh, đổi trạng thái
    services/
      telegram.ts       # gửi tin, định dạng tin
      cloudinary.ts     # ký upload, xóa ảnh
      rate-limit.ts     # đếm theo form_rate_limit
      # (đã có: telegram.ts, telegram-format.ts, cloudinary.ts)
      order-code.ts     # sinh mã TL-MMDD-NNN
  lib/
    validation/         # schema kiểm tra dữ liệu dùng chung FE + BE
    shop-config.ts      # thông tin tiệm (P0 là file, P1 chuyển vào DB)
    env.ts              # đọc + kiểm tra biến môi trường
    money.ts            # formatVND(25000) → "25.000₫"
    phone.ts            # chuẩn hóa SĐT Việt Nam
app/
  api/
    auth/[...all]/route.ts     # handler Better Auth
    telegram/webhook/route.ts  # P1 — nút trên tin Telegram
```

Quy tắc: component trong `app/` **không gọi ORM trực tiếp**; luôn qua `server/queries` hoặc `server/actions`. File trong `server/` có `import "server-only"`.

---

## 2. Biến môi trường (`lib/env.ts`)

| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `DATABASE_URL` | ✔ | Neon (pooled) |
| `BETTER_AUTH_SECRET` | ✔ | ≥ 32 ký tự ngẫu nhiên |
| `BETTER_AUTH_URL` | ✔ | URL gốc của site |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | ✔ | |
| `CLOUDINARY_FOLDER` | ✔ | `banh-mi-thanh-long` (dev: `banh-mi-thanh-long-dev`) |
| `TELEGRAM_BOT_TOKEN` | ✔ | Từ BotFather |
| `TELEGRAM_CHAT_ID` | ✔ | Id nhóm “Thanh Long – Đặt món” (số âm) |
| `TELEGRAM_WEBHOOK_SECRET` | P1 | Kiểm tra request webhook |
| `IP_HASH_SALT` | ✔ | Chuỗi ngẫu nhiên để băm IP |
| `NEXT_PUBLIC_SITE_URL` | ✔ | Dùng cho SEO, link trong tin Telegram |
| `NEXT_PUBLIC_GA_ID` | ✖ | Google Analytics (G5.7) |

Kiểm tra bằng schema validation khi khởi động; thiếu biến bắt buộc → dừng build với thông báo rõ ràng. Chỉ biến có tiền tố `NEXT_PUBLIC_` được dùng ở client.

---

## 3. Xác thực và phân quyền (G1.10, G2.1, G2.2, G5.2)

- Better Auth, email + mật khẩu. **Tắt đăng ký** (`disableSignUp`).
- `server/auth/session.ts` có hai hàm: `requireAdmin()` ném `UnauthorizedError` (dùng trong action/query) và `requireAdminPage()` redirect tới `/admin/dang-nhap` (dùng trong page/layout). Không có session hoặc `role !== "ADMIN"` thì bị từ chối.
- **Mọi** admin action và admin query gọi `requireAdmin()` ở dòng đầu tiên — không dựa vào middleware/layout một mình.
- Middleware chỉ làm lớp chặn sớm cho `/admin/*` (trừ trang đăng nhập).
- Giới hạn đăng nhập sai: dùng rate limit của Better Auth (vd. 5 lần / 15 phút).
- Cookie phiên: `httpOnly`, `secure`, `sameSite=lax`.

---

## 4. Kiểm tra dữ liệu (`lib/validation/`)

Dùng thư viện validation đang có trong code (mặc định Zod). Mỗi schema dùng chung cho form ở FE và action ở BE.

### 4.1 `orderRequestSchema`
| Trường | Quy tắc |
|---|---|
| `items` | mảng 1–20 dòng; mỗi dòng `{ menuItemId, optionId, quantity }`; `quantity` nguyên 1–50; không trùng cặp `menuItemId + optionId` (gộp lại) |
| `customerName` | trim, 2–80 ký tự |
| `phone` | SĐT Việt Nam: chấp nhận `0xxxxxxxxx`, `+84xxxxxxxxx`, có dấu cách/chấm; chuẩn hóa về `0` + 9 số; đầu số di động/cố định hợp lệ |
| `fulfillment` | `PICKUP` \| `DELIVERY` |
| `deliveryAddress` | bắt buộc 5–300 ký tự khi `DELIVERY` |
| `requestedAt` | tùy chọn; nếu có: ≥ hiện tại + 15 phút và ≤ hiện tại + 7 ngày (giờ Việt Nam) |
| `note` | tùy chọn, ≤ 500 ký tự |
| `website` | ô bẫy (honeypot), phải rỗng |
| `startedAt` | thời điểm mở form; gửi nhanh hơn 3 giây → coi là bot |

### 4.2 `contactSchema`
`name` 2–80 · `phone` hoặc `email` (ít nhất một) · `message` 10–1000 · honeypot + `startedAt` như trên.

### 4.3 Schema quản trị
`categorySchema`, `menuItemSchema` (kèm mảng `options` ≥ 1, giá nguyên 0–10.000.000), `orderStatusSchema`, `contactStatusSchema`. Slug tự sinh từ tên (bỏ dấu tiếng Việt, `đ` → `d`), cho sửa tay, kiểm tra trùng.

---

## 5. Query

### 5.1 Public (`server/queries/public`)
| Hàm | Trả về | Ghi chú |
|---|---|---|
| `getMenu()` | danh mục `is_active` + món `is_active`, kèm options, ảnh chính, `minPrice` | Sắp theo `sort_order`. Dùng cho `/thuc-don` và form đặt món |
| `getFeaturedItems(limit = 6)` | món `is_featured` | Trang chủ |
| `getMenuItemBySlug(slug)` | món + options + tất cả ảnh + danh mục | `null` → 404 |
| `getAllMenuSlugs()` | slug | `generateStaticParams`, sitemap |

Cache: bọc bằng cơ chế cache của Next.js với **tag** `menu`. Mọi admin action sửa thực đơn gọi `revalidateTag("menu")` (và `revalidatePath` các trang liên quan). Món “Tạm hết” phải hiện trên web **trong vài giây** sau khi bật.

Chỉ chọn các cột cần cho UI; không trả `ip_hash`, cột nội bộ ra client.

### 5.2 Admin (`server/queries/admin`)
| Hàm | Ghi chú |
|---|---|
| `listCategories()` | kèm số món mỗi danh mục |
| `listMenuItems({ categoryId?, q? })` | kèm giá thấp nhất, trạng thái “Tạm hết”, ẩn/hiện |
| `getMenuItemForEdit(id)` | |
| `listOrderRequests({ status?, page })` | 20 dòng/trang, mới nhất trước; kèm số món, tổng tham khảo, cờ Telegram lỗi |
| `getOrderRequest(id)` | kèm các dòng món |
| `countNewRequests()` | badge trên menu quản trị |
| `listContactMessages({ status?, page })` | |

---

## 6. Server action

Mọi action trả về kiểu thống nhất:
```ts
type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
```
Thông báo lỗi bằng tiếng Việt, thân thiện, không lộ chi tiết kỹ thuật. Lỗi kỹ thuật ghi log phía server.

### 6.1 `createOrderRequest(input)` — G3.8 – G3.10
Thứ tự xử lý:
1. Validate bằng `orderRequestSchema`. Honeypot có giá trị hoặc gửi < 3 giây → trả `ok: true` giả (không lưu, không báo bot).
2. Rate limit `order:<ip_hash>` (5 / 10 phút). Vượt → lỗi “Bạn gửi hơi nhiều, vui lòng gọi trực tiếp cho tiệm”.
3. Tải từ DB các món + option được chọn. Từ chối nếu: món không tồn tại, `is_active = false`, `is_sold_out_today = true`, option không thuộc món. Báo rõ món nào.
4. **Tính giá ở server** từ DB (không tin giá gửi từ client) → `unit_price`, `line_total`, `estimated_total`.
5. Sinh `code` (`TL-MMDD-NNN`, đếm theo ngày giờ Việt Nam, thử lại nếu trùng).
6. Lưu `order_request` + `order_request_item` trong **một transaction**.
7. Gửi Telegram (mục 8). Thành công → cập nhật `telegram_sent_at`, `telegram_message_id`. Lỗi → ghi `telegram_error`, **vẫn trả thành công cho khách**.
8. Trả `{ code, estimatedTotal, isOpenNow }` để FE hiển thị màn hình cảm ơn.

Gửi Telegram không được làm khách chờ quá lâu: timeout 5 giây.

### 6.2 `createContactMessage(input)` — G3.12
Validate → honeypot → rate limit `contact:<ip_hash>` (3 / 10 phút) → lưu → gửi Telegram → trả kết quả. Telegram lỗi xử lý giống 6.1.

### 6.3 Admin actions — G2.3 – G2.10
| Action | Ghi chú |
|---|---|
| `createCategory`, `updateCategory`, `deleteCategory`, `reorderCategories` | Xóa bị chặn khi còn món |
| `createMenuItem`, `updateMenuItem` | Lưu món + options trong một transaction (thêm/sửa/xóa option theo id). Bắt buộc ≥ 1 option. Đảm bảo tối đa 1 option mặc định |
| `deleteMenuItem` | Xóa món + ảnh Cloudinary. Dòng yêu cầu cũ giữ bản chụp (FK `SET NULL`) |
| `toggleSoldOut(id, value)` | Cập nhật `is_sold_out_today`, `sold_out_at`; revalidate ngay |
| `toggleActive(id, value)` | Ẩn/hiện món; chặn hiện khi chưa có option |
| `reorderMenuItems(categoryId, ids[])` | |
| `getUploadSignature()` | Ký upload Cloudinary phía server (G2.7), giới hạn thư mục `CLOUDINARY_FOLDER`, định dạng jpg/png/webp, ≤ 5 MB |
| `addMenuItemImage`, `deleteMenuItemImage`, `setPrimaryImage`, `reorderImages` | Lưu `public_id`, `url`, kích thước |
| `updateOrderRequestStatus(id, status, adminNote?)` | |
| `retryTelegram(kind, id)` | Gửi lại tin cho yêu cầu/tin liên hệ có `telegram_error` |
| `updateContactStatus(id, status)` | |

Mọi admin action: `requireAdmin()` → validate → thao tác → `revalidateTag`/`revalidatePath` → trả `ActionResult`.

---

## 7. Script dòng lệnh

| Lệnh | Việc |
|---|---|
| `db:migrate` | Chạy migration |
| `db:seed` | Dữ liệu mẫu (chặn production nếu không có `--force`) |
| `admin:create -- --email … --name …` | Tạo tài khoản admin; mật khẩu nhập từ bàn phím hoặc in mật khẩu ngẫu nhiên một lần. Từ chối nếu đã có admin, trừ khi `--reset-password` |
| `telegram:test` | Gửi một tin thử vào `TELEGRAM_CHAT_ID` |
| `telegram:chat-id` | In các chat id bot nhận được gần đây (hỗ trợ G0.6) |
| `db:backup` | `pg_dump` cho G6.5 |

Dùng trình quản lý gói theo lockfile đang có trong repo.

---

## 8. Telegram (`server/services/telegram.ts`) — G1.12, G3.10

- Gọi Bot API `sendMessage`, `parse_mode: "HTML"`; **escape** `& < >` trong mọi dữ liệu khách nhập.
- Không đưa thông tin nhạy cảm khác (IP, ip_hash) vào tin.
- Lỗi mạng: thử lại 1 lần sau 1 giây; tổng thời gian ≤ 5 giây.

Mẫu tin yêu cầu đặt món:
```
🥖 YÊU CẦU ĐẶT MÓN #TL-1007-023
👤 Nguyễn Văn A — 0901 234 567
🛍 Lấy tại quầy            (hoặc: 🛵 Giao: 12 Ngõ 5, Láng Hạ)
⏰ 07:30 thứ Năm 08/10      (hoặc: Sớm nhất có thể)

• 2 × Bánh mì thịt nướng (Đặc biệt) — 70.000₫
• 1 × Cà phê sữa đá — 20.000₫

💰 Tạm tính: 90.000₫ (giá tham khảo)
📝 Ghi chú: ít hành

👉 Gọi khách: 0901234567 (chỉ in số thường — Telegram không nhận link tel:)
🔗 Xem: <NEXT_PUBLIC_SITE_URL>/admin/yeu-cau/<id>
```
Mẫu tin liên hệ:
```
✉️ TIN LIÊN HỆ MỚI
👤 Trần Thị B — 0912 345 678 / b@gmail.com
💬 Nội dung tin nhắn…
🔗 Xem: <site>/admin/lien-he
```
Ngoài giờ mở cửa: thêm dòng “🌙 Gửi ngoài giờ mở cửa”.

P1 (G7.3): thêm `inline_keyboard` [Đã gọi] [Xong] [Hủy]; webhook `/api/telegram/webhook` kiểm `X-Telegram-Bot-Api-Secret-Token`, chỉ nhận từ đúng `TELEGRAM_CHAT_ID`, cập nhật status và sửa tin.

---

## 9. Giờ mở cửa (`lib/shop-config.ts`)

```ts
export const shopConfig = {
  name: "Bánh Mì Thanh Long",
  phone: "0900000000",          // giá trị tạm — thay ở G6.7
  zalo: "https://zalo.me/0900000000",
  telegram: "https://t.me/…",
  address: "…",
  mapsUrl: "…",
  mapsEmbedUrl: "…",
  deliveryRadiusKm: 3,
  maxQuantityPerItem: 50,
  maxScheduleDays: 7,
  openingHours: [ { days: [1,2,3,4,5,6,0], open: "06:00", close: "20:00" } ],
  timezone: "Asia/Ho_Chi_Minh",
} as const;
```
Hàm `isOpenAt(date)` và `nextOpenTime(date)` tính theo `Asia/Ho_Chi_Minh`, có test.

---

## 10. Bảo mật — G5.1 – G5.3

- Honeypot + thời gian điền form + rate limit theo IP băm (mục 6).
- Tất cả input qua validation; ORM dùng tham số hóa, không ghép chuỗi SQL.
- Header: `Content-Security-Policy` (cho phép Cloudinary, Google Maps embed, GA), `X-Frame-Options: DENY` (trừ nhúng map là iframe ra ngoài, không ảnh hưởng), `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` tối thiểu.
- Không log SĐT/địa chỉ đầy đủ ra console production.
- Lỗi trả về client không chứa stack trace.
- Ảnh chỉ upload qua chữ ký server; client không bao giờ thấy `CLOUDINARY_API_SECRET`.

---

## 11. Test — G3.13, G5.9

Dùng test runner đang có trong repo (mặc định Vitest).

| Nhóm | Ca kiểm thử tối thiểu |
|---|---|
| `phone.ts` | các dạng hợp lệ/không hợp lệ, chuẩn hóa `+84` |
| `money.ts` | `formatVND` |
| `shop-config` | `isOpenAt` biên giờ mở/đóng, qua nửa đêm |
| `orderRequestSchema` | giao hàng thiếu địa chỉ, số lượng 0/51, giờ nhận quá 7 ngày, honeypot |
| `createOrderRequest` | tính giá từ DB (bỏ qua giá client), món tạm hết bị từ chối, Telegram lỗi vẫn lưu + trả `ok`, rate limit |
| `telegram.ts` | escape HTML, định dạng tin đúng mẫu |
| Admin actions | gọi khi chưa đăng nhập → bị chặn |

CI chạy: typecheck → lint → test → build. Telegram và Cloudinary luôn được giả lập trong test.

---

## 12. Checklist task BE

- [ ] **G1.10** Better Auth chỉ admin, tắt đăng ký, `requireAdmin()`, script `admin:create`
- [ ] **G1.11** Service Cloudinary: ký upload, xóa ảnh, thư mục mới
- [ ] **G1.12** Service Telegram: hàm gửi + escape; xóa mẫu tin đơn hàng Lamora; script `telegram:test`, `telegram:chat-id`
- [ ] **G1.13** Viết lại query/action theo schema mới; xóa action giỏ hàng/checkout/đơn hàng
- [ ] **G1.14** CI xanh
- [ ] `lib/env.ts`, `lib/money.ts`, `lib/phone.ts`, `lib/shop-config.ts` + test
- [ ] **G2.x** Admin queries (5.2) và admin actions (6.3), revalidate tag `menu`
- [ ] **G3.8 – G3.9** `orderRequestSchema` + `createOrderRequest` bước 1–6, 8
- [ ] **G3.10** Bước 7: gửi Telegram, lỗi không chặn khách, `retryTelegram`
- [ ] **G3.12** `contactSchema` + `createContactMessage`
- [ ] **G3.13** Test theo mục 11
- [ ] **G5.1 – G5.3** Rate limit, header bảo mật, rà quyền, kiểm tra env
- [ ] **G6.2 – G6.4** Biến môi trường trên Netlify, build production, tạo admin production

## 13. Cần xác nhận
1. Giờ mở cửa thật của tiệm (đang để tạm 06:00–20:00 mọi ngày).
2. Thời gian đặt trước tối thiểu: đang để **15 phút**.
3. Ngoài giờ có chặn chọn “sớm nhất có thể” không? Mặc định: vẫn cho gửi, tin Telegram ghi “ngoài giờ”.


## Ghi chú lệch so với kế hoạch ban đầu (đã code)

- Schema nằm trong thư mục `src/server/db/schema/` (shared, auth, menu, requests, index), không phải một file.
- Số điện thoại chấp nhận cả di động (10 số, đầu 03/05/07/08/09) và máy bàn (11 số, đầu 02); nhận cả dạng +84/84.
- `admin:create`: mật khẩu lấy từ biến `ADMIN_PASSWORD` hoặc sinh ngẫu nhiên và in ra một lần; từ chối tạo admin thứ hai trừ khi thêm `--reset-password`. Đăng ký công khai tắt hoàn toàn (`disableSignUp`), script tạo user qua adapter nội bộ.
- `sendTelegramMessage` không bao giờ ném lỗi: thiếu biến môi trường hoặc lỗi mạng chỉ trả về kết quả thất bại.
