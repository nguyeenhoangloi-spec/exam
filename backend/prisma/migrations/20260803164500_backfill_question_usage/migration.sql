INSERT INTO "question_statistics" (
    "id",
    "questionId",
    "usedCount",
    "totalAnswers",
    "correctAnswers",
    "lastUsedAt",
    "updatedAt"
)
SELECT
    gen_random_uuid(),
    usage."questionId",
    usage."usedCount",
    0,
    0,
    usage."lastUsedAt",
    CURRENT_TIMESTAMP
FROM (
    SELECT
        "questionId",
        COUNT(*)::integer AS "usedCount",
        MAX("usedAt") AS "lastUsedAt"
    FROM "exam_paper_questions"
    GROUP BY "questionId"
) usage
ON CONFLICT ("questionId") DO UPDATE
SET
    "usedCount" = GREATEST("question_statistics"."usedCount", EXCLUDED."usedCount"),
    "lastUsedAt" = CASE
        WHEN "question_statistics"."lastUsedAt" IS NULL THEN EXCLUDED."lastUsedAt"
        ELSE GREATEST("question_statistics"."lastUsedAt", EXCLUDED."lastUsedAt")
    END,
    "updatedAt" = CURRENT_TIMESTAMP;
