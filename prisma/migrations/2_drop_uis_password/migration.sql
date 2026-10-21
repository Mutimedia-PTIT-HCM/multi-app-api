-- Bỏ lưu mật khẩu UIS: chỉ giữ OAuth refresh_token (xem 1_uis_tokens).
ALTER TABLE `students`
  DROP COLUMN `uisPassword`;
