# CODING-RULES — Quy tắc code và clean code

> Dựa trên `00-MASTER-PLAN` v1.0. Áp dụng cho **mọi** code trong dự án Bánh Mì Thanh Long, do người hay AI viết.
> `AGENTS.md` nói **làm gì và theo thứ tự nào**; file này nói **viết code thế nào**. Phần chuẩn kỹ thuật chung (stack, cấu trúc) nằm ở `01-TECH-STANDARDS.md`; nếu `01` chưa có, file này là chuẩn clean code duy nhất.
> Khi mâu thuẫn: `00` > `01` > file này > `TASK-*.md`.

Mục tiêu chung: **chủ tiệm đọc lại được**. Code ngắn, tên rõ, mỗi file một việc, không có “phép thuật”. Khi phân vân giữa “gọn và khéo” với “dài hơn nhưng dễ hiểu”, chọn cái dễ hiểu.

---

## 1. Đặt tên

| Loại | Quy tắc | Ví dụ đúng | Ví dụ sai |
|---|---|---|---|
| Biến, hàm | `camelCase`, tiếng Anh, nói đúng nội dung | `estimatedTotal`, `getMenuItemBySlug` | `tong`, `data2`, `handle` |
| Hàm | Bắt đầu bằng động từ | `createOrderRequest`, `formatVND`, `isOpenAt` | `orderRequest()`, `vnd()` |
| Boolean | `is` / `has` / `can` / `should` | `isSoldOutToday`, `hasOptions` | `soldOut`, `flag` |
| Hằng số cấu hình | `UPPER_SNAKE_CASE` | `MAX_QUANTITY_PER_ITEM` | `max` |
| Kiểu, interface, component | `PascalCase` | `MenuItem`, `OrderRequestForm` | `menuitem`, `orderForm` |
| File component | `PascalCase.tsx` | `MenuItemCard.tsx` | `menu-item-card.tsx` |
| File khác | `kebab-case.ts` | `shop-config.ts`, `order-code.ts` | `ShopConfig.ts`, `utils2.ts` |
| Route URL | Tiếng Việt không dấu, gạch ngang | `/thuc-don`, `/dat-mon/thanh-cong` | `/menu`, `/datMon` |
| Bảng / cột DB | `snake_case` tiếng Anh | `order_request.created_at` | `DonHang.NgayTao` |
| Chữ hiển thị | Tiếng Việt có dấu | “Gửi yêu cầu đặt món” | “Submit” |

- **Dùng đúng từ của dự án**, không dùng từ của shop hoa cũ:

| Khái niệm | Dùng | Không dùng |
|---|---|---|
| Món | `menuItem` | `product` |
| Lựa chọn có giá | `option` (`menuItemOption`) | `variant`, `sku` |
| Yêu cầu đặt món | `orderRequest` | `order`, `cart`, `checkout` |
| Tin liên hệ | `contactMessage` | `feedback`, `ticket` |
| Lấy tại quầy / giao | `fulfillment: "PICKUP" \| "DELIVERY"` | `shipping`, `shipment` |
| Tạm hết hôm nay | `isSoldOutToday` | `outOfStock`, `inventory` |

- Không viết tắt khó hiểu (`qty` → `quantity`, `addr` → `address`). Được dùng: `id`, `url`, `db`, `env`.
- Không đặt tên theo kiểu dữ liệu (`itemsArray`, `nameString`).

---

## 2. Hàm

- **Một hàm làm một việc.** Mô tả được bằng một câu không có chữ “và”.
- Dài tối đa khoảng **40 dòng**. Dài hơn → tách bước thành hàm nhỏ có tên.
- Tối đa **3 tham số**. Nhiều hơn → nhận một object.
- **Return sớm** thay vì lồng `if` nhiều tầng.
- Hàm tính toán (giá, giờ mở cửa, chuẩn hóa SĐT) là **hàm thuần**: không đọc DB, không đọc giờ hệ thống bên trong — nhận `now` làm tham số để test được.

```ts
// ❌ Lồng nhiều tầng, đọc giờ hệ thống bên trong
function canOrder(item) {
  if (item) {
    if (item.isActive) {
      if (!item.isSoldOutToday) {
        if (new Date().getHours() < 20) return true;
      }
    }
  }
  return false;
}

// ✅ Return sớm, nhận `now` từ ngoài
function canOrderItem(item: MenuItem, now: Date): boolean {
  if (!item.isActive) return false;
  if (item.isSoldOutToday) return false;
  return isOpenAt(now);
}
```

---

## 3. TypeScript

- `strict: true`. **Cấm `any`**; dữ liệu chưa rõ kiểu dùng `unknown` rồi kiểm tra bằng schema validation.
- Cấm `@ts-ignore`, `@ts-expect-error`, `eslint-disable` để “cho qua”. Nếu thật sự cần, ghi rõ lý do ngay trên dòng đó và báo chủ tiệm.
- Hạn chế dấu `!` (non-null assertion); kiểm tra `null` thay vì ép.
- **Kiểu lấy từ một nguồn**: kiểu dữ liệu form lấy từ schema validation (`z.infer<typeof orderRequestSchema>`), kiểu dữ liệu DB lấy từ ORM. Không khai báo lại bằng tay.
- Giá trị cố định dùng union type hoặc enum từ schema, không dùng chuỗi rời rạc rải khắp code.
- Export có tên (`export function …`), không `export default`, **trừ** file Next.js bắt buộc (`page.tsx`, `layout.tsx`, `route.ts`…).

---

## 4. Cấu trúc và ranh giới

Luồng dữ liệu luôn đi một chiều:

```
page / component  →  server/queries  (đọc)
                  →  server/actions  (ghi)  →  server/services (Telegram, Cloudinary, rate limit)
                                             →  server/db
lib/  ← hàm thuần, dùng được ở cả client và server
```

| Được | Không được |
|---|---|
| `page.tsx` gọi `getMenu()` | `page.tsx` gọi ORM trực tiếp |
| Action gọi `sendTelegramMessage()` | Component client gọi Telegram API |
| `lib/money.ts` dùng ở mọi nơi | `lib/` import từ `server/` |
| File trong `server/` có `import "server-only"` | Component client import file trong `server/` (trừ server action) |

- Một file một việc. File vượt khoảng **250 dòng** → tách.
- Đặt code ở nơi dùng nó. Chỉ chuyển vào `components/ui` hoặc `lib` khi **từ 2 nơi trở lên** cùng dùng.
- Không tạo file “thùng rác” như `utils.ts`, `helpers.ts`, `common.ts`. Đặt tên theo nội dung: `phone.ts`, `slug.ts`.
- Không vòng import (A import B, B import A).

---

## 5. React và Next.js

- Mặc định **Server Component**. Chỉ thêm `"use client"` ở component **lá** cần tương tác (form, công tắc, menu mobile), không đặt ở page hay layout.
- Truyền xuống client component **dữ liệu đã lọc**, không truyền nguyên bản ghi DB.
- Component dài quá ~150 dòng hoặc có nhiều khối giao diện → tách component con.
- Props tối đa khoảng 6; nhiều hơn thường là dấu hiệu component làm quá nhiều việc.
- Không lặp markup: thẻ món, nhãn, giá dùng component chung (`MenuItemCard`, `ItemBadges`, `Price`).
- `useEffect` chỉ cho việc đồng bộ với bên ngoài (giờ hiện tại, cuộn trang). Không dùng `useEffect` để tải dữ liệu đã có từ server hoặc để tính giá trị suy ra được.
- State form để trong form; **không** có store toàn cục kiểu giỏ hàng.
- Ảnh luôn qua `next/image`, có `alt` và `sizes`. Link nội bộ qua `next/link`.
- Mỗi route khách có `generateMetadata`. Route admin `noindex`.
- Đọc dữ liệu có cache theo tag `menu`; action sửa thực đơn phải `revalidateTag("menu")`.

---

## 6. Server action

Mọi action theo đúng một khuôn:

```ts
"use server";

export async function toggleSoldOut(input: unknown): Promise<ActionResult> {
  await requireAdmin();                              // 1. quyền (admin action)
  const parsed = toggleSoldOutSchema.safeParse(input); // 2. kiểm tra dữ liệu
  if (!parsed.success) return validationError(parsed.error);

  try {
    await setMenuItemSoldOut(parsed.data);           // 3. thao tác
  } catch (error) {
    logServerError("toggleSoldOut", error);          // 4. log kỹ thuật ở server
    return { ok: false, error: "Không lưu được, bạn thử lại nhé." };
  }

  revalidateTag("menu");                             // 5. làm mới cache
  return { ok: true, data: undefined };              // 6. kết quả thống nhất
}
```

- Nhận `unknown`, không tin kiểu từ client.
- Trả `ActionResult`; **không ném lỗi ra client**.
- Không tính giá, không kiểm tra “Tạm hết” bằng dữ liệu client gửi lên — luôn đọc lại DB.
- Ghi nhiều bảng cùng lúc → **transaction**.
- Gọi dịch vụ ngoài (Telegram, Cloudinary) **sau** khi lưu DB thành công, có timeout.

---

## 7. Xử lý lỗi

| Tình huống | Làm gì |
|---|---|
| Dữ liệu khách nhập sai | Trả `fieldErrors` tiếng Việt, hiện dưới từng ô |
| Không tìm thấy (món, yêu cầu) | `notFound()` trong page; action trả lỗi rõ ràng |
| Chưa đăng nhập | `requireAdmin()` chuyển về trang đăng nhập / trả `UNAUTHORIZED` |
| Telegram lỗi | Ghi `telegram_error`, **vẫn báo khách thành công** |
| Lỗi không lường trước | Log ở server, khách thấy thông báo chung + nút gọi tiệm |

- Không `catch` rồi bỏ trống. Mỗi `catch` phải log hoặc xử lý.
- Không trả stack trace, câu SQL, tên bảng cho trình duyệt.
- Không log SĐT, địa chỉ đầy đủ, mật khẩu, token. Che bớt: `0901***567`.
- Dùng một hàm log chung (`logServerError`), không rải `console.log`.

---

## 8. Dữ liệu và nghiệp vụ

- **Tiền** là số nguyên VND. Không dùng `float`. Hiển thị qua `formatVND()` duy nhất.
- **Giờ** lưu UTC, hiển thị và so sánh giờ mở cửa theo `Asia/Ho_Chi_Minh`. Không dùng `new Date().getHours()` trực tiếp cho nghiệp vụ.
- **Không có số ma thuật**: giới hạn 50 món, 7 ngày, 3 km, 15 phút, 5 lần / 10 phút… đặt trong `shop-config.ts` hoặc hằng số có tên.
- **Một nguồn sự thật**: thông tin tiệm (SĐT, địa chỉ, giờ) chỉ ở `shop-config.ts`; không gõ cứng SĐT trong component.
- Schema validation dùng chung cho form (client) và action (server), đặt trong `lib/validation/`.
- Chuỗi người dùng nhập: `trim()` trước khi lưu; escape khi đưa vào tin Telegram HTML.

---

## 9. Style và giao diện

- Màu, bo góc, bóng, khoảng cách qua **design token** (`TASK-FE` mục 3). Cấm mã màu trực tiếp (`#E91E63`, `text-pink-500`) trong component.
- Mobile-first: viết style cho màn hình nhỏ trước, rồi `md:`, `lg:`.
- Vùng bấm ≥ 44 × 44 px; chữ trong ô nhập ≥ 16 px.
- Mỗi màn hình có đủ trạng thái: đang tải, trống, lỗi, và “Tạm hết” khi liên quan.
- Ô nhập có `label`, lỗi gắn bằng `aria-describedby`; nút chỉ có icon phải có `aria-label`.

---

## 10. Comment và tài liệu

- Comment giải thích **vì sao**, không lặp lại code đang làm gì.

```ts
// ❌ Tăng số lần thử lên 1
attempts += 1;

// ✅ Telegram đôi khi trả lỗi mạng tạm thời; thử lại một lần là đủ,
//    vì khách không nên chờ quá 5 giây.
attempts += 1;
```

- Hàm export trong `lib/` và `server/services/` có một dòng JSDoc mô tả đầu vào/đầu ra.
- Không để code bị comment lại (“để dành”). Git đã lưu lịch sử.
- `TODO` phải kèm ID task: `// TODO(G7.3): thêm nút trạng thái trên tin Telegram`.
- Đổi hành vi so với tài liệu → cập nhật file `docs/` liên quan trong cùng commit.

---

## 11. Test

- Test cho mọi logic có quy tắc: validation, tính giá, giờ mở cửa, chuẩn hóa SĐT, sinh mã yêu cầu, phân quyền.
- Đặt file test cạnh file được test: `phone.ts` → `phone.test.ts`.
- Tên test mô tả hành vi bằng tiếng Việt: `it("từ chối món đang tạm hết")`.
- Mỗi test theo 3 bước: chuẩn bị → thực hiện → kiểm tra.
- Telegram, Cloudinary, giờ hệ thống luôn được giả lập; test không gọi mạng thật.
- Sửa lỗi → thêm một test tái hiện lỗi đó trước.
- Không xóa hoặc `skip` test để CI xanh.

---

## 12. Dependency

- Trước khi thêm thư viện: kiểm tra code hiện có hoặc API của Next.js / trình duyệt đã làm được chưa.
- Thêm thư viện phải hỏi chủ tiệm, nêu: lý do, dung lượng, giấy phép, còn được bảo trì không.
- Không thêm thư viện cho việc vài dòng code làm được (định dạng tiền, bỏ dấu tiếng Việt, so sánh ngày đơn giản).
- Không dùng dịch vụ trả phí hoặc gói miễn phí cấm dùng thương mại.

---

## 13. Git

- Một task (`G3.8`) = một commit hoặc một PR nhỏ. Không trộn việc không liên quan.
- Commit message: `G3.8: form đặt món – chọn món và số lượng`.
- Không commit: `.env*` (trừ `.env.example`), `node_modules`, file build, ảnh gốc dung lượng lớn.
- Trước khi commit: typecheck → lint → test → build đều qua.

---

## 14. Công cụ tự kiểm tra

Cấu hình để máy bắt lỗi thay vì nhớ bằng tay:

| Công cụ | Thiết lập tối thiểu |
|---|---|
| TypeScript | `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride` |
| ESLint | Cấu hình Next.js + TypeScript; bật `no-explicit-any`, `no-console` (cho phép `warn`/`error` trong `server/`), `react-hooks/exhaustive-deps`, `import/no-cycle` |
| Prettier | Một cấu hình chung, chạy khi lưu file |
| CI | typecheck → lint → test → build trên mỗi PR |

Dùng công cụ đã có trong repo; chỉ bổ sung luật còn thiếu.

---

## 15. Checklist review trước khi nộp

- [ ] Tên biến, hàm, file đúng mục 1; không còn `product`, `cart`, `order` theo nghĩa bán hàng
- [ ] Không hàm nào quá ~40 dòng, không file nào quá ~250 dòng
- [ ] Không `any`, không tắt lint/TS, không `console.log`
- [ ] Page/component không gọi ORM; admin action có `requireAdmin()` đầu tiên
- [ ] Action nhận `unknown`, validate, trả `ActionResult`, giá tính lại từ DB
- [ ] Không số ma thuật, không SĐT/địa chỉ gõ cứng, không mã màu trực tiếp
- [ ] Lỗi được log ở server, khách thấy thông báo tiếng Việt thân thiện
- [ ] Có test cho logic mới; test không gọi mạng thật
- [ ] Không code chết, không file thừa, không thư viện mới chưa được duyệt
- [ ] Tài liệu `docs/` khớp với code

## 16. Cần xác nhận
1. Repo hiện chưa có code nên chưa biết công cụ thật (ORM, Zod, Vitest, Tailwind, ESLint). Khi có code Lamora, đối chiếu lại mục 3, 9, 14 cho khớp.
2. Giới hạn 40 dòng/hàm, 250 dòng/file là ngưỡng gợi ý, không phải luật lint cứng. Muốn bắt buộc bằng ESLint (`max-lines`, `max-lines-per-function`) thì báo để bật.
