-- Reconcile legacy achievement labels with the current Rubric result enum.

ALTER TYPE "EssayCriterionAchievementLevel" RENAME TO "EssayCriterionAchievementLevel_legacy";

CREATE TYPE "EssayCriterionAchievementLevel" AS ENUM ('FULL', 'PARTIAL', 'NOT_MET', 'NEEDS_REVIEW');

ALTER TABLE "essay_ai_criterion_results"
  ALTER COLUMN "achievementLevel" DROP DEFAULT,
  ALTER COLUMN "achievementLevel" TYPE "EssayCriterionAchievementLevel"
    USING (
      CASE "achievementLevel"::text
        WHEN 'EXCELLENT' THEN 'FULL'
        WHEN 'GOOD' THEN 'PARTIAL'
        WHEN 'SATISFACTORY' THEN 'PARTIAL'
        WHEN 'NEEDS_IMPROVEMENT' THEN 'NEEDS_REVIEW'
        WHEN 'UNSATISFACTORY' THEN 'NOT_MET'
        ELSE "achievementLevel"::text
      END
    )::"EssayCriterionAchievementLevel",
  ALTER COLUMN "achievementLevel" SET DEFAULT 'NEEDS_REVIEW';

DROP TYPE "EssayCriterionAchievementLevel_legacy";
