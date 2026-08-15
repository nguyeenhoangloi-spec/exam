import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { BackupRestoreStatus, BackupRestoreTarget } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PRODUCTION_MAINTENANCE_ADVISORY_KEY, PRODUCTION_MAINTENANCE_LOCK_PREFIX } from '../../backups/backup.service';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<any>();
    if (request.method === 'OPTIONS' || String(request.originalUrl || request.url || '').startsWith('/auth/')) return true;
    if (request.user?.role === 'ADMIN') return true;

    try {
      const advisoryLock = await this.prisma.$queryRaw<{ locked: boolean }[]>`
        SELECT EXISTS (
          SELECT 1
          FROM pg_locks
          WHERE locktype = 'advisory'
            AND granted = true
            AND classid = 0
            AND objid = ${PRODUCTION_MAINTENANCE_ADVISORY_KEY}
        ) AS locked
      `;
      const lock = await this.prisma.backupRestoreRequest.findFirst({
        where: {
          target: BackupRestoreTarget.PRODUCTION,
          OR: [
            { status: BackupRestoreStatus.RUNNING },
            { status: BackupRestoreStatus.FAILED, errorMessage: { startsWith: PRODUCTION_MAINTENANCE_LOCK_PREFIX } },
          ],
        },
        select: { id: true },
      });
      if (!advisoryLock[0]?.locked && !lock) return true;
    } catch {
      throw new ServiceUnavailableException('Không thể xác minh trạng thái bảo trì của hệ thống.');
    }

    throw new ServiceUnavailableException('Hệ thống đang ở chế độ bảo trì để khôi phục dữ liệu. Vui lòng thử lại sau.');
  }
}
