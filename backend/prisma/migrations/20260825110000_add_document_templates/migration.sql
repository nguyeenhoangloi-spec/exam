CREATE TYPE "DocumentTemplateDataSource" AS ENUM (
  'EXAM_SCHEDULE_LIST',
  'ROOM_DOOR_LIST',
  'SUPERVISOR_ASSIGNMENT',
  'GRADE_REPORT',
  'STUDENT_DIRECTORY',
  'TEACHER_DIRECTORY',
  'GENERIC_REPORT'
);

CREATE TYPE "DocumentTemplateVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE "document_templates" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "dataSource" "DocumentTemplateDataSource" NOT NULL,
  "description" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdById" INTEGER,
  "updatedById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_template_versions" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "DocumentTemplateVersionStatus" NOT NULL DEFAULT 'DRAFT',
  "config" JSONB NOT NULL,
  "createdById" INTEGER,
  "publishedById" INTEGER,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "document_template_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "document_templates_code_key" ON "document_templates"("code");
CREATE INDEX "document_templates_dataSource_idx" ON "document_templates"("dataSource");
CREATE UNIQUE INDEX "document_template_versions_templateId_version_key" ON "document_template_versions"("templateId", "version");
CREATE INDEX "document_template_versions_templateId_status_idx" ON "document_template_versions"("templateId", "status");

ALTER TABLE "document_template_versions"
  ADD CONSTRAINT "document_template_versions_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "document_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
