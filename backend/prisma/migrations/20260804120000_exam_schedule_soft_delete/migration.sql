-- Soft-delete exam schedules so ADMIN can recover schedules without losing related data.
ALTER TABLE "exam_schedules"
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "deletedById" INTEGER;

CREATE INDEX "exam_schedules_deletedAt_idx" ON "exam_schedules"("deletedAt");

ALTER TABLE "exam_schedules"
  ADD CONSTRAINT "exam_schedules_deletedById_fkey"
  FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
