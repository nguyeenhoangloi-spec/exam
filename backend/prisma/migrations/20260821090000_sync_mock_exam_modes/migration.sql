-- Đồng bộ dữ liệu cũ theo nguồn sự thật là exam_schedules.mode.
-- Lượt thi và cấu hình của thi thử phải luôn được đánh dấu MOCK, để không
-- bị các truy vấn kết quả chính thức hoặc luồng hiển thị chính thức nhận nhầm.

UPDATE "online_exam_configs" AS config
SET "mode" = schedule."mode"
FROM "exam_schedules" AS schedule
WHERE schedule."id" = config."examScheduleId"
  AND config."mode" IS DISTINCT FROM schedule."mode";

UPDATE "exam_attempts" AS attempt
SET "mode" = schedule."mode"
FROM "online_exam_configs" AS config
JOIN "exam_schedules" AS schedule ON schedule."id" = config."examScheduleId"
WHERE config."id" = attempt."onlineExamConfigId"
  AND attempt."mode" IS DISTINCT FROM schedule."mode";
