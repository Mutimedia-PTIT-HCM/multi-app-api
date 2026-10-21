# 06. Kế hoạch refactor

Nguyên tắc xuyên suốt:

1. **Không vỡ contract với mobile app** — giữ path, method, shape `{error, message, data}`, field name tiếng Việt/Anh như hiện tại. Breaking change nào cũng phải liệt kê rõ để team app xử lý.
2. **Rewrite song song, không sửa trong chỗ** — codebase cũ nhỏ (~2.3k dòng) nhưng rối; viết service mới trong repo/folder mới, app cũ vẫn chạy đến khi cutover.
3. **Mỗi module migrate xong phải có contract test** so response với server cũ (dùng fixture ghi lại).
4. **Ưu tiên đúng thứ tự rủi ro**: secrets → auth → storage → từng domain → job nền.

## Phase 0 — An toàn hoá (làm NGAY, độc lập với stack mới)

- [ ] **Rotate toàn bộ secrets đã lộ** (docs/04 mục A1): Firebase service account, FCM, APN key `.p8`, Google OAuth client, MySQL password, VPS root password, `SECRET_KEY`, `SALT_PASSWORD`.
- [ ] Xoá `service-account.json`, `fcm-config.json`, `AuthKey_*.p8` khỏi repo + `.gitignore` chúng; rotate thay vì cố xoá git history (nếu repo từng public thì bắt buộc xoá history).
- [ ] Tạo `.env.example` đủ biến: `PORT, DB_*, SECRET_KEY, SALT_PASSWORD, BASE_URL_MULTI_SERVER, PATH_NAME, ACCESS_TOKEN, BASE_URL_ENDPOINT` + biến R2 mới.
- [ ] Bỏ password VPS khỏi `Makefile` → dùng SSH key.
- [ ] Ghi lại response mẫu của từng endpoint quan trọng (fixture) → làm contract test sau.

## Phase 1 — Scaffold nền (repo mới `multi-server-v2`)

Stack đã chốt: **NestJS + TS 7 + Prisma + MySQL + BullMQ + R2**.

- [ ] `nest new` (pnpm), cấu hình `strict`, ESLint+Prettier, vitest.
- [ ] `prisma db pull` từ `multidb` → `schema.prisma` (giữ nguyên tên bảng/cột qua `@@map`/`@map`).
- [ ] Infra chung:
  - `ConfigModule` + zod validate env lúc boot.
  - `TransformInterceptor` → wrap mọi response thành `{error:false, message, data}`.
  - `AllExceptionsFilter` → `{error:true, message}` (HTTP code đúng, message tiếng Việt giữ nguyên).
  - `JwtAuthGuard` (2 guard hoặc 1 guard + `@Roles()`): dùng `jose`/`jsonwebtoken` HS256, claim `{mssv, role, scope: 'stu'|'chief', exp}`.
  - `ValidationPipe` global (whitelist, transform) → xoá pattern `JSON.parse(req.body)`.
  - Logger pino thay `console.log`.
- [ ] `UisService` (module core): gói `crawlLogin`, `getStudentInfor`, crawl TKB/điểm — một chỗ duy nhất xử lý cookie/XSRF/retry/timeout; `CredentialCipher` (AES-256-GCM) mã hoá password UIS.

## Phase 2 — Auth & user core

- [ ] `POST /stu_role/login`, `/delegation_chief_role/login`, `check_access_token` — giữ body/response shape.
- [ ] Quyết định token: **JWT chuẩn mới** (khuyến nghị) — app update field token vẫn giữ tên `accessToken`/`accessTokenChief`; nếu cần tương thích app cũ tuyệt đối thì giữ verify token cũ song song 1 thời gian.
- [ ] Migrate password `base64+salt` → AES-GCM **lazy**: mỗi lần login thành công re-encrypt. (Giữ được job crawl, không cần user làm gì.)
- [ ] `stu_inf` module: get_stu_inf, get_all_user (parametrize + escape LIKE), change_profile (upload avatar → R2), get_inf_stu (thêm role check).

## Phase 3 — Storage → Cloudflare R2

- [ ] `StorageService`: `@aws-sdk/client-s3` trỏ `endpoint=https://<accountid>.r2.cloudflarestorage.com`, bucket `multi-app`, credential R2 trong env.
- [ ] Upload: giữ multipart contract (`FileInterceptor`), stream → R2, DB lưu **key**; response URL = public domain của bucket (`pub-xxx.r2.dev` hoặc custom domain CDN).
- [ ] Prefix key giữ cấu trúc cũ: `avt/`, `products/<maanpham>/`, `cert/`, `notification/`, `event/thumb/`, `event/qrcode/`.
- [ ] Sanitize filename + validate mime/size (hiện tại `originalname` dùng thẳng → path traversal).
- [ ] Script migrate: upload toàn bộ `public/**` lên R2 (giữ key), verify URL trả về không đổi.
- [ ] (Nâng cao, làm sau) presigned PUT cho client upload trực tiếp — giảm tải server.

## Phase 4 — Migrate domain modules (theo thứ tự rủi ro thấp → cao)

| #   | Module                                 | Ghi chú                                                                          |
| --- | -------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | `teacher` (canbo)                      | Nhỏ nhất; thêm guard quyền cho `modify_teacher`                                  |
| 2   | `schedule`, `point`                    | Pure crawl → chỉ bọc `UisService`; fix bug week/semester parsing                 |
| 3   | `notification` (stu read + chief send) | Parametrize INSERT hàng loạt → `createMany`; upload đính kèm → R2                |
| 4   | `event` + `attendance`                 | Check-in, QR gen (trả buffer thay ghi đĩa), ownership check khi xoá              |
| 5   | `product` (chợ)                        | Parametrize toàn bộ (đang inject nặng); order transaction; ownership check       |
| 6   | `point_ext` (2 phía)                   | Fix bug `data/user undefined`, `AND ? <= ?`; N+1 → join/group                    |
| 7   | `role` + `update_new_class`            | Move cập nhật lớp hàng loạt vào queue                                            |
| 8   | `message` + Socket.IO gateway          | Room theo mssv; lưu DB parametrize; thêm mark-read (hiện `seen` không dùng được) |

Mỗi module: service unit test (mock Prisma + mock UisService) + contract test fixture.

## Phase 5 — Job nền

- [ ] `runCheckNewPoint` → BullMQ repeatable job (1h): fan-out mỗi SV = 1 job con, `concurrency` thấp + backoff — không còn `while(true)` và không đánh UIS 1 loạt.
- [ ] `checkTKB` → `@nestjs/schedule` cron, handle `startDate=null`.
- [ ] `runAuth` (rotate SECRET_KEY) → **bỏ** (JWT chuẩn có `exp` + refresh token thay cho rotate key thủ công).
- [ ] Giữ lại hành vi FCM: `sendFcm` → `PushService` (topic condition + data payload giữ nguyên `fcm_type/fragment_opened/click_action`).

## Phase 6 — Vận hành & dọn dẹp

- [ ] OpenAPI (`@nestjs/swagger`) generate từ DTO → tài liệu cho team app.
- [ ] Schema cleanup (phase riêng, sau khi ổn định): index cho `mssv/malop/masukien/matb`, đổi `text` ngày giờ → `datetime`, chuẩn charset utf8mb4, FK.
- [ ] CORS whitelist domain, `server.timeout` hữu hạn, helmet, rate-limit login.
- [ ] CI: typecheck (`tsc --noEmit` TS7), lint, test; Dockerfile multi-stage; `docker-compose.prod.yml` thêm worker container (cùng image, command khác).
- [ ] Cutover: deploy v2 song song port khác → test app → trỏ domain → giữ v1 readonly vài ngày để rollback.

## Checklist "không được phép" cho code mới (đưa vào rules)

- ❌ Nối input vào SQL (mọi query qua Prisma hoặc parameterized).
- ❌ Commit secrets / file credential.
- ❌ `console.log` (dùng Logger), `throw` trong callback, `any` không cần thiết.
- ❌ Query trong controller / business logic trong controller.
- ❌ Trả response không qua envelope chuẩn.
- ❌ Lưu file local disk — mọi file qua `StorageService` (R2).
