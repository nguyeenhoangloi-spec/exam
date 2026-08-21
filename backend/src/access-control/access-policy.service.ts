import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessControlService } from './access-control.service';

export type AccessContext = {
  departmentId?: number;
  classId?: number;
  subjectId?: number;
};

@Injectable()
export class AccessPolicyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
  ) {}

  async can(actor: { id: number; role: string } | undefined, permissionCode: string, context?: AccessContext) {
    if (!actor?.id || !actor.role) return false;
    await this.accessControl.ensureCatalog();

    const permission = await this.prisma.permission.findUnique({
      where: { code: permissionCode },
      select: { id: true },
    });
    if (!permission) return false;

    const override = await this.prisma.userPermissionOverride.findUnique({
      where: { userId_permissionId: { userId: actor.id, permissionId: permission.id } },
      select: { effect: true },
    });
    if (override?.effect === 'DENY') return false;

    const grantedByRole = await this.prisma.rolePermission.findUnique({
      where: { role_permissionId: { role: actor.role, permissionId: permission.id } },
      select: { id: true },
    });
    if (!grantedByRole && override?.effect !== 'ALLOW') return false;

    if (!context || actor.role === 'ADMIN') return true;
    const requestedScopes = [
      context.departmentId ? { type: 'DEPARTMENT' as const, resourceId: context.departmentId } : null,
      context.classId ? { type: 'CLASS' as const, resourceId: context.classId } : null,
      context.subjectId ? { type: 'SUBJECT' as const, resourceId: context.subjectId } : null,
    ].filter(Boolean) as Array<{ type: 'DEPARTMENT' | 'CLASS' | 'SUBJECT'; resourceId: number }>;

    if (!requestedScopes.length) return true;
    const assignedScopes = await this.prisma.userAccessScope.findMany({
      where: { userId: actor.id },
      select: { type: true, resourceId: true },
    });
    // No custom scope keeps existing module-specific ownership checks unchanged.
    if (!assignedScopes.length) return true;
    return requestedScopes.every((requested) =>
      assignedScopes.some((scope) => scope.type === requested.type && scope.resourceId === requested.resourceId),
    );
  }

  async assertAnyPermission(actor: { id: number; role: string } | undefined, permissions: string[]) {
    for (const permission of permissions) {
      if (await this.can(actor, permission)) return true;
    }
    throw new ForbiddenException('Bạn không có quyền truy cập chức năng này.');
  }
}
