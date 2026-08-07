CREATE TABLE "fill_blank_answers" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "blankIndex" INTEGER NOT NULL,
    "answer" TEXT NOT NULL,
    "normalizedAnswer" TEXT NOT NULL,
    "acceptedAnswers" JSONB,
    "score" DOUBLE PRECISION NOT NULL,
    "caseSensitive" BOOLEAN NOT NULL DEFAULT false,
    "ignoreWhitespace" BOOLEAN NOT NULL DEFAULT true,
    "ignoreVietnameseTone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fill_blank_answers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fill_blank_answers_questionId_blankIndex_key" ON "fill_blank_answers"("questionId", "blankIndex");
CREATE INDEX "fill_blank_answers_questionId_idx" ON "fill_blank_answers"("questionId");

ALTER TABLE "fill_blank_answers"
  ADD CONSTRAINT "fill_blank_answers_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attempt_answers"
  ADD COLUMN "fillBlankAnswers" JSONB,
  ADD COLUMN "fillBlankScore" DOUBLE PRECISION,
  ADD COLUMN "fillBlankResult" JSONB;
