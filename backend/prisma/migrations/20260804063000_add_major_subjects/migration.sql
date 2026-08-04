-- CreateEnum
CREATE TYPE "SubjectRequirementType" AS ENUM ('MANDATORY', 'ELECTIVE');

-- CreateTable
CREATE TABLE "major_subjects" (
    "id" SERIAL NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "type" "SubjectRequirementType" NOT NULL DEFAULT 'MANDATORY',
    "recommendedSemester" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "major_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "major_subjects_departmentId_subjectId_key" ON "major_subjects"("departmentId", "subjectId");

-- AddForeignKey
ALTER TABLE "major_subjects" ADD CONSTRAINT "major_subjects_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "major_subjects" ADD CONSTRAINT "major_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
