# 05. Phân tích lựa chọn tech stack

## Yêu cầu hệ thống đặt ra

| Yêu cầu                               | Chi tiết                                                                                                 |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| API cho **mobile**, không cần SSR/web | Toàn bộ consumer là app Android/iOS                                                                      |
| **WebSocket bắt buộc**                | Chat realtime đang dùng socket.io                                                                        |
| **Background job bắt buộc**           | Crawl điểm hàng giờ cho *toàn bộ* sinh viên (vài phút → vài chục phút), cron cập nhật học kỳ             |
| HTTP client "bẩn"                     | Crawl UIS: cần control `set-cookie`, redirect, XSRF header — cần full Node HTTP, không phải edge runtime |
| File storage                          | Chuyển sang **Cloudflare R2** (S3-compatible)                                                            |
| DB                                    | MySQL `multidb` đang chạy production, có data thật                                                       |
| Contract API                          | Giữ `{error, message, data}` + path hiện tại để app không vỡ                                             |
| Đội ngũ                               | Sinh viên → cần framework **áp sẵn kiến trúc tốt**, tránh tự do dẫn đến mess như hiện tại                |
| Deploy                                | VPS tự quản + Docker (Makefile đã có)                                                                    |

## Phương án 1 — NestJS (khuyến nghị)

**Cấu phần:** NestJS + TypeScript 7 + Prisma (MySQL hiện tại) + @nestjs/schedule + BullMQ + @nestjs/websockets (socket.io) + @aws-sdk/client-s3 (R2) + firebase-admin + zod/class-validator.

Tại sao khớp nghiệp vụ:

| Nhu cầu                             | NestJS cung cấp                                                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `middleWareStu` / `middleWareChief` | `JwtAuthGuard` + `RolesGuard` — đúng chuẩn, test được                                                                                                              |
| Envelope `{error,message,data}`     | Một `TransformInterceptor` duy nhất cho toàn hệ thống                                                                                                              |
| `JSON.parse(req.body)` + validate   | `ValidationPipe` + DTO — xoá hàng chục bug tiềm ẩn                                                                                                                 |
| Cron + job nền                      | `@nestjs/schedule` (checkTKB, rotate key) + **BullMQ queue** cho crawl-điểm (retry, backoff, rate-limit, concurrency — giải quyết đúng vấn đề login UIS hàng loạt) |
| Socket.IO chat                      | `WebSocketGateway` first-class                                                                                                                                     |
| Upload file                         | `FilesInterceptor` → `StorageService` (R2)                                                                                                                         |
| Kiến trúc                           | Module/Controller/Service/Repository **bắt buộc** — sinh viên không thể viết query trong controller được nữa                                                       |
| Long-running process                | Server Node thường, deploy VPS/Docker giữ nguyên                                                                                                                   |
| DB                                  | `prisma db pull` → có model typed từ schema hiện tại **không cần migrate DB**                                                                                      |

Nhược điểm: boilerplate nhiều hơn Express, decorator pattern phải học (~1 tuần làm quen), nhưng chính "nặng" đó lại là thứ tạo kỷ luật kiến trúc.

## Phương án 2 — Next.js làm API thuần

Câu hỏi: *"Next.js làm API được không?"* → **Được, nhưng không khớp hệ thống này.**

Được ở chỗ:
- Route handlers (`app/api/**/route.ts`) viết REST API bình thường, TypeScript sẵn.
- Self-host bằng `next start` trên VPS thì vẫn là 1 Node server.
- Nếu **sau này cần trang admin web** (dashboard cho BCH/đoàn trường) → Next.js cho phép 1 codebase làm cả API lẫn web — đây là lý do duy nhất đáng cân nhắc.

Không khớp ở chỗ:
1. **Socket.IO không chạy trong route handlers.** Phải custom server (`server.ts` tự viết) hoặc tách service riêng → mất phần lớn giá trị "dùng Next cho gọn", deploy phức tạp hơn.
2. **Không có kiến trúc sẵn**: không DI, không guard/interceptor/pipe. Với team đang *vì thiếu kỷ luật mà ra codebase hiện tại*, Next API-only cho tự do y hệt Express → mess sẽ tái diễn, chỉ khác là `.ts`.
3. **Background job không có chỗ đứng**: phải chạy tiến trình phụ (worker riêng) hoặc trigger từ ngoài — lệch mô hình "1 file 1 route".
4. Middleware của Next thiết kế cho edge/runtime khác, multipart upload xử lý thủ công hơn Nest.
5. Route-fragmentation: logic rải vào hàng chục `route.ts`, không có service layer chuẩn — tự phải dựng lại cấu trúc mà NestJS cho sẵn.

→ Kết luận: chỉ chọn Next.js nếu roadmap có **web admin cùng repo** và chấp nhận tách worker + socket service riêng.

## Phương án 3 — Next.js + Supabase

Phân tích riêng vì user nêu tên:

| Thành phần Supabase | Có dùng được không                                                                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth                | **Không.** Auth nghiệp vụ = uỷ quyền cho UIS crawl. Supabase Auth không giải quyết được "login hộ bằng password UIS" — vẫn phải tự làm JWT, thêm 1 hệ thống auth thừa |
| Postgres            | Được, nhưng phải **migrate MySQL→Postgres** + viết lại toàn bộ data layer. Schema hiện tại xấu, migrate = làm lại từ đầu — nếu làm thì làm trên NestJS luôn sạch hơn  |
| Storage             | Trùng vai trò với **R2 user đã chọn**                                                                                                                                 |
| Realtime            | Có thể thay socket.io chat, nhưng đổi cả protocol client + phụ thuộc RLS Postgres — refactor to nhất trong các phương án cho tính năng nhỏ nhất                       |
| Edge Functions      | Deno runtime — crawling cookie/redirect OK nhưng cron + socket + long-job không phù hợp                                                                               |

→ **Không khuyến nghị** cho dự án này: giải quyết sai vấn đề (auth/storage đã có đáp án), tốn migration DB, tăng moving parts cho team sinh viên. Supabase hợp khi *bắt đầu project mới không có backend* — không hợp migrate hệ có sẵn MySQL + crawler.

## Phương án 4 (tham khảo) — Fastify/Hono + TS

Nhẹ, nhanh, gần Express nên migrate dễ. Nhưng **không áp kiến trúc** — vẫn tự dựng service layer → cùng rủi ro như Next API-only. Chỉ nên nếu team có 1 người giỏi giữ kiến trúc.

## So sánh nhanh

| Tiêu chí                              | NestJS        | Next.js API-only | Next + Supabase        | Fastify/Hono  |
| ------------------------------------- | ------------- | ---------------- | ---------------------- | ------------- |
| Khớp WebSocket                        | ✅ Gateway sẵn | ❌ custom server  | ⚠️ Realtime khác cơ chế | ⚠️ tự tích hợp |
| Cron/queue nền                        | ✅ sẵn         | ❌ tự dựng        | ⚠️ hạn chế              | ⚠️ tự dựng     |
| Kiến trúc áp sẵn (cho team sinh viên) | ✅✅            | ❌                | ❌                      | ❌             |
| Giữ MySQL hiện tại                    | ✅ Prisma pull | ✅                | ❌ migrate PG           | ✅             |
| Validation/DI/Guard                   | ✅             | ⚠️ tự dựng        | ⚠️                      | ⚠️             |
| Deploy VPS Docker hiện tại            | ✅ nguyên mẫu  | ✅                | ⚠️ nhiều service        | ✅             |
| Có web admin kèm sau                  | ⚠️ tách repo   | ✅                | ✅                      | ❌             |
| Độ phức tạp học                       | TB            | thấp-TB          | cao                    | thấp          |

## Đề xuất — ✅ ĐÃ CHỐT: NestJS + Prisma + MySQL (21/10/2026)

**NestJS + TypeScript 7 + Prisma + MySQL + BullMQ + socket.io gateway + R2.**

- Nếu sau này cần web admin → làm Next.js riêng gọi chung API (tách bạch mobile API / web vẫn tốt).
- Supabase loại khỏi vòng: không giải được bài toán crawl-auth, trùng R2, tốn migration.

### Lưu ý TypeScript 7 (ra stable 07/2026 — bản native Go, nhanh ~10x)

- `npm i -D typescript@^7` dùng được ngay cho `tsc` CLI + editor.
- **Chưa có programmatic API ổn định** → các tool dựa vào compiler API (typescript-eslint, ts-jest, typia, tsc-alias...) có thể chưa tương thích → dùng song song `@typescript/typescript6` (`tsc6`) hoặc swc/vitest (không cần compiler API).
- Với NestJS: build/runtime qua tsc CLI hoặc swc đều ổn; type-check CI chạy `tsc --noEmit` bản 7. Test nên dùng **vitest** (esbuild/swc, không đụng compiler API) thay vì ts-jest.
