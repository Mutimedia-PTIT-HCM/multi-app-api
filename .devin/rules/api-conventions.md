---
description: "API contract conventions — response envelope, errors, naming"
trigger: always_on
---

# API Conventions (contract với mobile app — KHÔNG được phá vỡ)

## Response envelope

Mọi response JSON theo shape:

```json
{ "error": false, "message": "<tiếng Việt>", "data": <payload> }
```

- `error: true` + `message` tiếng Việt cho lỗi nghiệp vụ (app hiển thị `message` trực tiếp cho user).
- `data` có thể vắng hoặc `null` khi lỗi.
- HTTP status: 200 cho nghiệp vụ (kể cả `error:true` — legacy contract), 401 auth fail, 403 thiếu quyền, 4xx/5xx đúng chuẩn ở code mới.

## Auth header

`Authorization: Bearer <token>`. `req.mssv` được gán bởi guard.

## Request body

- Legacy: client gửi JSON đã stringify (server `JSON.parse(req.body)`). Code mới: accept object trực tiếp qua ValidationPipe — vẫn phải tương thích nếu app gửi string.
- Upload: `multipart/form-data`, field file tên `files`, field text như cũ.

## Naming giữ nguyên khi refactor

- Path, method, field name (kể cả tên xấu như `mamh`, `sotc`, `pointSelf`) giữ y nguyên trừ khi có version API mới `/v2` được team app chấp thuận.
- FCM payload keys (`fcm_type`, `fragment_opened`, `click_action`, `notification_type`) giữ nguyên — app parse theo key này.

## Pagination/ID

- ID hiện sinh bằng `Date.now()` (ms) — khi refactor vẫn được, nhưng code mới nên dùng cuid/uuid nếu contract cho phép (string).
