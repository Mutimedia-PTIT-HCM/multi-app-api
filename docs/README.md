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

## TL;DR

- Code hiện tại: Express.js thuần, JS không type, ~2.300 dòng, nhiều lỗi bảo mật (SQL injection, secrets commit vào repo, JWT tự chế), nhiều bug tiềm ẩn.
- Hệ thống là **proxy/crawler cho cổng UIS của trường** (uis.ptithcm.edu.vn) + các tính năng nội bộ (thông báo, sự kiện, điểm rèn luyện, chợ ấn phẩm, chat).
- File upload hiện lưu local `public/` → kế hoạch chuyển sang **Cloudflare R2**.
- Stack đã chốt: **NestJS + TypeScript 7 + Prisma + MySQL hiện có** (phân tích chi tiết ở doc 05).

## Trạng thái triển khai (v2)

Codebase mới đã dựng tại root repo (Express cũ nằm trong `legacy/`):

- ✅ NestJS 11 + TS7 + Prisma + MySQL `multidb_v2` (camelCase columns) + BullMQ/Redis + Socket.IO
- ✅ Response envelope `{error,message,data}` giữ nguyên; global prefix `/api/v1`; Swagger tại `/api/docs`
- ✅ Auth JWT 2 scope (`student`/`chief`) qua `StudentAuthGuard`/`ChiefAuthGuard`; password UIS mã hoá AES-GCM
- ✅ Storage abstraction: S3-compatible qua `S3_*` (MinIO dev / R2 / AWS), fallback local `./uploads` + serve `/uploads/*`
- ✅ Jobs: BullMQ `point-crawl` (fan-out per student, retry+rate-limit), `class-sync`, cron `semester-sync` 0h hằng ngày
- ✅ Đã import xong data từ `multidb` (script one-shot đã xoá sau khi chạy: 710 SV, 11.985 điểm RL, 4.606 snapshot điểm, 308 tin nhắn, 23 đơn hàng…)
- ⏳ Chưa verify e2e với tài khoản UIS thật; chưa có test suite; chưa migrate file vật lý lên R2

Chạy local: xem mục Commands trong `AGENTS.md`.
