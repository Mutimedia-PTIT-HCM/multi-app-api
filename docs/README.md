# Tài liệu hệ thống multi-server

Tài liệu nghiệp vụ + kế hoạch refactor cho backend của ứng dụng mobile sinh viên PTIT HCM (đoàn – hội).

| File                                                   | Nội dung                                                   |
| ------------------------------------------------------ | ---------------------------------------------------------- |
| [01-business-overview.md](01-business-overview.md)     | Tổng quan nghiệp vụ, actor, luồng chính                    |
| [02-api-inventory.md](02-api-inventory.md)             | Danh mục đầy đủ các API hiện tại (contract với mobile app) |
| [03-database-schema.md](03-database-schema.md)         | Schema MySQL hiện tại và các vấn đề                        |
| [04-codebase-audit.md](04-codebase-audit.md)           | Đánh giá code hiện tại: bug, bảo mật, kiến trúc            |
| [05-tech-stack-analysis.md](05-tech-stack-analysis.md) | Phân tích lựa chọn: NestJS vs Next.js + Supabase           |
| [06-refactor-plan.md](06-refactor-plan.md)             | Kế hoạch refactor từng bước                                |
| [07-mapping-legacy-v2.md](07-mapping-legacy-v2.md)     | Bảng mapping legacy↔v2: API endpoint, bảng SQL, job nền    |
| [08-background-jobs.md](08-background-jobs.md)         | Jobs chạy nền: BullMQ queues, cron, lịch, cách thêm job    |
| [09-setup-guide.md](09-setup-guide.md)                 | Hướng dẫn setup môi trường dev từng bước + troubleshooting |

## TL;DR

- Hệ thống là **proxy/crawler cho cổng UIS của trường** (uis.ptithcm.edu.vn) + các tính năng nội bộ (thông báo, sự kiện, điểm rèn luyện, chợ ấn phẩm, chat).
- Codebase hiện tại: **NestJS 11 + TypeScript + Prisma + MySQL `multidb_v2`** — refactor hoàn tất từ Express legacy (đã xoá; xem doc 04–07 cho lịch sử và mapping).
- Doc 01–06 mô tả **codebase legacy** — giữ lại làm tài liệu tham khảo nghiệp vụ và quyết định thiết kế.

## Trạng thái triển khai (v2)

- ✅ Response envelope `{error,message,data}`; global prefix `/api/v1`; Swagger tại `/api/docs` (response schema đầy đủ qua `@ApiDataResponse`)
- ✅ Auth: login OAuth qua UIS → JWT app 2 scope (`student`/`chief`); **không lưu password** — access/refresh token UIS mã hoá AES-256-GCM, refresh tự động mỗi 5h
- ✅ DI qua interface + token (`src/contracts/`); response types tường minh; storage S3-compatible (MinIO dev / R2 / AWS) + fallback local `./uploads`
- ✅ Jobs: `point-crawl` mỗi giờ, `token-refresh` 5h, `semester-sync` 0h — xem doc 08
- ✅ Đã import data từ `multidb` (710 SV, 11.985 điểm RL, 4.606 snapshot điểm, 308 tin nhắn, 23 đơn hàng…); file key đã chuẩn hoá (migration 3)
- ⏳ Chưa verify e2e với tài khoản UIS thật; chưa có test suite; chưa migrate file vật lý lên R2

Chạy local: [09-setup-guide.md](09-setup-guide.md) · Commands nhanh: `AGENTS.md`.
