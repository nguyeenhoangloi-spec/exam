CREATE TYPE "ExamPaperStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

ALTER TABLE "exam_papers"
ADD COLUMN "status" "ExamPaperStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "exam_papers_examScheduleId_paperCode_key"
ON "exam_papers"("examScheduleId", "paperCode");

CREATE INDEX "exam_papers_status_deletedAt_idx"
ON "exam_papers"("status", "deletedAt");
