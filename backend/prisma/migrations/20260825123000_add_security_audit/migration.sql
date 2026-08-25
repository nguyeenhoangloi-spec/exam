CREATE TYPE "SecurityAuditCategory" AS ENUM (
  'AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'DATA_EXPORT',
  'EXAMINATION', 'BACKUP_RECOVERY', 'AI_PROCESSING', 'SYSTEM_SECURITY'
);

CREATE TYPE "SecurityAuditOutcome" AS ENUM ('SUCCESS', 'DENIED', 'FAILURE');

CREATE TABLE "security_audit_events" (
  "id" UUID NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "category" "SecurityAuditCategory" NOT NULL,
  "action" TEXT NOT NULL,
  "outcome" "SecurityAuditOutcome" NOT NULL,
  "actorId" INTEGER,
  "subjectUserId" INTEGER,
  "entityType" TEXT,
  "entityId" TEXT,
  "requestId" TEXT,
  "httpMethod" TEXT,
  "route" TEXT,
  "ipAddress" TEXT,
  "ipHash" TEXT,
  "location" TEXT,
  "userAgentHash" TEXT,
  "metadata" JSONB,
  "previousHash" TEXT,
  "eventHash" TEXT NOT NULL,
  "retentionUntil" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3),
  "legalHold" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "security_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "security_audit_events_eventHash_key" ON "security_audit_events"("eventHash");
CREATE INDEX "security_audit_events_occurredAt_idx" ON "security_audit_events"("occurredAt");
CREATE INDEX "security_audit_events_actorId_occurredAt_idx" ON "security_audit_events"("actorId", "occurredAt");
CREATE INDEX "security_audit_events_category_occurredAt_idx" ON "security_audit_events"("category", "occurredAt");
CREATE INDEX "security_audit_events_action_occurredAt_idx" ON "security_audit_events"("action", "occurredAt");
CREATE INDEX "security_audit_events_outcome_occurredAt_idx" ON "security_audit_events"("outcome", "occurredAt");
CREATE INDEX "security_audit_events_entityType_entityId_idx" ON "security_audit_events"("entityType", "entityId");
CREATE INDEX "security_audit_events_retentionUntil_legalHold_idx" ON "security_audit_events"("retentionUntil", "legalHold");

CREATE TABLE "security_audit_retention_policies" (
  "id" UUID NOT NULL,
  "category" "SecurityAuditCategory" NOT NULL,
  "hotDays" INTEGER NOT NULL DEFAULT 90,
  "retainDays" INTEGER NOT NULL DEFAULT 1825,
  "rawIpDays" INTEGER NOT NULL DEFAULT 90,
  "updatedById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "security_audit_retention_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "security_audit_retention_policies_category_key" ON "security_audit_retention_policies"("category");

CREATE TABLE "security_audit_legal_holds" (
  "id" UUID NOT NULL,
  "eventId" UUID NOT NULL,
  "reason" TEXT NOT NULL,
  "caseReference" TEXT,
  "createdById" INTEGER NOT NULL,
  "releasedAt" TIMESTAMP(3),
  "releasedById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "security_audit_legal_holds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "security_audit_legal_holds_eventId_key" ON "security_audit_legal_holds"("eventId");
CREATE INDEX "security_audit_legal_holds_releasedAt_idx" ON "security_audit_legal_holds"("releasedAt");

ALTER TABLE "security_audit_events"
  ADD CONSTRAINT "security_audit_events_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "security_audit_retention_policies"
  ADD CONSTRAINT "security_audit_retention_policies_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "security_audit_legal_holds"
  ADD CONSTRAINT "security_audit_legal_holds_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "security_audit_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "security_audit_legal_holds"
  ADD CONSTRAINT "security_audit_legal_holds_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
