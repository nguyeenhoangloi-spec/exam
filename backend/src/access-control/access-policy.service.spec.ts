import { AccessPolicyService } from './access-policy.service';

describe('AccessPolicyService', () => {
  const createService = () => {
    const prisma: any = {
      permission: { findUnique: jest.fn().mockResolvedValue({ id: 'permission-1' }) },
      userPermissionOverride: { findUnique: jest.fn().mockResolvedValue(null) },
      rolePermission: { findUnique: jest.fn().mockResolvedValue({ id: 'role-permission-1' }) },
      userAccessScope: { findMany: jest.fn().mockResolvedValue([]) },
      subject: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const accessControl: any = {
      ensureCatalog: jest.fn().mockResolvedValue(undefined),
      canUseUserOverride: jest.fn().mockReturnValue(true),
    };
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

  it('does not let an invalid legacy override create an effective permission', async () => {
    const { prisma, accessControl, service } = createService();
    prisma.userPermissionOverride.findUnique.mockResolvedValue({ effect: 'ALLOW' });
    prisma.rolePermission.findUnique.mockResolvedValue(null);
    accessControl.canUseUserOverride.mockReturnValue(false);

    await expect(service.can({ id: 7, role: 'STUDENT' }, 'EXAM_REPORT_VIEW')).resolves.toBe(false);
  });

  it('allows a matching scope and rejects an unrelated scope', async () => {
    const { prisma, service } = createService();
    prisma.userAccessScope.findMany.mockResolvedValue([
      { type: 'DEPARTMENT', resourceId: 4 },
      { type: 'SUBJECT', resourceId: 12 },
    ]);

    await expect(service.can({ id: 7, role: 'TEACHER' }, 'QUESTION_MANAGE', { departmentId: 4, subjectId: 12 })).resolves.toBe(true);
    await expect(service.can({ id: 7, role: 'TEACHER' }, 'QUESTION_MANAGE', { departmentId: 5 })).resolves.toBe(false);
  });

  it('treats department, class and subject scopes as a union', async () => {
    const { prisma, service } = createService();
    prisma.userAccessScope.findMany.mockResolvedValue([{ type: 'DEPARTMENT', resourceId: 4 }]);

    await expect(
      service.can(
        { id: 7, role: 'TEACHER' },
        'QUESTION_MANAGE',
        { departmentId: 4, classId: 20, subjectId: 12 },
      ),
    ).resolves.toBe(true);
  });

  it('returns an explainable decision for frontend and audit tools', async () => {
    const { service } = createService();

    await expect(service.explain({ id: 7, role: 'TEACHER' }, 'ESSAY_GRADE')).resolves.toMatchObject({
      allowed: true,
      permissionSource: 'ROLE',
      scopeSource: 'INHERITED',
    });
  });

  it('keeps admins unrestricted after their permission is granted', async () => {
    const { prisma, service } = createService();
    prisma.userPermissionOverride.findUnique.mockResolvedValue({ effect: 'ALLOW' });

    await expect(service.can({ id: 1, role: 'ADMIN' }, 'ACCESS_CONTROL_MANAGE', { departmentId: 999 })).resolves.toBe(true);
    expect(prisma.userAccessScope.findMany).not.toHaveBeenCalled();
  });

  it('resolves department, class and subject scopes to an allowed subject union', async () => {
    const { prisma, service } = createService();
    prisma.userAccessScope.findMany.mockResolvedValue([
      { type: 'DEPARTMENT', resourceId: 2 },
      { type: 'CLASS', resourceId: 8 },
      { type: 'SUBJECT', resourceId: 21 },
    ]);
    prisma.subject.findMany.mockResolvedValue([{ id: 5 }, { id: 21 }, { id: 34 }]);

    await expect(service.allowedSubjectIds({ id: 7, role: 'TEACHER' })).resolves.toEqual([5, 21, 34]);
    expect(prisma.subject.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { OR: expect.any(Array) },
    }));
  });
});
