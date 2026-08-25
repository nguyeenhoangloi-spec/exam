import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessControlService } from './access-control.service';
import { SystemRole } from './dto/access-control.dto';

export type AccessContext = {
  departmentId?: number;
  classId?: number;
  subjectId?: number;
};

export type AccessDecision = {
  allowed: boolean;
  permissionCode: string;
  permissionSource: 'ROLE' | 'USER_ALLOW' | 'USER_DENY' | 'NONE';
  scopeSource: 'ADMIN' | 'INHERITED' | 'CUSTOM_MATCH' | 'CUSTOM_MISMATCH' | 'NOT_EVALUATED';
  reason: string;
};

@Injectable()
export class AccessPolicyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
  ) {}

  /** Resolve custom department/class/subject scopes to their covered subjects. */
  async allowedSubjectIds(actor: { id: number; role?: string }): Promise<number[] | null> {
    if (actor.role !== 'TEACHER') return null;
    const scopes = await this.prisma.userAccessScope.findMany({
      where: { userId: actor.id },
      select: { type: true, resourceId: true },
    });
    if (!scopes.length) return null;

    const departmentIds = scopes.filter((scope) => scope.type === 'DEPARTMENT').map((scope) => scope.resourceId);
    const classIds = scopes.filter((scope) => scope.type === 'CLASS').map((scope) => scope.resourceId);
    const subjectIds = scopes.filter((scope) => scope.type === 'SUBJECT').map((scope) => scope.resourceId);
    const subjects = await this.prisma.subject.findMany({
      where: {
        OR: [
          ...(departmentIds.length ? [{ departmentId: { in: departmentIds } }] : []),
          ...(subjectIds.length ? [{ id: { in: subjectIds } }] : []),
          ...(classIds.length ? [{ studentSubjects: { some: { student: { classId: { in: classIds } } } } }] : []),
        ],
      },
      select: { id: true },
    });
    return subjects.map((subject) => subject.id);
  }

  async assertSubjectScope(actor: { id: number; role?: string }, subjectId: number) {
    const allowedIds = await this.allowedSubjectIds(actor);
    if (allowedIds !== null && !allowedIds.includes(subjectId)) {
      throw new ForbiddenException('Môn học nằm ngoài phạm vi dữ liệu được phân công cho tài khoản này.');
    }
  }

  async can(actor: { id: number; role: string } | undefined, permissionCode: string, context?: AccessContext) {
    return (await this.explain(actor, permissionCode, context)).allowed;
  }

  async explain(
    actor: { id: number; role: string } | undefined,
    permissionCode: string,
    context?: AccessContext,
  ): Promise<AccessDecision> {
    if (!actor?.id || !actor.role) {
      return this.decision(false, permissionCode, 'NONE', 'NOT_EVALUATED', 'Chưa xác định được tài khoản thực hiện.');
    }
    await this.accessControl.ensureCatalog();

    const permission = await this.prisma.permission.findUnique({
      where: { code: permissionCode },
      select: { id: true },
    });
    if (!permission) {
      return this.decision(false, permissionCode, 'NONE', 'NOT_EVALUATED', 'Quyền không tồn tại trong danh mục hệ thống.');
    }

    const storedOverride = await this.prisma.userPermissionOverride.findUnique({
      where: { userId_permissionId: { userId: actor.id, permissionId: permission.id } },
      select: { effect: true },
    });
    // Do not honor stale records that predate the current override policy.
    // This keeps a database row from bypassing an endpoint's role contract.
    const override = this.accessControl.canUseUserOverride(actor.role as SystemRole, permissionCode)
      ? storedOverride
      : null;
    if (override?.effect === 'DENY') {
      return this.decision(false, permissionCode, 'USER_DENY', 'NOT_EVALUATED', 'Tài khoản đang bị chặn quyền này bằng cấu hình quyền riêng.');
    }

    const grantedByRole = await this.prisma.rolePermission.findUnique({
      where: { role_permissionId: { role: actor.role, permissionId: permission.id } },
      select: { id: true },
    });
    if (!grantedByRole && override?.effect !== 'ALLOW') {
      return this.decision(false, permissionCode, 'NONE', 'NOT_EVALUATED', 'Vai trò và quyền riêng của tài khoản không cho phép chức năng này.');
    }
    const permissionSource = override?.effect === 'ALLOW' ? 'USER_ALLOW' : 'ROLE';

    if (actor.role === 'ADMIN') {
      return this.decision(true, permissionCode, permissionSource, 'ADMIN', 'Admin hợp lệ không bị giới hạn bởi phạm vi dữ liệu riêng.');
    }
    const requestedScopes = [
      context?.departmentId ? { type: 'DEPARTMENT' as const, resourceId: context.departmentId } : null,
      context?.classId ? { type: 'CLASS' as const, resourceId: context.classId } : null,
      context?.subjectId ? { type: 'SUBJECT' as const, resourceId: context.subjectId } : null,
    ].filter(Boolean) as Array<{ type: 'DEPARTMENT' | 'CLASS' | 'SUBJECT'; resourceId: number }>;

    const assignedScopes = await this.prisma.userAccessScope.findMany({
      where: { userId: actor.id },
      select: { type: true, resourceId: true },
    });
    if (!assignedScopes.length) {
      return this.decision(true, permissionCode, permissionSource, 'INHERITED', 'Sử dụng phạm vi nghiệp vụ mặc định của module.');
    }
    if (!requestedScopes.length) {
      return this.decision(true, permissionCode, permissionSource, 'NOT_EVALUATED', 'Có quyền chức năng; phạm vi dữ liệu phải được áp dụng khi truy vấn dữ liệu nghiệp vụ.');
    }

    // Scopes are a union: a matching department, class or subject is enough.
    // A service should provide every known context identifier so a department
    // grant can cover its descendant class/subject without duplicate scopes.
    const matched = requestedScopes.some((requested) =>
      assignedScopes.some((scope) => scope.type === requested.type && scope.resourceId === requested.resourceId),
    );
    return matched
      ? this.decision(true, permissionCode, permissionSource, 'CUSTOM_MATCH', 'Ngữ cảnh thao tác nằm trong phạm vi dữ liệu được gán.')
      : this.decision(false, permissionCode, permissionSource, 'CUSTOM_MISMATCH', 'Ngữ cảnh thao tác nằm ngoài phạm vi dữ liệu được gán.');
  }

  async assertAnyPermission(actor: { id: number; role: string } | undefined, permissions: string[]) {
    for (const permission of permissions) {
      if (await this.can(actor, permission)) return true;
    }
    throw new ForbiddenException('Bạn không có quyền truy cập chức năng này.');
  }

  private decision(
    allowed: boolean,
    permissionCode: string,
    permissionSource: AccessDecision['permissionSource'],
    scopeSource: AccessDecision['scopeSource'],
    reason: string,
  ): AccessDecision {
    return { allowed, permissionCode, permissionSource, scopeSource, reason };
  }
}
