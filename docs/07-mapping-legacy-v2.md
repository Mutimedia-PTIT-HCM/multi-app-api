# 07. Mapping legacy ↔ v2

Bảng đối chiếu giữa codebase legacy (`legacy/`, Express) và codebase mới (`src/`, NestJS + Prisma).
Phục vụ: review parity khi refactor, kiểm tra app mobile cũ chuyển sang API mới thiếu gì.

## Quy ước chung

| Legacy | v2 |
|---|---|
| Base URL: `/stu_role/**`, `/delegation_chief_role/**` | `/api/v1/**` (global prefix) |
| 2 token: `accessToken` (for=stu) + `accessTokenChief` (for=delegation) | 1 JWT có `scope`: `student` / `chief` |
| Auth middleware `middleWareStu` / `middleWareChief` | `StudentAuthGuard` / `ChiefAuthGuard` |
| Upload: multipart trực tiếp vào endpoint nghiệp vụ | 2 bước: `POST /uploads/presign` → `PUT uploadUrl` → truyền `key` vào API nghiệp vụ |
| Response: mỗi file tự build JSON | Envelope thống nhất `{error, message, data}` (interceptor) |
| Không phân trang | `?page=&limit=` trên mọi list endpoint |
| Lỗi: status code + text lộn xộn | `{error:true, code:"PREFIX_NNN", message, data:null}` |

---

## 1. Mapping API endpoint

### Auth

| Legacy | v2 | Ghi chú |
|---|---|---|
| `POST /stu_role/login` | `POST /auth/student/login` | Trả `accessToken` (+`accessTokenChief` nếu role ≠ 6) |
| `POST /delegation_chief_role/login` | `POST /auth/chief/login` | Guard `NO_CHIEF_ROLES` (role 0/6 → 403) |
| `POST /stu_role/check_access_token` | `GET /auth/check` | Verify token, trả scope |
| — | `POST /uploads/presign` | **Mới**: xin quyền upload (mọi ảnh/file đi qua đây) |
| — | `PUT /uploads/local/:token` | **Mới**: endpoint upload binary khi storage=local |

### Students / hồ sơ

| Legacy | v2 | Ghi chú |
|---|---|---|
| `GET /stu_role/stu_inf/get_stu_inf/:stu_code` | `GET /students/:studentCode` | |
| `GET /stu_role/stu_inf/get_all_user?name_searched=` | `GET /students?search=` | Paginated |
| `PATCH /stu_role/stu_inf/change_profile` | `PATCH /students/me/profile` | Avatar đi qua presign (`avatarKey`) thay vì multipart |
| `GET /stu_role/stu_inf/get_inf_stu/:grade` | **BỎ** | Import khoá từ service nội bộ khác — dùng `prisma/seed.ts` / script import thay vì endpoint |
| `GET .../stu_inf/get_stu_inf/:stu_code` (chief) | `GET /students/:studentCode` | Chung endpoint, guard student |
| `GET .../stu_inf/get_members_class` | `GET /students/me/class-members` | |
| `PUT .../stu_inf/update_new_class` | `PUT /classes/sync` | Đẩy vào BullMQ `class-sync` queue, trả `jobId` |
| — | `GET /students/me` | **Mới**: profile bản thân |

### Schedule / điểm học tập (crawl UIS trực tiếp)

| Legacy | v2 | Ghi chú |
|---|---|---|
| `GET /stu_role/schedule/learn_week` | `GET /schedule/weeks` | Trả `{totalWeeks, currentWeek, semesterCode}` — khác shape `" "` lặp của legacy |
| `GET /stu_role/schedule/schedule_learn/:week` | `GET /schedule/weeks/:week` | Trả `ScheduleDay[7]` normalize (`subjectCode/subjectName/...`) thay vì `mamh/tenmh/...` |
| `GET /stu_role/point/get_point` | `GET /academic-points` | Trả `SemesterPoint[]` normalize (`subjects:[{subjectCode,...,exam,final}]`) |

### Điểm rèn luyện (training points)

| Legacy | v2 | Ghi chú |
|---|---|---|
| `GET /stu_role/point_ext/get_point` | `GET /training-points/form` | |
| `POST /stu_role/point_ext/post_point` | `POST /training-points/self` | |
| `POST /stu_role/point_ext/post_cert` | `POST /training-points/certificates` | Ảnh qua presign (`keys[]`) thay vì multipart |
| `GET /stu_role/point_ext/get_cert` | `GET /training-points/certificates` | Trả `{major, individual}` giữ nguyên shape |
| `POST .../point_ext/toggle_status` | `POST /training-points/status` | |
| `GET .../point_ext/get_status_point_ext` | `GET /training-points/status` | |
| `GET .../point_ext/get_point/:mssv` | `GET /training-points/students/:studentCode` | |
| `GET .../point_ext/get_all_point` | `GET /training-points/class` | Fix bug N+1 + `data/user` undefined của legacy |
| `POST .../point_ext/post_point` | `POST /training-points/review` | Chấm `finalPoint` |
| `POST .../point_ext/init` | `POST /training-points/reset` | |
| `GET .../point_ext/get_cert/:mssv` | `GET /training-points/students/:studentCode/certificates` | |
| `POST .../point_ext/delete_point` | `DELETE /training-points/:pointId` | |
| `GET .../point_ext/get_config` | **BỎ** | Bản sao bug của `get_all_point` trong legacy |

### Sự kiện

| Legacy | v2 | Ghi chú |
|---|---|---|
| `POST /stu_role/event/check_in` | `POST /events/:eventCode/check-in` | `codeEvent` → path param |
| `GET /stu_role/event/get_3_event` | `GET /events?page=1&limit=3` | Gộp vào list paginated |
| `GET /stu_role/event/get_event` | `GET /events` | |
| `POST .../event/post_event` | `POST /events` | Thumbnail qua presign (`thumbKey`) |
| `DELETE .../event/delete_event/:id` | `DELETE /events/:eventCode` | Có check ownership |
| `GET .../event/download_qr/:event_code` | `GET /events/:eventCode/qr` | Trả `image/png` trực tiếp (không phải file) |
| `GET .../attendance/get_list_attendance/:code` | `GET /events/:eventCode/attendance` | |

### Thông báo

| Legacy | v2 | Ghi chú |
|---|---|---|
| `GET /stu_role/notification/get_notifi` | `GET /notifications` | Paginated |
| `POST .../notification/send_notification` | `POST /notifications` | File đính kèm qua presign (`keys[]`) |
| — | `PATCH /notifications/recipients/:recipientId/read` | **Mới**: đánh dấu đã đọc |

### Tin nhắn

| Legacy | v2 | Ghi chú |
|---|---|---|
| `GET /stu_role/message/get_message_target/:target` | `GET /messages/:peerCode` | Paginated |
| `GET /stu_role/message/get_message_user` | `GET /messages/conversations` | |
| `DELETE /stu_role/message/remove_msg/:id` | `DELETE /messages/:messageCode` | Có check quyền sở hữu |
| Socket `LOGIN`, `SEND_MESSAGE_TO_RECEIVER` | `MessagesGateway` (giữ tên event) | |

### Chợ ấn phẩm

| Legacy | v2 | Ghi chú |
|---|---|---|
| `POST /stu_role/product/post_product` | `POST /products` | Ảnh qua presign (`keys[]` ≤3) |
| `GET /stu_role/product/get_all_products` | `GET /products` | Paginated |
| `GET /stu_role/product/get_list_product?string_product_code=` | `GET /products?codes=` | codes comma-separated |
| `GET /stu_role/product/get_product_by_code/:code` | `GET /products/:productCode` | |
| `POST /stu_role/product/order_product` | `POST /orders` | Body `[{productCode, quantity, note}]` — seller suy từ product |
| `GET /stu_role/product/get_my_order` | `GET /orders/mine` | Paginated |
| `GET /stu_role/product/get_order_my_product` | `GET /orders/received` | Paginated |
| `DELETE /stu_role/product/cancel_order/:order_code` | `DELETE /orders/:orderCode` | Có check quyền |
| `POST /stu_role/product/confirm_order/:id` | `POST /orders/:orderCode/confirm` | status -1→0 |
| `POST /stu_role/product/done_order/:id` | `POST /orders/:orderCode/done` | status 0→1 |

### Cán bộ / role / hệ thống

| Legacy | v2 | Ghi chú |
|---|---|---|
| `GET /stu_role/teacher/get_teacher` | `GET /teachers` | Paginated |
| `PUT /stu_role/teacher/modify_teacher` | `PUT /teachers/:teacherCode` | Legacy **mọi SV sửa được** — v2 vẫn student guard (giữ parity) |
| `PUT .../role/update_role` | `PUT /classes/role` | |
| `GET .../get_config` | `GET /system/semester/chief` | `{semesterCode}` |
| — | `GET /system/semester` | **Mới**: student cũng xem được HK hiện tại |
| `GET /` | `GET /api/v1/` | Health (ẩn khỏi Swagger) |
| `GET /app-ads.txt` | `GET /api/v1/app-ads.txt` | Giữ nguyên cho AdMob |

### File tĩnh (legacy `express.static('public')`) → object storage

| Legacy path | v2 |
|---|---|
| `/avt/*` | `storage.url(avatarKey)` → S3 public URL hoặc `/uploads/*` |
| `/products/<ma>/*`, `/cert/*`, `/notification/*`, `/event/thumb/*` | Cùng pattern — URL build từ `S3_PUBLIC_URL`/local |
| `/event/qrcode/*` | Không còn file — QR generate on-the-fly |

---

## 2. Mapping bảng SQL

DB legacy `multidb` (snake_case/text, không FK) → DB mới `multidb_v2` (Prisma, camelCase, typed + FK).

| Legacy table | Prisma model | Đổi tên cột chính | Ghi chú |
|---|---|---|---|
| `sinhvien` | `Student` | `mssv→studentCode`, `malop→classCode`, `hoten→fullName`, `sdt→phone`, `pers_email→personalEmail`, `fb→facebook`, `gioitinh→gender`, `ngaysinh→birthDate`, `avt→avatarKey`, `ctv→isCollaborator`, `hide_pers_email/fb/phone→hidePersonalEmail/hideFacebook/hidePhone` | `password` (reversible base64) **đã xoá** → `uisAccessToken`, `uisRefreshToken`, `uisTokenExpiresAt` (AES-256-GCM). `token` (unused) → `fcmToken` |
| `canbo` | `Teacher` | `magv→teacherCode`, `hotengv→fullName`, `zl→zalo`, `hocham→academicRank`, `hocvi→degree` | Charset chuẩn utf8mb4 |
| `mentor` | `Mentor` | `magv→teacherCode`, `malop→classCode` | Thêm PK + FK |
| `config` | `SystemConfig` | `nhhk→semesterCode` | |
| `form_point_ext` | `TrainingPointForm` | `stt→orderNo`, `pointRule→maxPoint`, `parent→parentId` | `stt float` → `orderNo int` |
| `point_ext` | `TrainingPoint` | `idFormPoint→formId`, `mssv→studentCode`, `pointSelf→selfPoint`, `pointFinal→finalPoint` | FK tới form + student |
| `status_point_ext` | `TrainingPointStatus` | `class→classCode`, `status→isOpen` | `status int` → `isOpen boolean` |
| `cert` | `Certificate` | `mssv→studentCode`, `img→imageKeys` | Space-separated → `imageKeys` |
| `chitietsukien` | `Event` | `masukien→eventCode`, `ten→title`, `noidung→content`, `thoigian→eventTime`, `done→isDone`, `thumb→thumbnailKey`, `poster→posterCode` | `Date.now()` mã → `eventCode` string giữ nguyên |
| `sukien` | `EventCheckIn` | `mask→eventCode`, `mssv→studentCode`, `thoigiancheckin→checkInAt` | `checkInAt` → `DateTime` |
| `ctthongbao` | `Notification` | `matb→notificationCode`, `tieude→title`, `noidung→content`, `poster→posterCode`, `sendat→sentAt`, `list_file_name→fileKeys` | |
| `thongbao` | `NotificationRecipient` | `matb→notificationCode`, `mssv→studentCode` | `seen` giữ tên (int→vẫn int? → `seen`) |
| `anpham` | `Product` | `maanpham→productCode`, `mssv→sellerCode`, `tenanpham→name`, `gia→price`, `soluongton→stock`, `mota→description`, `hinhanh→imageKeys` | `longtext` PK → string |
| `donhang` | `Order` | `madonhang→orderCode`, `buyer→buyerCode`, `maanpham→productCode`, `soluong→quantity`, `time→createdAt`, `state→status` | `state -1/0/1` → `status` giữ nguyên ngữ nghĩa |
| `message` | `Message` | `message_code→messageCode`, `sender→senderCode`, `receiver→receiverCode`, `time→sentAt` | `time` text → `sentAt DateTime` |
| `pointtmp` | `PointSnapshot` | `mssv→studentCode`, `nhhk→semesterCode` | Cache GPA cho job crawl+notify |
| `position` | `Position` | Giữ nguyên | Danh mục chức vụ |

### Bảng/trường legacy đã loại bỏ

| Legacy | Lý do |
|---|---|
| `sinhvien.password` | Không lưu password UIS — chuyển sang OAuth token (encrypted) |
| `sinhvien.token` | Không dùng (insert `''` ở legacy) |
| `config` các cột phụ | Chỉ còn `semesterCode` cần thiết |
| File path trong `avt/hinhanh/img/list_file_name` | Chuyển sang storage `key` → URL build qua `StorageService` |

### Đã thêm mới (không có ở legacy)

| Model | Mục đích |
|---|---|
| `Student.uisAccessToken`/`uisRefreshToken`/`uisTokenExpiresAt` | OAuth UIS server-side (thay password) |
| `Student.fcmToken` | Push notification theo device (chuẩn bị) |
| `createdAt`/`updatedAt` các model | Audit chuẩn |

---

## 3. Mapping job nền

| Legacy | v2 | Ghi chú |
|---|---|---|
| `runCheckNewPoint()` — `while(true)+setTimeout` 1h, trong web process | `PointCrawlProcessor` (BullMQ) | Repeatable hourly, fan-out `crawl-one`/SV, retry + rate-limit |
| `schedule.schedule('0 0 * * *')` → `checkTKB()` | `SemesterSyncService.checkSemester` (@nestjs/schedule) | Cùng logic crawl ngày đầu HK tiếp theo → update `systemConfig` |
| — | `TokenRefreshProcessor` (5h) | **Mới**: quét refresh token sắp hết → renew |
| `update_new_class` endpoint | `ClassSyncProcessor` queue | Endpoint giờ chỉ enqueue |

## 4. Endpoint bỏ hẳn

| Legacy | Lý do |
|---|---|
| `GET /stu_role/stu_inf/get_inf_stu/:grade` | Import khoá từ service nội bộ — làm bằng seed script, không phải API |
| `GET .../point_ext/get_config` | Bản sao bug của `get_all_point` |
| `POST /stu_role/event/check_in` body `{codeEvent}` | Đổi sang path param |
| `express.static('public')` | Object storage + presigned upload thay thế |
