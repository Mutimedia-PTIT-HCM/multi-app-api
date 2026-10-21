---
description: "Security rules — SQL injection, secrets, auth, file upload"
trigger: always_on
---

# Security (BẮT BUỘC — codebase cũ từng vi phạm tất cả)

## SQL

- TUYỆT ĐỐI không nối chuỗi input (body, params, query, header, tên file) vào SQL. Chỉ parameterized query `query(sql, [params])` hoặc ORM.
- Input từ `req.mssv` (từ token) cũng phải parameterized.
- `LIKE` phải escape `%`, `_` trong input trước khi bind.

## Secrets

- Không bao giờ commit: `.env`, `*.json` credential (service-account, fcm-config), `*.p8`, password/token trong code.
- Phát hiện secret hardcode trong code cũ → báo user, không tự ý giữ lại.
- Không log password, token, cookie, credentials UIS.

## Auth / Authorization

- Token verify ở middleware/guard — handler không tự verify lại.
- Guard phải handle token thiếu/malformed (trả 401, KHÔNG throw).
- Endpoint mới mặc định cần auth — public phải khai báo tường minh.
- Mọi mutation phải check ownership: đơn hàng, tin nhắn, sự kiện, điểm chỉ chỉnh bởi chủ sở hữu hoặc role có quyền **trong phạm vi lớp của họ**.
- Codebase mới: JWT chuẩn (jsonwebtoken/jose), claim `{mssv, role, exp}` — cấm tự chế signature.

## UIS tokens (đặc thù hệ thống)

- KHÔNG lưu password UIS. Chỉ lưu OAuth `uisAccessToken`/`uisRefreshToken` mã hoá AES-256-GCM qua `CredentialCipherService`, key ngoài DB (env `CREDENTIAL_KEY`). Không log/return field này ra client.

## Upload

- Validate mime + size; KHÔNG dùng `file.originalname` trực tiếp (path traversal) — gen tên file server-side.
- File lưu qua `StorageService` (Cloudflare R2) — không ghi local disk trong code mới.

## HTTP ngoài (crawl UIS)

- Mọi call UIS phải qua `UisService` duy nhất: có timeout, retry/backoff, không gọi trực tiếp axios trong handler/job.
