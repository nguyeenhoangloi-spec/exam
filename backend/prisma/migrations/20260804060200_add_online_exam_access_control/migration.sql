-- Migration: add_online_exam_access_control
-- Thêm các field kiểm soát truy cập và điều kiện dự thi cho OnlineExamConfig
-- và field xác nhận quy định cho ExamAttempt

-- AlterTable: exam_attempts
ALTER TABLE "exam_attempts" ADD COLUMN "rulesAcceptedAt" TIMESTAMP(3);

-- AlterTable: online_exam_configs
ALTER TABLE "online_exam_configs"
  ADD COLUMN "accessCode"             TEXT,
  ADD COLUMN "ipWhitelist"            JSONB     NOT NULL DEFAULT '[]',
  ADD COLUMN "lateEntryWindowMinutes" INTEGER   NOT NULL DEFAULT 15,
  ADD COLUMN "maxAttempts"            INTEGER   NOT NULL DEFAULT 1,
  ADD COLUMN "requireDeviceBinding"   BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN "requireRulesAcceptance" BOOLEAN   NOT NULL DEFAULT true;
