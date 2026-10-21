-- Thêm cột lưu UIS OAuth tokens (refresh-token flow)
ALTER TABLE `students`
  ADD COLUMN `uisRefreshToken` TEXT NULL,
  ADD COLUMN `uisAccessToken` TEXT NULL,
  ADD COLUMN `uisTokenExpiresAt` DATETIME(3) NULL;
