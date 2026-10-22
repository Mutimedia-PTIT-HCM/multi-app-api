# 09. Setup môi trường dev

Yêu cầu: **Docker** (cho MySQL/Redis/MinIO), **Node.js ≥ 20** (khuyến nghị 24),
**pnpm** — không cần cài tay, repo pin sẵn qua `packageManager` field.

## 1. Chuẩn bị pnpm

```bash
corepack enable            # bật corepack (đi kèm Node)
# pnpm install lần đầu sẽ tự tải đúng pnpm@11.20.0
```

## 2. Cài đặt

```bash
git clone <repo-url> && cd multi-app-api
pnpm install               # tự generate Prisma Client (postinstall)
                           # + tự cài pre-push hook (prepare script)
```

## 3. Cấu hình `.env`

```bash
cp .env.example .env
```

Các biến **phải đổi** trước khi chạy thật:

| Biến | Làm gì |
|---|---|
| `JWT_SECRET` | Random ≥ 32 ký tự |
| `CREDENTIAL_KEY` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` — khoá AES-GCM mã hoá UIS token trong DB. **Đổi key = toàn bộ token cũ không giải mã được** (user phải login lại) |
| `FIREBASE_CREDENTIAL_PATH` | Đặt `service-account.json` Firebase vào `secrets/` — **không có file thì FCM tự tắt**, app vẫn chạy bình thường |

Các biến giữ nguyên cho dev local: `DATABASE_URL`, `REDIS_*`, `S3_*` (trỏ MinIO
trong docker-compose). Xoá trống hết `S3_*` nếu muốn fallback lưu file vào
`./uploads` (không cần MinIO).

## 4. Khởi động infra

```bash
docker compose up -d mysql redis minio minio-init
```

`minio-init` tự tạo bucket `multi-uploads` + set public-read.

## 5. Migrate + seed DB

```bash
pnpm prisma:migrate        # apply migrations vào multidb_v2
pnpm db:seed               # seed system_configs (học kỳ hiện tại) + positions (role BCS)
```

## 6. Chạy app

```bash
pnpm dev                   # tsc --watch + node --watch — reload khi sửa code
# hoặc:
pnpm build && pnpm start
```

Kiểm tra:

- `GET http://localhost:3000/` → `{"status":"ok"}`
- Swagger: `http://localhost:3000/api/docs`
- Boot log phải có `Storage: S3` (hoặc `Storage: local`) và `FCM: enabled/disabled`

## Chạy full stack bằng Docker (không cần Node local)

```bash
docker compose up -d       # mysql + redis + minio + api (build từ Dockerfile)
```

App trong container tự chạy `prisma migrate deploy` trước khi start.

## Troubleshooting

| Lỗi | Fix |
|---|---|
| `P1010 denied access shadow database` khi `prisma migrate dev` | DB user thiếu quyền tạo DB — chạy `pnpm prisma db execute --file <migration.sql>` rồi `pnpm prisma migrate resolve --applied <tên-migration>` |
| `EADDRINUSE port 3000` | `lsof -ti:3000 \| xargs kill` |
| `ERR_PNPM_IGNORED_BUILDS` | Dep có build script chưa được phê duyệt → thêm vào `allowBuilds` trong `pnpm-workspace.yaml` |
| `Cannot find module 'x'` sau khi `pnpm install` | pnpm strict — package import trực tiếp phải khai trong `dependencies` (không được trông chờ hoisting) |
| `FCM: disabled` | Thiếu/sai `FIREBASE_CREDENTIAL_PATH` — bỏ qua nếu không cần push notification |
| Job không chạy | Kiểm tra Redis up: `docker compose ps` → xem thêm [08-background-jobs.md](08-background-jobs.md) |
