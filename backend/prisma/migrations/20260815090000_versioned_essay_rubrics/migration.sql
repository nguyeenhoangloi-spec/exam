-- Preserve existing grading evidence before introducing richer, versioned rubrics.
CREATE TYPE "EssayAiGradingStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');
CREATE TYPE "EssayCriterionAchievementLevel" AS ENUM ('FULL', 'PARTIAL', 'NOT_MET', 'NEEDS_REVIEW');

CREATE TABLE "essay_rubric_versions" (
  "id" TEXT NOT NULL,
  "questionId" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "referenceAnswer" TEXT,
  "gradingGuidance" TEXT,
  "totalScore" DOUBLE PRECISION NOT NULL,
  "isLocked" BOOLEAN NOT NULL DEFAULT false,
  "createdById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "essay_rubric_versions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "essay_rubric_criteria"
  ADD COLUMN "fullCreditGuide" TEXT,
  ADD COLUMN "partialCreditGuide" TEXT,
  ADD COLUMN "zeroCreditGuide" TEXT,
  ADD COLUMN "acceptedConcepts" TEXT,
  ADD COLUMN "commonMistakes" TEXT,
  ADD COLUMN "scoreStep" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
  ADD COLUMN "rubricVersionId" TEXT;

-- Every existing set of criteria becomes immutable version 1.  The deterministic id
-- makes this migration repeatable on restored development copies.
INSERT INTO "essay_rubric_versions" ("id", "questionId", "version", "referenceAnswer", "totalScore", "isLocked")
SELECT
  md5("q"."id"::text || ':essay-rubric-v1'),
  "q"."id",
  1,
  "q"."explanation",
  COALESCE(SUM("c"."maxScore"), "q"."score"),
  EXISTS (
    SELECT 1 FROM "essay_grades" "g"
    INNER JOIN "essay_rubric_criteria" "gc" ON "gc"."id" = "g"."criterionId"
    WHERE "gc"."questionId" = "q"."id"
  )
FROM "questions" "q"
INNER JOIN "essay_rubric_criteria" "c" ON "c"."questionId" = "q"."id"
GROUP BY "q"."id", "q"."explanation", "q"."score";

UPDATE "essay_rubric_criteria" "c"
SET "rubricVersionId" = md5("c"."questionId"::text || ':essay-rubric-v1')
WHERE "rubricVersionId" IS NULL;

ALTER TABLE "attempt_answers" ADD COLUMN "rubricVersionId" TEXT;

UPDATE "attempt_answers" "a"
SET "rubricVersionId" = "c"."rubricVersionId"
FROM "essay_grades" "g"
INNER JOIN "essay_rubric_criteria" "c" ON "c"."id" = "g"."criterionId"
WHERE "g"."attemptAnswerId" = "a"."id" AND "a"."rubricVersionId" IS NULL;

CREATE TABLE "essay_ai_grading_runs" (
  "id" TEXT NOT NULL,
  "attemptAnswerId" TEXT NOT NULL,
  "rubricVersionId" TEXT,
  "status" "EssayAiGradingStatus" NOT NULL DEFAULT 'QUEUED',
  "provider" TEXT,
  "model" TEXT,
  "suggestedScore" DOUBLE PRECISION,
  "overallComment" TEXT,
  "confidence" DOUBLE PRECISION,
  "warning" TEXT,
  "errorMessage" TEXT,
  "requestedById" INTEGER NOT NULL,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "essay_ai_grading_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "essay_ai_criterion_results" (
  "id" TEXT NOT NULL,
  "aiGradingRunId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "suggestedScore" DOUBLE PRECISION NOT NULL,
  "achievementLevel" "EssayCriterionAchievementLevel" NOT NULL DEFAULT 'NEEDS_REVIEW',
  "comment" TEXT,
  "evidenceQuote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "essay_ai_criterion_results_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "essay_rubric_versions_questionId_version_key" ON "essay_rubric_versions"("questionId", "version");
CREATE INDEX "essay_rubric_versions_questionId_createdAt_idx" ON "essay_rubric_versions"("questionId", "createdAt");
CREATE INDEX "essay_ai_grading_runs_attemptAnswerId_createdAt_idx" ON "essay_ai_grading_runs"("attemptAnswerId", "createdAt");
CREATE INDEX "essay_ai_grading_runs_status_createdAt_idx" ON "essay_ai_grading_runs"("status", "createdAt");
CREATE UNIQUE INDEX "essay_ai_criterion_results_aiGradingRunId_criterionId_key" ON "essay_ai_criterion_results"("aiGradingRunId", "criterionId");
CREATE INDEX "essay_ai_criterion_results_criterionId_idx" ON "essay_ai_criterion_results"("criterionId");

ALTER TABLE "essay_rubric_criteria" ADD CONSTRAINT "essay_rubric_criteria_rubricVersionId_fkey" FOREIGN KEY ("rubricVersionId") REFERENCES "essay_rubric_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_rubricVersionId_fkey" FOREIGN KEY ("rubricVersionId") REFERENCES "essay_rubric_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "essay_rubric_versions" ADD CONSTRAINT "essay_rubric_versions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "essay_ai_grading_runs" ADD CONSTRAINT "essay_ai_grading_runs_attemptAnswerId_fkey" FOREIGN KEY ("attemptAnswerId") REFERENCES "attempt_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "essay_ai_grading_runs" ADD CONSTRAINT "essay_ai_grading_runs_rubricVersionId_fkey" FOREIGN KEY ("rubricVersionId") REFERENCES "essay_rubric_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "essay_ai_criterion_results" ADD CONSTRAINT "essay_ai_criterion_results_aiGradingRunId_fkey" FOREIGN KEY ("aiGradingRunId") REFERENCES "essay_ai_grading_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "essay_ai_criterion_results" ADD CONSTRAINT "essay_ai_criterion_results_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "essay_rubric_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
