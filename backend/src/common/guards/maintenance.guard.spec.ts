import { ServiceUnavailableException } from '@nestjs/common';
import { MaintenanceGuard } from './maintenance.guard';

const context = (request: any) => ({
  switchToHttp: () => ({ getRequest: () => request }),
}) as any;

describe('MaintenanceGuard', () => {
  it('cho phép Admin truy cập trong maintenance', async () => {
    const prisma = { $queryRaw: jest.fn(), backupRestoreRequest: { findFirst: jest.fn() } };
    const guard = new MaintenanceGuard(prisma as any);

    await expect(guard.canActivate(context({ method: 'GET', originalUrl: '/backups/overview', user: { role: 'ADMIN' } }))).resolves.toBe(true);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('chặn người dùng thường khi advisory maintenance lock đang giữ', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ locked: true }]),
      backupRestoreRequest: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const guard = new MaintenanceGuard(prisma as any);

    await expect(guard.canActivate(context({ method: 'GET', originalUrl: '/dashboard', user: { role: 'STUDENT' } })))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('cho phép người dùng khi không có maintenance lock', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ locked: false }]),
      backupRestoreRequest: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const guard = new MaintenanceGuard(prisma as any);

    await expect(guard.canActivate(context({ method: 'GET', originalUrl: '/dashboard', user: { role: 'STUDENT' } }))).resolves.toBe(true);
  });
});
