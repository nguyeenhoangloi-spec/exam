import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

  write(input: AuditInput, client: AuditClient = this.prisma) {
    return client.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId == null ? null : String(input.entityId),
        description: input.description,
        metadata: input.metadata,
      },
    });
  }

  actorName(actor: Pick<User, 'username'> | { username?: string } | null | undefined) {
    return actor?.username || 'Hệ thống';
  }
}
