# TASK-DB — Database Bánh Mì Thanh Long

> Dựa trên `00-MASTER-PLAN` v1.0. Đọc cùng `02-DATABASE.md` (nếu có chênh lệch, `02` thắng và cập nhật lại file này).
> Liên quan kế hoạch task: **G1.6 – G1.9**, **G6.1**, **G6.5**.

---

## 1. Nguyên tắc

| # | Quy tắc |
|---|---|
| 1 | PostgreSQL trên **Neon**. Project Neon **mới**, không dùng lại dữ liệu Lamora. |
| 2 | Dùng **ORM đang có trong code Lamora**. Không đổi ORM. Mọi thay đổi schema đi qua migration, không sửa tay trên Neon. |
| 3 | Tiền là **số nguyên VND** (`integer`), không dùng float/decimal. `25000` = 25.000₫. |
| 4 | Khóa chính `id` dạng chuỗi (cuid/uuid — theo kiểu code cũ đang dùng). |
| 5 | Mọi bảng có `created_at`, bảng sửa được có thêm `updated_at`. Lưu giờ dạng `timestamptz` (UTC), hiển thị theo `Asia/Ho_Chi_Minh`. |
| 6 | Tên bảng/cột trong DB: `snake_case`, tiếng Anh. Tên hiển thị tiếng Việt nằm ở UI. |
| 7 | Yêu cầu đặt món **lưu bản chụp** (tên món, tên lựa chọn, đơn giá) tại thời điểm gửi — sửa thực đơn sau này không làm sai yêu cầu cũ. |
| 8 | Không có bảng đơn hàng, thanh toán, vận chuyển, tồn kho, giỏ hàng, mã giảm giá. |

---

## 2. Sơ đồ quan hệ (ERD)

```
user (Better Auth) ──< session
       └──< account

category ──< menu_item ──< menu_item_option
                  └──< menu_item_image

order_request ──< order_request_item >── menu_item (SET NULL)
                                    └── menu_item_option (SET NULL)

contact_message           (độc lập)
form_rate_limit           (độc lập, chống spam)
rate_limit                (của Better Auth, chống dò mật khẩu đăng nhập)
```

`──<` = một – nhiều.

---

## 3. Enum

| Enum | Giá trị | Ghi chú |
|---|---|---|
| `user_role` | `ADMIN` | Chỉ một giá trị ở P0. Thêm `STAFF` ở P2. |
| `fulfillment_type` | `PICKUP`, `DELIVERY` | Lấy tại quầy / giao gần |
| `order_request_status` | `NEW`, `CALLED`, `DONE`, `CANCELLED` | Mới · Đã gọi · Xong · Hủy (khớp nút Telegram ở P1) |
| `contact_status` | `NEW`, `HANDLED` | Mới · Đã xử lý |

---

## 4. Bảng chi tiết

### 4.1 Bảng của Better Auth: `user`, `session`, `account`, `verification`
Giữ nguyên theo Better Auth (sinh bằng CLI của Better Auth hoặc schema cũ của Lamora). Bổ sung/giữ:

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `role` | `user_role` | NOT NULL, default `ADMIN` | Dùng để kiểm quyền |

- Tắt đăng ký công khai. Tài khoản admin chỉ tạo bằng script (`BE` mục 7).

### 4.2 `category` — Danh mục
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | text | PK |
| `name` | varchar(80) | NOT NULL |
| `slug` | varchar(100) | NOT NULL, UNIQUE |
| `description` | varchar(300) | NULL |
| `sort_order` | integer | NOT NULL, default 0 |
| `is_active` | boolean | NOT NULL, default true |
| `created_at`, `updated_at` | timestamptz | NOT NULL |

Index: `(is_active, sort_order)`.
Xóa: **không cho xóa** khi còn món (FK `RESTRICT`); UI báo “chuyển món sang danh mục khác trước”.

### 4.3 `menu_item` — Món
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | text | PK | |
| `category_id` | text | NOT NULL, FK → `category.id` `RESTRICT` | |
| `name` | varchar(120) | NOT NULL | “Bánh mì thịt nướng” |
| `slug` | varchar(140) | NOT NULL, UNIQUE | `banh-mi-thit-nuong` |
| `short_description` | varchar(200) | NULL | Hiện trên thẻ món |
| `description` | text | NULL | Trang chi tiết |
| `ingredients` | text | NULL | Thành phần |
| `is_spicy` | boolean | NOT NULL, default false | Nhãn “Cay” |
| `is_vegetarian` | boolean | NOT NULL, default false | Nhãn “Chay” |
| `is_best_seller` | boolean | NOT NULL, default false | Nhãn “Bán chạy” |
| `is_new` | boolean | NOT NULL, default false | Nhãn “Món mới” |
| `is_featured` | boolean | NOT NULL, default false | Hiện ở “Món nổi bật” trang chủ |
| `is_sold_out_today` | boolean | NOT NULL, default false | Công tắc “Tạm hết hôm nay” |
| `sold_out_at` | timestamptz | NULL | Lúc bật “Tạm hết” (để sau này tự reset nếu cần) |
| `is_active` | boolean | NOT NULL, default true | Ẩn món khỏi web mà không xóa |
| `sort_order` | integer | NOT NULL, default 0 | |
| `created_at`, `updated_at` | timestamptz | NOT NULL | |

Index: `(category_id, is_active, sort_order)`, `(is_featured)` where `is_active`.
Quy tắc: món phải có **≥ 1** `menu_item_option` mới được `is_active = true` (kiểm ở tầng server).

### 4.4 `menu_item_option` — Lựa chọn có giá
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | text | PK | |
| `menu_item_id` | text | NOT NULL, FK → `menu_item.id` `CASCADE` | |
| `name` | varchar(60) | NOT NULL | “Thường”, “Đặc biệt”, “Size L” |
| `price` | integer | NOT NULL, CHECK `price >= 0` | VND |
| `is_default` | boolean | NOT NULL, default false | Lựa chọn chọn sẵn trong form |
| `sort_order` | integer | NOT NULL, default 0 | |
| `created_at`, `updated_at` | timestamptz | NOT NULL | |

Index: `(menu_item_id, sort_order)`. Mỗi món tối đa 1 option `is_default = true` (partial unique index nếu ORM hỗ trợ, nếu không thì kiểm ở server).
Giá hiển thị “từ X₫” = `min(price)` của món.

### 4.5 `menu_item_image` — Ảnh món (Cloudinary)
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | text | PK |
| `menu_item_id` | text | NOT NULL, FK `CASCADE` |
| `public_id` | varchar(255) | NOT NULL — id trên Cloudinary |
| `url` | text | NOT NULL — `secure_url` |
| `width`, `height` | integer | NOT NULL |
| `alt` | varchar(200) | NULL (mặc định dùng tên món) |
| `is_primary` | boolean | NOT NULL, default false |
| `sort_order` | integer | NOT NULL, default 0 |
| `created_at` | timestamptz | NOT NULL |

Khi xóa ảnh/món: xóa luôn file trên Cloudinary (làm ở server action, không dùng trigger DB).
Nếu module media của Lamora đã có bảng ảnh dùng chung, **giữ bảng đó** và chỉ đổi khóa ngoại sang `menu_item`.

### 4.6 `order_request` — Yêu cầu đặt món
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | text | PK | |
| `code` | varchar(20) | NOT NULL, UNIQUE | Mã dễ đọc, ví dụ `TL-1007-023` (ngày + số thứ tự trong ngày) |
| `customer_name` | varchar(80) | NOT NULL | |
| `phone` | varchar(15) | NOT NULL | Đã chuẩn hóa dạng `0xxxxxxxxx` |
| `fulfillment` | `fulfillment_type` | NOT NULL | |
| `delivery_address` | varchar(300) | NULL | Bắt buộc khi `DELIVERY` (CHECK) |
| `requested_at` | timestamptz | NULL | Giờ muốn nhận; NULL = “sớm nhất có thể” |
| `note` | varchar(500) | NULL | |
| `estimated_total` | integer | NOT NULL | Tổng **tham khảo**, server tự tính |
| `status` | `order_request_status` | NOT NULL, default `NEW` | |
| `admin_note` | varchar(500) | NULL | Ghi chú nội bộ của tiệm |
| `telegram_sent_at` | timestamptz | NULL | NULL = chưa gửi được |
| `telegram_message_id` | bigint | NULL | Dùng cho nút Telegram (P1) |
| `telegram_error` | varchar(500) | NULL | Lỗi gần nhất khi gửi |
| `ip_hash` | varchar(64) | NULL | SHA-256(IP + salt), không lưu IP thô |
| `created_at`, `updated_at` | timestamptz | NOT NULL | |

CHECK: `fulfillment <> 'DELIVERY' OR delivery_address IS NOT NULL`.
Index: `(status, created_at DESC)`, `(created_at DESC)`, `(phone)`.

### 4.7 `order_request_item` — Dòng món trong yêu cầu
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | text | PK | |
| `order_request_id` | text | NOT NULL, FK `CASCADE` | |
| `menu_item_id` | text | NULL, FK `SET NULL` | Món có thể bị xóa sau này |
| `menu_item_option_id` | text | NULL, FK `SET NULL` | |
| `item_name` | varchar(120) | NOT NULL | Bản chụp |
| `option_name` | varchar(60) | NOT NULL | Bản chụp |
| `unit_price` | integer | NOT NULL | Bản chụp |
| `quantity` | integer | NOT NULL, CHECK `1..50` | |
| `line_total` | integer | NOT NULL | `unit_price * quantity` |

Index: `(order_request_id)`, `(menu_item_id)` (cho thống kê P1).

### 4.8 `contact_message` — Tin liên hệ
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | text | PK |
| `name` | varchar(80) | NOT NULL |
| `phone` | varchar(15) | NULL |
| `email` | varchar(120) | NULL |
| `message` | varchar(1000) | NOT NULL |
| `status` | `contact_status` | NOT NULL, default `NEW` |
| `telegram_sent_at` | timestamptz | NULL |
| `telegram_error` | varchar(500) | NULL |
| `ip_hash` | varchar(64) | NULL |
| `created_at`, `updated_at` | timestamptz | NOT NULL |

CHECK: `phone IS NOT NULL OR email IS NOT NULL` (phải có ít nhất một cách liên lạc).
Index: `(status, created_at DESC)`.

### 4.9 `form_rate_limit` — Chống spam
Netlify chạy serverless nên không giới hạn bằng bộ nhớ được; đếm trong DB.

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `key` | varchar(120) | PK — ví dụ `order:<ip_hash>` |
| `count` | integer | NOT NULL |
| `window_start` | timestamptz | NOT NULL |

Mặc định: tối đa **5 yêu cầu đặt món / 10 phút / IP** và **3 tin liên hệ / 10 phút / IP**. Dòng cũ hơn 1 ngày được xóa khi ghi (hoặc job dọn dẹp).

---

## 5. Chuyển đổi từ schema Lamora (G1.6 – G1.8)

| Lamora | Bánh Mì Thanh Long | Việc làm |
|---|---|---|
| `product` | `menu_item` | Đổi tên + thêm cột nhãn, `is_featured`, `is_sold_out_today`, `ingredients`; bỏ cột tồn kho, cân nặng, SKU… |
| `product_variant` (nếu có) | `menu_item_option` | Giữ tên + giá; bỏ tồn kho, SKU |
| `category` | `category` | Giữ |
| Bảng ảnh sản phẩm / media | `menu_item_image` | Giữ, đổi FK |
| `user` + bảng Better Auth | giữ | Đảm bảo có `role` |
| `cart`, `cart_item` | — | **Xóa** |
| `order`, `order_item` | — | **Xóa** (thay bằng `order_request`) |
| `payment`, `shipment`, `shipping_fee`, `inventory`, `coupon`, `address` | — | **Xóa** |
| — | `order_request`, `order_request_item`, `contact_message`, `form_rate_limit` | **Tạo mới** |
| — | `rate_limit` (Better Auth lưu giới hạn đăng nhập trong DB vì serverless không giữ bộ nhớ) | **Tạo mới** |

Vì dùng Neon project mới: **xóa thư mục migration cũ, tạo một migration khởi tạo sạch** (`0000_init`) thay vì chuỗi migration Lamora.

---

## 6. Dữ liệu mẫu (seed) — G1.9

Script seed chạy được nhiều lần (xóa dữ liệu mẫu cũ rồi chèn lại), **không chạy trên production** trừ khi có cờ `--force`.

| Danh mục | Món mẫu (lựa chọn: giá) |
|---|---|
| Bánh mì kẹp | Thịt nướng (Thường 25.000 / Đặc biệt 35.000) · Pate chả (Thường 20.000 / Đặc biệt 30.000) · Gà xé (25.000) · Chay (20.000, nhãn Chay) |
| Combo | Combo sáng: bánh mì + cà phê (40.000) · Combo văn phòng 10 phần (230.000) |
| Món thêm | Thêm trứng (5.000) · Thêm pate (5.000) · Thêm chả (7.000) |
| Đồ uống | Cà phê sữa đá (20.000) · Trà tắc (15.000) |

Giá trên chỉ là dữ liệu mẫu; chủ tiệm nhập giá thật ở G2.11.
Seed thêm 3 yêu cầu đặt món mẫu (mỗi trạng thái một cái) và 2 tin liên hệ để dựng trang quản trị.

---

## 7. Vận hành (G6.1, G6.5)

- Hai database: **dev** (branch Neon) và **production**. Biến `DATABASE_URL` khác nhau, không bao giờ trỏ dev vào production.
- Migration production chạy trong bước build/deploy hoặc bằng lệnh tay có kiểm tra — theo `09-DEPLOYMENT.md`.
- Sao lưu: `pg_dump` hằng tuần → nén → tải lên Google Drive; giữ 8 bản gần nhất. Neon Free có khôi phục theo thời điểm ngắn hạn, không thay được bản sao lưu riêng.

---

## 8. Checklist task DB

- [ ] **G1.6** Viết schema `category`, `menu_item`, `menu_item_option`, `menu_item_image` theo mục 4.2–4.5
- [ ] **G1.7** Viết schema `order_request`, `order_request_item`, `contact_message`, `form_rate_limit` + enum (mục 3, 4.6–4.9)
- [ ] **G1.8** Xóa bảng bán hàng cũ (mục 5); đảm bảo `user.role`
- [ ] **G1.9** Migration khởi tạo `0000_init` trên Neon mới + script seed (mục 6)
- [ ] Kiểm tra: tất cả CHECK, UNIQUE, FK hoạt động (thử chèn dữ liệu sai phải lỗi)
- [ ] **G6.1** Database production + chạy migration
- [ ] **G6.5** Script sao lưu hằng tuần

## 9. Cần xác nhận
1. “Tạm hết hôm nay” có tự tắt vào sáng hôm sau không? Mặc định: **không**, chủ tiệm tắt bằng tay. Cột `sold_out_at` đã có sẵn nếu muốn đổi.
2. Có cần lưu email khách trong yêu cầu đặt món không? Mặc định: không (tiệm gọi/nhắn lại).
