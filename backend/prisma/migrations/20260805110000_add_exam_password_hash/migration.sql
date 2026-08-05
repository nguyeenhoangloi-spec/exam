-- Migration: add_exam_password_hash
-- Thêm cột lưu mật khẩu thi chính thức (bcrypt hash) do Giảng viên/Admin thiết lập
-- khi phát hành đề thi. Bắt buộc với kỳ thi OFFICIAL; sinh viên phải nhập đúng
-- mật khẩu mới được vào thi.

-- AlterTable: online_exam_configs
ALTER TABLE "online_exam_configs"
  ADD COLUMN "examPasswordHash" TEXT;
