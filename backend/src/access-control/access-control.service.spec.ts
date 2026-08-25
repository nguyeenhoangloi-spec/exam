import { BadRequestException } from '@nestjs/common';
import { ACCESS_PERMISSION_CATALOG, AccessControlService } from './access-control.service';

describe('AccessControlService', () => {
  const createService = () => {
    const tx: any = {
      permission: {
        upsert: jest.fn(async ({ where }: any) => ({ id: `id-${where.code}`, code: where.code })),
      },
      rolePermission: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      auditLog: { create: jest.fn() },
    };
    const prisma: any = {
      permission: {
        findMany: jest.fn().mockResolvedValue(ACCESS_PERMISSION_CATALOG.map(({ code }) => ({ code }))),
        findUnique: jest.fn(),
      },
      rolePermission: { upsert: jest.fn(), deleteMany: jest.fn() },
      user: { findUnique: jest.fn() },
      userPermissionOverride: { upsert: jest.fn() },
      userAccessScope: { deleteMany: jest.fn(), findMany: jest.fn() },
      $transaction: jest.fn(async (work: any) => work(tx)),
    };
    const audit: any = { write: jest.fn().mockResolvedValue(undefined) };
    return { prisma, tx, audit, service: new AccessControlService(prisma, audit) };
  };

  it('does not restore role grants for existing permission codes', async () => {
    const { service, tx } = createService();

    await service.ensureCatalog();

    expect(tx.rolePermission.createMany).not.toHaveBeenCalled();
  });

  it('applies default grants only when a permission code is introduced', async () => {
    const { service, prisma, tx } = createService();
    const introduced = ACCESS_PERMISSION_CATALOG[0];
    prisma.permission.findMany.mockResolvedValue(
      ACCESS_PERMISSION_CATALOG.slice(1).map(({ code }) => ({ code })),
    );

    await service.ensureCatalog();

    expect(tx.rolePermission.createMany).toHaveBeenCalledTimes(1);
    expect(tx.rolePermission.createMany).toHaveBeenCalledWith({
      data: introduced.roles.map((role) => ({ role, permissionId: `id-${introduced.code}` })),
      skipDuplicates: true,
    });
  });

  it('prevents denying a core access-control permission to an admin account', async () => {
    const { service, prisma } = createService();
    jest.spyOn(service, 'ensureCatalog').mockResolvedValue(undefined);
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: 'ADMIN', status: 'ACTIVE' });
    prisma.permission.findUnique.mockResolvedValue({
      id: 'permission-1',
      code: 'ACCESS_CONTROL_MANAGE',
      name: 'Quản lý phân quyền',
    });

    await expect(
      service.upsertUserOverride(
        { id: 1 },
        1,
        { permissionCode: 'ACCESS_CONTROL_MANAGE', effect: 'DENY', reason: 'Không còn phụ trách' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows a compatible business permission to be granted to an individual account', async () => {
    const { service, prisma } = createService();
    jest.spyOn(service, 'ensureCatalog').mockResolvedValue(undefined);
    prisma.user.findUnique.mockResolvedValue({ id: 8, role: 'TEACHER', status: 'ACTIVE' });
    prisma.permission.findUnique.mockResolvedValue({
      id: 'permission-1',
      code: 'EXAM_REPORT_VIEW',
      name: 'Xem báo cáo thống kê kỳ thi',
    });
    prisma.userPermissionOverride.upsert.mockResolvedValue({ id: 'override-1' });

    await expect(
      service.upsertUserOverride(
        { id: 1 },
        8,
        { permissionCode: 'EXAM_REPORT_VIEW', effect: 'ALLOW', reason: 'Cấp quyền báo cáo riêng' },
      ),
    ).resolves.toEqual({ id: 'override-1' });
  });

  it('rejects a grant that the target role cannot use at the API layer', async () => {
    const { service, prisma } = createService();
    jest.spyOn(service, 'ensureCatalog').mockResolvedValue(undefined);
    prisma.user.findUnique.mockResolvedValue({ id: 8, role: 'STUDENT', status: 'ACTIVE' });
    prisma.permission.findUnique.mockResolvedValue({
      id: 'permission-1',
      code: 'EXAM_REPORT_VIEW',
      name: 'Xem báo cáo thống kê kỳ thi',
    });

    await expect(
      service.upsertUserOverride(
        { id: 1 },
        8,
        { permissionCode: 'EXAM_REPORT_VIEW', effect: 'ALLOW', reason: 'Cấp quyền báo cáo riêng' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents granting a protected permission to an individual account', async () => {
    const { service, prisma } = createService();
    jest.spyOn(service, 'ensureCatalog').mockResolvedValue(undefined);
    prisma.user.findUnique.mockResolvedValue({ id: 8, role: 'STUDENT', status: 'ACTIVE' });
    prisma.permission.findUnique.mockResolvedValue({
      id: 'permission-1',
      code: 'BACKUP_MANAGE',
      name: 'Quản lý sao lưu',
    });

    await expect(
      service.upsertUserOverride(
        { id: 1 },
        8,
        { permissionCode: 'BACKUP_MANAGE', effect: 'ALLOW', reason: 'Cấp quyền sao lưu riêng' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts custom data scopes only for teacher accounts', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({ id: 8, role: 'STUDENT', status: 'ACTIVE' });

    await expect(
      service.replaceUserScopes(
        { id: 1 },
        8,
        { scopes: [], reason: 'Giới hạn dữ liệu theo nhiệm vụ' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
