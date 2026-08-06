CREATE TYPE "EssayAnswerGradingStatus" AS ENUM ('NOT_GRADED', 'IN_PROGRESS', 'GRADED');
CREATE TYPE "EssayAttemptGradingStatus" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED', 'UNDER_GRADING', 'WAITING_APPROVAL', 'PUBLISHED');

ALTER TABLE "attempt_answers"
  ADD COLUMN "finalScore" DOUBLE PRECISION,
  ADD COLUMN "gradingStatus" "EssayAnswerGradingStatus" NOT NULL DEFAULT 'NOT_GRADED',
  ADD COLUMN "lastSavedAt" TIMESTAMP(3),
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "teacherComment" TEXT,
  ADD COLUMN "textAnswerRich" JSONB;

ALTER TABLE "exam_attempts"
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "approvedById" INTEGER,
  ADD COLUMN "gradedAt" TIMESTAMP(3),
  ADD COLUMN "gradedById" INTEGER,
  ADD COLUMN "gradingStatus" "EssayAttemptGradingStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
  ADD COLUMN "publishedAt" TIMESTAMP(3);

ALTER TABLE "online_exam_configs"
  ADD COLUMN "allowEssayFileUpload" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "essayEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "maxEssayFileSizeMb" INTEGER NOT NULL DEFAULT 20,
  ADD COLUMN "showEssayResultAfterApproval" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "essay_rubric_criteria" (
  "id" TEXT NOT NULL,
  "questionId" UUID NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "maxScore" DOUBLE PRECISION NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "essay_rubric_criteria_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "essay_grades" (
  "id" TEXT NOT NULL,
  "attemptAnswerId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "comment" TEXT,
  "gradedById" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "essay_grades_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "essay_submission_files" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "answerId" TEXT,
  "url" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "essay_submission_files_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "essay_rubric_criteria_questionId_idx" ON "essay_rubric_criteria"("questionId");
CREATE UNIQUE INDEX "essay_rubric_criteria_questionId_sortOrder_key" ON "essay_rubric_criteria"("questionId", "sortOrder");
CREATE INDEX "essay_grades_gradedById_idx" ON "essay_grades"("gradedById");
CREATE UNIQUE INDEX "essay_grades_attemptAnswerId_criterionId_key" ON "essay_grades"("attemptAnswerId", "criterionId");
CREATE INDEX "essay_submission_files_attemptId_idx" ON "essay_submission_files"("attemptId");
CREATE INDEX "essay_submission_files_answerId_idx" ON "essay_submission_files"("answerId");

ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "essay_rubric_criteria" ADD CONSTRAINT "essay_rubric_criteria_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "essay_grades" ADD CONSTRAINT "essay_grades_attemptAnswerId_fkey" FOREIGN KEY ("attemptAnswerId") REFERENCES "attempt_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "essay_grades" ADD CONSTRAINT "essay_grades_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "essay_rubric_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "essay_grades" ADD CONSTRAINT "essay_grades_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "essay_submission_files" ADD CONSTRAINT "essay_submission_files_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "essay_submission_files" ADD CONSTRAINT "essay_submission_files_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "attempt_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
