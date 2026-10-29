# TASK-FE — Giao diện Bánh Mì Thanh Long

> Dựa trên `00-MASTER-PLAN` v1.0. Đọc cùng `03-UI-DESIGN.md`, `05-SHOP-PAGES.md`, `06-ADMIN-PAGES.md`. Dữ liệu và action: `TASK-BE.md`.
> Liên quan kế hoạch task: **G1.1 – G1.5** (gỡ UI bán hàng), **G2.1 – G2.10**, **G3.1 – G3.12**, **G4.1 – G4.6**, **G5.4 – G5.8**.

---

## 1. Nguyên tắc

| # | Quy tắc |
|---|---|
| 1 | **Mobile-first**: thiết kế cho màn hình 360–430 px trước, rồi mở rộng. Phần lớn khách mở link từ Zalo / Facebook / Google Maps. |
| 2 | Mặc định là **Server Component**. Chỉ thêm `"use client"` cho phần cần tương tác (form, công tắc, menu mobile). |
| 3 | Không có giỏ hàng, nút “Thêm vào giỏ”, “Thanh toán”, “Mua ngay”. Hành động chính luôn là **“Đặt món”** hoặc **Gọi / Zalo**. |
| 4 | Giá luôn hiển thị kèm ý “giá tham khảo” ở form đặt món và màn hình cảm ơn. |
| 5 | Toàn bộ chữ tiếng Việt có dấu, giọng gần gũi (“Tiệm sẽ gọi lại cho bạn ngay”). |
| 6 | Ảnh dùng `next/image` qua Cloudinary, có `sizes`, ảnh đầu trang `priority`. |
| 7 | Vùng bấm tối thiểu 44 × 44 px; chữ nội dung ≥ 16 px (tránh iPhone tự phóng to ô nhập). |
| 8 | Dùng lại component UI của Lamora, chỉ đổi style theo token mới. Không thêm thư viện UI mới nếu không cần. |

---

## 2. Bản đồ trang (route)

### 2.1 Web khách
| Route | Trang | Task |
|---|---|---|
| `/` | Trang chủ | G3.4 |
| `/thuc-don` | Thực đơn | G3.5 |
| `/thuc-don/[slug]` | Chi tiết món | G3.6 |
| `/dat-mon` | Form đặt món (nhận `?mon=<slug>&lua-chon=<optionId>`) | G3.8 |
| `/dat-mon/thanh-cong` | Cảm ơn (nhận `?ma=<code>`) | G3.11 |
| `/lien-he` | Liên hệ + form | G3.12 |
| `/gioi-thieu` | Câu chuyện tiệm | G3.7 |
| `/chinh-sach-bao-mat` | Chính sách bảo mật | G3.7 |
| `not-found`, `error` | 404, lỗi | G3.7 |

Xóa toàn bộ route bán hàng Lamora: giỏ hàng, checkout, thanh toán, tra cứu đơn, tài khoản khách (G1.2 – G1.4).

### 2.2 Quản trị
| Route | Màn hình | Task |
|---|---|---|
| `/admin/dang-nhap` | Đăng nhập | G2.2 |
| `/admin` | Tổng quan: số yêu cầu mới, lối tắt | G2.1 |
| `/admin/yeu-cau` | Danh sách yêu cầu đặt món | G2.9 |
| `/admin/yeu-cau/[id]` | Chi tiết yêu cầu | G2.9 |
| `/admin/mon` | Danh sách món + công tắc “Tạm hết” | G2.4, G2.8 |
| `/admin/mon/moi`, `/admin/mon/[id]` | Thêm / sửa món | G2.5 – G2.7 |
| `/admin/danh-muc` | Danh mục | G2.3 |
| `/admin/lien-he` | Tin liên hệ | G2.10 |

Trang quản trị: `noindex`, không vào sitemap.

---

## 3. Design token — G4.1 – G4.3

Giá trị màu chính xác lấy ở `03-UI-DESIGN.md` mục 2. Khai báo dạng biến CSS (và cấu hình Tailwind nếu code cũ dùng Tailwind), **không viết mã màu trực tiếp trong component**.

| Token | Vai trò |
|---|---|
| `--color-bg` | Nền kem bột mì |
| `--color-surface` | Thẻ, ô nhập (sáng hơn nền) |
| `--color-text` | Chữ nâu vỏ bánh |
| `--color-text-muted` | Chữ phụ |
| `--color-primary` | Hồng thanh long — nút chính, giá, điểm nhấn |
| `--color-primary-foreground` | Chữ trên nút chính (đảm bảo tương phản ≥ 4.5:1) |
| `--color-accent-green` | Nhãn “Chay”, trạng thái “Đang mở cửa” |
| `--color-accent-yellow` | Nhãn “Bán chạy”, “Món mới” |
| `--color-danger` | Lỗi, nhãn “Cay”, “Tạm hết” |
| `--radius-card`, `--radius-button` | Bo góc mềm |
| `--shadow-card` | Bóng nhẹ |

Font qua `next/font/google`, subset `vietnamese` + `latin`:
- Tiêu đề: **Baloo 2** (600, 700)
- Nội dung: **Be Vietnam Pro** (400, 500, 600)

Logo chữ tạm “Bánh Mì Thanh Long” theo `03` mục 5.2 + favicon.

---

## 4. Component dùng chung

| Component | Mô tả | Client? |
|---|---|---|
| `SiteHeader` | Logo, menu (Thực đơn · Giới thiệu · Liên hệ), nút “Đặt món”; menu hamburger trên điện thoại | Phần menu mobile |
| `SiteFooter` | Địa chỉ, giờ mở cửa, SĐT, Zalo, Telegram, thông tin pháp lý (G5.8) | |
| `FloatingContact` | 3 nút nổi góc phải dưới: Gọi (`tel:`), Zalo, Telegram; không che nút gửi form | |
| `OpenStatusBadge` | “Đang mở cửa · đóng lúc 20:00” / “Đã đóng cửa · mở lại 06:00” | ✔ (tính giờ phía client để không bị cache sai) |
| `MenuItemCard` | Ảnh, tên, mô tả ngắn, “từ 25.000₫”, nhãn, nút “Đặt”; trạng thái “Tạm hết” làm mờ + nhãn, nút bị tắt | |
| `ItemBadges` | Cay · Chay · Bán chạy · Món mới · Tạm hết | |
| `Price` | Định dạng `25.000₫` dùng `formatVND` | |
| `CategoryTabs` | Thanh danh mục dính đầu trang, cuộn ngang, nhảy tới mục | ✔ |
| `QuantityStepper` | Nút − / + và ô số, giới hạn 1–50 | ✔ |
| `FormField`, `Input`, `Textarea`, `RadioGroup`, `Select` | Hiện lỗi dưới ô, `aria-invalid`, `aria-describedby` | ✔ |
| `SubmitButton` | Trạng thái đang gửi, chặn bấm hai lần | ✔ |
| `EmptyState`, `Skeleton` | Trạng thái trống / đang tải | |
| `MapEmbed` | iframe Google Maps, `loading="lazy"` | |

---

## 5. Trang khách chi tiết

### 5.1 Trang chủ `/` — G3.4
Thứ tự khối trên điện thoại:
1. **Hero**: ảnh lớn bánh mì, tên tiệm, câu giới thiệu ngắn, `OpenStatusBadge`, 2 nút: **Đặt món** (chính) · **Gọi ngay**.
2. **Món nổi bật**: 4–6 `MenuItemCard` (`getFeaturedItems`), cuộn ngang trên điện thoại, lưới trên desktop.
3. **Thực đơn rút gọn**: mỗi danh mục 3 món đầu + link “Xem cả thực đơn”.
4. **Câu chuyện tiệm**: ảnh + 2–3 đoạn ngắn, link “Giới thiệu”.
5. **Đặt số lượng cho văn phòng / sự kiện**: một dòng kêu gọi + nút Đặt món / Zalo.
6. **Địa chỉ & giờ mở cửa**: địa chỉ, giờ, `MapEmbed`, nút “Chỉ đường” (mở Google Maps).

### 5.2 Thực đơn `/thuc-don` — G3.5
- `CategoryTabs` dính trên cùng; mỗi danh mục là một mục có tiêu đề + danh sách `MenuItemCard`.
- Điện thoại: thẻ dạng hàng ngang (ảnh vuông bên trái 96 px, nội dung bên phải). Desktop: lưới 3–4 cột.
- Món “Tạm hết” vẫn hiện, xếp cuối danh mục, nút “Đặt” bị tắt.
- Nút cố định cuối màn hình điện thoại: “Đặt món”.

### 5.3 Chi tiết món `/thuc-don/[slug]` — G3.6
- Ảnh lớn (vuốt nếu nhiều ảnh), tên, nhãn, mô tả, thành phần.
- Danh sách lựa chọn dạng radio với giá từng lựa chọn; chọn sẵn option mặc định.
- Nút **“Đặt món này”** → `/dat-mon?mon=<slug>&lua-chon=<optionId>`.
- Món tạm hết: nút tắt + dòng “Món này tạm hết hôm nay, bạn xem món khác nhé”.
- Khối “Món khác cùng danh mục” (3–4 món).
- `generateStaticParams` + `generateMetadata` (tên, mô tả, ảnh OG).

### 5.4 Đặt món `/dat-mon` — G3.8 – G3.11
Một trang, chia 3 bước dọc (không phải trang riêng):

**Bước 1 — Chọn món**
- Ô chọn món nhanh: danh sách món theo danh mục (dạng sheet/accordion trên điện thoại); chọn món → chọn lựa chọn → số lượng → “Thêm”.
- Danh sách món đã chọn: tên + lựa chọn, `QuantityStepper`, thành tiền dòng, nút xóa.
- Nếu vào từ `?mon=…`: món đó đã có sẵn 1 phần.
- **Tạm tính** cập nhật trực tiếp + dòng chữ nhỏ “Giá tham khảo, tiệm sẽ xác nhận khi gọi lại”.
- Đây là **state cục bộ của form**, không phải giỏ hàng: không lưu localStorage, không có icon giỏ trên header.

**Bước 2 — Thông tin nhận món**
- Tên, SĐT (`inputMode="tel"`, `autoComplete="tel"`).
- Nhận món: **Lấy tại quầy** / **Giao gần (trong 3 km)**. Chọn giao → hiện ô địa chỉ + ghi chú “Phí giao tiệm báo khi gọi”.
- Giờ muốn nhận: **Sớm nhất có thể** hoặc chọn ngày (hôm nay → 7 ngày tới) + giờ (bước 15 phút, trong giờ mở cửa).
- Ghi chú.

**Bước 3 — Gửi**
- Tóm tắt ngắn + nút **“Gửi yêu cầu đặt món”**.
- Ngoài giờ mở cửa: dòng thông báo “Tiệm đang đóng cửa, sẽ gọi lại bạn lúc 06:00”.
- Honeypot ẩn (`website`) + `startedAt` (thời điểm mở trang).
- Lỗi từ server: hiện dưới từng ô (`fieldErrors`) và một thông báo tổng ở đầu form; cuộn tới lỗi đầu tiên. Món bị báo hết khi gửi → đánh dấu đỏ dòng món đó.
- Thành công → chuyển tới `/dat-mon/thanh-cong?ma=TL-1007-023`.

**Trang thành công**: mã yêu cầu, “Tiệm sẽ gọi lại cho bạn trong ít phút” (hoặc “khi mở cửa”), nút Gọi / Zalo nếu cần gấp, link về thực đơn. `noindex`.

P1 (G7.1): nhớ tên + SĐT bằng localStorage, hỏi khách trước khi lưu.

### 5.5 Liên hệ `/lien-he` — G3.12
Địa chỉ, `MapEmbed`, giờ mở cửa theo từng ngày, SĐT, Zalo, Telegram (nút lớn), form liên hệ (tên, SĐT hoặc email, nội dung) → thông báo thành công ngay tại chỗ.

### 5.6 Giới thiệu, Chính sách bảo mật, 404, lỗi — G3.7
- Chính sách bảo mật: dữ liệu thu thập (tên, SĐT, địa chỉ giao), mục đích (liên hệ xác nhận món), nơi lưu, thời gian lưu, Google Analytics, cách yêu cầu xóa.
- 404: “Không tìm thấy trang” + link thực đơn; `error.tsx`: thông báo + nút thử lại + nút Gọi tiệm.

---

## 6. Trang quản trị chi tiết — G2.1 – G2.10

Thiết kế cho **điện thoại** trước (chủ tiệm thao tác lúc đứng quầy).

| Màn hình | Nội dung |
|---|---|
| Khung | Thanh dưới cùng trên điện thoại: Yêu cầu (badge số mới) · Món · Danh mục · Liên hệ; sidebar trên desktop. Nút đăng xuất |
| Đăng nhập | Email, mật khẩu, thông báo lỗi chung “Sai email hoặc mật khẩu” |
| Tổng quan | Số yêu cầu mới hôm nay, yêu cầu Telegram gửi lỗi, lối tắt “Bật/tắt món hết” |
| Danh sách yêu cầu | Lọc theo trạng thái (tab); mỗi dòng: mã, giờ gửi, tên, SĐT, giờ nhận, tạm tính, trạng thái, biểu tượng cảnh báo nếu Telegram lỗi |
| Chi tiết yêu cầu | Thông tin khách, nút **Gọi** (`tel:`) và **Zalo**, danh sách món, ghi chú, đổi trạng thái (4 nút), ghi chú nội bộ, nút “Gửi lại Telegram” khi lỗi |
| Danh sách món | Nhóm theo danh mục; mỗi dòng: ảnh nhỏ, tên, giá thấp nhất, **công tắc “Tạm hết”** to, dễ bấm (cập nhật lạc quan, hoàn tác nếu lỗi), trạng thái ẩn/hiện; nút thêm món |
| Form món | Tên → slug tự sinh; danh mục; mô tả ngắn; mô tả; thành phần; 4 nhãn + “Nổi bật”; **lựa chọn & giá** (thêm dòng, xóa dòng, kéo sắp xếp, chọn mặc định; ô giá nhập số, hiển thị `25.000`); **ảnh** (tải nhiều ảnh, chọn ảnh chính, xóa, hiện tiến trình tải); nút Lưu dính cuối màn hình; cảnh báo khi rời trang chưa lưu |
| Danh mục | Danh sách + sắp xếp, thêm/sửa trong hộp thoại, xóa có xác nhận |
| Liên hệ | Danh sách tin, đánh dấu đã xử lý, nút Gọi/Email |

Mọi thao tác thành công/thất bại hiện toast ngắn.

---

## 7. SEO, hiệu năng, analytics — G5.4 – G5.8

- `generateMetadata` mọi trang khách: title “<Trang> | Bánh Mì Thanh Long”, mô tả, ảnh OG 1200×630 (dùng khi chia sẻ Zalo/Facebook).
- `app/sitemap.ts`, `app/robots.ts` (chặn `/admin`, `/dat-mon/thanh-cong`).
- JSON-LD: `Restaurant` (tên, địa chỉ, SĐT, giờ mở cửa, `servesCuisine: "Vietnamese"`, `priceRange`) trên trang chủ/liên hệ; `Menu` + `MenuSection` + `MenuItem` (giá `VND`) trên `/thuc-don`.
- `lang="vi"`, thẻ heading đúng thứ tự, `alt` ảnh có nghĩa.
- Mục tiêu: LCP < 2,5 s trên 4G giả lập; CLS < 0,1. Ảnh hero ≤ 150 KB, định dạng tự động của Cloudinary (`f_auto,q_auto`).
- Google Analytics bằng `@next/third-parties` hoặc script `afterInteractive`; sự kiện: `click_call`, `click_zalo`, `click_telegram`, `order_request_submit`, `contact_submit`.
- Footer pháp lý: số đăng ký hộ kinh doanh, giấy chứng nhận ATTP (chờ thông tin thật).

---

## 8. Kiểm tra trước khi xong mỗi trang

- [ ] Xem ở 360 px, 390 px, 768 px, 1280 px — không cuộn ngang, chữ không tràn.
- [ ] Mở trong trình duyệt của Zalo và Facebook trên điện thoại thật.
- [ ] Dùng được bằng bàn phím; nhãn ô nhập đầy đủ; tương phản đạt.
- [ ] Trạng thái: đang tải, trống, lỗi, “Tạm hết”.
- [ ] Không còn chữ, màu, font, icon của Lamora.

---

## 9. Checklist task FE

**G1 — Gỡ UI cũ**
- [ ] **G1.1** Đổi tên thương hiệu, metadata, logo tạm
- [ ] **G1.2 – G1.4** Xóa trang + component giỏ hàng, checkout, thanh toán, tra cứu đơn; xóa icon giỏ trên header

**G2 — Quản trị**
- [ ] **G2.1** Khung admin + điều hướng mobile
- [ ] **G2.2** Trang đăng nhập
- [ ] **G2.3** Danh mục
- [ ] **G2.4 + G2.8** Danh sách món + công tắc “Tạm hết”
- [ ] **G2.5 – G2.7** Form món: thông tin, lựa chọn & giá, ảnh
- [ ] **G2.9** Danh sách + chi tiết yêu cầu
- [ ] **G2.10** Tin liên hệ

**G3 — Web khách**
- [ ] **G3.2** `SiteHeader`, `SiteFooter` · **G3.3** `FloatingContact`
- [ ] **G3.4** Trang chủ
- [ ] **G3.5** Thực đơn
- [ ] **G3.6** Chi tiết món
- [ ] **G3.7** Giới thiệu, chính sách, 404, lỗi
- [ ] **G3.8** Form đặt món 3 bước
- [ ] **G3.11** Trang thành công
- [ ] **G3.12** Trang liên hệ + form

**G4 — Giao diện**
- [ ] **G4.1** Token màu · **G4.2** Font · **G4.3** Logo, favicon
- [ ] **G4.4** Restyle component chung
- [ ] **G4.5** Áp cho trang khách · **G4.6** Áp cho admin

**G5 — SEO / hiệu năng**
- [ ] **G5.4** Metadata, OG, sitemap, robots
- [ ] **G5.5** JSON-LD
- [ ] **G5.6** Tối ưu ảnh, đo Lighthouse
- [ ] **G5.7** Google Analytics + sự kiện
- [ ] **G5.8** Footer pháp lý

## 10. Cần xác nhận
1. Màu hex chính xác và logo: lấy theo `03-UI-DESIGN.md`; nếu chưa có, AI đề xuất bảng màu để duyệt ở G4.7.
2. Chọn món trong form đặt món dạng **sheet trượt từ dưới lên** (mặc định) hay dạng danh sách mở rộng?
3. Ảnh hero và câu chuyện tiệm: dùng ảnh mẫu cho tới khi có ảnh thật.
