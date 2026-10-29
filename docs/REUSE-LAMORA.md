# REUSE-LAMORA — Phần nào lấy lại từ Lamora, phần nào làm mới

> Dựa trên `00-MASTER-PLAN` v1.0 (Phần D: “giữ nền tảng auth, lib, UI, product, media, Telegram; bỏ phần bán hàng”) và `TASK-DB/BE/FE.md`.
> Dùng cho **giai đoạn 1 (G0.8, G1.1 – G1.14)**. Nếu có `12-KE-HOACH-CHUYEN-DOI.md`, file đó thắng khi mâu thuẫn.
> Bản này phân loại theo **module**. Đường dẫn file cụ thể của Lamora chưa biết, nên AI phải điền **mục 6 — Bảng kiểm kê** trước khi sửa code (task G0.8).

---

## 1. Bốn mức quyết định

| Ký hiệu | Mức | Nghĩa |
|---|---|---|
| 🟢 | **GIỮ** | Chép sang, chỉ đổi tên thương hiệu / biến môi trường. Logic không đổi |
| 🟡 | **GIỮ + SỬA** | Chép sang làm nền, sửa theo mô hình mới (đổi tên khái niệm, thêm/bớt trường) |
| 🔴 | **BỎ** | Không chép. Xóa khỏi repo mới cùng mọi chỗ import nó |
| 🔵 | **LÀM MỚI** | Lamora không có. Viết mới theo `TASK-*.md` |

Nguyên tắc chọn: **chỉ giữ khi code cũ chạy đúng, có kiểu rõ ràng, và đạt `CODING-RULES.md` sau khi sửa ít**. Nếu sửa một file cũ tốn hơn viết lại (quá nửa file phải đổi), xếp nó vào 🔵 và ghi lý do trong bảng kiểm kê.

---

## 2. Tổng quan theo lớp

| Lớp | 🟢 Giữ | 🟡 Giữ + sửa | 🔴 Bỏ | 🔵 Làm mới |
|---|---|---|---|---|
| Cấu hình dự án | tsconfig, ESLint, Prettier, CI | package.json, next.config, .env.example | script/biến của thanh toán, email | Lệnh `admin:create`, `telegram:*`, `db:backup` |
| Database | Client ORM, cấu hình migration | Bảng Better Auth (`role`), `category`, `product`→`menu_item`, variant→`option`, ảnh | Giỏ, đơn, thanh toán, vận chuyển, tồn kho, coupon, địa chỉ, migration cũ | `order_request(_item)`, `contact_message`, `form_rate_limit`, migration `0001_init`, seed |
| Server | Better Auth core, client Cloudinary, hàm gửi Telegram | `requireAdmin`, query/action sản phẩm → món, upload ảnh | Action/route giỏ, checkout, thanh toán, đơn, email, webhook thanh toán | `createOrderRequest`, `createContactMessage`, rate limit, mã yêu cầu, mẫu tin Telegram mới |
| Lib dùng chung | Format tiền VND, slug tiếng Việt, cn/classnames | Validation sản phẩm → món, `env.ts` | Tính phí ship, tính thuế, mã giảm giá | `phone.ts`, `shop-config.ts` (giờ mở cửa), schema đặt món / liên hệ |
| UI dùng chung | Button, Input, Textarea, Dialog, Toast, Skeleton | Header, Footer, ProductCard → `MenuItemCard`, Badge | CartDrawer, CartIcon, CheckoutSteps, PaymentMethod, OrderTracking | `FloatingContact`, `OpenStatusBadge`, `CategoryTabs`, `QuantityStepper`, `MapEmbed` |
| Trang khách | Layout gốc, 404/error | Trang chủ, danh sách sản phẩm → thực đơn, chi tiết sản phẩm → chi tiết món, giới thiệu, chính sách | Giỏ, checkout, thanh toán, tra cứu đơn, tài khoản khách | Form đặt món 3 bước, trang thành công, trang liên hệ có form |
| Quản trị | Khung layout, đăng nhập | Danh sách + form sản phẩm → món, danh mục, upload ảnh | Quản lý đơn hàng, vận chuyển, tồn kho, coupon, báo cáo doanh thu | Công tắc “Tạm hết”, danh sách yêu cầu đặt món, tin liên hệ |
| Giao diện | Cấu trúc design token | Giá trị token (màu, font) → “Lò bánh phố” | Logo, ảnh, chữ “Lamora” | Logo chữ tạm, favicon |

---

## 3. Chi tiết từng module

### 3.1 Cấu hình dự án — G0.8, G1.1, G1.14

| Module Lamora | Quyết định | Việc cần làm | Đích trong dự án mới |
|---|---|---|---|
| `tsconfig.json` | 🟢 | Bật thêm `noUncheckedIndexedAccess` nếu chưa có (`CODING-RULES` mục 14) | giữ vị trí |
| ESLint, Prettier | 🟢 | Thêm luật còn thiếu theo `CODING-RULES` mục 14 | giữ vị trí |
| CI (GitHub Actions) | 🟢 | Đảm bảo chạy typecheck → lint → test → build | `.github/workflows/` |
| `package.json` | 🟡 | Đổi `name`; gỡ thư viện thanh toán, email, giỏ hàng; thêm script mục 7 `TASK-BE` | gốc |
| `next.config.*` | 🟡 | Giữ domain Cloudinary; gỡ domain cổng thanh toán; thêm header bảo mật (G5.2) | gốc |
| `.env.example` | 🟡 | Viết lại theo `TASK-BE` mục 2; xóa khóa thanh toán, email, SMTP | gốc |
| `netlify.toml` (nếu có) | 🟢 | Kiểm tra lệnh build | gốc |
| `AGENTS.md`, `docs/` của Lamora | 🔴 | Không chép. Dùng bộ tài liệu mới; bản cũ để `docs/_ban-cu-lamora-flower/` nếu muốn lưu | — |

### 3.2 Database — G1.6 – G1.9 (chi tiết bảng: `TASK-DB.md` mục 5)

| Module Lamora | Quyết định | Việc cần làm |
|---|---|---|
| Client ORM (kết nối Neon) | 🟢 | Chỉ đổi `DATABASE_URL` |
| Bảng Better Auth | 🟡 | Giữ; đảm bảo cột `role` enum chỉ `ADMIN` |
| `category` | 🟡 | Giữ; thêm `sort_order`, `is_active` nếu thiếu |
| `product` | 🟡 | Đổi thành `menu_item`; thêm nhãn, `is_featured`, `is_sold_out_today`, `sold_out_at`, `ingredients`; bỏ tồn kho, SKU, cân nặng, kích thước |
| `product_variant` | 🟡 | Đổi thành `menu_item_option`; giữ tên + giá; bỏ tồn kho, SKU |
| Bảng ảnh / media | 🟡 | Giữ; đổi khóa ngoại sang `menu_item` |
| `cart`, `order`, `payment`, `shipment`, `inventory`, `coupon`, `address`, `review`… | 🔴 | Xóa khỏi schema |
| Thư mục migration cũ | 🔴 | Xóa; tạo `0001_init` sạch trên Neon mới |
| Seed cũ (hoa) | 🔴 | Viết seed mới |
| `order_request`, `order_request_item`, `contact_message`, `form_rate_limit` | 🔵 | Viết mới theo `TASK-DB` mục 4.6 – 4.9 |

### 3.3 Xác thực — G1.10, G2.1, G2.2

| Module Lamora | Quyết định | Việc cần làm |
|---|---|---|
| Cấu hình Better Auth (server + client) | 🟢 | Tắt đăng ký (`disableSignUp`); bỏ đăng nhập mạng xã hội, xác minh email nếu có |
| Route `api/auth/[...all]` | 🟢 | Không đổi |
| Hàm kiểm tra quyền admin | 🟡 | Chuẩn hóa thành `requireAdmin()` (`TASK-BE` mục 3) |
| Middleware chặn `/admin` | 🟡 | Đổi đường dẫn đăng nhập thành `/admin/dang-nhap` |
| Tài khoản khách hàng (đăng ký, hồ sơ, địa chỉ) | 🔴 | Xóa |
| Script tạo admin | 🔵 nếu chưa có | `admin:create` (`TASK-BE` mục 7) |

### 3.4 Media / Cloudinary — G1.11, G2.7

| Module Lamora | Quyết định | Việc cần làm |
|---|---|---|
| Client Cloudinary, hàm ký upload, hàm xóa | 🟢 | Đổi thư mục sang `CLOUDINARY_FOLDER` |
| Component upload ảnh trong admin | 🟡 | Gắn với món; thêm chọn ảnh chính, sắp xếp |
| Helper URL ảnh (`f_auto,q_auto`, cắt) | 🟢 | Giữ |

### 3.5 Telegram — G1.12, G3.10

| Module Lamora | Quyết định | Việc cần làm |
|---|---|---|
| Hàm gửi tin (`sendMessage`) | 🟢 | Thêm timeout 5 giây + thử lại 1 lần nếu chưa có |
| Hàm escape HTML | 🟢 | Giữ; nếu chưa có thì 🔵 |
| Mẫu tin “đơn hàng mới” / “đã thanh toán” | 🔴 | Thay bằng mẫu tin yêu cầu đặt món và tin liên hệ (`TASK-BE` mục 8) |
| Script lấy `chat_id`, gửi thử | 🔵 nếu chưa có | `telegram:chat-id`, `telegram:test` |

### 3.6 Sản phẩm → Món — G1.6, G1.13, G2.4 – G2.8, G3.5, G3.6

| Module Lamora | Quyết định | Việc cần làm |
|---|---|---|
| Query danh sách / chi tiết sản phẩm | 🟡 | Đổi thành `getMenu`, `getMenuItemBySlug`, `getFeaturedItems`; thêm cache tag `menu`; bỏ lọc giá, sắp xếp phức tạp, phân trang |
| Action CRUD sản phẩm (admin) | 🟡 | Đổi thành món; lưu options trong transaction; bắt buộc ≥ 1 option |
| Validation sản phẩm | 🟡 | Đổi thành `menuItemSchema` |
| Tạo slug tiếng Việt | 🟢 | Giữ |
| Lọc, tìm kiếm, sắp xếp theo giá | 🔴 | Bỏ (tìm kiếm là P1) |
| Đánh giá sản phẩm, sản phẩm yêu thích | 🔴 | Bỏ |
| Công tắc “Tạm hết hôm nay” | 🔵 | `toggleSoldOut` + UI |

### 3.7 Bán hàng — tất cả 🔴 (G1.2 – G1.5)

Xóa toàn bộ, kể cả component, route, action, store, type, test và thư viện chỉ dùng cho chúng:

| Nhóm | Ví dụ những gì cần xóa |
|---|---|
| Giỏ hàng | store giỏ (Zustand/Context), `CartDrawer`, `CartIcon`, nút “Thêm vào giỏ”, localStorage giỏ |
| Checkout | trang và form checkout, chọn địa chỉ, chọn phương thức giao |
| Thanh toán | tích hợp cổng thanh toán, mã QR, webhook thanh toán, trang kết quả thanh toán |
| Vận chuyển | tính phí ship, bảng phí, theo dõi vận đơn |
| Đơn hàng | trang tra cứu đơn, lịch sử đơn, admin quản lý đơn |
| Tồn kho | trừ kho, cảnh báo hết hàng |
| Email | gửi email xác nhận đơn, template email, thư viện gửi mail |
| Khuyến mãi | coupon, giá sale, flash sale |

**Lưu ý — đừng chép form checkout làm form đặt món.** Hai luồng khác bản chất (giỏ toàn cục + thanh toán vs. state cục bộ + gửi Telegram). Chỉ được lấy **các component ô nhập** (Input, RadioGroup…) và **hàm kiểm tra SĐT** nếu có.

### 3.8 UI dùng chung — G4.4

| Module Lamora | Quyết định | Việc cần làm |
|---|---|---|
| `components/ui/*` (Button, Input, Textarea, Select, Dialog, Toast, Skeleton, Badge) | 🟢 | Đổi style sang token mới, không đổi API |
| Header, Footer | 🟡 | Bỏ icon giỏ, tài khoản; thêm nút “Đặt món”; footer đọc `shop-config` |
| ProductCard | 🟡 | Đổi thành `MenuItemCard`; giá “từ X₫”; nhãn; trạng thái “Tạm hết” |
| Bộ lọc, phân trang sản phẩm | 🔴 | Bỏ |
| Design token (biến CSS / Tailwind theme) | 🟡 | Giữ cấu trúc, thay giá trị theo “Lò bánh phố” |
| Font, logo, ảnh Lamora | 🔴 | Thay bằng Baloo 2, Be Vietnam Pro, logo chữ tạm |

### 3.9 Trang — G3.x, G2.x

| Trang Lamora | Quyết định | Trang mới |
|---|---|---|
| Layout gốc, `not-found`, `error` | 🟢 | giữ, đổi chữ |
| Trang chủ | 🟡 | `/` — bố cục mới theo `TASK-FE` 5.1 |
| Danh sách sản phẩm | 🟡 | `/thuc-don` |
| Chi tiết sản phẩm | 🟡 | `/thuc-don/[slug]`; nút “Đặt món này” thay “Thêm vào giỏ” |
| Giới thiệu, chính sách | 🟡 | `/gioi-thieu`, `/chinh-sach-bao-mat` (viết lại nội dung) |
| Liên hệ (nếu có) | 🟡 | `/lien-he` + form gửi Telegram |
| Giỏ, checkout, thanh toán, tra cứu đơn, tài khoản | 🔴 | — |
| Đặt món, trang thành công | 🔵 | `/dat-mon`, `/dat-mon/thanh-cong` |
| Admin: khung, đăng nhập | 🟢 | `/admin`, `/admin/dang-nhap` |
| Admin: sản phẩm, danh mục | 🟡 | `/admin/mon`, `/admin/danh-muc` |
| Admin: đơn hàng, vận chuyển, coupon, báo cáo | 🔴 | — |
| Admin: yêu cầu đặt món, tin liên hệ | 🔵 | `/admin/yeu-cau`, `/admin/lien-he` |

### 3.10 Lib và test

| Module Lamora | Quyết định | Việc cần làm |
|---|---|---|
| Format tiền VND | 🟢 | Đặt tên `formatVND` trong `lib/money.ts` |
| Đọc biến môi trường | 🟡 | Viết lại danh sách biến (`TASK-BE` mục 2) |
| Kiểm tra SĐT | 🟡 / 🔵 | Chuẩn hóa về `lib/phone.ts` (`TASK-BE` 4.1) |
| Ngày giờ, múi giờ | 🟡 / 🔵 | `isOpenAt`, `nextOpenTime` theo `Asia/Ho_Chi_Minh` |
| Test của phần được giữ | 🟢 | Chép theo, sửa tên khái niệm |
| Test của phần bị bỏ | 🔴 | Xóa |

---

## 4. Những phần chắc chắn LÀM MỚI 🔵

Lamora không có hoặc khác bản chất — viết theo `TASK-*.md`, không tìm code cũ:

1. Bảng `order_request`, `order_request_item`, `contact_message`, `form_rate_limit` + migration `0001_init` + seed bánh mì
2. `createOrderRequest` (8 bước, `TASK-BE` 6.1) và `createContactMessage`
3. Rate limit lưu trong DB, honeypot, sinh mã `TL-MMDD-NNN`
4. Mẫu tin Telegram đặt món / liên hệ, `retryTelegram`
5. `shop-config.ts`, `isOpenAt`, `OpenStatusBadge`
6. Form đặt món 3 bước + trang thành công
7. `FloatingContact`, `CategoryTabs`, `QuantityStepper`, `MapEmbed`
8. Công tắc “Tạm hết hôm nay” (server + admin UI)
9. Admin: danh sách / chi tiết yêu cầu, tin liên hệ
10. JSON-LD nhà hàng và thực đơn (G5.5)

---

## 5. Quy trình lấy code (AI làm theo thứ tự)

1. **Không sửa repo Lamora.** Tạo repo mới `banh-mi-thanh-long`, chép toàn bộ code Lamora vào (G0.8). Repo cũ giữ nguyên để tra cứu.
2. **Kiểm kê**: chạy các lệnh ở mục 5.1, điền **mục 6** cho từng file/thư mục, gửi chủ tiệm duyệt. Chưa sửa code ở bước này.
3. **Xóa 🔴 trước** (G1.2 – G1.5), theo thứ tự: trang → component → action/route → store → type → bảng DB → thư viện trong `package.json`. Sau mỗi nhóm chạy typecheck để tìm chỗ còn import.
4. **Đổi tên khái niệm** (G1.1, G1.6): `product` → `menuItem`, `variant` → `option`, chữ “Lamora” → “Bánh Mì Thanh Long”. Đổi bằng công cụ refactor của editor, không thay chuỗi mù.
5. **Sửa 🟡** theo bảng mục 3, mỗi module một commit.
6. **Viết 🔵** theo giai đoạn 2, 3 của kế hoạch.
7. Kết thúc giai đoạn 1: chạy mục 5.2 — phải không còn kết quả nào.

### 5.1 Lệnh tìm để kiểm kê

```bash
# Toàn bộ file nguồn (bỏ node_modules, .next)
git ls-files | grep -E '\.(ts|tsx|css|sql|json|toml|yml)$'

# Phần bán hàng — ứng viên 🔴
grep -rliE 'cart|checkout|payment|thanh.?toan|shipping|shipment|van.?chuyen|inventory|stock|ton.?kho|coupon|voucher|discount|order(Item|Status|Tracking)?\b|vnpay|momo|zalopay|stripe|paypal|sendgrid|resend|nodemailer|smtp' src app 2>/dev/null

# Phần giữ — ứng viên 🟢 / 🟡
grep -rliE 'better-auth|betterAuth|cloudinary|telegram|product|variant|category|slug|formatVnd|formatVND|toLocaleString\(.vi' src app 2>/dev/null

# Thương hiệu cũ
grep -rli 'lamora' . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
```

### 5.2 Kiểm tra cuối giai đoạn 1 (phải rỗng)

```bash
grep -rliE 'lamora|cart|checkout|payment|shipping|inventory|coupon' src app --exclude-dir=node_modules
```
Mọi kết quả còn lại phải được giải thích trong bảng kiểm kê (ví dụ chữ `order` trong `sort_order` là hợp lệ).

---

## 6. Bảng kiểm kê (AI điền ở G0.8, chủ tiệm duyệt)

Mỗi file hoặc thư mục trong code Lamora một dòng. Không được để file nào “chưa phân loại”.

| # | Đường dẫn Lamora | Module (mục 3.x) | Quyết định | Đích trong dự án mới | Việc cần làm / lý do | Task | Xong |
|---|---|---|---|---|---|---|---|
| 1 | `src/lib/auth.ts` *(ví dụ)* | 3.3 | 🟢 | `src/server/auth/auth.ts` | Tắt đăng ký | G1.10 | [ ] |
| 2 | `src/components/cart/CartDrawer.tsx` *(ví dụ)* | 3.7 | 🔴 | — | Giỏ hàng | G1.2 | [ ] |
| 3 | `src/components/product/ProductCard.tsx` *(ví dụ)* | 3.8 | 🟡 | `src/components/site/MenuItemCard.tsx` | Giá “từ X₫”, nhãn, Tạm hết | G4.4 | [ ] |
| … | | | | | | | |

**Tổng kết sau kiểm kê** (AI điền):

| Quyết định | Số file | Ghi chú |
|---|---|---|
| 🟢 Giữ | | |
| 🟡 Giữ + sửa | | |
| 🔴 Bỏ | | |
| 🔵 Làm mới (không có trong Lamora) | | lấy từ mục 4 |
| Không chắc — cần chủ tiệm quyết | | liệt kê từng file |

---

## 7. Cần xác nhận
1. Code Lamora nằm ở đâu (thư mục trên máy hoặc repo GitHub)? Có đúng dùng Next.js App Router + Better Auth + Cloudinary + Telegram như master plan ghi không?
2. Lamora dùng ORM nào (Prisma / Drizzle)? `TASK-DB` viết trung lập, cần chốt để AI viết schema đúng cú pháp.
3. Lamora đã có test và CI chưa? Nếu chưa, CI là 🔵 thay vì 🟢.
4. Muốn lưu bản tài liệu Lamora cũ vào `docs/_ban-cu-lamora-flower/` không? Mặc định: không chép.
