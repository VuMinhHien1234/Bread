# PROGRESS — Đã làm gì, kiểm tra được gì, còn gì

## Cập nhật 2026-10-29 — Đổi đường dẫn quản trị
- Trang quản trị chuyển từ `/admin` sang `/quan-ly-qd45jc` (đăng nhập: `/quan-ly-qd45jc/dang-nhap`). Một chỗ khai báo: `src/lib/admin-path.ts`; `/admin` giờ trả 404. robots.txt không còn liệt kê đường dẫn quản trị; trang quản trị gửi header `X-Robots-Tag: noindex` và `Cache-Control: no-store`. Có test giữ thư mục, matcher proxy và hằng số khớp nhau.

## Cập nhật 2026-10-14 — Giao diện sang trọng + sẵn sàng deploy
- **Giao diện**: đổi font sang Newsreader (tiêu đề) + Source Sans 3 (nội dung), tự host; làm lại header (menu điện thoại toàn màn hình, đánh dấu trang đang xem), hero 2 cột có khung vòm, 3 điểm mạnh, thẻ món tỉ lệ 4:5, bảng danh mục kiểu thực đơn, chân trang 4 cột, nút liên hệ nổi dạng biểu tượng, trang lỗi/404, trang đăng nhập quản trị. Đã chụp màn hình kiểm tra máy tính và điện thoại (390px), không tràn ngang, không lỗi JavaScript.
- **Sửa lỗi deploy**: (1) `package-lock.json` lệch với `package.json` → `npm ci` (CI/Netlify) sẽ lỗi; đã tạo lại. (2) Có cả `pnpm-lock.yaml` + `pnpm-workspace.yaml` chứa giá trị dang dở → Netlify sẽ chọn pnpm và lỗi; đã bỏ, dự án dùng npm. (3) `npm run typecheck` lỗi ở `scripts/telegram-chat-id.ts`; đã sửa. (4) `next build` lỗi khi không có biến môi trường (trang admin bị dựng sẵn lúc build); đã sửa — build không cần secret.
- **CI/CD**: thêm `.github/workflows/ci.yml`, `backup.yml`, `db-migrate.yml`, `.github/dependabot.yml`, `.nvmrc`; cập nhật `netlify.toml`, `docs/DEPLOY.md`.
- Kiểm tra: typecheck, lint, Prettier, 202 test, build — đều qua (build không có `.env`).

> Cập nhật: 2026-10-07 (sau giai đoạn 2–5 phần code). Ghi trung thực: chỉ đánh dấu "đã kiểm tra" khi có lệnh/test chứng minh.

## Bối cảnh quan trọng
Code Lamora **không có sẵn** khi bắt đầu, nên các phần 🟢 trong `REUSE-LAMORA.md` (Better Auth, Telegram, Cloudinary, UI cơ bản, format tiền, slug, lint/CI) được **viết lại từ đầu** theo `CODING-RULES.md`, không chép từ Lamora. Khi có code Lamora, đối chiếu để lấy thêm chỗ nào hay hơn; không bắt buộc thay.
Quyết định kỹ thuật phải chốt khi chưa có code cũ: **ORM = Drizzle** (driver Neon WebSocket để có transaction), **validation = Zod 4**, **test = Vitest 5**, **CSS = Tailwind 4**, **Next.js 16**.

## Kết quả kiểm tra hiện tại
| Kiểm tra | Kết quả |
|---|---|
| `npm run typecheck` | Qua |
| `npm run lint` | Qua, 0 cảnh báo |
| `npm run test` | 199 test qua; logic nghiệp vụ chạy trên Postgres thật trong bộ nhớ (PGlite). Test hiển thị giờ mở cửa phụ thuộc giờ mở cửa TẠM 06:00–20:00 trong `shop-config`; đổi giờ thật thì sửa test |
| `npm run build` | Qua (`next build --webpack`) khi dùng font giả lập (môi trường làm việc không ra được Google Fonts). **Chưa chạy với font thật** — chạy trên máy bạn / Netlify |
| Migration `drizzle/0000_init.sql` | Chạy được trên Postgres (PGlite); CHECK, UNIQUE, FK, chỉ mục từng phần đều bị vi phạm đúng như mong đợi |
| Seed | Chạy trên PGlite: đủ dữ liệu, chạy lại không nhân đôi, không đụng dữ liệu thật |
| Trang `/` và 404 | Chạy thật bằng `next start`: 200 và 404 |
| Đăng nhập quản trị | Test trên Postgres thật trong bộ nhớ: đăng nhập đúng nhận cookie phiên và role ADMIN, sai mật khẩu bị từ chối, đăng ký công khai bị chặn, khóa sau 5 lần sai (429). `next start`: `/admin/dang-nhap` 200, `/admin` khi chưa đăng nhập chuyển về trang đăng nhập (307). **Chưa thử bấm đăng nhập trên trình duyệt với Neon thật** |

## G1.13 — Đã có gì phía server
- **Kiểm tra dữ liệu** `src/lib/validation/`: đơn đặt món (giờ hẹn 15 phút–7 ngày, số lượng 1–50, gộp dòng trùng, địa chỉ khi giao), tin liên hệ, schema quản trị (danh mục, món + lựa chọn, ảnh, trạng thái).
- **Dịch vụ** `src/server/services/`: `order-request` (kiểm tra → chống spam → tính giá từ DB → lưu trong transaction → Telegram), `contact-message`, `rate-limit` (đếm theo IP băm, một câu lệnh nên không đếm sai khi gửi đồng thời), `order-code` (TL-MMDD-NNN, thử lại nếu trùng), `admin-categories`, `admin-menu`, `admin-images`, `admin-requests` (đổi trạng thái, gửi lại Telegram).
- **Query** `src/server/queries/public` (cache tag `menu`) và `admin` (mỗi hàm gọi `requireAdmin()` đầu tiên).
- **Action** `src/server/actions/public` và `admin`. Mọi admin action đi qua `runAdminAction`: kiểm tra quyền trước, chưa đăng nhập thì không đụng tới database (có test cho cả 18 action).
- Logic nghiệp vụ nhận `db` làm tham số để test trên PGlite; file action chỉ là lớp mỏng nối với Neon, Telegram, Cloudinary thật.

**Lưu ý:** các file action chưa được trang nào import nên `next build` chưa biên dịch chúng; chúng đã qua typecheck, lint và test. Sẽ được build đầy đủ khi có trang dùng (G2.x, G3.x).

## Đã chạy thử thực tế (Postgres 18 cục bộ + `next start`)
- Nạp `0000_init.sql`, `db:seed`, `admin:create`, rồi chạy cả web bằng Chromium (Playwright): trang `/`, `/thuc-don`, `/dat-mon`, `/lien-he`, `/gioi-thieu` trả 200, không lỗi JavaScript.
- Gửi form đặt món → yêu cầu lưu vào DB (mã `TL-MMDD-NNN`), Telegram lỗi (token giả) nên hiện cờ "Telegram lỗi" trong admin, khách vẫn thấy "Đã gửi yêu cầu".
- `/admin/*` chưa đăng nhập bị chuyển về `/admin/dang-nhap`; đăng nhập đúng vào được danh sách yêu cầu, món, danh mục, liên hệ.
- Header bảo mật (CSP, X-Frame-Options, HSTS…), `sitemap.xml`, `robots.txt`, JSON-LD, ảnh chia sẻ có mặt; đặt món và đăng nhập vẫn chạy dưới CSP.
- Lưu ý: `getDb` có nhánh riêng cho `localhost` (WebSocket proxy) chỉ để thử cục bộ; trên Neon thật dùng đường mặc định. `db:migrate` (drizzle-kit) không chạy được với Postgres cục bộ, nên migration được nạp bằng script riêng; trên Neon dùng `db:migrate` bình thường.

## Chưa kiểm tra được (cần thông tin/tài khoản thật)
- Kết nối **Neon thật** (`db:migrate` trên Neon), `admin:create` trên Neon
- Gửi tin **Telegram thật**, upload/xóa ảnh **Cloudinary thật** (giao diện tải ảnh chưa thử với Cloudinary)
- CI trên GitHub Actions (`ci.yml`) và workflow sao lưu `backup.yml` (chưa chạy; cả hai nằm ngoài thư mục `.github/workflows` của máy bạn, cần đặt vào)
- Build với font Google thật; kiểm tra dấu tiếng Việt với font thật; đo Lighthouse (G5.6)
- Giao diện trên điện thoại thật và trình duyệt Zalo/Facebook (G4.7, G5.10)

## Nội dung TẠM cần thay (G6.7)
Số điện thoại, Zalo, Telegram, địa chỉ, link Google Maps, giờ mở cửa, câu chuyện tiệm, thông tin pháp lý trong `src/lib/shop-config.ts`; nội dung trang giới thiệu và chính sách bảo mật là bản nháp AI soạn. Không dùng Google Analytics (G5.7 bỏ).

## Trạng thái theo task (`KE-HOACH-TASK.md`)
| Task | Trạng thái |
|---|---|
| G0.7 AGENTS.md | Xong |
| G0.8 Repo mới + `.env.example` | **Một phần**: có khung dự án + `.env.example`; chưa tạo repo Git, không có code Lamora để chép |
| G1.1 Đổi tên thương hiệu | Không áp dụng (viết mới, không còn chữ Lamora) |
| G1.2 – G1.5 Gỡ phần bán hàng | Không áp dụng (không chép phần bán hàng) |
| G1.6, G1.7 Schema | Xong, đã kiểm tra trên Postgres |
| G1.8 Xóa bảng cũ | Không áp dụng; đã thêm cột `role` |
| G1.9 Migration + seed | Xong, đã chạy trên Postgres 18 thật cục bộ (migration tên `0000_init`); chưa chạy trên Neon |
| G1.10 Better Auth | Xong phần code + test đăng nhập; trang đăng nhập `/admin/dang-nhap`, trang `/admin` có đăng xuất. Còn: chạy `admin:create` và đăng nhập thử trên Neon thật |
| G1.11 Cloudinary | Xong phần ký/xóa ảnh (có test chữ ký); chưa thử với Cloudinary thật |
| G1.12 Telegram | Xong: gửi, thử lại, escape, mẫu tin, `telegram:test`, `telegram:chat-id` (có test) |
| G1.13 Query/action theo schema mới | **Xong phần server** (xem mục bên dưới); chưa nối vào giao diện, chưa chạy với Neon thật |
| G3.2 – G3.12 | Xong: layout, trang chủ, thực đơn, chi tiết, giới thiệu, bảo mật, form đặt món, liên hệ, 404/lỗi |
| G2.1 – G2.10 | Xong: khung admin, danh mục, món (lựa chọn, ảnh, Tạm hết), yêu cầu, tin liên hệ |
| G5.2, G5.4, G5.5, G5.8 | Xong: header bảo mật, `proxy.ts`, metadata, sitemap, robots, ảnh chia sẻ, JSON-LD, chân trang pháp lý |
| G6.3, G6.5 | Một phần: `netlify.toml`, `docs/DEPLOY.md`, `db:backup`, `backup.yml` |
| G1.14 CI xanh | Cục bộ xanh (typecheck, lint, test, build); workflow chưa chạy trên GitHub |
| **Giai đoạn 1 — tiêu chí "Xong khi"** | Không còn giỏ hàng/chữ Lamora ✔ · CI xanh cục bộ ✔ · trang quản trị đăng nhập được ✔ (đã test, chưa thử Neon thật) · "app chạy local" ⏳ cần bạn điền `.env` + Neon rồi `npm run dev` |
| G3.1 `shop-config` | Xong (giá trị TẠM) |
| G4.1 – G4.2 Token màu + font | Xong (màu là đề xuất, chờ duyệt G4.7) |
| Component UI | Đã viết thêm Badge, Select, Stepper, Checkbox, Switch; có test hiển thị cho component site và admin chính |

## Chỗ code khác với bản TASK trước đó (đã cập nhật TASK)
1. Thêm bảng `rate_limit` (Better Auth cần để giới hạn đăng nhập sai trên serverless).
2. Migration đặt tên `0000_init` (do drizzle-kit), không phải `0001_init`.
3. Tin Telegram **không có** liên kết `tel:` (Telegram chỉ nhận http/https); SĐT để dạng chữ, Telegram tự cho bấm gọi.
4. `requireAdmin()` ném `UnauthorizedError`; trong page dùng `requireAdminPage()` (chuyển về trang đăng nhập).
5. SĐT hợp lệ: di động 10 số **và** cố định 11 số (bản TASK ghi "0 + 9 số").
6. `admin:create` lấy mật khẩu từ `ADMIN_PASSWORD` hoặc tự sinh ngẫu nhiên; không nhận mật khẩu qua tham số dòng lệnh.

## Việc tiếp theo (theo thứ tự)
1. Bạn: tạo Neon + Cloudinary + bot Telegram, điền `.env`, làm theo `docs/DEPLOY.md` (`db:migrate`, `admin:create`, `telegram:test`), đặt `ci.yml` và `backup.yml` vào `.github/workflows/`.
2. Bạn: nhập thực đơn thật (G2.11), thay nội dung TẠM (G6.7), thử trên điện thoại (G3.14, G4.7, G5.10).
3. AI: sửa lỗi tìm được ở bước thử điện thoại (G5.11), đo Lighthouse (G5.6), kiểm tra dấu tiếng Việt với font thật.
