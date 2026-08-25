-- Teacher availability and auditable supervisor shift-change workflow.
CREATE TYPE "TeacherAvailabilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE');
CREATE TYPE "SupervisorChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE "teacher_duty_availabilities" (
    "id" SERIAL NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" "TeacherAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "teacher_duty_availabilities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supervisor_change_requests" (
    "id" SERIAL NOT NULL,
    "examSupervisorId" INTEGER NOT NULL,
    "requesterTeacherId" INTEGER NOT NULL,
    "replacementTeacherId" INTEGER,
    "reason" TEXT NOT NULL,
    "status" "SupervisorChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedById" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supervisor_change_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "teacher_duty_availabilities_teacherId_examDate_startTime_endTime_key" ON "teacher_duty_availabilities"("teacherId", "examDate", "startTime", "endTime");
CREATE INDEX "teacher_duty_availabilities_teacherId_examDate_idx" ON "teacher_duty_availabilities"("teacherId", "examDate");
CREATE INDEX "supervisor_change_requests_examSupervisorId_status_idx" ON "supervisor_change_requests"("examSupervisorId", "status");
CREATE INDEX "supervisor_change_requests_requesterTeacherId_status_idx" ON "supervisor_change_requests"("requesterTeacherId", "status");

ALTER TABLE "teacher_duty_availabilities" ADD CONSTRAINT "teacher_duty_availabilities_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "supervisor_change_requests" ADD CONSTRAINT "supervisor_change_requests_examSupervisorId_fkey" FOREIGN KEY ("examSupervisorId") REFERENCES "exam_supervisors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "supervisor_change_requests" ADD CONSTRAINT "supervisor_change_requests_requesterTeacherId_fkey" FOREIGN KEY ("requesterTeacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supervisor_change_requests" ADD CONSTRAINT "supervisor_change_requests_replacementTeacherId_fkey" FOREIGN KEY ("replacementTeacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "supervisor_change_requests" ADD CONSTRAINT "supervisor_change_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
