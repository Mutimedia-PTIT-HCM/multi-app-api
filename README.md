# multi-app-api

Backend REST API cho mobile app sinh viên PTIT HCM — xem thời khoá biểu,
điểm số, điểm rèn luyện, mua bán đồ dùng, nhắn tin, thông báo lớp, sự kiện
và điểm danh.

Dữ liệu học vụ được đồng bộ từ cổng **UIS** của trường qua OAuth — server
**không lưu mật khẩu** sinh viên, chỉ giữ access/refresh token đã mã hoá
(AES-256-GCM) và tự refresh định kỳ.

## Tính năng

- **Xác thực**: login qua UIS (OAuth), JWT riêng của app với 2 scope
  `student`/`chief` (ban cán sự); Socket.IO + upload dùng token scope riêng
- **Học vụ**: thời khoá biểu theo tuần, điểm tổng kết, điểm thành phần —
  crawl realtime từ UIS
- **Điểm rèn luyện**: xem điểm, BCS nhập/chấm form, reset theo học kỳ
- **Lớp học**: danh sách lớp, cập nhật role BCS, thống kê
- **Sự kiện**: tạo/xoá sự kiện, QR check-in điểm danh
- **Thông báo**: BCS đăng thông báo kèm file → push FCM theo topic
- **Chợ ấn phẩm**: đăng bán, đặt mua, duyệt đơn trong lớp
- **Chat**: nhắn tin realtime qua Socket.IO
- **Background jobs**: crawl điểm mỗi giờ (FCM khi điểm đổi), refresh token
  UIS mỗi 5h, đồng bộ học kỳ 0h hằng ngày — xem
  [docs/08-background-jobs.md](docs/08-background-jobs.md)

## Stack

NestJS 11 · TypeScript · Prisma · MySQL 8 · BullMQ + Redis · Socket.IO ·
Firebase FCM · S3-compatible storage (Cloudflare R2 / MinIO / local) ·
Swagger · Biome · pnpm

## Kiến trúc

Layered — mọi layer giao tiếp qua **interface + DI token**
(`src/contracts/`), không inject concrete class:

```
src/
  presentation/   controllers, gateway, DTO  → inject I*Service
  application/    business logic             → inject port interfaces
  infrastructure/ prisma, storage, uis, push → implement ports
  contracts/      port interfaces + DI tokens (điểm nối duy nhất giữa các layer)
  app-type/       shared domain types
  common/         constants, errors, guards, swagger helpers
  jobs/           BullMQ processors + cron
```

Quy ước code: **`AGENTS.md`** — bắt buộc đọc trước khi contribute.
API contract: **`docs/`** + Swagger tại `/api/docs` khi app chạy.

## Bắt đầu

→ **[docs/09-setup-guide.md](docs/09-setup-guide.md)** — cài đặt local từng
bước (~5 phút với Docker).

## Tài liệu

| | |
|---|---|
| [docs/](docs/README.md) | Tài liệu đầy đủ: nghiệp vụ, API, schema, jobs |
| [AGENTS.md](AGENTS.md) | Quy ước code, kiến trúc, commands |
| [SECURITY.md](SECURITY.md) | Báo cáo lỗ hổng + quy tắc bảo mật |
