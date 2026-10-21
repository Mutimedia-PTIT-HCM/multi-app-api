---
description: "TypeScript code style for new codebase"
trigger: always_on
---

# Code Style (áp dụng cho code mới — TypeScript)

- TypeScript `strict`, không `any` trừ boundary có lý do (khi đó dùng `unknown` + narrow). Target ES2022+, module NodeNext.
- TypeScript 7 (`typescript@^7`, `tsc` native) cho typecheck/build; tool cần compiler API cũ thì dùng `@typescript/typescript6` — không pin xuống TS5/6 cho toàn repo.
- async/await toàn bộ — cấm callback-style mới. `try/catch` chỉ ở boundary biết cách xử lý; để exception filter xử lý phần còn lại.
- Cấm `throw` trong callback/event handler; cấm `while(true)` + `setTimeout` — job định kỳ qua `@nestjs/schedule`, job batch qua BullMQ.
- Logging: `Logger` (pino/nest) — cấm `console.log`. Không log secrets/password/token.
- Ngày giờ: ISO 8601 / `Date` — cấm format `dd/mm/yyyy` thủ công trong code mới; convert ở boundary khi contract cũ bắt buộc.
- Tên: camelCase biến/hàm, PascalCase class/type, UPPER_SNAKE env/const. Không viết tắt mơ hồ (`excuteQuery` → `executeQuery` style cũ bỏ).
- Hàm ngắn, single purpose; không copy-paste block >3 dòng — extract shared util/service (legacy có ~5 bản sao avatar-URL và crawl-login).
- Không thêm comment giải thích cái code tự nói; comment chỉ cho nghiệp vụ không hiển nhiên (vd: "UIS trả ds_diem_hocky mới nhất ở đầu").
- Dependency mới: check đã có trong repo chưa; cài qua pnpm; tránh lib deprecated/ít maintain (legacy từng dùng `request`, `salted-sha256`, `fs` shim — cấm tái sử dụng).
