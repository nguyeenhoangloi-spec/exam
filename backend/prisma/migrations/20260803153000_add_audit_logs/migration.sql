CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" INTEGER,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "audit_logs" (
    "id",
    "actorId",
    "action",
    "entityType",
    "entityId",
    "description",
    "metadata",
    "createdAt"
)
SELECT
    gen_random_uuid(),
    history."changedById",
    history."action"::text,
    'QUESTION',
    history."questionId",
    CASE history."action"::text
        WHEN 'CREATE' THEN actor.username || ' đã tạo câu hỏi ' || question.code
        WHEN 'UPDATE' THEN actor.username || ' đã cập nhật câu hỏi ' || question.code
        WHEN 'SUBMIT' THEN actor.username || ' đã gửi duyệt câu hỏi ' || question.code
        WHEN 'APPROVE' THEN actor.username || ' đã duyệt câu hỏi ' || question.code
        WHEN 'REJECT' THEN actor.username || ' đã từ chối câu hỏi ' || question.code
        WHEN 'ARCHIVE' THEN actor.username || ' đã lưu trữ câu hỏi ' || question.code
        WHEN 'DUPLICATE' THEN actor.username || ' đã nhân bản câu hỏi ' || question.code
        WHEN 'RESTORE' THEN actor.username || ' đã khôi phục câu hỏi ' || question.code
        WHEN 'DELETE' THEN actor.username || ' đã xóa câu hỏi ' || question.code
        ELSE actor.username || ' đã thao tác với câu hỏi ' || question.code
    END,
    jsonb_build_object('questionCode', question.code, 'note', history.note),
    history."createdAt"
FROM "question_histories" history
JOIN "questions" question ON question.id = history."questionId"
JOIN "users" actor ON actor.id = history."changedById"
WHERE NOT EXISTS (
    SELECT 1
    FROM "audit_logs" existing
    WHERE existing."entityType" = 'QUESTION'
      AND existing."entityId" = history."questionId"::text
      AND existing."action" = history."action"::text
      AND existing."createdAt" = history."createdAt"
);
