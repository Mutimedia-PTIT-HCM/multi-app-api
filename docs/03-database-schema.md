# 03. Database schema (MySQL)

Nguồn: `multidb.sql` (dump thật). DB `multidb`, charset `utf8mb4`. Không có FOREIGN KEY, hầu như không có index, nhiều cột `longtext` làm "khoá", ngày giờ lưu `text` dạng `dd/mm/yyyy h:m:s`.

## Bảng

### `sinhvien` – tài khoản/hồ sơ sinh viên (PK: mssv)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `mssv` | varchar(12) PK | Mã SV (N21DCCN..., DCPT/DCTT prefix ở tầng app) |
| `password` | text | `base64(passwordUIS + SALT_PASSWORD)` — **giải mã được** (job crawl cần) |
| `malop` | text | Mã lớp (vd D21CQCN01-N); cũng là FCM topic |
| `token` | text | (không dùng — insert `''`) |
| `hoten` | varchar(300) | |
| `sdt`, `pers_email`, `fb` | text | Liên hệ tự khai |
| `gioitinh` | tinyint | 0=Nam, 1=Nữ |
| `ngaysinh` | text | `dd/mm/yyyy` |
| `avt` | varchar(500) | Tên file trong `/avt`; `''` = dùng default.png |
| `role` | int default 6 | 6 = SV thường; 3,4,7 = có quyền (7 cao nhất); 0 = không có chief token |
| `ctv` | int | Cộng tác viên (chưa thấy dùng) |
| `hide_pers_email`, `hide_fb`, `hide_phone` | int | Flag ẩn thông tin liên hệ |
| `otp` | text | (chưa dùng) |

### `canbo` – danh bạ giảng viên (PK: magv)

`magv, hotengv, ngaysinh, zl (Zalo), sdt, email, hocham, hocvi`. Charset `utf8mb3` (bảng lệch charset với phần còn lại).

### `mentor` – phân công CVHT: `magv, malop` (không PK)

### `config` – cấu hình hệ thống (PK: id, 1 dòng)

`nhhk` = học kỳ hiện tại dạng `YYYYK` (vd `20241`). Job `checkTKB` tự tăng. Charset `latin1`.

### `form_point_ext` – form tiêu chí điểm rèn luyện (PK: id auto)

`stt (float), content, pointRule (điểm tối đa), type, parent` — cấu trúc cây qua `parent`.

### `point_ext` – điểm rèn luyện từng SV (PK: id auto)

`idFormPoint → form_point_ext.id`, `mssv`, `pointSelf` (SV tự chấm), `pointFinal` (BCS duyệt).

### `status_point_ext` – trạng thái mở chấm theo lớp (PK: class)

`class` (char 255, mã lớp), `status` (0 đóng / 1 mở).

### `cert` – minh chứng tự upload: `mssv, title, img` (tên file cách nhau bởi space)

### `chitietsukien` – sự kiện: `masukien (= Date.now()), ten, noidung, thoigian, done, thumb, poster(mssv)`

### `sukien` – check-in sự kiện: `mask (=masukien), mssv, thoigiancheckin, location`

### `thongbao` + `ctthongbao` – thông báo 1-nhiều

- `ctthongbao`: `matb (Date.now()), tieude, noidung, poster, sendat, type ('normal'|'schedule'|...), list_file_name (space-separated)`
- `thongbao`: `matb, mssv (người nhận), seen`

### `anpham` + `donhang` – chợ ấn phẩm

- `anpham`: `maanpham (longtext, =Date.now()), mssv (seller), tenanpham, gia, soluongton, mota, hinhanh (space-separated filenames)`
- `donhang`: `madonhang (Date.now()+i), buyer, maanpham, soluong, time, state (-1 mới / 0 xác nhận / 1 hoàn thành), note`

### `message` – chat 1-1 (PK: message_code)

`message_code (=Date.now()), sender, receiver, content, time, state`

### `pointtmp` – cache GPA cho job notify: `mssv, nhhk, gpa` (2 HK gần nhất/SV)

### `position` – danh mục chức vụ: `id, name` (ít dùng)

## Vấn đề schema (cần xử lý khi refactor — có thể tách phase riêng)

1. **Không FK, không index** ngoài vài PK → join theo `mssv/malop/masukien` full-scan.
2. Kiểu dữ liệu sai: `longtext` làm mã/PK (`anpham.maanpham`, `ctthongbao.matb`), thời gian/mã lớp/mật khẩu đều `text`, `donhang.state` tinyint nullable.
3. Ngày giờ `text dd/mm/yyyy h:m:s` → không sort/filter được đúng, bug múi giờ.
4. `malop` là text, dùng `LIKE '%xx%'` để suy ra khoá (`update_new_class`) — dễ sai.
5. `password` lưu reversible — thiết kế lại: encrypt AES-256-GCM + tách key, hoặc lưu `uis_access_token` refresh được (nếu UIS hỗ trợ).
6. `list_file_name`/`hinhanh`/`img` lưu chuỗi space-separated → chuyển sang bảng con hoặc JSON khi migrate storage R2.
7. Charset lộn xộn: `latin1` (config, status_point_ext), `utf8mb3` (canbo), `utf8mb4`.
8. `config`/`status_point_ext` nên gộp vào bảng settings chuẩn.

> Lộ trình khuyến nghị: **giữ nguyên schema khi sang Prisma** (`prisma db pull`), chỉ thêm index + sửa kiểu trong một phase migration riêng sau khi API đã ổn định — tránh vỡ app trong quá trình chuyển.
