import { SetMetadata } from '@nestjs/common';
import { SecurityAuditCategory } from '@prisma/client';

export const SECURITY_AUDIT_EVENT = 'security_audit_event';

export type SecurityAuditEventOptions = {
  category: SecurityAuditCategory;
  action: string;
  entityType: string;
  /** Route parameter that identifies the accessed entity, normally "id". */
  entityIdParam?: string;
  /** Small, non-sensitive context to make the event easier to investigate. */
  metadata?: Record<string, string | number | boolean | null>;
};

/**
 * Marks an endpoint that returns or creates sensitive data. The audit event is
 * written only after the handler completes successfully; authorization denials
 * continue to be recorded by the guards.
 */
export const SecurityAuditEvent = (options: SecurityAuditEventOptions) =>
  SetMetadata(SECURITY_AUDIT_EVENT, options);
