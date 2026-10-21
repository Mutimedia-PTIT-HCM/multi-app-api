# 01. Tổng quan nghiệp vụ

## Bối cảnh

Backend phục vụ app mobile dành cho sinh viên **PTIT HCM** (Học viện Công nghệ Bưu chính Viễn thông cơ sở TP.HCM). App có 2 phân hệ chính tương ứng 2 nhóm route:

| Nhóm route | Actor | Mục đích |
|---|---|---|
| `/stu_role/**` | Sinh viên (`stu`) | Xem TKB, điểm, profile, nhắn tin, sự kiện, mua bán ấn phẩm, tự chấm điểm rèn luyện |
| `/delegation_chief_role/**` | Ban cán sự lớp / ban chấp hành chi đoàn | Đăng thông báo, tạo sự kiện + QR check-in, duyệt điểm rèn luyện, quản lý thành viên lớp |

> Tên "delegation_chief" = lãnh đạo chi đoàn/lớp (lớp trưởng, bí thư...). Role lưu trong cột `sinhvien.role` (int). `role = 6` là sinh viên thường (không có quyền chief). Role 3, 4, 7 có quyền quản trị (7 = BCH/ctv cao nhất, 3 được set role cho người khác trừ 7).

## Điểm đặc biệt của hệ thống: crawl UIS

Hệ thống **không tự quản lý đăng nhập** mà uỷ quyền xác thực cho cổng thông tin sinh viên của trường: `https://uis.ptithcm.edu.vn/api`.

Luồng login (`crawlLogin` trong `mylib.js`):

1. Client gửi `mssv` + `password` (tài khoản UIS).
2. Server base64-encode credentials → gọi `GET /pn-signin?code=...` của UIS.
3. UIS trả về redirect chứa `CurrUser` (base64 JSON: `access_token`, thông tin user) + cookie `xsrf-ctrl`/`xsrf-sec`.
4. Server dùng `access_token` + cookie XSRF đó để gọi tiếp các API UIS khác (lấy thông tin SV, TKB, điểm).
5. Server cấp **JWT tự chế** cho client (2 loại: student token, chief token).

**Hệ quả quan trọng**: server **phải lưu password UIS của sinh viên dưới dạng giải mã được** để các job nền (crawl điểm định kỳ, cập nhật lớp) có thể đăng nhập lại UIS. Hiện tại lưu `base64(password + SALT_PASSWORD)` trong `sinhvien.password` — đây là rủi ro bảo mật lớn nhất của hệ thống, bắt buộc phải xử lý khi refactor (mã hoá đối xứng thật, vd AES-256-GCM với key trong KMS/env).

Chỉ hỗ trợ MSSV bắt đầu bằng `DCPT` hoặc `DCTT` (ngành Đa phương tiện / an toàn thông tin? – cần xác nhận với team, code trả `-1` "chưa phục vụ ngành khác" nếu khác prefix).

### Các API UIS đang dùng

| Endpoint UIS | Dùng cho |
|---|---|
| `GET /pn-signin` | Đăng nhập, lấy `access_token` + cookie XSRF |
| `POST /dkmh/w-locsinhvieninfo` | Thông tin sinh viên (tên, lớp, giới tính, ngày sinh, SĐT) |
| `POST /sch/w-locdstkbtuanusertheohocky` | Thời khoá biểu theo tuần của học kỳ (`ds_tuan_tkb`) |
| `POST /srm/w-locdsdiemsinhvien` | Điểm các học kỳ (`ds_diem_hocky`, `ds_diem_mon_hoc`, `ds_diem_thanh_phan`) |
| `POST /auth/login` | Login kiểu OAuth password grant (dùng trong `crawlFirstWeekStartDate`) |

Khái niệm `nhhk` = mã học kỳ dạng `YYYYK` (vd `20241` = năm học 2024, học kỳ 1; K∈{1,2,3}). Lưu trong bảng `config`, được job `checkTKB` tự động tăng khi gần đến học kỳ mới.

## Danh sách tính năng

### Phân hệ sinh viên

| Tính năng | Mô tả |
|---|---|
| Đăng nhập | `/stu_role/login` – xác thực qua UIS, tạo user mới nếu lần đầu, trả `accessToken` (+`accessTokenChief` nếu có quyền) |
| Thời khoá biểu | Crawl TKB theo tuần từ UIS; `learn_week` trả về chuỗi khoảng trắng có độ dài = số tuần + `tuan_hien_tai`; `schedule_learn/:week` trả mảng 7 ngày, mỗi ngày có `monhoc[]` |
| Điểm học tập | Crawl điểm tất cả học kỳ từ UIS, parse thành `{year, semester, gpa, list_point_and_subj[]}` (điểm thành phần: CC/KT/Se/TH/Thi/TK) |
| Hồ sơ | Xem profile SV khác, tìm SV theo tên/mssv, cập nhật avatar + fb/email/SĐT + flag ẩn (`hide_*`) |
| Điểm rèn luyện (tự chấm) | Form `form_point_ext` (cây tiêu chí có `parent`, `pointRule` = điểm tối đa). SV tự chấm `pointSelf` vào `point_ext`; chỉ chấm khi `status_point_ext.status=1` của lớp; upload minh chứng (`cert`) |
| Sự kiện | Xem danh sách/top-3 sự kiện; check-in sự kiện (ghi `sukien`: mask, mssv, thời gian, location) |
| Thông báo | Xem thông báo được gửi tới mình (`thongbao` join `ctthongbao`) |
| Tin nhắn | Chat 1-1: lịch sử qua REST, realtime qua Socket.IO (join room = mssv), push FCM cho người nhận |
| Chợ ấn phẩm | Đăng ấn phẩm (tối đa 3 ảnh), xem/đặt hàng (mỗi item = 1 dòng `donhang`), xem đơn mua/đơn bán, huỷ đơn, xác nhận/hoàn thành đơn |
| Danh bạ cán bộ | Xem danh sách giảng viên (`canbo`), sửa thông tin GV (`PUT modify_teacher` – hiện **không check quyền**) |

### Phân hệ ban cán sự / BCH

| Tính năng | Mô tả |
|---|---|
| Đăng nhập | `/delegation_chief_role/login` – login qua UIS + check `role != 6` |
| Thông báo | `send_notification`: gửi cho cả lớp (tạo `thongbao` + `ctthongbao` + push FCM theo topic = mã lớp); hỗ trợ type `schedule` kèm lịch học (milis_scheduling, room) |
| Sự kiện | Đăng sự kiện (có ảnh thumb) + push FCM topic `all`; xoá sự kiện; tải QR code check-in (`download_qr` gen file QR chứa JSON `{masukien, thoigian, poster}`) |
| Điểm danh | `get_list_attendance/:code_event` – danh sách SV đã check-in sự kiện |
| Điểm rèn luyện (duyệt) | `toggle_status` mở/khoá chấm cho lớp; `get_point/:mssv`, `get_all_point` (cả lớp); `post_point` chấm `pointFinal`; `delete_point`; `init` = reset điểm + xoá cert cả lớp (role 3/4); `get_cert/:mssv` xem minh chứng |
| Thành viên lớp | `get_members_class`; `update_new_class` – crawl lại `malop` cho toàn khoá qua UIS |
| Phân quyền | `update_role` – role 7 set tuỳ ý (<8), role 3 set trừ 7 |
| Cấu hình | `get_config` – xem `nhhk` hiện tại |

### Job nền & realtime

| Job | Tần suất | Việc |
|---|---|---|
| `runCheckNewPoint` | mỗi giờ | Với **từng** sinh viên: login UIS → crawl GPA 2 học kỳ gần nhất → so với `pointtmp` → FCM "Thông báo điểm" nếu đổi; FCM nhắc re-login nếu sai password |
| `runAuth` | mỗi giờ | Ngày mùng 1 <2h sáng: random `SECRET_KEY` mới → **vô hiệu toàn bộ token** (và chỉ đổi trong RAM, restart mất) |
| `checkTKB` (cron `0 0 * * *`) | hằng ngày | Lấy ngày bắt đầu HK sau từ UIS (login bằng SV mới nhất) → trước 10 ngày thì update `config.nhhk` sang HK mới |
| Socket.IO | – | `LOGIN` (join room mssv), `SEND_MESSAGE_TO_RECEIVER` (lưu `message` + FCM) |
| FCM topics | – | Subscribe phía client theo `mssv`, `malop`, `all` (server gửi bằng `condition: 'topic' in topics`) |

## Định dạng response chuẩn hiện tại (contract với app)

```json
{ "error": false, "message": "...", "data": {...} }
```

- `error: true` + `message` tiếng Việt khi lỗi nghiệp vụ (vẫn HTTP 200).
- HTTP 401 chỉ khi fail middleware auth.
- Body JSON gửi dạng **string hoá JSON** (client `JSON.stringify` body → server `JSON.parse(req.body)`) — vì `bodyParser.raw` lẫn `.json()`.
- Auth header: `Authorization: Bearer <token>` (token tự chế, không phải JWT chuẩn).

**Khi refactor phải giữ nguyên contract này** (hoặc version API mới `/v2`) để app mobile cũ không vỡ.
