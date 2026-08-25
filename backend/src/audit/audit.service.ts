import { Injectable, Optional } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityAuditService } from '../security-audit/security-audit.service';

export type AuditInput = {
  actorId?: number | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  description: string;
  metadata?: Prisma.InputJsonValue;
};

type AuditClient = Pick<PrismaService, 'auditLog'> | Prisma.TransactionClient;

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly securityAudit?: SecurityAuditService,
  ) {}

  private categoryFor(input: AuditInput) {
    const action = input.action.toUpperCase();
    if (action.includes('BACKUP') || action.includes('RESTORE')) return 'BACKUP_RECOVERY' as const;
    if (action.includes('ACCESS_') || input.entityType === 'ACCESS_CONTROL') return 'AUTHORIZATION' as const;
    if (action.includes('AI_')) return 'AI_PROCESSING' as const;
    if (/EXPORT|DOWNLOAD|RENDER|PRINT/.test(`${action}:${input.entityType}`)) return 'DATA_EXPORT' as const;
    if (/ESSAY|GRADE|EXAM|QUESTION|PAPER|PROCTOR|ATTEMPT/.test(`${action}:${input.entityType}`)) return 'EXAMINATION' as const;
    return 'SYSTEM_SECURITY' as const;
  }

  async write(input: AuditInput, client: AuditClient = this.prisma) {
    const created = await client.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId == null ? null : String(input.entityId),
        description: input.description,
        metadata: input.metadata,
      },
    });
    // The readable activity log remains unchanged. High-value business actions
    // are mirrored as sanitized security events when the dedicated module is enabled.
    if (this.securityAudit) {
      await this.securityAudit.write({
        category: this.categoryFor(input), action: input.action, outcome: 'SUCCESS', actor: input.actorId ? { id: input.actorId } : undefined,
        entityType: input.entityType, entityId: input.entityId, metadata: input.metadata,
      });
    }
    return created;
  }

  actorName(actor: Pick<User, 'username'> | { username?: string } | null | undefined) {
    return actor?.username || 'Hệ thống';
  }
}
