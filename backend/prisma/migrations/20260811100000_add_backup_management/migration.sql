CREATE TYPE "BackupJobType" AS ENUM ('FULL', 'DATABASE', 'UPLOADS', 'SAFETY');
CREATE TYPE "BackupJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'VERIFYING', 'SUCCEEDED', 'FAILED', 'VERIFY_FAILED', 'CANCELLED');
CREATE TYPE "BackupRestoreTarget" AS ENUM ('STAGING', 'PRODUCTION');
CREATE TYPE "BackupRestoreStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'EXPIRED');

CREATE TABLE "backup_jobs" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "type" "BackupJobType" NOT NULL DEFAULT 'FULL',
    "status" "BackupJobStatus" NOT NULL DEFAULT 'QUEUED',
    "storageKey" TEXT,
    "manifestKey" TEXT,
    "checksum" TEXT,
    "sizeBytes" BIGINT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "appCommit" TEXT,
    "migration" TEXT,
    "errorMessage" TEXT,
    "initiatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "backup_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "backup_jobs_snapshotId_key" ON "backup_jobs"("snapshotId");
CREATE INDEX "backup_jobs_status_createdAt_idx" ON "backup_jobs"("status", "createdAt");
CREATE INDEX "backup_jobs_completedAt_idx" ON "backup_jobs"("completedAt");

CREATE TABLE "backup_restore_requests" (
    "id" TEXT NOT NULL,
    "backupJobId" TEXT NOT NULL,
    "target" "BackupRestoreTarget" NOT NULL,
    "status" "BackupRestoreStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "reason" TEXT NOT NULL,
    "confirmationHash" TEXT,
    "requestedById" INTEGER NOT NULL,
    "approvedById" INTEGER,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "backup_restore_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "backup_restore_requests_status_createdAt_idx" ON "backup_restore_requests"("status", "createdAt");
CREATE INDEX "backup_restore_requests_backupJobId_idx" ON "backup_restore_requests"("backupJobId");

ALTER TABLE "backup_jobs" ADD CONSTRAINT "backup_jobs_initiatedById_fkey"
  FOREIGN KEY ("initiatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "backup_restore_requests" ADD CONSTRAINT "backup_restore_requests_backupJobId_fkey"
  FOREIGN KEY ("backupJobId") REFERENCES "backup_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "backup_restore_requests" ADD CONSTRAINT "backup_restore_requests_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "backup_restore_requests" ADD CONSTRAINT "backup_restore_requests_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
