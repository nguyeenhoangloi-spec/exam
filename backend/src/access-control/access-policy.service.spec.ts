import { AccessPolicyService } from './access-policy.service';

describe('AccessPolicyService', () => {
  const createService = () => {
    const prisma: any = {
      permission: { findUnique: jest.fn().mockResolvedValue({ id: 'permission-1' }) },
      userPermissionOverride: { findUnique: jest.fn().mockResolvedValue(null) },
      rolePermission: { findUnique: jest.fn().mockResolvedValue({ id: 'role-permission-1' }) },
      userAccessScope: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const accessControl: any = { ensureCatalog: jest.fn().mockResolvedValue(undefined) };
    return { prisma, accessControl, service: new AccessPolicyService(prisma, accessControl) };
  };

  it('gives a per-user deny priority over role permission', async () => {
    const { prisma, service } = createService();
    prisma.userPermissionOverride.findUnique.mockResolvedValue({ effect: 'DENY' });

    await expect(service.can({ id: 7, role: 'TEACHER' }, 'ESSAY_GRADE')).resolves.toBe(false);
    expect(prisma.rolePermission.findUnique).not.toHaveBeenCalled();
  });

  it('allows a permission granted by the current role', async () => {
    const { service } = createService();

    await expect(service.can({ id: 7, role: 'TEACHER' }, 'ESSAY_GRADE')).resolves.toBe(true);
  });

  it('requires every requested ABAC scope when custom scopes exist', async () => {
    const { prisma, service } = createService();
    prisma.userAccessScope.findMany.mockResolvedValue([
      { type: 'DEPARTMENT', resourceId: 4 },
      { type: 'SUBJECT', resourceId: 12 },
    ]);

    await expect(service.can({ id: 7, role: 'TEACHER' }, 'QUESTION_MANAGE', { departmentId: 4, subjectId: 12 })).resolves.toBe(true);
    await expect(service.can({ id: 7, role: 'TEACHER' }, 'QUESTION_MANAGE', { departmentId: 5 })).resolves.toBe(false);
  });

  it('keeps admins unrestricted after their permission is granted', async () => {
    const { prisma, service } = createService();
    prisma.userPermissionOverride.findUnique.mockResolvedValue({ effect: 'ALLOW' });

    await expect(service.can({ id: 1, role: 'ADMIN' }, 'ACCESS_CONTROL_MANAGE', { departmentId: 999 })).resolves.toBe(true);
    expect(prisma.userAccessScope.findMany).not.toHaveBeenCalled();
  });
});
