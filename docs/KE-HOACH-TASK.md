# Kế hoạch task — Bánh Mì Thanh Long

Oct 7, 2026 · @it

## Tổng quan

Dự án chia thành 8 giai đoạn (0–7) với 74 task cho bản ra mắt và 8 task mở rộng; bản ra mắt (MVP) gồm giai đoạn 0–6, ước tính khoảng 5–7 tuần nếu làm buổi tối và cuối tuần. Kế hoạch bám theo `00-MASTER-PLAN` v1.0; mỗi task ghi file hướng dẫn liên quan (`01`–`12`) để AI đọc khi viết code.

**Cách đọc**

- **ID task**: `G<giai đoạn>.<số>`, ví dụ `G3.4`. Dùng ID này khi giao việc cho AI hoặc ghi commit.
- **Người làm**: **AI** = AI viết code, chủ tiệm review và chạy · **Bạn** = việc chủ tiệm tự làm (tài khoản, thông tin tiệm, ảnh, thử trên điện thoại).
- **Xong khi**: điều kiện để đánh dấu cả giai đoạn hoàn thành. Chưa đạt thì chưa sang giai đoạn sau, trừ khi ghi “làm song song được”.
- Tick ô vuông khi xong task.

| Giai đoạn | Nội dung | Số task | Ước tính |
| --- | --- | --- | --- |
| 0 | Xác nhận plan, chuẩn bị tài khoản | 8 | 1–2 ngày |
| 1 | Chuyển đổi code Lamora | 14 | 4–6 ngày |
| 2 | Trang quản trị P0 | 11 | 5–7 ngày |
| 3 | Web khách P0 + Telegram | 14 | 6–8 ngày |
| 4 | Giao diện “Lò bánh phố” | 7 | 3–4 ngày |
| 5 | Bảo mật, SEO, kiểm thử | 11 | 4–5 ngày |
| 6 | Deploy và ra mắt | 9 | 2–3 ngày |
| 7 | P1 / P2 sau ra mắt | 8 | Theo nhu cầu |

Ước tính là con số thô cho một người review code AI viết, chưa tính thời gian chờ ảnh thật và giấy tờ.

## Tiến độ (cập nhật 2026-10-07)

Tick = code đã viết và qua test trong môi trường phát triển (typecheck, lint, 199 test, build). Task chưa tick mà có ghi chú nghĩa là đang làm dở. **Chưa có task nào được thử trên dịch vụ thật** (Neon, Telegram, Cloudinary, GitHub CI); những chỗ đó ghi rõ trong ngoặc. Chi tiết: `docs/PROGRESS.md`.

| Giai đoạn | Đã tick | Tổng |
| --- | --- | --- |
| 0 | 1 | 8 |
| 1 | 11 | 14 |
| 2 | 10 | 11 |
| 3 | 13 | 14 |
| 4 | 5 | 7 |
| 5 | 5 | 11 |
| 6 | 0 | 9 |
| 7 | 0 | 8 |
| **Cộng** | **45** | **82** |

Việc tiếp theo: bạn tạo Neon, Cloudinary, bot Telegram, điền `.env` rồi làm theo `docs/DEPLOY.md`; sau đó thử trên điện thoại thật (G3.14, G4.7, G5.10) và cung cấp thông tin tiệm thật (G6.7). Luồng đặt món và quản trị đã được thử trên Postgres thật cục bộ (Telegram chưa thử vì chưa có token).

## Giai đoạn 0 — Xác nhận và chuẩn bị

Mục tiêu: chốt plan, trả lời các câu hỏi chặn việc (H1, H2) và có sẵn mọi tài khoản trước khi AI viết dòng code đầu tiên.

- [ ] **G0.1** · Bạn · Đọc và duyệt `00-MASTER-PLAN` v1.0 và `01-TECH-STANDARDS`.
- [ ] **G0.2** · Bạn · Trả lời H1 #1: tạo repo mới `banh-mi-thanh-long` hay làm trong repo cũ (mặc định: repo mới).
- [ ] **G0.3** · Bạn · Trả lời H1 #2: bỏ dữ liệu Neon cũ, tạo project Neon mới (mặc định: tạo mới).
- [ ] **G0.4** · Bạn · Trả lời H2 #3–5: hướng “Lò bánh phố”, logo chữ tạm, ảnh mẫu.
- [ ] **G0.5** · Bạn · Chuẩn bị tài khoản: GitHub, Neon (project mới), Cloudinary, Netlify — đều gói Free.
- [ ] **G0.6** · Bạn · Tạo Telegram bot qua BotFather, tạo nhóm “Thanh Long – Đặt món”, thêm bot vào nhóm, lấy `chat_id` (`07`).
- [x] **G0.7** · AI · Cập nhật `AGENTS.md` theo `01` mục 13 (mô hình không bán hàng, quy tắc mới). *(AGENTS.md đã có, kèm `docs/CODING-RULES.md`)*
- [ ] **G0.8** · AI · Tạo repo mới từ code Lamora, giữ repo Lamora nguyên vẹn; tạo file `.env.example` với các biến mới. *(đang dở: có khung dự án + `.env.example` (viết mới vì không có code Lamora); chưa tạo repo Git)*

**Xong khi:** plan được duyệt, có repo mới, có đủ khóa Neon / Cloudinary / Telegram trong `.env` máy local.

## Giai đoạn 1 — Chuyển đổi code Lamora

Mục tiêu: code Lamora chạy được với mô hình mới — giữ auth, lib, UI, product, media, Telegram; bỏ toàn bộ phần bán hàng. Làm theo thứ tự trong `12-KE-HOACH-CHUYEN-DOI`, mỗi task một commit để dễ quay lại.

**Gỡ phần bán hàng**

- [x] **G1.1** · AI · Đổi tên thương hiệu toàn dự án: tên package, metadata, chữ trên giao diện, logo tạm. Không còn chữ “Lamora”. *(viết mới nên không còn chữ Lamora)*
- [x] **G1.2** · AI · Gỡ giỏ hàng: store, component, trang, nút “Thêm vào giỏ”. *(không chép phần giỏ hàng sang)*
- [x] **G1.3** · AI · Gỡ checkout, thanh toán online, mã QR. *(không chép checkout, thanh toán, QR sang)*
- [x] **G1.4** · AI · Gỡ phí ship tự tính, tồn kho, tra cứu đơn. *(không chép phí ship, tồn kho, tra cứu đơn sang)*
- [x] **G1.5** · AI · Gỡ email gửi khách. *(không có email gửi khách)*

**Đổi cấu trúc dữ liệu** (`02`)

- [x] **G1.6** · AI · Sản phẩm → món: thêm lựa chọn có giá riêng (ít nhất 1 lựa chọn/món), nhãn (cay, chay, bán chạy, món mới), cờ “Tạm hết hôm nay”. *(bảng món + lựa chọn có giá, nhãn, cờ Tạm hết; đã test trên Postgres)*
- [x] **G1.7** · AI · Thêm bảng yêu cầu đặt món (kèm các dòng món) và tin liên hệ, có cột trạng thái. *(`order_request`, `order_request_item`, `contact_message`; đã test)*
- [x] **G1.8** · AI · Xóa bảng đơn hàng, thanh toán, vận chuyển, tồn kho; giữ bảng người dùng với cột `role` (chỉ `ADMIN`). *(không có bảng bán hàng; bảng user có cột `role`)*
- [ ] **G1.9** · AI · Tạo migration mới trên Neon mới và dữ liệu mẫu: 4 danh mục, khoảng 10 món. *(migration `0000_init.sql` và dữ liệu mẫu đã chạy thành công trên Postgres 18 thật ở máy phát triển; chưa chạy trên Neon)*

**Giữ và rà phần nền tảng**

- [ ] **G1.10** · AI · Rà Better Auth: chỉ 1 tài khoản admin, có script tạo admin từ dòng lệnh. *(đã viết + test đăng nhập, khóa sau 5 lần sai, chặn đăng ký; chờ chạy `admin:create` trên Neon thật)*
- [x] **G1.11** · AI · Rà module ảnh Cloudinary, đổi thư mục lưu sang tên dự án mới. *(ký upload, xóa ảnh, thư mục theo biến `CLOUDINARY_FOLDER`; có test chữ ký, chưa thử Cloudinary thật)*
- [x] **G1.12** · AI · Rà thư viện Telegram cũ: giữ hàm gửi tin, xóa mẫu tin đơn hàng cũ. *(gửi, thử lại, escape, mẫu tin mới, `telegram:test`, `telegram:chat-id`; chưa thử Telegram thật)*
- [x] **G1.13** · AI · Sửa query, server action, route handler theo schema mới; xóa code không còn dùng (`04`). *(query + action public và admin, có test trên Postgres; chưa nối vào giao diện)*
- [ ] **G1.14** · AI · CI xanh: typecheck, lint, test, build đều qua. *(typecheck, lint, test, build xanh trên máy; workflow `ci.yml` chưa chạy trên GitHub)*

**Xong khi:** app chạy local, trang quản trị đăng nhập được, không còn giỏ hàng hay chữ “Lamora”, CI xanh.

## Giai đoạn 2 — Trang quản trị P0

Mục tiêu: chủ tiệm nhập được thực đơn thật và xem được yêu cầu đặt món, thao tác thoải mái trên điện thoại. Làm quản trị trước web khách để có dữ liệu thật hiển thị ở giai đoạn 3 (`06`, `04`).

- [x] **G2.1** · AI · Khung trang quản trị dùng tốt trên điện thoại; chặn mọi route và server action khi chưa đăng nhập. *(khung `/admin` có menu điều hướng, bố cục điện thoại; `src/proxy.ts` chặn sớm khi không có cookie phiên; đã thử đăng nhập thật trên Postgres cục bộ)*
- [x] **G2.2** · AI · Đăng nhập, đăng xuất, báo lỗi sai mật khẩu. *(đăng nhập, đăng xuất, báo sai mật khẩu và khóa tạm; chưa thử với Neon thật)*
- [x] **G2.3** · AI · Quản lý danh mục: thêm, sửa, xóa, sắp xếp thứ tự hiển thị. *(giao diện quản lý danh mục (thêm, sửa, xóa, đổi thứ tự))*
- [x] **G2.4** · AI · Danh sách món: lọc theo danh mục, thấy ngay giá và trạng thái “Tạm hết”. *(danh sách món có lọc theo danh mục, giá và nhãn “Tạm hết”)*
- [x] **G2.5** · AI · Form thêm/sửa món: tên, đường dẫn, mô tả, thành phần, danh mục, nhãn. *(form thêm/sửa món)*
- [x] **G2.6** · AI · Lựa chọn và giá trong form món: thêm, xóa, sắp xếp; bắt buộc ít nhất 1 lựa chọn. *(lựa chọn và giá trong form món, bắt buộc ít nhất 1)*
- [x] **G2.7** · AI · Tải ảnh món lên Cloudinary, chọn ảnh chính, xóa ảnh. *(tải ảnh lên Cloudinary (ký phía server, giới hạn 5MB jpg/png/webp), chọn ảnh chính, xóa ảnh; chưa thử với Cloudinary thật)*
- [x] **G2.8** · AI · Công tắc “Tạm hết hôm nay” bấm một chạm ngay trên danh sách món. *(công tắc “Tạm hết” một chạm trên danh sách món)*
- [x] **G2.9** · AI · Danh sách yêu cầu đặt món: mới nhất trên cùng, xem chi tiết, đổi trạng thái, bấm gọi nhanh SĐT khách. *(danh sách + chi tiết yêu cầu, đổi trạng thái, gọi nhanh, thử lại Telegram; đã thử luồng đặt món → admin trên Postgres cục bộ)*
- [x] **G2.10** · AI · Danh sách tin liên hệ: xem, đổi trạng thái. *(danh sách tin liên hệ và đổi trạng thái)*
- [ ] **G2.11** · Bạn · Nhập thực đơn thật: danh mục, món, lựa chọn, giá (ảnh mẫu được).

**Xong khi:** bạn nhập trọn thực đơn thật từ điện thoại mà không cần sửa code.

## Giai đoạn 3 — Web khách P0 và Telegram

Mục tiêu: khách mở link trên điện thoại, xem thực đơn và gửi được yêu cầu đặt món; tin báo về nhóm Telegram ngay, đồng thời lưu vào database (`05`, `07`).

**Khung chung**

- [x] **G3.1** · AI · Một file cấu hình thông tin tiệm: địa chỉ, giờ mở cửa, SĐT, Zalo, Telegram, link Google Maps (giá trị tạm, thay ở G6.7). *(`src/lib/shop-config.ts`, giá trị đang là TẠM)*
- [x] **G3.2** · AI · Layout chung: header, menu điện thoại, footer lấy từ file cấu hình. *(layout chung (header, menu điện thoại, footer) lấy từ shop-config)*
- [x] **G3.3** · AI · Nút liên hệ nổi: Gọi · Zalo · Telegram. *(nút nổi Gọi · Zalo · Telegram)*

**Các trang**

- [x] **G3.4** · AI · Trang chủ: ảnh lớn, món nổi bật, thực đơn rút gọn, câu chuyện tiệm, địa chỉ + giờ mở cửa, nút đặt món. *(trang chủ; nội dung câu chuyện là nháp TẠM)*
- [x] **G3.5** · AI · Trang thực đơn: món theo danh mục, giá, nhãn, món “Tạm hết” hiển thị mờ và không đặt được. *(trang thực đơn theo danh mục, món “Tạm hết” mờ và không đặt được)*
- [x] **G3.6** · AI · Chi tiết món: ảnh, mô tả, thành phần, các lựa chọn và giá, nút “Đặt món này” mở form với món đã chọn sẵn. *(trang chi tiết món có lựa chọn, giá và nút “Đặt món này”)*
- [x] **G3.7** · AI · Trang giới thiệu, chính sách bảo mật, trang 404 và trang lỗi. *(giới thiệu, chính sách bảo mật (nháp TẠM, không nhắc analytics), 404, trang lỗi)*

**Đặt món và liên hệ**

- [x] **G3.8** · AI · Form đặt món: chọn món + lựa chọn + số lượng (tối đa 50/món), tên, SĐT, lấy tại quầy hoặc giao (trong 3 km), giờ muốn nhận (trong 7 ngày tới), ghi chú. *(form đặt món đầy đủ; đã gửi thử thật trên Postgres cục bộ)*
- [x] **G3.9** · AI · Kiểm tra dữ liệu phía server và lưu yêu cầu vào database; tổng tiền ghi rõ là giá tham khảo. *(kiểm tra ở server, tính giá từ database, lưu trong transaction; chưa có giao diện hiển thị)*
- [x] **G3.10** · AI · Gửi tin Telegram sau khi lưu; Telegram lỗi thì yêu cầu vẫn được lưu và khách vẫn thấy gửi thành công. *(lưu trước, gửi Telegram sau, lỗi Telegram vẫn báo thành công; đã test bằng Telegram giả lập)*
- [x] **G3.11** · AI · Màn hình gửi thành công: “Tiệm sẽ gọi lại để xác nhận”; ngoài giờ mở cửa thì báo tiệm gọi lại khi mở cửa. *(màn hình gửi thành công có mã yêu cầu; ngoài giờ có thông báo)*
- [x] **G3.12** · AI · Trang liên hệ: bản đồ, giờ mở cửa, SĐT, Zalo, Telegram, form liên hệ → database + Telegram. *(trang liên hệ có bản đồ, giờ mở cửa và form liên hệ)*
- [x] **G3.13** · AI · Test tự động cho kiểm tra dữ liệu form và luồng lưu + gửi Telegram (giả lập Telegram lỗi). *(test kiểm tra dữ liệu + luồng lưu và Telegram (cả khi Telegram lỗi, spam, tính giá))*
- [ ] **G3.14** · Bạn · Gửi thử 5 yêu cầu từ điện thoại, kiểm tra tin trong nhóm Telegram và trong trang quản trị.

**Xong khi:** yêu cầu gửi từ điện thoại hiện trong nhóm Telegram dưới 10 giây và có trong trang quản trị.

## Giai đoạn 4 — Giao diện “Lò bánh phố”

Mục tiêu: web mang màu thương hiệu, ảnh món là trọng tâm, đẹp trên điện thoại (`03`). G4.1–G4.3 làm song song được với giai đoạn 3 vì chỉ đổi design token.

- [x] **G4.1** · AI · Design token màu: nền kem bột mì, chữ nâu vỏ bánh, điểm nhấn hồng thanh long, xanh lá, vàng bơ (`03` mục 2). *(token màu trong `globals.css` (bảng màu kem đã được bạn đồng ý))*
- [ ] **G4.2** · AI · Font Baloo 2 (tiêu đề) và Be Vietnam Pro (nội dung), kiểm tra đủ dấu tiếng Việt. *(đã khai báo 2 font; chưa kiểm tra dấu tiếng Việt với font thật)*
- [x] **G4.3** · AI · Logo chữ tạm (`03` mục 5.2) và favicon. *(logo chữ tạm và favicon (`src/app/icon.svg`))*
- [x] **G4.4** · AI · Đổi kiểu component chung: nút, thẻ món, nhãn, ô nhập, nút liên hệ nổi. *(bộ component UI mới: nút, thẻ món, nhãn, ô nhập, chọn, công tắc, tăng giảm, nút nổi)*
- [x] **G4.5** · AI · Áp giao diện mới cho toàn bộ trang khách, ưu tiên màn hình 360–430 px. *(áp giao diện kem cho toàn bộ trang khách; đã chụp thử ở 390px)*
- [x] **G4.6** · AI · Áp token cho trang quản trị (giữ gọn, ưu tiên dễ bấm). *(trang quản trị dùng cùng token, nút lớn dễ bấm)*
- [ ] **G4.7** · Bạn · Duyệt UI kit và các trang trên điện thoại thật; ghi lại chỗ cần sửa.

**Xong khi:** bạn duyệt giao diện trên điện thoại, không còn màu hay font của Lamora.

## Giai đoạn 5 — Bảo mật, SEO và kiểm thử

Mục tiêu: form không bị spam, khách quanh tiệm tìm thấy trên Google, trang tải dưới 2,5 giây trên 4G và không còn lỗi nghiêm trọng (`08`, `10`).

**Bảo mật**

- [x] **G5.1** · AI · Chống spam cho form đặt món và liên hệ theo `08` (ví dụ ô bẫy ẩn + giới hạn số lần gửi theo IP). *(ô bẫy, thời gian điền ≥ 3 giây, giới hạn theo IP băm; đã test (chưa có form để thử thật))*
- [x] **G5.2** · AI · Rà quyền: mọi server action và route quản trị đều kiểm tra đăng nhập; thêm header bảo mật. *(mọi admin action kiểm tra quyền; header bảo mật (CSP, X-Frame-Options DENY, HSTS, Referrer-Policy, Permissions-Policy) trong `next.config.ts`; đã kiểm tra trên bản `next start`)*
- [ ] **G5.3** · AI · Kiểm tra biến môi trường khi khởi động; không có khóa nào lộ ra phía trình duyệt. *(một phần: kiểm tra biến môi trường bằng Zod ở lần dùng đầu; chưa kiểm tra lúc khởi động)*

**SEO và hiệu năng**

- [x] **G5.4** · AI · Metadata từng trang, ảnh chia sẻ Zalo/Facebook, sitemap, robots. *(metadata từng trang, ảnh chia sẻ `opengraph-image.png` 1200×630, sitemap, robots)*
- [x] **G5.5** · AI · Dữ liệu cấu trúc nhà hàng và thực đơn (JSON-LD) cho SEO địa phương. *(JSON-LD Restaurant ở trang chủ)*
- [ ] **G5.6** · AI · Tối ưu ảnh và tốc độ; đo Lighthouse trên giả lập 4G, mục tiêu tải dưới 2,5 giây.
- [ ] **G5.7** · AI · Gắn Google Analytics, cập nhật chính sách bảo mật tương ứng. *(BỎ theo quyết định của bạn: không dùng Google Analytics; chính sách bảo mật không nhắc analytics)*
- [x] **G5.8** · AI · Chân trang pháp lý: số đăng ký hộ kinh doanh, giấy chứng nhận an toàn thực phẩm (chờ H4 #12). *(chân trang tự hiện số đăng ký / giấy an toàn thực phẩm khi điền trong shop-config)*

**Kiểm thử**

- [ ] **G5.9** · AI · Bổ sung test tự động còn thiếu để CI phủ các luồng chính. *(đã có 199 test gồm giao diện chính; chưa có test trình duyệt tự động trong CI)*
- [ ] **G5.10** · Bạn · Chạy checklist `10` trên điện thoại thật: Android, iPhone, và trình duyệt trong Zalo / Facebook.
- [ ] **G5.11** · AI · Sửa hết lỗi nghiêm trọng tìm được ở G5.10.

**Xong khi:** checklist `10` đạt, Lighthouse trên điện thoại đạt mục tiêu, không còn lỗi nghiêm trọng.

## Giai đoạn 6 — Deploy và ra mắt

Mục tiêu: web chạy thật trên tên miền riêng, chi phí gần 0đ/tháng, có sao lưu (`09`, `11`).

- [ ] **G6.1** · AI · Tạo database Neon production, chạy migration; tách biệt với database phát triển.
- [ ] **G6.2** · AI · Tạo site Netlify, khai báo biến môi trường, build thành công.
- [ ] **G6.3** · AI · CI/CD: tự deploy khi merge vào nhánh chính, bản xem trước cho mỗi pull request. *(có `netlify.toml` và `docs/DEPLOY.md`; chưa nối GitHub/Netlify thật)*
- [ ] **G6.4** · AI · Tạo tài khoản admin production bằng script.
- [ ] **G6.5** · AI · Sao lưu database hằng tuần lên Google Drive (chờ H4 #14). *(có `npm run db:backup` và workflow `backup.yml` (GitHub Actions → Google Drive qua rclone), hướng dẫn trong `docs/DEPLOY.md`; cần bạn đặt file vào `.github/workflows/` và tạo secret; chưa chạy thật)*
- [ ] **G6.6** · Bạn · Mua tên miền (`.vn` hoặc `.com`, H4 #13), trỏ DNS về Netlify, kiểm tra HTTPS.
- [ ] **G6.7** · Bạn · Cung cấp thông tin tiệm thật (H4 #11) để thay giá trị tạm trong file cấu hình.
- [ ] **G6.8** · Bạn · Thay ảnh món thật, nhập thực đơn thật trên production, gửi 1 yêu cầu thử cuối cùng.
- [ ] **G6.9** · Bạn · Tạo/cập nhật Google Business Profile, gắn link web; theo dõi lượng credits Netlify tháng đầu.

**Xong khi:** web chạy trên tên miền thật, yêu cầu đặt món từ production về đúng nhóm Telegram, có bản sao lưu đầu tiên.

## Giai đoạn 7 — Mở rộng sau ra mắt

Làm P1 sau 2–4 tuần chạy thật, khi đã biết tiệm cần gì nhất; P2 chỉ làm khi có nhu cầu rõ ràng.

**P1 — Web khách**

- [ ] **G7.1** · Nhớ tên + SĐT khách trên trình duyệt cho lần đặt sau.
- [ ] **G7.2** · Tìm kiếm món (chỉ khi thực đơn lớn dần).

**P1 — Quản trị**

- [ ] **G7.3** · Nút trên tin Telegram để đổi trạng thái yêu cầu: “Đã gọi”, “Xong”, “Hủy”.
- [ ] **G7.4** · Sửa thông tin tiệm (giờ mở cửa, SĐT, banner) trong trang quản trị thay vì file cấu hình.
- [ ] **G7.5** · Thống kê số yêu cầu và món được đặt nhiều.

**P2**

- [ ] **G7.6** · Form riêng cho đặt bàn / đặt tiệc số lượng lớn.
- [ ] **G7.7** · Blog, đánh giá món.
- [ ] **G7.8** · Nhiều chi nhánh; thêm vai trò nhân viên (cột `role` đã sẵn).

## Thứ tự làm và việc cần chuẩn bị

Đường chính là G0 → G1 → G2 → G3 → G5 → G6; chỉ giao diện (G4) chạy song song được.

&#91;embedded content: thứ tự giai đoạn · 8 giai đoạn, 1 nhánh song song\]

Làm quản trị trước web khách để trang thực đơn hiển thị ngay dữ liệu thật thay vì dữ liệu giả.

**Bạn cần chuẩn bị, theo thời điểm cần**

| Việc | Cần trước | Câu hỏi trong plan |
| --- | --- | --- |
| Repo mới hay cũ, giữ dữ liệu Neon cũ không | G1 | H1 #1–2 |
| Bot + nhóm Telegram, `chat_id` | G3 | H3 #9 |
| Bán kính giao hàng, giờ nhận đặt | G3 | H3 #6–7 |
| Hướng giao diện, logo | G4 | H2 #3–4 |
| Giấy chứng nhận ATTP, đăng ký hộ kinh doanh | G5 | H4 #12 |
| Thông tin tiệm thật (địa chỉ, giờ, SĐT, Zalo, Maps) | G6 | H4 #11 |
| Ảnh món thật | G6 | H2 #5 |
| Tên miền `.vn` hay `.com` | G6 | H4 #13 |
| Nơi lưu bản sao lưu | G6 | H4 #14 |

**Cần xác nhận**

- “Tạm hết hôm nay” tự bật lại mỗi sáng hay chỉ tắt/bật bằng tay? Plan chưa nói; nếu chưa trả lời, AI làm bật bằng tay.
- Project hiện chỉ có file `00`; các file `01`–`12` chưa được tải lên nên task chỉ dẫn chiếu theo tên file. Tải chúng lên để đối chiếu và chỉnh task cho khớp chi tiết.
