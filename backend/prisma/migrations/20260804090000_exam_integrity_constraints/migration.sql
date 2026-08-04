-- This migration is intentionally not applied automatically. The existing database
-- was checked for duplicates before these constraints were added.
CREATE UNIQUE INDEX "student_subjects_studentId_subjectId_semester_schoolYear_key"
ON "student_subjects"("studentId", "subjectId", "semester", "schoolYear");

CREATE UNIQUE INDEX "exam_schedule_rooms_examScheduleId_roomId_key"
ON "exam_schedule_rooms"("examScheduleId", "roomId");

CREATE UNIQUE INDEX "exam_room_students_examScheduleRoomId_studentId_key"
ON "exam_room_students"("examScheduleRoomId", "studentId");

CREATE UNIQUE INDEX "exam_room_students_examScheduleRoomId_seatNumber_key"
ON "exam_room_students"("examScheduleRoomId", "seatNumber");

CREATE UNIQUE INDEX "exam_supervisors_examScheduleRoomId_teacherId_key"
ON "exam_supervisors"("examScheduleRoomId", "teacherId");

CREATE UNIQUE INDEX "exam_supervisors_examScheduleRoomId_role_key"
ON "exam_supervisors"("examScheduleRoomId", "role");

CREATE UNIQUE INDEX "exam_paper_questions_examPaperId_questionId_key"
ON "exam_paper_questions"("examPaperId", "questionId");

CREATE UNIQUE INDEX "exam_paper_questions_examPaperId_questionOrder_key"
ON "exam_paper_questions"("examPaperId", "questionOrder");
