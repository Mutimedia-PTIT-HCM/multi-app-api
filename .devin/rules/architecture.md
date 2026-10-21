---
description: "Layered architecture for the NestJS refactor"
trigger: always_on
---

# Architecture (codebase refactor — NestJS)

## Layering bắt buộc

```
Controller  →  Service  →  Repository/Prisma | UisService | StorageService | PushService
```

- Controller: chỉ routing + DTO in/out — KHÔNG query DB, KHÔNG logic nghiệp vụ.
- Service: business logic, transaction.
- Data access: `PrismaService` duy nhất — cấm raw SQL nối chuỗi; raw query chỉ khi Prisma không biểu đạt được và phải `$queryRaw` parameterized.
- Mọi call sang UIS qua `UisService` (cookie/XSRF/retry/timeout 1 chỗ).
- Mọi file IO qua `StorageService` (R2). Mọi push qua `PushService` (FCM).

## Module map (theo legacy route)

`auth`, `student` (stu_inf/schedule/point), `point-ext` (stu + chief), `event` (+attendance), `notification`, `message` (+gateway), `product`, `teacher`, `role`, `config`, `jobs` (crawl-point, tkb-semester), `core` (prisma/uis/storage/push/logger/guards).

## Quy tắc

- Guard dùng chung `AuthGuard` + `@Roles()`, không viết middleware riêng từng router.
- Envelope `{error,message,data}` qua 1 `TransformInterceptor` toàn cục — handler return raw data, không tự wrap.
- Lỗi nghiệp vụ: throw exception có `message` tiếng Việt → exception filter map ra `{error:true, message}`.
- Config chỉ đọc qua `ConfigService` — cấm `process.env` rải rác ngoài `main.ts`/config module.
- Cron/job queue đặt trong `jobs/` — không để trong `main.ts`.
