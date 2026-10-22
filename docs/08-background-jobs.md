# 08. Background jobs & scheduling

Toàn bộ job chạy **trong cùng process với Nest app** — không có worker/scheduler
service riêng. Chỉ cần app + Redis + MySQL là jobs tự chạy.

## 2 cơ chế

| Cơ chế | Dùng cho | Đăng ký ở |
|---|---|---|
| **BullMQ** (queue trên Redis) | Job fan-out nhiều item, cần retry/rate-limit | `src/jobs/jobs.module.ts` — `BullModule.registerQueue()`; lịch định kỳ qua `queue.upsertJobScheduler()` trong `onModuleInit` của processor (persist trong Redis, sống qua restart) |
| **`@nestjs/schedule` cron** | Job đơn giản 1 lần/chu kỳ, không fan-out | `ScheduleModule.forRoot()` trong `JobsModule` + decorator `@Cron()` trên method |

## Danh sách job

| Job | File | Lịch | Vai trò |
|---|---|---|---|
| Point crawl | `jobs/point-crawl/point-crawl.processor.ts` | `0 * * * *` (mỗi giờ) — BullMQ scheduler | Fan-out `crawl-one` từng sinh viên → crawl điểm UIS → so `pointSnapshot` → FCM khi có điểm mới. Thay legacy `runCheckNewPoint` |
| Token refresh | `jobs/token-refresh/token-refresh.processor.ts` | `0 */5 * * *` (mỗi 5h) — BullMQ scheduler | Quét `uisRefreshToken` trong DB → gọi UIS refresh → lưu token mới (refresh token ROTATE mỗi lần dùng). Giữ session sống kể cả khi user mở app đồng thời |
| Class sync | `jobs/class-sync/class-sync.processor.ts` | Không có lịch — được enqueue on-demand (`concurrency: 1`, sleep 500ms giữa các lớp để không dồn UIS) | Crawl lại `malop` toàn khoá qua UIS → upsert classes/students. Thay legacy `update_new_class` |
| Semester sync | `jobs/semester-sync/semester-sync.service.ts` | `@Cron("0 0 * * *")` 0h hằng ngày | Crawl `ngay_bat_dau` học kỳ tiếp theo qua 1 mssv mẫu → sắp đến kỳ mới thì update `system_configs`. Thay legacy `checkTKB` |

## Lưu ý vận hành

- **Redis bắt buộc** — `BullModule.forRootAsync` trong `app.module.ts` đọc
  `REDIS_HOST/PORT` từ env. Không có Redis → queue jobs không chạy (cron
  `@nestjs/schedule` thì vẫn chạy vì nó là in-process timer).
- Deploy **nhiều replica** → BullMQ jobs tự phân phối qua Redis (an toàn), còn
  `@Cron` sẽ chạy **trên mọi replica** — nếu scale >1 instance cần leader
  election hoặc tách scheduler.
- Đổi lịch: sửa `pattern`/`@Cron` rồi restart — `upsertJobScheduler` là
  idempotent, lịch cũ trong Redis bị ghi đè theo `jobId` cố định.
- Log job hiện qua Nest logger của từng processor (`this.logger`) — xem bằng
  `docker logs` / journald của process app.

## Thêm job mới

1. Tạo `src/jobs/<name>/<name>.processor.ts` — `@Processor(QUEUE)` extends
   `WorkerHost`; nếu định kỳ thì `onModuleInit` → `upsertJobScheduler`.
2. Khai `QUEUE` constant trong `common/` + `BullModule.registerQueue` và
   providers trong `jobs.module.ts`.
3. Inject dependency qua token `@Inject(*_PORT)` — giống mọi service khác.
