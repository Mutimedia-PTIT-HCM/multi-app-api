# 02. Danh mục API hiện tại

Base URL: `process.env.BASE_URL_MULTI_SERVER`. Auth: `Authorization: Bearer <token>`.

Token:
- `accessToken` (header `for: "stu"`) → dùng cho `/stu_role/**`
- `accessTokenChief` (header `for: "delegation and chief"`) → dùng cho `/delegation_chief_role/**`

Middleware mount ở `app.js`: `/stu_role` → `middleWareStu` (bỏ qua path `/login`), `/delegation_chief_role` → `middleWareChief` (bỏ qua `/login`).

Body POST/PATCH/PUT: **JSON đã stringify** (server gọi `JSON.parse(req.body)`), trừ endpoint `multipart/form-data` (upload).

## Root

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | `/` | – | Health check |
| GET | `/app-ads.txt` | – | Serve `public/ads/app-ads.txt` (AdMob) |

## `/stu_role` – Sinh viên

### Auth (module/stu.js)

| Method | Path | Body | Mô tả |
|---|---|---|---|
| POST | `/stu_role/login` | `{mssv, password}` | Login qua UIS. Lần đầu → insert `sinhvien` (role 6) + lấy info từ UIS. Trả `{accessToken, accessTokenChief?, data: sinhvien}`. Lỗi: sai pass / MSSV không phải DCPT/DCTT |
| POST | `/stu_role/check_access_token` | – | Verify token student |

### Schedule (module/student/schedule.js)

| Method | Path | Params | Mô tả |
|---|---|---|---|
| GET | `/stu_role/schedule/learn_week?ngay_trong_tuan=dd/mm/yyyy` | | Crawl UIS: số tuần HK (chuỗi `" "` lặp) + `tuan_hien_tai` |
| GET | `/stu_role/schedule/schedule_learn/:week?ngay_trong_tuan=` | week | Crawl UIS: TKB tuần → `mang_mon_hoc_trong_tuan` = 7 ngày, mỗi ngày `{date, monhoc:[{mamh,tenmh,sotc,thu,tencb,phong,tietbd,sotiet}]}` |

### Point (module/student/point.js)

| Method | Path | Mô tả |
|---|---|---|
| GET | `/stu_role/point/get_point` | Crawl toàn bộ điểm UIS → `[{year, semester, gpa, list_point_and_subj:[{code_subj,name,TC,CC,KT,Se,TH,Thi,TK}]}]` |

### Student info (module/student/stu_inf.js)

| Method | Path | Mô tả |
|---|---|---|
| GET | `/stu_role/stu_inf/get_stu_inf/:stu_code` | Thông tin 1 SV (kèm URL avatar) |
| GET | `/stu_role/stu_inf/get_inf_stu/:grade` | **Import sinh viên cả khoá** từ service khác (`BASE_URL_ENDPOINT/multi_role/stu_inf/get_new_stu/:grade`) rồi insert DB. Có vẻ là service nội bộ khác (multi-app?) |
| GET | `/stu_role/stu_inf/get_all_user?name_searched=` | Tìm SV theo tên/mssv (LIKE), loại chính mình |
| PATCH | `/stu_role/stu_inf/change_profile` | multipart: `files` (avatar, nhưng array tới 100 file — bug), fields `fb, pers_email, phone, is_hide_email, is_hide_phone, is_hide_fb` |

### Điểm rèn luyện – tự chấm (module/student/point_ext.js)

| Method | Path | Body | Mô tả |
|---|---|---|---|
| GET | `/stu_role/point_ext/get_point` | | Form tiêu chí + điểm tự chấm/điểm duyệt của mình |
| POST | `/stu_role/point_ext/post_point` | `{idFormPoint, point}` | Tự chấm (`pointSelf`), check `point <= pointRule`, check status lớp mở |
| POST | `/stu_role/point_ext/post_cert` | multipart `files` + `title` | Upload minh chứng → `cert` |
| GET | `/stu_role/point_ext/get_cert` | | `major`: sự kiện đã check-in; `individual`: cert tự upload (URL `/cert/...`) |

### Sự kiện (module/student/event.js)

| Method | Path | Body | Mô tả |
|---|---|---|---|
| POST | `/stu_role/event/check_in` | `{codeEvent, location}` | Check-in (chặn check-in trùng) |
| GET | `/stu_role/event/get_3_event` | | 3 sự kiện mới nhất |
| GET | `/stu_role/event/get_event` | | Toàn bộ sự kiện (verify lại token thủ công — thừa) |

### Thông báo (module/student/notification.js)

| Method | Path | Mô tả |
|---|---|---|
| GET | `/stu_role/notification/get_notifi` | Thông báo của mình (join ctthongbao + poster info + link file đính kèm) |

### Tin nhắn (module/student/message.js + socket.io)

| Method | Path | Mô tả |
|---|---|---|
| GET | `/stu_role/message/get_message_target/:target_code` | Lịch sử chat 2 chiều với `target_code`, join lấy hoten+avt người gửi |
| GET | `/stu_role/message/get_message_user` | Danh sách hội thoại (join lấy thông tin người còn lại) |
| DELETE | `/stu_role/message/remove_msg/:id` | Xoá message theo `message_code` (không check quyền sở hữu) |

Socket events: `LOGIN` (join room = mssv), `SEND_MESSAGE_TO_RECEIVER` `{sender, receiver, content, full_name_sender, link_avt_sender}` → insert `message` + FCM.

### Chợ ấn phẩm (module/student/product.js)

| Method | Path | Body | Mô tả |
|---|---|---|---|
| POST | `/stu_role/product/post_product` | multipart `files`(≤3) + `name_product, cost_product, soluongton, description` | Đăng ấn phẩm → `anpham`, ảnh lưu `public/products/<ma>` |
| GET | `/stu_role/product/get_all_products` | | Tất cả ấn phẩm + tên người bán |
| GET | `/stu_role/product/get_list_product?string_product_code=` | | Theo danh sách mã (space-separated) |
| GET | `/stu_role/product/get_product_by_code/:code_product` | | Chi tiết 1 ấn phẩm + avt người bán |
| POST | `/stu_role/product/order_product` | `[{seller, productCode, num, note}]` | Insert nhiều dòng `donhang` (state=-1), FCM cho từng seller |
| GET | `/stu_role/product/get_my_order` | | Đơn mình đã mua |
| GET | `/stu_role/product/get_order_my_product` | | Đơn người khác mua ấn phẩm mình |
| DELETE | `/stu_role/product/cancel_order/:order_code` | | Xoá đơn (không check quyền) |
| POST | `/stu_role/product/confirm_order/:id` | | state=0 |
| POST | `/stu_role/product/done_order/:id` | | state=1 |

State đơn hàng: `-1` = mới đặt, `0` = đã xác nhận, `1` = hoàn thành.

### Cán bộ (module/student/teacher.js)

| Method | Path | Mô tả |
|---|---|---|
| GET | `/stu_role/teacher/get_teacher` | Danh bạ giảng viên (`canbo`) |
| PUT | `/stu_role/teacher/modify_teacher` | Sửa `ngaysinh,sdt,email,hocham,hocvi` theo `magv` — **mọi SV đều sửa được** |

## `/delegation_chief_role` – Ban cán sự / BCH

| Method | Path | Body | Mô tả |
|---|---|---|---|
| POST | `/delegation_chief_role/login` | `{mssv,password}` | Login UIS + `role != 6` mới vào được |
| GET | `/delegation_chief_role/get_config` | | `{nhhk}` |

### Thông báo (delegation_chief/notification.js)

| Method | Path | Body | Mô tả |
|---|---|---|---|
| POST | `/delegation_chief_role/notification/send_notification` | multipart `files` + `title, content, type` (+`learn_time_clock, learn_time_date, room` nếu type=schedule) | Tạo `thongbao` cho cả lớp + `ctthongbao` + FCM topic=malop |

### Sự kiện (delegation_chief/event.js)

| Method | Path | Mô tả |
|---|---|---|
| POST | `.../event/post_event` | multipart `files` + `title, content` → `chitietsukien` + FCM topic `all` |
| DELETE | `.../event/delete_event/:id` | Xoá `chitietsukien` (không check quyền/ownership) |
| GET | `.../event/download_qr/:event_code` | Gen + trả file QR (JSON `{masukien,thoigian,poster}`) |
| GET | `.../event/get_event` | Toàn bộ sự kiện |

### Điểm danh (delegation_chief/attendance.js)

| Method | Path | Mô tả |
|---|---|---|
| GET | `.../attendance/get_list_attendance/:code_event` | Danh sách check-in của sự kiện |

### Điểm rèn luyện – duyệt (delegation_chief/point_ext.js)

| Method | Path | Body | Mô tả |
|---|---|---|---|
| POST | `.../point_ext/toggle_status` | `{status}` | Mở/khoá chấm điểm cho **lớp của mình** |
| GET | `.../point_ext/get_status_point_ext` | | Status lớp mình (tạo dòng mới =0 nếu chưa có) |
| GET | `.../point_ext/get_point/:mssv` | | Điểm của 1 SV |
| GET | `.../point_ext/get_all_point` | | Điểm cả lớp (N+1 query, có bug `data`/`user` undefined) |
| POST | `.../point_ext/post_point` | `{idFormPoint, point, mssv}` | Chấm `pointFinal` cho SV |
| POST | `.../point_ext/init` | | Reset: xoá `cert`, `point_ext` cả lớp + xoá file cert trên đĩa (role 3 hoặc 4) |
| GET | `.../point_ext/get_config` | | (bản sao bug của get_all_point) |
| GET | `.../point_ext/get_cert/:mssv` | | Minh chứng của 1 SV |
| POST | `.../point_ext/delete_point` | `{pointExtId}` | Xoá 1 dòng `point_ext` |

### Thành viên (delegation_chief/stu_inf.js)

| Method | Path | Mô tả |
|---|---|---|
| GET | `.../stu_inf/get_stu_inf/:stu_code` | Thông tin 1 SV |
| GET | `.../stu_inf/get_members_class` | Thành viên lớp mình |
| PUT | `.../stu_inf/update_new_class` | Crawl lại `malop` toàn khoá qua UIS (role 6/7 bị chặn — logic ngược trong code: chặn `==7 || ==6`) |

### Phân quyền (delegation_chief/role.js)

| Method | Path | Body | Mô tả |
|---|---|---|---|
| PUT | `.../role/update_role` | `{mssv, role}` | role=7 set tuỳ ý (<8); role=3 set trừ 7; còn lại 403 |

## File tĩnh (`express.static('public')`)

| Path | Nội dung |
|---|---|
| `/avt/*` | Avatar (`default.png` fallback) |
| `/products/<maanpham>/*` | Ảnh ấn phẩm |
| `/cert/*` | Minh chứng điểm rèn luyện |
| `/notification/*` | File đính kèm thông báo |
| `/event/thumb/*`, `/event/qrcode/*` | Poster sự kiện, QR check-in |
| `/ads/app-ads.txt` | AdMob |

→ Toàn bộ sẽ migrate sang **Cloudflare R2** (xem docs/06).
