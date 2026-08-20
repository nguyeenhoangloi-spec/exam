-- Reconcile the enum values created by the earlier essay grading schema.
-- Existing legacy values are preserved through an explicit mapping.

ALTER TYPE "EssayAiGradingStatus" RENAME TO "EssayAiGradingStatus_legacy";

CREATE TYPE "EssayAiGradingStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

ALTER TABLE "essay_ai_grading_runs"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "EssayAiGradingStatus"
    USING (
      CASE "status"::text
        WHEN 'PROCESSING' THEN 'RUNNING'
        WHEN 'COMPLETED' THEN 'SUCCEEDED'
        ELSE "status"::text
      END
    )::"EssayAiGradingStatus",
  ALTER COLUMN "status" SET DEFAULT 'QUEUED';

DROP TYPE "EssayAiGradingStatus_legacy";
