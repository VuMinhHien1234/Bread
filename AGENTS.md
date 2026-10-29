# AGENTS.md — Quy tắc cho AI viết code dự án Bánh Mì Thanh Long

Bạn là AI lập trình viên của dự án. Chủ tiệm không phải lập trình viên chuyên nghiệp: họ đọc code bạn viết, chạy thử và duyệt. Hãy viết code **đơn giản, rõ ràng, dễ review**, và giải thích ngắn gọn bằng tiếng Việt.

---

## 1. Dự án là gì

- Website cho tiệm **Bánh Mì Thanh Long**: **giới thiệu món + liên hệ**. **KHÔNG bán hàng online.**
- Khách gửi **yêu cầu đặt món** qua form → lưu database → báo ngay về **nhóm Telegram** của tiệm → tiệm gọi lại chốt đơn.
- Giá món được hiển thị nhưng **chỉ để tham khảo**.
- Một tài khoản quản trị (chủ tiệm) quản lý thực đơn, bật/tắt “Tạm hết hôm nay”, xem yêu cầu và tin liên hệ.
- Code được chuyển đổi từ dự án cũ **Lamora Flower** (shop hoa có bán hàng). Giữ phần nền tảng, bỏ phần bán hàng.

## 2. Tài liệu phải đọc

Đọc theo thứ tự trước khi làm task. Nếu tài liệu mâu thuẫn, thứ tự ưu tiên là: `00` > `01` > `CODING-RULES` > file chuyên đề > file TASK.

| File | Khi nào đọc |
|---|---|
| `docs/00-MASTER-PLAN-banh-mi-thanh-long.md` | Luôn luôn — phạm vi và quyết định 🔒 |
| `docs/01-TECH-STANDARDS.md` | Luôn luôn — chuẩn kỹ thuật |
| `docs/CODING-RULES.md` | Luôn luôn — cách viết code, clean code, checklist review |
| `docs/KE-HOACH-TASK.md` | Để biết ID task (`G3.8`…) và điều kiện “Xong khi” |
| `docs/TASK-DB.md` + `02-DATABASE.md` | Task đụng tới schema, migration, seed |
| `docs/TASK-BE.md` + `04`, `07`, `08` | Query, server action, auth, Telegram, bảo mật |
| `docs/TASK-FE.md` + `03`, `05`, `06` | Trang, component, giao diện |
| `docs/09-DEPLOYMENT.md`, `10-TESTING-CHECKLIST.md` | Deploy, kiểm thử |
| `docs/12-KE-HOACH-CHUYEN-DOI.md` | Giai đoạn chuyển đổi code Lamora |
| `docs/REUSE-LAMORA.md` | Giai đoạn 0–1: phần nào giữ / sửa / bỏ / làm mới từ code Lamora, lệnh kiểm kê, bảng kiểm kê phải điền trước khi sửa code |

**Nếu một file trong bảng không tồn tại**: không tự bịa nội dung của nó. Dùng `TASK-*.md` và `CODING-RULES.md` làm chuẩn, ghi rõ trong báo cáo là file nào thiếu, và hỏi chủ tiệm trước khi quyết định điều mà chỉ file đó mới trả lời được.

## 3. Stack (không tự ý đổi)

- **Next.js App Router**, fullstack trong **một** dự án: web khách + quản trị + API.
- **TypeScript** chế độ strict.
- **PostgreSQL trên Neon**; dùng **ORM đang có trong repo** (không đổi ORM).
- **Better Auth** (email + mật khẩu, tắt đăng ký).
- **Cloudinary** lưu ảnh (upload có chữ ký server).
- **Telegram Bot API** cho thông báo.
- Hosting **Netlify** gói Free. Không dùng Vercel Hobby.
- Validation: thư viện đang có trong repo (mặc định Zod). Test: runner đang có (mặc định Vitest).
- Trình quản lý gói: theo lockfile có sẵn. **Không thêm thư viện mới** khi chưa hỏi chủ tiệm và giải thích lý do.
- Chỉ dùng dịch vụ có gói miễn phí cho phép dùng thương mại.

## 4. Điều tuyệt đối KHÔNG làm

1. Không thêm giỏ hàng, checkout, thanh toán online, mã QR thanh toán, phí ship tự tính, tồn kho, tra cứu đơn, tài khoản khách hàng, mã giảm giá.
2. Không tin giá gửi từ trình duyệt — giá luôn tính lại ở server từ database.
3. Không để lỗi Telegram làm mất yêu cầu: **lưu database trước, gửi Telegram sau**; Telegram lỗi vẫn báo khách thành công.
4. Không đưa khóa bí mật ra client; chỉ biến `NEXT_PUBLIC_*` được dùng ở client. Không commit file `.env`.
5. Không gọi ORM trực tiếp trong component/page; luôn qua `src/server/queries` hoặc `src/server/actions`.
6. Không viết admin action/query mà thiếu `requireAdmin()` ở dòng đầu.
7. Không sửa schema bằng tay trên Neon; mọi thay đổi qua migration.
8. Không chạy seed, migration phá hủy hay lệnh xóa dữ liệu trên **production**.
9. Không dùng `any`, không tắt lint/TypeScript bằng comment để “cho qua”, không bỏ qua test đang lỗi.
10. Không tự ý làm tính năng P1/P2 khi task không yêu cầu.

## 5. Cấu trúc thư mục

```
src/
  app/                      # route: (site) web khách, admin/ quản trị, api/
  components/
    ui/                     # nút, ô nhập, toast… (dùng chung)
    site/                   # component web khách
    admin/                  # component quản trị
  server/                   # chỉ chạy ở server ("server-only")
    db/  auth/  queries/  actions/  services/
  lib/                      # hàm thuần dùng chung: validation, money, phone, shop-config, env
docs/                       # tài liệu dự án
```
Nếu code Lamora đã có cấu trúc khác, **giữ cấu trúc cũ** và báo lại chỗ khác biệt thay vì tự di chuyển hàng loạt.

## 6. Quy tắc viết code

Đầy đủ ở `docs/CODING-RULES.md` (đặt tên, hàm, TypeScript, ranh giới thư mục, server action, xử lý lỗi, test, git). Tóm tắt:

- Đặt tên tiếng Anh trong code (`menuItem`, `orderRequest`); chữ hiển thị cho người dùng bằng **tiếng Việt có dấu**.
- File component `PascalCase.tsx`, file khác `kebab-case.ts`. Route URL tiếng Việt không dấu (`/thuc-don`, `/dat-mon`).
- Hàm ngắn, một việc. File quá ~250 dòng thì tách.
- Mặc định Server Component; `"use client"` chỉ cho phần tương tác.
- Server action trả về `ActionResult` (`{ ok: true, data } | { ok: false, error, fieldErrors? }`), thông báo lỗi tiếng Việt thân thiện.
- Tiền là số nguyên VND; hiển thị qua `formatVND()`. Giờ hiển thị theo `Asia/Ho_Chi_Minh`.
- Màu, bo góc, bóng qua **design token**; không viết mã màu trong component.
- Comment giải thích **vì sao**, không giải thích code làm gì.
- Không để code chết, `console.log` gỡ lỗi, file không dùng.

## 7. Cách làm một task

1. Nhận task theo ID (ví dụ `G3.8`). Đọc mô tả trong kế hoạch + file TASK liên quan.
2. Nếu yêu cầu không rõ hoặc mâu thuẫn tài liệu: **dừng và hỏi**, kèm đề xuất mặc định. Không đoán ở chỗ ảnh hưởng dữ liệu hay bảo mật.
3. Trước khi sửa: liệt kê ngắn các file sẽ tạo/sửa/xóa.
4. Làm thay đổi **nhỏ nhất đủ để xong task**. Một task = một commit (hoặc một PR nhỏ).
5. Viết/cập nhật test cho logic có quy tắc (validation, tính giá, giờ mở cửa, quyền).
6. Chạy và đảm bảo qua hết: typecheck → lint → test → build.
7. Báo cáo lại bằng tiếng Việt:
   - Đã làm gì (gạch đầu dòng ngắn)
   - Cách chủ tiệm tự kiểm tra (các bước bấm thử, trên điện thoại)
   - Điều chưa làm / cần xác nhận
8. Nếu thay đổi làm lệch tài liệu, cập nhật file `docs/` tương ứng trong cùng commit.

Commit message: `G3.8: form đặt món – chọn món và số lượng` (ID task + mô tả tiếng Việt ngắn).

## 8. Định nghĩa “Xong” cho mọi task

- [ ] Đúng mô tả task và không vượt phạm vi
- [ ] Qua checklist review ở `docs/CODING-RULES.md` mục 15
- [ ] Chạy được trên điện thoại (360 px) và desktop
- [ ] Có trạng thái đang tải / trống / lỗi nếu là màn hình
- [ ] Typecheck, lint, test, build đều qua
- [ ] Không còn chữ “Lamora”, không có phần bán hàng
- [ ] Không lộ khóa bí mật, admin được bảo vệ
- [ ] Báo cáo cho chủ tiệm theo mục 7.7

## 9. Quy tắc nghiệp vụ cần nhớ

| Quy tắc | Giá trị |
|---|---|
| Số lượng mỗi món trong một yêu cầu | 1–50 |
| Hẹn giờ nhận | từ hiện tại + 15 phút đến 7 ngày tới, hoặc “sớm nhất có thể” |
| Giao hàng | trong 3 km, bắt buộc địa chỉ, phí báo khi gọi |
| Món “Tạm hết hôm nay” | vẫn hiện trên web, không đặt được, server từ chối nếu vẫn gửi |
| Món phải có | ≥ 1 lựa chọn có giá |
| Trạng thái yêu cầu | `NEW` → `CALLED` → `DONE` / `CANCELLED` |
| Chống spam | honeypot + thời gian điền ≥ 3 giây + 5 yêu cầu / 10 phút / IP, 3 tin liên hệ / 10 phút / IP |
| Ngoài giờ mở cửa | vẫn nhận yêu cầu, tin Telegram ghi “ngoài giờ” |
| Thông tin tiệm (P0) | đọc từ `src/lib/shop-config.ts` |

## 10. Lệnh thường dùng

Tên lệnh cụ thể xem `package.json`; cần có tối thiểu:
`dev` · `build` · `lint` · `typecheck` · `test` · `db:migrate` · `db:seed` · `admin:create` · `telegram:test` · `telegram:chat-id` · `db:backup`.
Nếu thiếu lệnh nào trong danh sách này, thêm vào khi làm task liên quan.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
