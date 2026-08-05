-- Allow questions to be imported without assigning a chapter.
ALTER TABLE "questions" ALTER COLUMN "chapterId" DROP NOT NULL;
