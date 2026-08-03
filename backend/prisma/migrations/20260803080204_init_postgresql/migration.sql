-- PostgreSQL extensions and sequence used by Question Bank.
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE SEQUENCE IF NOT EXISTS "question_code_seq" START WITH 1 INCREMENT BY 1;

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'ESSAY');

-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "BloomLevel" AS ENUM ('REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QuestionHistoryAction" AS ENUM ('CREATE', 'UPDATE', 'SUBMIT', 'APPROVE', 'REJECT', 'ARCHIVE', 'DUPLICATE', 'RESTORE', 'DELETE', 'BULK_UPDATE');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "studentCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "classId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" SERIAL NOT NULL,
    "teacherCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "departmentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" SERIAL NOT NULL,
    "subjectCode" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" UUID NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_subjects" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "semester" TEXT NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ELIGIBLE',

    CONSTRAINT "student_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_periods" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',

    CONSTRAINT "exam_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_schedules" (
    "id" SERIAL NOT NULL,
    "examPeriodId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "examType" TEXT NOT NULL DEFAULT 'TRAC_NGHIEM',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "note" TEXT,

    CONSTRAINT "exam_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_rooms" (
    "id" SERIAL NOT NULL,
    "roomCode" TEXT NOT NULL,
    "roomName" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "roomType" TEXT NOT NULL DEFAULT 'THI_LY_THUYET',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "exam_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_schedule_rooms" (
    "id" SERIAL NOT NULL,
    "examScheduleId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,

    CONSTRAINT "exam_schedule_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_room_students" (
    "id" SERIAL NOT NULL,
    "examScheduleRoomId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "examNumber" TEXT NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',

    CONSTRAINT "exam_room_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_supervisors" (
    "id" SERIAL NOT NULL,
    "examScheduleRoomId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SUPERVISOR_1',
    "note" TEXT,

    CONSTRAINT "exam_supervisors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "chapterId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "normalizedContent" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "bloomLevel" "BloomLevel" NOT NULL DEFAULT 'UNDERSTAND',
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "explanation" TEXT,
    "keywords" TEXT,
    "status" "QuestionStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdById" INTEGER NOT NULL,
    "approvedById" INTEGER,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- Accelerate similarity checks on normalized question content.
CREATE INDEX "questions_normalizedContent_trgm_idx"
ON "questions" USING GIN ("normalizedContent" gin_trgm_ops);

-- CreateTable
CREATE TABLE "question_histories" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "action" "QuestionHistoryAction" NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedById" INTEGER NOT NULL,

    CONSTRAINT "question_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_statistics" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "totalAnswers" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_papers" (
    "id" SERIAL NOT NULL,
    "examScheduleId" INTEGER NOT NULL,
    "paperCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "exam_papers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_paper_questions" (
    "id" SERIAL NOT NULL,
    "examPaperId" INTEGER NOT NULL,
    "questionId" UUID NOT NULL,
    "questionOrder" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_paper_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "classes_code_key" ON "classes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "students_studentCode_key" ON "students"("studentCode");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_teacherCode_key" ON "teachers"("teacherCode");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_userId_key" ON "teachers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_subjectCode_key" ON "subjects"("subjectCode");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_subjectId_code_key" ON "chapters"("subjectId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_subjectId_order_key" ON "chapters"("subjectId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "exam_rooms_roomCode_key" ON "exam_rooms"("roomCode");

-- CreateIndex
CREATE UNIQUE INDEX "questions_code_key" ON "questions"("code");

-- CreateIndex
CREATE INDEX "questions_subjectId_chapterId_status_idx" ON "questions"("subjectId", "chapterId", "status");

-- CreateIndex
CREATE INDEX "questions_createdById_createdAt_idx" ON "questions"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "question_histories_questionId_createdAt_idx" ON "question_histories"("questionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "question_options_questionId_order_key" ON "question_options"("questionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "question_statistics_questionId_key" ON "question_statistics"("questionId");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_subjects" ADD CONSTRAINT "student_subjects_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_subjects" ADD CONSTRAINT "student_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_examPeriodId_fkey" FOREIGN KEY ("examPeriodId") REFERENCES "exam_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedule_rooms" ADD CONSTRAINT "exam_schedule_rooms_examScheduleId_fkey" FOREIGN KEY ("examScheduleId") REFERENCES "exam_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedule_rooms" ADD CONSTRAINT "exam_schedule_rooms_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "exam_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_room_students" ADD CONSTRAINT "exam_room_students_examScheduleRoomId_fkey" FOREIGN KEY ("examScheduleRoomId") REFERENCES "exam_schedule_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_room_students" ADD CONSTRAINT "exam_room_students_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_supervisors" ADD CONSTRAINT "exam_supervisors_examScheduleRoomId_fkey" FOREIGN KEY ("examScheduleRoomId") REFERENCES "exam_schedule_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_supervisors" ADD CONSTRAINT "exam_supervisors_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_histories" ADD CONSTRAINT "question_histories_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_histories" ADD CONSTRAINT "question_histories_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_statistics" ADD CONSTRAINT "question_statistics_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_papers" ADD CONSTRAINT "exam_papers_examScheduleId_fkey" FOREIGN KEY ("examScheduleId") REFERENCES "exam_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_papers" ADD CONSTRAINT "exam_papers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_paper_questions" ADD CONSTRAINT "exam_paper_questions_examPaperId_fkey" FOREIGN KEY ("examPaperId") REFERENCES "exam_papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_paper_questions" ADD CONSTRAINT "exam_paper_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
