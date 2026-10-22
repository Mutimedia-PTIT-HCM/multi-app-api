# multi-server — Project Rules

Backend API cho app mobile sinh viên PTIT HCM. Codebase hiện tại: **NestJS 11 + TypeScript 7 + Prisma + MySQL + BullMQ/Redis + Socket.IO** (v2, root repo). Code Express cũ được giữ ở `legacy/` chỉ để đối chiếu — **không sửa code trong `legacy/`**.

**Đọc `docs/` trước khi sửa code** — đặc biệt `docs/02-api-inventory.md` (contract với app) và `docs/06-refactor-plan.md`.

## Cấu trúc

Clean architecture — dependency chỉ đi vào trong: `presentation` → `application` → `infrastructure` → `app-type`. Jobs và `main.ts`/`app.module.ts` ở outermost.

```
src/
  main.ts                 # bootstrap: global prefix /api/v1, validation, filter, interceptor, swagger /api/docs
  app.module.ts           # wiring toàn bộ module
  app-type/               # DOMAIN — mọi type/interface dùng chung (auth, uis, upload) — KHÔNG chứa logic
  application/            # USE CASES — <feature>/<feature>.service.ts: business logic
  infrastructure/         # ADAPTERS — prisma, uis (oauth+crawl), storage (R2+local), push (FCM), crypto (AES-GCM)
  presentation/           # INTERFACE — <feature>/{controller,module,dto,gateway}: HTTP/WS layer
  common/                 # framework-level: guards, decorators, envelope interceptor, exception filter
  jobs/                   # background: BullMQ processors (point-crawl, class-sync, token-refresh), cron semester-sync
prisma/schema.prisma      # DB mới `multidb_v2` — bảng snake_case, cột camelCase
scripts/fix-dist-paths.js # rewrite alias @app- trong dist sau tsc build
legacy/                   # code Express cũ + multidb.sql — READ ONLY
```

## Quy tắc import

- Mọi import cross-directory dùng alias `@app-` prefix, tối đa 2 cấp: `@app-type`, `@app-common`, `@app-infra/<svc>`, `@app-application/<feat>`, `@app-presentation/<feat>`, `@app-jobs` — resolve qua `index.ts` (barrel) của thư mục đó. KHÔNG dùng `../../...`.
- Layer rule: presentation (controller/gateway/dto) chỉ gọi application service; application chỉ gọi infrastructure + app-type; infrastructure không được import từ presentation/application; KHÔNG import ngược lên (`infrastructure` → `application` là cấm).
- Mỗi file chỉ chứa 1 đơn vị: 1 class HOẶC 1 function HOẶC 1 type/const — không gộp nhiều export trong 1 file; export ra ngoài qua `index.ts` (barrel). DTO inline trong controller phải tách ra `dto/`; hằng số queue tách `<name>.queue.ts`; custom error tách `<name>.error.ts`.
- File chung tài nguyên/cùng domain được group vào thư mục con (vd `app-type/uis/*`, `app-type/schedule/*`, `jobs/point-crawl/*`); thư mục con có `index.ts` riêng, index cha chỉ re-export subdir (`export * from "./uis"`).
- Constant dùng chung toàn app đặt trong `common/` theo domain: `common/queues/` (tên BullMQ queue), `common/roles/` (role code) — KHÔNG để const cross-app rải trong service/processor. Constant chỉ dùng nội bộ 1 file giữ nguyên trong file đó.

## Dependency injection qua interface (`src/contracts/`)

- Layers chỉ giao tiếp qua interface: mọi service cross-layer có port interface + DI token trong `src/contracts/<domain>/` (`<name>.port.ts` + `<name>.token.ts`), export qua barrel, import bằng `@app-contracts`.
- Consumer KHÔNG inject concrete class — dùng `@Inject(TOKEN) private readonly x: IXxxPort` trong constructor.
- Module bind token → implementation: `providers: [{ provide: X_PORT, useClass: XService }]`, `exports: [X_PORT]` (export token, không export class).
- Implementation class `implements` port interface của nó.
- Ngoại lệ cho phép inject trực tiếp: framework services (`JwtService`, `ConfigService`, `Queue` của BullMQ) và class không ai inject bên ngoài (processor).
- `PrismaPort = PrismaClient` — application/jobs nhìn DB qua port này, không biết `PrismaService`.

## Error handling

- Mọi lỗi business throw `AppException(status, XXX_ERRORS.Y)` — KHÔNG throw `NotFoundException("...")` với message hardcode.
- Error entries định nghĩa sẵn trong `common/errors/<module>.errors.ts` dạng `{ code, message }` — code `PREFIX_NNN` (vd `AUTH_001`, `TP_002`), message tiếng Anh (client tự map ngôn ngữ hiển thị).
- Envelope lỗi: `{ error: true, code, message, data: null }` — `AllExceptionsFilter` normalize; `HttpException` không có code → `HTTP_<status>`.
- Controller wrap handler trong `try/catch` + `rethrowError(e)` (từ `@app-common`) — chuyển lỗi không phải HttpException (UisUnreachableError→503, còn lại→500). Service KHÔNG try/catch để nuốt lỗi.

## Response & pagination

- Envelope success: `{ error: false, message, data }` — `ResponseInterceptor` tự wrap; controller trả `ApiResult(message, data)` hoặc raw data (message mặc định "Thành công").
- List endpoint BẮT BUỘC phân trang: nhận `@Query() q: PaginationQueryDto` (`?page=&limit=`, default 1/20, max 100); service dùng `toPrismaPage(q)` (skip/take) + `count` và trả `toPaginated(items, total, q)` → `data: { items, meta: { page, limit, total, totalPages } }`. KHÔNG trả mảng trần.

## API docs (Swagger `/api/docs`)

- Mọi controller: `@ApiTags`; mọi route: `@ApiOperation({summary})`; route có guard: `@ApiBearerAuth()`; route public (login): KHÔNG gắn.
- Endpoint multipart (upload): `@ApiConsumes("multipart/form-data")` + `@ApiBody({schema})` với field `format: "binary"` để Swagger UI render file picker.
- DTO luôn có `@ApiProperty`/`@ApiPropertyOptional` kèm `example` để test được ngay trong Swagger UI.
- Route infra (health, static file) dùng `@ApiExcludeEndpoint()` để không lọt vào docs.

## Typing

- Mọi service method và controller handler BẮT BUỘC khai báo return type tường minh — cấm để inference trả `any`/shape ẩn.
- Response shape khai báo trong `app-type/<domain>/<name>.type.ts`, derive từ Prisma model (`import type { X } from "@prisma/client"`) + `Omit`/`&` cho field thêm/bớt (avatarUrl, imageUrls…).
- Nullable field trong schema (fullName, birthDate…) phải phản ánh `| null` trong view type.
- List endpoint trả `PaginatedResult<T>` với `T` là item type cụ thể — không `PaginatedResult<unknown>`.
- Thêm export mới → export qua `index.ts` của thư mục.
- Import cùng thư mục (`./foo`, `./dto/foo`) giữ nguyên relative.
- tsconfig `paths: {"@app-type": ["./src/app-type"], "@app-*": ["./src/*"]}`; sau `tsc`, `scripts/fix-dist-paths.js` rewrite `require("@app-...")` trong dist (đã gắn trong `npm run build`) — prefix `@app-` không trùng npm scoped packages.
- KHÔNG tự ý `git commit` — chỉ commit khi được yêu cầu.

## Quy tắc bắt buộc

- Giữ response envelope `{error, message, data}` — controller trả `new ApiResult(message, data)` hoặc return thuần (interceptor wrap); lỗi throw `HttpException` — app mobile phụ thuộc contract này.
- Auth: `@UseGuards(StudentAuthGuard)` / `ChiefAuthGuard`, lấy user qua `@CurrentUser()`. KHÔNG tự parse JWT trong controller.
- DB: chỉ qua `PrismaService` — KHÔNG raw SQL nối chuỗi. Cột DB là camelCase, map 1-1 với field Prisma.
- KHÔNG lưu password UIS — chỉ lưu OAuth tokens mã hoá qua `CredentialCipherService` (AES-GCM). KHÔNG log password/token.
- UIS OAuth: login grant=password → lưu `uisAccessToken`(8h)+`uisRefreshToken`(rotate) đã mã hoá. Mọi chỗ cần gọi UIS API phải đi qua `UisSessionService.getSession(mssv)` — tự reuse/refresh; refresh token chết → user phải login lại app. KHÔNG gọi `uis.login` trực tiếp ngoài auth flow. Refresh BẮT BUỘC kèm `username`; refresh xong access token cũ chết (single session). Cron `token-refresh` chạy mỗi 5h gia hạn session.
- File upload: qua `StorageService` (tự fallback local `./uploads` khi chưa có `S3_*`); validate mime/size; key giữ prefix legacy (`avt/`, `products/`, `cert/`, `notification/`, `event/thumb/`, `event/qrcode/`).
- Socket: gateway yêu cầu JWT trong `handshake.auth.token`; giữ event name legacy `LOGIN`, `SEND_MESSAGE_TO_RECEIVER`, `NEW_MESSAGE`.
- FCM: gửi theo topic (`PushService.sendToTopics`), topic = mssv / malop — client tự subscribe.
- KHÔNG commit secrets (`.env`, `service-account.json`, `*.p8`). `.env.example` là mẫu duy nhất được commit.
- Dependencies: sau khi `npm install <pkg>` BẮT BUỘC chạy `npm audit` — phải về `0 vulnerabilities` trước khi commit. Nếu vuln ở transitive dep bị pin exact → dùng `overrides` trong package.json (đã có sẵn cho `deepmerge-ts`, `js-yaml`). Chỉ nâng major version khi tương thích (kiểm tra peerDependencies trước); không thêm dep mới nếu nó kéo theo vuln không vá được. Xoá dep không dùng (vd `tsc-alias` đã xoá vì `fix-dist-paths.js` thay thế).

## Lưu ý TypeScript 7

- TS7 chưa có compiler API → **không dùng** `nest build`/`nest start`; build trực tiếp `tsc -p tsconfig.build.json`.
- `tsx`/esbuild không emit `design:paramtypes` → dev dùng `tsc --watch` + `node --watch` (script `npm run dev`), không dùng `tsx src/main.ts`.
- Lint/format bằng **Biome** (typescript-eslint chưa tương thích TS7). Biome cần `unsafeParameterDecoratorsEnabled: true` cho `@Body()`… — đã bật trong `biome.json`. KHÔNG bật `useImportType` — sẽ phá DI.

## Commands

```bash
docker compose up -d mysql redis   # infra local
npm install
npm run prisma:migrate             # dev: migrate dev | prod: prisma:deploy
npm run db:seed                    # seed system_configs + positions
npm run build                      # tsc → dist/
npm start                          # node dist/main.js  (port 3000)
npm run dev                        # tsc --watch + node --watch
npm run typecheck && npm run lint  # verify trước khi commit
```

Docs API: `http://localhost:3000/api/docs` (Swagger).

## Upload flow (2 bước, presigned)

- Client KHÔNG gửi file trực tiếp vào API nghiệp vụ nữa: `POST /api/v1/uploads/presign` (body `{purpose, fileName, contentType}`) → nhận `{key, uploadUrl, method:"PUT", publicUrl}` → client PUT binary lên `uploadUrl` → dùng `key`/`publicUrl` trong API nghiệp vụ.
- Storage theo env `S3_*`: MinIO trong docker-compose (dev, bucket `multi-uploads`, anonymous download) · R2/AWS chỉ cần đổi `S3_ENDPOINT`/`S3_REGION` · trống → local `./uploads`.
- S3 mode: `uploadUrl` là presigned PUT URL SigV4 (15 phút). `S3_ENDPOINT` cho server nội bộ, `S3_PRESIGN_ENDPOINT`/`S3_PUBLIC_URL` trỏ host public — host nằm trong chữ ký nên KHÔNG đổi host sau khi ký.
- Local mode: `uploadUrl` là `PUT /api/v1/uploads/local/:token` — token JWT ngắn hạn scope `"upload"`, endpoint public.
- `purpose` quyết định prefix key: avatar→`avt`, product→`products`, notification→`notification`, event→`event/thumb`, cert→`cert`, misc→`misc`.

## Swagger response docs

- Mọi endpoint BẮT BUỘC có `@ApiDataResponse({type | isArray | paginated | primitive})` từ `@app-common` — envelope `{error,message,data}` tự wrap.
- Response DTO classes nằm trong `common/swagger/dto/<domain>/` (tách khỏi `app-type` interface), 1 class/file, `@ApiProperty` mỗi field.
- Field có union type (`string | null`, `number | null`, `XDto | null`) BẮT BUỘC khai `type:` trong `@ApiProperty` — union không reflect được `design:type` (thành `Object`), Swagger sẽ render `{...}` thay vì type thật. Vd: `@ApiProperty({ type: "string", nullable: true })`. Property initializer (`page = 1`) cũng không đủ — phải có `: number` annotation.
- Error envelope `{error:true,code,message,data:null}` tự gắn vào mọi route qua `registerErrorResponses(document)` trong main.ts — không cần decorator tay.
