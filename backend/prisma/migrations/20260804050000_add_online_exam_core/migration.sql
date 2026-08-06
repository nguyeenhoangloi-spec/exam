-- The initial PostgreSQL migration predates the online-exam module.  Keep the
-- core online-exam tables in the migration chain so a fresh database can be
-- migrated without relying on `prisma db push`.

DO $$ BEGIN
  CREATE TYPE "ExamMode" AS ENUM ('MOCK','OFFICIAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "AttemptStatus" AS ENUM ('NOT_STARTED','DEVICE_CHECK','READY','IN_PROGRESS','DISCONNECTED','SUBMITTED','AUTO_SUBMITTED','TERMINATED','UNDER_REVIEW','GRADED','INVALIDATED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "EventSeverity" AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "ProctoringEventType" AS ENUM ('TAB_HIDDEN','WINDOW_BLUR','FULLSCREEN_EXIT','COPY_ATTEMPT','PASTE_ATTEMPT','CONTEXT_MENU_ATTEMPT','NETWORK_DISCONNECTED','NETWORK_RECONNECTED','PAGE_RELOAD','MULTIPLE_SESSION','CAMERA_DISABLED','FACE_NOT_FOUND','MULTIPLE_FACES','SUSPICIOUS_DEVICE_CHANGE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "exam_schedules"
  ADD COLUMN IF NOT EXISTS "mode" "ExamMode" NOT NULL DEFAULT 'OFFICIAL';

CREATE TABLE IF NOT EXISTS "online_exam_configs" (
  "id" SERIAL NOT NULL,
  "examScheduleId" INTEGER NOT NULL,
  "examPaperId" INTEGER NOT NULL,
  "mode" "ExamMode" NOT NULL DEFAULT 'OFFICIAL',
  "requireWebcam" BOOLEAN NOT NULL DEFAULT false,
  "requireMic" BOOLEAN NOT NULL DEFAULT false,
  "requireFullscreen" BOOLEAN NOT NULL DEFAULT true,
  "preventTabSwitch" BOOLEAN NOT NULL DEFAULT true,
  "preventCopyPaste" BOOLEAN NOT NULL DEFAULT true,
  "shuffleQuestions" BOOLEAN NOT NULL DEFAULT true,
  "shuffleOptions" BOOLEAN NOT NULL DEFAULT true,
  "maxAllowedViolations" INTEGER NOT NULL DEFAULT 5,
  "showResultImmediately" BOOLEAN NOT NULL DEFAULT false,
  "allowReview" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "online_exam_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "exam_security_policies" (
  "id" SERIAL NOT NULL,
  "onlineExamConfigId" INTEGER NOT NULL,
  "weightTabHidden" INTEGER NOT NULL DEFAULT 10,
  "weightWindowBlur" INTEGER NOT NULL DEFAULT 5,
  "weightExitFull" INTEGER NOT NULL DEFAULT 15,
  "weightCopyPaste" INTEGER NOT NULL DEFAULT 20,
  "weightMultiSession" INTEGER NOT NULL DEFAULT 50,
  "weightFaceMissing" INTEGER NOT NULL DEFAULT 15,
  "weightMultiFace" INTEGER NOT NULL DEFAULT 30,
  "reviewThreshold" INTEGER NOT NULL DEFAULT 40,
  CONSTRAINT "exam_security_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "exam_attempts" (
  "id" TEXT NOT NULL,
  "onlineExamConfigId" INTEGER NOT NULL,
  "studentId" INTEGER NOT NULL,
  "mode" "ExamMode" NOT NULL DEFAULT 'OFFICIAL',
  "attemptNumber" INTEGER NOT NULL DEFAULT 1,
  "attemptToken" TEXT NOT NULL,
  "status" "AttemptStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "startTime" TIMESTAMP(3),
  "endTime" TIMESTAMP(3),
  "expectedEndTime" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "extraMinutes" INTEGER NOT NULL DEFAULT 0,
  "extraTimeReason" TEXT,
  "clientIp" TEXT,
  "userAgent" TEXT,
  "deviceFingerprint" TEXT,
  "totalScore" DOUBLE PRECISION,
  "maxScore" DOUBLE PRECISION,
  "riskScore" INTEGER NOT NULL DEFAULT 0,
  "isFlagged" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "exam_snapshots" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "paperTitle" TEXT NOT NULL,
  "duration" INTEGER NOT NULL,
  "questionCount" INTEGER NOT NULL,
  "snapshotData" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "exam_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "attempt_answers" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "selectedOptionIds" JSONB,
  "textAnswer" TEXT,
  "isFlaggedForReview" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1,
  "clientTimestamp" TIMESTAMP(3) NOT NULL,
  "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attempt_answers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "proctoring_events" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "eventType" "ProctoringEventType" NOT NULL,
  "severity" "EventSeverity" NOT NULL DEFAULT 'LOW',
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "duration" INTEGER,
  "metadata" JSONB,
  "evidenceUrl" TEXT,
  "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
  CONSTRAINT "proctoring_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "device_sessions" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "deviceInfo" TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "device_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "exam_incidents" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "reportedById" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "decision" TEXT NOT NULL DEFAULT 'PENDING',
  "studentAppeal" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "exam_incidents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "online_exam_configs_examScheduleId_key" ON "online_exam_configs"("examScheduleId");
CREATE UNIQUE INDEX IF NOT EXISTS "exam_security_policies_onlineExamConfigId_key" ON "exam_security_policies"("onlineExamConfigId");
CREATE UNIQUE INDEX IF NOT EXISTS "exam_attempts_attemptToken_key" ON "exam_attempts"("attemptToken");
CREATE UNIQUE INDEX IF NOT EXISTS "exam_attempts_onlineExamConfigId_studentId_attemptNumber_key" ON "exam_attempts"("onlineExamConfigId","studentId","attemptNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "exam_snapshots_attemptId_key" ON "exam_snapshots"("attemptId");
CREATE UNIQUE INDEX IF NOT EXISTS "attempt_answers_attemptId_questionId_key" ON "attempt_answers"("attemptId","questionId");
CREATE UNIQUE INDEX IF NOT EXISTS "device_sessions_sessionToken_key" ON "device_sessions"("sessionToken");
CREATE INDEX IF NOT EXISTS "exam_attempts_studentId_status_idx" ON "exam_attempts"("studentId","status");
CREATE INDEX IF NOT EXISTS "attempt_answers_attemptId_idx" ON "attempt_answers"("attemptId");
CREATE INDEX IF NOT EXISTS "proctoring_events_attemptId_occurredAt_idx" ON "proctoring_events"("attemptId","occurredAt");
CREATE INDEX IF NOT EXISTS "exam_incidents_attemptId_idx" ON "exam_incidents"("attemptId");
