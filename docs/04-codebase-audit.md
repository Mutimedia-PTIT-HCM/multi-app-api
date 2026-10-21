# 04. Đánh giá codebase hiện tại

## A. Bảo mật — mức NGHIÊM TRỌNG

### A1. Secrets đang commit trong git (phải rotate NGAY)

| File | Nội dung |
|---|---|
| `service-account.json` | Firebase service account private key |
| `fcm-config.json` | FCM credential |
| `AuthKey_YDGC8VLS7Y.p8` | Apple Push Notification key |
| `module/student/stu_inf.js:15-18` | Google OAuth `CLIENT_SECRET` + `REFRESH_TOKEN` hardcode (dù đoạn oAuth2Client không dùng tới) |
| `Makefile:44` | **VPS root password** (`sshpass -p '...'` plaintext) + IP VPS |
| `docker-compose.yml` | MySQL root/user password default plaintext |

→ Việc đầu tiên trong refactor: revoke/rotate toàn bộ, xoá khỏi git history (hoặc chấp nhận rotate là đủ vì repo private), đưa vào `.env` / secrets manager.

### A2. SQL injection tràn lan

Nhiều chỗ nối chuỗi input thẳng vào query:

- `product.js`: `order_product` (`INSERT INTO donhang VALUES ${stringQueryCodeProductOrder}` chứa `productCode`, `note`), `get_list_product`, `get_product_by_code`, `get_my_order`, `get_order_my_product` (nối `mssv` — tuy lấy từ token nhưng pattern nguy hiểm)
- `stu_inf.js`: `get_all_user` (nối `name_searched` từ query param — **injectable trực tiếp**), `change_profile` (nối `fb`, `email`, `phone`, `listNameFile`)
- `notification.js` (chief): nối `title`, `content`, `listNameFile` vào `INSERT ctthongbao`
- `app.js` socket handler: `INSERT INTO message VALUES ('${payload.sender}'...)` — nội dung chat inject được
- `stu_inf.js get_inf_stu`: nối dữ liệu từ service khác vào INSERT hàng loạt

→ Rule bắt buộc khi refactor: **chỉ dùng parameterized query / Prisma, cấm template-string SQL chứa input**.

### A3. JWT tự chế — yếu

`mylib.generAccessTokenStudent/DelegationChief`:
- Signature = `saltedSha256(header.payload, SECRET_KEY)` — không phải HMAC chuẩn, lib `salted-sha256` ít người dùng/không audit.
- Token bị `.replace(/[;'"-]/g,'')` sau khi tạo → **xác thực so sánh với bản không strip → nhiều token hợp lệ sẽ bị coi là invalid** (bug) và nếu strip làm trùng thì còn yếu hơn.
- Payload chỉ có `mssv`, không `exp`, `iat`, `iss` → token không hết hạn; ai forge được secret thì vào được mọi tài khoản.
- `SECRET_KEY` lấy từ env, job `runAuth` đổi key ngày mùng 1 → đăng xuất hàng loạt user, và chỉ đổi trong RAM.
- `verifyAuthorizationStudent` crash nếu token không đủ 3 phần (`split('.')[1]` → JSON.parse undefined throw) → middleware throw → treo request.

→ Refactor: `jsonwebtoken`/`jose` HS256 + `exp`, refresh token, giữ claim `mssv` + `role`.

### A4. Mật khẩu UIS lưu reversible

`sinhvien.password = base64(password + SALT)` — decode được bởi bất kỳ ai đọc DB. Đây là **yêu cầu nghiệp vụ** (job crawl điểm cần login UIS) nên không thể hash 1 chiều; giải pháp: AES-256-GCM với key ngoài DB + giới hạn quyền đọc, hoặc nghiên cứu flow token refresh của UIS để bỏ lưu password.

### A5. Không kiểm soát truy cập trên nhiều endpoint

- `teacher/modify_teacher`: SV thường sửa được thông tin giảng viên.
- `product/cancel_order`, `confirm_order`, `done_order`: không check đơn có thuộc mình (mua/bán) không.
- `event/delete_event`: chief nào cũng xoá được event của người khác.
- `message/remove_msg`: xoá được tin nhắn của người khác.
- `stu_inf/get_inf_stu/:grade`: import cả khoá — không check quyền.
- `delegation_chief/point_ext` endpoints: chỉ check chief-token, không check đúng lớp của mình (chief lớp A chấm được lớp B qua `get_point/:mssv`, `post_point`).

### A6. Khác

- CORS `*` cho cả REST lẫn Socket.IO.
- `server.setTimeout(0)` — request treo vĩnh viễn (Slowloris).
- Upload file không validate type/size/không sanitize tên (`file.originalname` dùng thẳng làm tên file → path traversal `../../` có thể ghi đè file ngoài `public/`).
- `middleWareStu` crash khi thiếu header `authorization` (`stringAuth.split` trên undefined).
- `runCheckNewPoint` login UIS hàng loạt mỗi giờ — dễ bị trường chặn IP; không có retry/backoff/rate limit.

## B. Bug chờ "nổ" (correctness)

| Vị trí | Bug |
|---|---|
| `app.js:215` | `printf("Running checks for TKB")` — `printf` không tồn tại → cron throw mỗi đêm |
| `delegation_chief/point_ext.js:71-73, 183-185` | `await selectData(...)[0]` — await cả mảng rồi index **nhưng biến `user` lại là `selectData(...)` không await**; `data.avt` — `data` chưa khai báo → ReferenceError khi `get_all_point`/`get_config` chạy |
| `delegation_chief/point_ext.js:108` | `UPDATE ... AND ? <= ?` — luôn update kể cả `point > pointRule` (logic ngược so với nhánh else) |
| `mylib.js:371` | `for (i <= Math.min(1, len-1))` — chỉ lấy tối đa 2 phần tử ĐẦU của `ds_diem_hocky`; nếu UIS trả mới nhất ở cuối thì lấy sai học kỳ (ngược với `crawlPoint` duyệt từ cuối) |
| `mylib.js:523` | `typeof payloadAccessClient.mssv === undefined` — luôn false (so sánh string với undefined) |
| `stu_inf.js:115` | `array('files', 100)` cho avatar — nhận 100 file, chỉ lưu tên file cuối; đè file cùng tên |
| `delegation_chief/stu_inf.js:59` | Comment/logic ngược: chặn role 6 **và 7** (7 là BCH cao nhất đáng lẽ được phép); chuỗi `'-%${academicYear}%'` LIKE có thể match sai lớp |
| `product.js:131,161` | `hinhanh.split(' ')` duyệt cả phần tử rỗng cuối → link ảnh thừa; chỗ thì `-1` chỗ thì không — không nhất quán |
| `app.js:44` | `prevNhhk = currNhhk.toString()` thay vì `prevNhhk.toString()` → curr và prev giống nhau khi HK≠1 |
| `app.js:79` | `mapTempPoint[key].gpa = gpa` — `mapTempPoint[key]` là number, gán `.gpa` vô nghĩa (không crash nhưng sai ý đồ) |
| `message.js:17` | `WHERE sender=? AND receiver=? OR sender=? AND receiver=?` — thiếu ngoặc nhưng may đúng precedence; vẫn nên viết lại |
| `stu_inf.js:85` | Nối `req.mssv` vào query + `name_searched` → inject |
| `event.js` (stu): | verify token thủ công lần 2 — code thừa, dễ lệch logic |
| `notification.js (stu)` | `seen` select ra nhưng không có API mark-as-read → trạng thái đã đọc không bao giờ đổi |
| `checkTKB` | `startDate` có thể null → `split('/')` crash; cron chạy 0h mỗi đêm mà comment nói khác |
| `getNextDate` | `setMonth(1)` = tháng 2 thay vì tháng 1 khi qua năm (off-by-one); `numDateOfMonth` thiếu tham số year → năm nhuận sai |
| `crawlTotalWeekSchedule` | `currWeek = strTotal.length - 1` dùng độ dài chuỗi thay vì index tuần → sai |

## C. Kiến trúc / chất lượng code

- Không tách lớp: route chứa cả SQL + business + HTTP. Không service/repository layer.
- Không validation DTO; `JSON.parse(req.body)` không try/catch → body xấu crash request (throw trong async → unhandledRejection).
- Error handling: `throw err` trong callback mysql → **crash toàn process** (pool callback không phải async context an toàn); không có error middleware.
- `bodyParser.raw` + `.json()` cùng lúc ở mọi router → body là Buffer → phải `JSON.parse` thủ công (nguồn gốc hàng chục bug tiềm ẩn khi body là object sẵn).
- Trộn `mysql` và `mysql2` (import mysql rồi không dùng).
- `while(true) + setTimeout` thay vì scheduler; `node-cron` chỉ dùng 1 chỗ.
- N+1 query: `get_all_point` (2 query/SV), `runCheckNewPoint` (1 login + nhiều query/SV mỗi giờ).
- Response lệch chuẩn: chỗ có `data`, chỗ không; lỗi nghiệp vụ vẫn HTTP 200.
- Không có test, lint, type; dependency rác (bcrypt, aes256, crypto-js, apn, nodemailer, cheerio, request (deprecated), fs, child_process, qs...) — nhiều lib không dùng.
- Log `console.log` rải rác, có log cả password flow/user object.
- File upload local disk → container restart/deploy mất file nếu không mount volume (docker-compose có mount `./public` nên còn sống, nhưng không backup/multi-instance được).

## D. Điểm tốt (giữ lại)

- Phân tách 2 phân hệ route rõ ràng student/chief.
- Dùng FCM topic condition thay vì quản lý device token — gọn.
- Pool mysql2 + env config (đã refactor một phần từ single connection).
- Docker + Makefile deploy có sẵn, dễ port sang stack mới.
