-- Tách duyệt nội bộ khỏi công bố kết quả cho sinh viên.
ALTER TYPE "EssayAttemptGradingStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
