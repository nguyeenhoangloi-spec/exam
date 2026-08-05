-- Additive migration for rich question content and externally stored media metadata.
ALTER TABLE "questions" ADD COLUMN "contentRich" JSONB;
ALTER TABLE "question_options" ADD COLUMN "contentRich" JSONB;

CREATE TABLE "question_media" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "optionId" UUID,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "question_media_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "question_media_questionId_sortOrder_idx" ON "question_media"("questionId", "sortOrder");
CREATE INDEX "question_media_optionId_idx" ON "question_media"("optionId");

ALTER TABLE "question_media" ADD CONSTRAINT "question_media_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_media" ADD CONSTRAINT "question_media_optionId_fkey"
  FOREIGN KEY ("optionId") REFERENCES "question_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
