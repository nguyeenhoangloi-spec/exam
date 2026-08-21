-- RBAC permission catalog, per-user overrides and ABAC resource scopes.
CREATE TYPE "PermissionOverrideEffect" AS ENUM ('ALLOW', 'DENY');
CREATE TYPE "AccessScopeType" AS ENUM ('DEPARTMENT', 'CLASS', 'SUBJECT');

CREATE TABLE "permissions" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "description" TEXT,
  "sensitive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "role_permissions" (
  "id" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_permission_overrides" (
  "id" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  "permissionId" TEXT NOT NULL,
  "effect" "PermissionOverrideEffect" NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_permission_overrides_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_access_scopes" (
  "id" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  "type" "AccessScopeType" NOT NULL,
  "resourceId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_access_scopes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");
CREATE INDEX "permissions_module_idx" ON "permissions"("module");
CREATE UNIQUE INDEX "role_permissions_role_permissionId_key" ON "role_permissions"("role", "permissionId");
CREATE INDEX "role_permissions_role_idx" ON "role_permissions"("role");
CREATE UNIQUE INDEX "user_permission_overrides_userId_permissionId_key" ON "user_permission_overrides"("userId", "permissionId");
CREATE INDEX "user_permission_overrides_userId_idx" ON "user_permission_overrides"("userId");
CREATE UNIQUE INDEX "user_access_scopes_userId_type_resourceId_key" ON "user_access_scopes"("userId", "type", "resourceId");
CREATE INDEX "user_access_scopes_userId_type_idx" ON "user_access_scopes"("userId", "type");

ALTER TABLE "role_permissions"
  ADD CONSTRAINT "role_permissions_permissionId_fkey"
  FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_permission_overrides"
  ADD CONSTRAINT "user_permission_overrides_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_permission_overrides"
  ADD CONSTRAINT "user_permission_overrides_permissionId_fkey"
  FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_access_scopes"
  ADD CONSTRAINT "user_access_scopes_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
