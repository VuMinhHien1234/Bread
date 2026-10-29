# 00 — MASTER PLAN: Bánh Mì Thanh Long

> **Vai trò của file này:** File gốc của dự án. Mọi file hướng dẫn (`01-…` đến `12-…`) được sinh từ đây. Khi một quyết định ở đây thay đổi, cập nhật các file con phụ thuộc (xem Phần G) và ghi vào Nhật ký thay đổi.
>
> **Ký hiệu:** 🔒 = quyết định bắt buộc, chủ tiệm đã xác nhận, đổi sẽ ảnh hưởng lớn · 🔧 = mặc định tự chọn, có thể đổi sau mà không phải làm lại nhiều.
>
> **Lịch sử:** Bộ tài liệu này chuyển đổi từ dự án shop hoa lụa “Lamora Flower” (bán hàng đầy đủ). Bản cũ lưu ở `docs/_ban-cu-lamora-flower/`. Cách chuyển code đã viết sang dự án mới: `12-KE-HOACH-CHUYEN-DOI.md`.

---

## Trạng thái

| Mục | Giá trị |
|---|---|
| Phiên bản | v1.0 |
| Cập nhật | 2026-10-07 |
| Quyết định bắt buộc | Đã chốt (Phần A, B3, B4, D) |
| File con | 12 file, đã viết lại theo mô hình mới |

---

## PHẦN A — Kinh doanh

| Mục | Quyết định | Loại |
|---|---|---|
| Tên thương hiệu | **Bánh Mì Thanh Long** | 🔒 |
| Mô hình | Tiệm bánh mì. Website **giới thiệu món và liên hệ**, **không bán hàng trực tuyến** (không giỏ hàng, không thanh toán online) | 🔒 |
| Đặt món | Khách gửi **yêu cầu đặt món** qua form → web báo ngay về **Telegram** của tiệm → tiệm gọi/nhắn lại chốt đơn | 🔒 |
| Giá | **Hiển thị giá** từng món, chỉ để tham khảo. Giá cuối do tiệm báo khi xác nhận | 🔒 |
| Quản trị | **1 tài khoản quản trị** (chủ tiệm) | 🔒 |
| Khách hàng | Khách quanh khu vực tiệm: ăn sáng, mua mang đi, đặt số lượng cho văn phòng / sự kiện | 🔧 |
| Nhận món | Lấy tại quầy, hoặc giao gần (tiệm tự giao hoặc gọi xe công nghệ). Phí giao báo khi gọi xác nhận | 🔧 |
| Số cửa hàng | 1 cửa hàng. Nhiều chi nhánh: P2 | 🔧 |
| Ngôn ngữ / tiền tệ | Tiếng Việt / VND | 🔧 |
| Tên miền | Tạm dùng subdomain miễn phí của hosting. Nên mua `banhmithanhlong.vn` hoặc `.com` khi ra mắt | 🔧 |
| Quy mô ban đầu | Dưới 60 món, dưới 100 yêu cầu đặt món/ngày | 🔧 |

**Danh mục món mẫu** 🔧: Bánh mì kẹp · Combo · Món thêm (topping) · Đồ uống. Thêm/sửa trong trang quản trị, không cần sửa code.

**Đặc thù món** 🔧: mỗi món có 1 hoặc nhiều **lựa chọn có giá riêng** (ví dụ “Thường 25.000₫ / Đặc biệt 35.000₫”) · nhãn ăn kèm (cay, chay, bán chạy, món mới) · công tắc **“Tạm hết hôm nay”**. Không quản lý tồn kho.

---

## PHẦN B — Tính năng

**P0** = bản ra mắt (MVP) · **P1** = ngay sau MVP · **P2** = mở rộng sau

### B1. Website khách
| Tính năng | Ưu tiên |
|---|---|
| Trang chủ: ảnh lớn, món nổi bật, thực đơn rút gọn, câu chuyện tiệm, địa chỉ + giờ mở cửa, nút đặt món | P0 |
| Trang thực đơn: toàn bộ món theo danh mục, có giá, nhãn, “Tạm hết” | P0 |
| Chi tiết món: ảnh, mô tả, thành phần, các lựa chọn và giá, nút “Đặt món này” | P0 |
| **Form đặt món** (chọn món + số lượng, tên, SĐT, lấy tại quầy / giao, giờ muốn nhận, ghi chú) → gửi Telegram | P0 |
| Trang liên hệ: địa chỉ, bản đồ, giờ mở cửa, SĐT, Zalo, Telegram, **form liên hệ** → gửi Telegram | P0 |
| Nút liên hệ nổi: Gọi · Zalo · Telegram | P0 |
| Trang giới thiệu, chính sách bảo mật | P0 |
| Nhớ tên + SĐT khách trên trình duyệt cho lần đặt sau | P1 |
| Tìm kiếm món | P1 (thực đơn nhỏ, chưa cần) |
| Đặt bàn / đặt tiệc số lượng lớn có form riêng | P2 |
| Blog, đánh giá món, đa chi nhánh | P2 |

### B2. Trang quản trị (chỉ chủ tiệm dùng)
| Tính năng | Ưu tiên |
|---|---|
| Đăng nhập quản trị | P0 |
| Quản lý món, lựa chọn & giá, ảnh, danh mục | P0 |
| Bật/tắt nhanh “Tạm hết hôm nay” cho món (dùng trên điện thoại) | P0 |
| Danh sách **yêu cầu đặt món** và **tin liên hệ** (bản lưu dự phòng khi Telegram lỗi), đổi trạng thái | P0 |
| Bấm nút trên tin Telegram để đổi trạng thái yêu cầu (“Đã gọi”, “Xong”, “Hủy”) | P1 |
| Sửa thông tin tiệm (giờ mở cửa, SĐT, banner) trong admin thay vì file cấu hình | P1 |
| Thống kê số yêu cầu, món được đặt nhiều | P1 |

### B3. Phân quyền 🔒
Một vai trò `ADMIN` duy nhất. Cột `role` vẫn có để sau này thêm nhân viên mà không phải đổi cấu trúc dữ liệu.

### B4. Bán hàng và thanh toán 🔒
- **Không** có giỏ hàng, thanh toán online, mã QR, phí ship tự tính, tồn kho, tra cứu đơn.
- Yêu cầu đặt món **không phải đơn hàng đã chốt**. Tiệm liên hệ lại để xác nhận món, giá, phí giao, thời gian.
- Thanh toán diễn ra ngoài web: tại quầy, khi nhận món, hoặc chuyển khoản theo thông tin tiệm gửi qua tin nhắn.

### B5. Thông báo 🔒
- Yêu cầu đặt món mới và tin liên hệ mới → **Telegram bot** gửi vào chat/nhóm của tiệm (miễn phí, tức thì).
- Mọi yêu cầu **đồng thời lưu vào database**, để không mất khi Telegram lỗi.
- Email cho khách: không làm (khách được gọi/nhắn lại).

---

## PHẦN C — Thiết kế giao diện 🔧

| Mục | Mặc định |
|---|---|
| Phong cách | “Lò bánh phố”: ấm áp, ngon mắt, gần gũi; ảnh món là trọng tâm |
| Màu | Nền kem bột mì · chữ nâu vỏ bánh · điểm nhấn **hồng thanh long**, xanh lá, vàng bơ (xem `03` mục 2) |
| Font | Baloo 2 (tiêu đề) + Be Vietnam Pro (nội dung), đều hỗ trợ đủ dấu tiếng Việt |
| Thiết bị | Ưu tiên điện thoại (mobile-first) — phần lớn khách mở link từ Zalo/Facebook/Google Maps |
| Ảnh | Tạm dùng ảnh mẫu, thay bằng ảnh thật trước khi ra mắt |

Chi tiết ở `03-UI-DESIGN.md`.

---

## PHẦN D — Kỹ thuật

| Mục | Quyết định | Loại |
|---|---|---|
| Người viết code | **Chủ yếu do AI viết**, chủ tiệm review và chạy | 🔒 |
| Kiến trúc | **Next.js fullstack**: web khách, trang quản trị và API trong **một** dự án | 🔒 |
| Ngân sách hạ tầng | **Gần 0đ/tháng**, chỉ dùng gói miễn phí cho phép dùng thương mại | 🔒 |
| Tận dụng code cũ | Giữ nền tảng đã viết cho Lamora (auth, lib, UI, product, media, Telegram), bỏ phần bán hàng (`12`) | 🔒 |
| Ngôn ngữ | TypeScript | 🔧 |
| Database | PostgreSQL trên Neon (gói Free) | 🔧 |
| Hosting | Netlify (gói Free, 300 credits/tháng). Không dùng gói Hobby của Vercel vì cấm dùng thương mại. Dự phòng ở `09` mục 2.2 | 🔧 |
| Lưu ảnh | Cloudinary (gói Free) | 🔧 |
| Đăng nhập admin | Better Auth (email + mật khẩu) | 🔧 |
| Thông báo | Telegram Bot API | 🔒 |
| Quy tắc cho AI viết code | File `AGENTS.md` ở thư mục gốc dự án | 🔒 |

Toàn bộ chuẩn kỹ thuật: **`01-TECH-STANDARDS.md`**.

---

## PHẦN E — Yêu cầu phi chức năng 🔧
SEO địa phương (Google Maps / Google Business Profile, dữ liệu cấu trúc nhà hàng, thực đơn) · trang tải dưới 2,5 giây trên 4G · HTTPS · chống spam form · sao lưu database định kỳ · Google Analytics.

---

## PHẦN F — Lộ trình

| Giai đoạn | Nội dung | Kết quả |
|---|---|---|
| 0. Xác nhận | Master plan v1.0 + chuẩn kỹ thuật | Plan được duyệt |
| 1. Chuyển đổi code | Đổi tên thương hiệu, gỡ phần bán hàng, đổi schema (`12`) | Code cũ chạy được với mô hình mới, CI xanh |
| 2. Quản trị P0 | Món, lựa chọn & giá, danh mục, “Tạm hết”, danh sách yêu cầu | Nhập được thực đơn thật |
| 3. Web khách P0 | Trang chủ, thực đơn, chi tiết món, đặt món, liên hệ | Gửi được yêu cầu đặt món → Telegram |
| 4. Giao diện | Đổi design token sang “Lò bánh phố” (`03`) | Duyệt UI kit trên điện thoại |
| 5. Kiểm thử | Theo `10`, thử trên điện thoại thật | Sửa hết lỗi nghiêm trọng |
| 6. Deploy | Netlify, Neon, tên miền, Google Business Profile | Website chạy thật |
| 7. Mở rộng | P1, rồi P2 | Theo nhu cầu |

---

## PHẦN G — Danh sách file hướng dẫn

| File | Nội dung | Phụ thuộc |
|---|---|---|
| `01-TECH-STANDARDS.md` | Stack, cấu trúc source, quy tắc clean code, quy tắc cho AI | D |
| `02-DATABASE.md` | ERD, bảng, cột, quan hệ, index, dữ liệu mẫu | A, B, 01 |
| `03-UI-DESIGN.md` | Design system, wireframe từng trang | B1, B2, C |
| `04-SERVER-LAYER.md` | Query, server action, route handler, xác thực, validation | B, 01, 02 |
| `05-SHOP-PAGES.md` | Các trang khách, luồng đặt món và liên hệ | B1, 03, 04 |
| `06-ADMIN-PAGES.md` | Màn hình quản trị: thực đơn, yêu cầu | B2, B3, 03, 04 |
| `07-TELEGRAM-DAT-MON.md` | Luồng đặt món, tin nhắn Telegram, cài bot | B4, B5 |
| `08-SECURITY-SEO.md` | Bảo mật, chống spam, SEO địa phương, hiệu năng, pháp lý | E |
| `09-DEPLOYMENT.md` | Netlify, Neon, Cloudinary, tên miền, CI/CD, backup | D, E |
| `10-TESTING-CHECKLIST.md` | Kịch bản kiểm thử trước ra mắt | Tất cả |
| `11-HUONG-DAN-TRIEN-KHAI.md` | Hướng dẫn từng bước cho chủ tiệm | 09 |
| `12-KE-HOACH-CHUYEN-DOI.md` | Chuyển code Lamora Flower sang Bánh Mì Thanh Long: giữ gì, bỏ gì, làm theo thứ tự nào | Tất cả |
| `AGENTS.md` | Quy tắc cho AI viết code (thư mục gốc dự án) — **cần cập nhật theo `01` mục 13** | Tất cả |

**Quy tắc sinh file con**
1. Đầu mỗi file ghi: “Dựa trên 00-MASTER-PLAN.md v… và 01-TECH-STANDARDS.md v…”.
2. Chỉ chi tiết hóa tính năng P0; P1/P2 ghi điểm mở rộng.
3. Cuối mỗi file có mục “Cần xác nhận”.

---

## PHẦN H — Câu hỏi còn mở

Câu nào chưa trả lời thì AI dùng **mặc định** ở cột cuối. Trả lời xong thì sửa file gốc và đánh dấu ✅ ở đây.

### H1. Cần trả lời trước khi chuyển đổi code
| # | Câu hỏi | File | Mặc định |
|---|---|---|---|
| 1 | Làm trong repo cũ (đổi tên thành `banh-mi-thanh-long`) hay tạo repo mới từ code cũ? | 12 | Tạo repo mới, sao chép code cũ, giữ repo Lamora nguyên vẹn |
| 2 | Giữ dữ liệu Neon cũ không? | 12 | Không, tạo project Neon mới |

### H2. Cần trả lời trước khi dựng giao diện
| # | Câu hỏi | File | Mặc định |
|---|---|---|---|
| 3 | Đồng ý hướng “Lò bánh phố” (kem – nâu – hồng thanh long)? | 03 | Đồng ý |
| 4 | Logo | 03 | Logo chữ tạm (`03` mục 5.2) |
| 5 | Ảnh món thật | 03 | Ảnh mẫu, thay trước ra mắt |

### H3. Có mặc định, đổi được sau
| # | Câu hỏi | File | Mặc định |
|---|---|---|---|
| 6 | Có nhận giao tận nơi không, bán kính bao xa? | 05, 07 | Có, trong bán kính 3 km, phí báo khi gọi |
| 7 | Đặt trước tối thiểu bao lâu? Giờ nhận đặt? | 05, 07 | Nhận yêu cầu trong giờ mở cửa; hẹn giờ trong 7 ngày tới; ngoài giờ vẫn gửi được, tiệm gọi lại khi mở cửa |
| 8 | Số lượng tối đa mỗi món trong một yêu cầu | 04 | 50 |
| 9 | Telegram gửi vào chat cá nhân hay nhóm (để nhân viên cùng xem)? | 07 | Nhóm “Thanh Long – Đặt món” |
| 10 | Bật Google Analytics | 08 | Có |

### H4. Cần trước ngày ra mắt
| # | Câu hỏi | File |
|---|---|---|
| 11 | Địa chỉ, giờ mở cửa, SĐT, Zalo, username Telegram, link Google Maps của tiệm | 05 |
| 12 | Giấy chứng nhận cơ sở đủ điều kiện an toàn thực phẩm, đăng ký hộ kinh doanh (thông tin chân trang) | 08 |
| 13 | Tên miền `.vn` hay `.com` | 09 |
| 14 | Nơi lưu bản sao lưu hằng tuần (Google Drive) | 09 |

---

## Nhật ký thay đổi

| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| v1.0 | 2026-10-07 | **Chuyển dự án sang Bánh Mì Thanh Long.** Web giới thiệu món + liên hệ; bỏ giỏ hàng, thanh toán, vận chuyển, tồn kho, tra cứu đơn; thêm form đặt món và form liên hệ gửi Telegram; hiển thị giá tham khảo. Đổi file `07` thành `07-TELEGRAM-DAT-MON.md`; thêm `12-KE-HOACH-CHUYEN-DOI.md`. Bản Lamora Flower (v0.1–v0.4) lưu ở `_ban-cu-lamora-flower/` |
