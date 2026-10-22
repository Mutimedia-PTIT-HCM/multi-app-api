# Security Policy

## Supported Versions

Chỉ nhánh `main` được hỗ trợ. Các bản deploy cũ hơn không nhận security fix —
khuyến nghị luôn chạy commit mới nhất trên `main`.

| Version | Supported |
|---|---|
| `main` (latest) | ✅ |
| Bất kỳ tag/branch cũ nào | ❌ |

## Báo cáo lỗ hổng bảo mật

**KHÔNG** mở public issue cho lỗ hổng bảo mật.

Dùng **GitHub Private Vulnerability Reporting**:
repo → tab **Security** → **Report a vulnerability**. Nếu tính năng chưa bật,
liên hệ trực tiếp maintainer qua kênh riêng của team.

Khi báo cáo, ghi rõ:

- Endpoint/file bị ảnh hưởng và cách reproduce
- Mức độ tác động (lộ dữ liệu, bypass auth, injection...)
- PoC nếu có

Maintainer sẽ phản hồi trong vòng vài ngày làm việc. Xin đừng công khai lỗ hổng
cho tới khi có bản vá.

## Quy tắc bảo mật bắt buộc khi phát triển

- **Secrets**: tuyệt đối không commit `.env`, `service-account.json`, `*.p8`,
  `fcm-config.json`, file trong `secrets/` (đã gitignore). Nếu lỡ commit —
  rotate key ngay, xoá khỏi history chỉ là bước phụ.
- **Dependencies**: sau `pnpm add` phải `pnpm audit` → 0 vulnerabilities.
  Vuln ở transitive dep → `overrides` trong `pnpm-workspace.yaml`. Không thêm
  dep kéo theo vuln không vá được. (Xem `AGENTS.md`.)
- **Auth**: JWT có `scope` (`student`/`chief`/`upload`) — route mới phải gắn
  guard đúng scope; không bỏ guard vì "test cho nhanh".
- **Input**: mọi body/query validate qua `class-validator` DTO; query DB chỉ
  qua Prisma (parameterized) — tuyệt đối không nối chuỗi SQL.
- **Upload**: chỉ qua presigned URL/token có scope `upload`, giới hạn size +
  content-type; không nhận binary trực tiếp vào route nghiệp vụ.
- **Log**: không log password, token, credential — kể cả trong error handler.
