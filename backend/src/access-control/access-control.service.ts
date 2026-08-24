import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReplaceUserScopesDto, SystemRole, UpsertUserPermissionOverrideDto } from './dto/access-control.dto';

type PermissionSeed = {
  code: string;
  name: string;
  module: string;
  description: string;
  sensitive?: boolean;
  roles: SystemRole[];
};

const PERMISSIONS: PermissionSeed[] = [
  { code: 'ACCESS_CONTROL_VIEW', name: 'Xem phân quyền', module: 'Quản trị hệ thống', description: 'Xem ma trận quyền, quyền riêng và phạm vi truy cập.', sensitive: true, roles: ['ADMIN'] },
  { code: 'ACCESS_CONTROL_MANAGE', name: 'Quản lý phân quyền', module: 'Quản trị hệ thống', description: 'Cấp, thu hồi quyền và thay đổi phạm vi truy cập.', sensitive: true, roles: ['ADMIN'] },
  { code: 'AUDIT_LOG_VIEW', name: 'Xem nhật ký hệ thống', module: 'Quản trị hệ thống', description: 'Tra cứu lịch sử thao tác và thay đổi bảo mật.', sensitive: true, roles: ['ADMIN'] },
  { code: 'BACKUP_MANAGE', name: 'Quản lý sao lưu', module: 'Quản trị hệ thống', description: 'Tạo, khôi phục và duyệt sao lưu dữ liệu.', sensitive: true, roles: ['ADMIN'] },
  { code: 'EXAM_SCHEDULE_MANAGE', name: 'Quản lý lịch thi', module: 'Tổ chức thi', description: 'Tạo và điều chỉnh lịch thi.', roles: ['ADMIN', 'TEACHER'] },
  { code: 'QUESTION_MANAGE', name: 'Quản lý ngân hàng câu hỏi', module: 'Ngân hàng đề', description: 'Tạo, cập nhật và quản lý câu hỏi trong phạm vi được phép.', roles: ['ADMIN', 'TEACHER'] },
  { code: 'EXAM_PAPER_MANAGE', name: 'Quản lý đề thi', module: 'Ngân hàng đề', description: 'Tạo và quản lý đề thi trong phạm vi được phép.', roles: ['ADMIN', 'TEACHER'] },
  { code: 'SYSTEM_REPORT_VIEW', name: 'Xem báo cáo tổng quan hệ thống', module: 'Báo cáo', description: 'Xem báo cáo tổng thể về lịch thi, phòng thi, sinh viên, ngân hàng đề và hoạt động khảo thí.', sensitive: true, roles: ['ADMIN'] },
  { code: 'EXAM_REPORT_VIEW', name: 'Xem báo cáo thống kê kỳ thi', module: 'Báo cáo', description: 'Xem thống kê kết quả, phổ điểm, tỷ lệ đạt và tình trạng bài thi trong phạm vi được phép.', roles: ['ADMIN', 'TEACHER'] },
  { code: 'EXAM_REPORT_EXPORT', name: 'Xuất báo cáo kỳ thi', module: 'Báo cáo', description: 'Xuất dữ liệu báo cáo kỳ thi ra CSV, Excel hoặc bản in trong phạm vi được phép.', sensitive: true, roles: ['ADMIN', 'TEACHER'] },
  { code: 'ESSAY_GRADE', name: 'Chấm bài tự luận', module: 'Chấm thi', description: 'Chấm bài tự luận được phân công.', sensitive: true, roles: ['ADMIN', 'TEACHER'] },
  { code: 'ESSAY_PUBLISH', name: 'Công bố điểm tự luận', module: 'Chấm thi', description: 'Duyệt và công bố điểm tự luận.', sensitive: true, roles: ['ADMIN'] },
  { code: 'GRADE_APPEAL_REVIEW', name: 'Xử lý phúc khảo', module: 'Chấm thi', description: 'Xem xét và xử lý đơn phúc khảo.', sensitive: true, roles: ['ADMIN', 'TEACHER'] },
  { code: 'STUDENT_SCHEDULE_VIEW', name: 'Xem lịch thi cá nhân', module: 'Sinh viên', description: 'Xem lịch thi thuộc tài khoản sinh viên.', roles: ['STUDENT'] },
  { code: 'STUDENT_RESULT_VIEW', name: 'Xem kết quả cá nhân', module: 'Sinh viên', description: 'Xem kết quả đủ điều kiện công bố.', sensitive: true, roles: ['STUDENT'] },
  { code: 'ONLINE_EXAM_TAKE', name: 'Làm bài trực tuyến', module: 'Sinh viên', description: 'Truy cập lượt thi trực tuyến hợp lệ.', roles: ['STUDENT'] },
];

const ROLES: SystemRole[] = ['ADMIN', 'TEACHER', 'STUDENT'];

@Injectable()
export class AccessControlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async ensureCatalog() {
    for (const seed of PERMISSIONS) {
      const permission = await this.prisma.permission.upsert({
        where: { code: seed.code },
        update: { name: seed.name, module: seed.module, description: seed.description, sensitive: Boolean(seed.sensitive) },
        create: { code: seed.code, name: seed.name, module: seed.module, description: seed.description, sensitive: Boolean(seed.sensitive) },
      });
      for (const role of seed.roles) {
        await this.prisma.rolePermission.upsert({
          where: { role_permissionId: { role, permissionId: permission.id } },
          update: {},
          create: { role, permissionId: permission.id },
        });
      }
    }
  }

  async getOverview() {
    await this.ensureCatalog();
    const permissions = await this.prisma.permission.findMany({
      include: { rolePermissions: { select: { role: true } } },
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
    });
    return {
      roles: ROLES,
      permissions: permissions.map((permission) => ({
        ...permission,
        roles: permission.rolePermissions.map((entry) => entry.role),
      })),
    };
  }

  async listUsers() {
    await this.ensureCatalog();
    return this.prisma.user.findMany({
      select: {
        id: true, username: true, email: true, role: true, status: true,
        teacher: { select: { fullName: true, department: { select: { id: true, name: true } } } },
        student: { select: { fullName: true, class: { select: { id: true, name: true, department: { select: { id: true, name: true } } } } } },
        permissionOverrides: { include: { permission: { select: { code: true, name: true } } } },
        accessScopes: { select: { id: true, type: true, resourceId: true } },
      },
      orderBy: { id: 'asc' },
    });
  }

  async getScopeOptions() {
    const [departments, classes, subjects] = await Promise.all([
      this.prisma.department.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: 'asc' } }),
      this.prisma.class.findMany({ select: { id: true, code: true, name: true, departmentId: true }, orderBy: { name: 'asc' } }),
      this.prisma.subject.findMany({ select: { id: true, subjectCode: true, subjectName: true, departmentId: true }, orderBy: { subjectName: 'asc' } }),
    ]);
    return { departments, classes, subjects };
  }

  async setRolePermission(actor: { id: number; username?: string }, role: string, permissionCode: string, granted: boolean) {
    await this.ensureCatalog();
    if (!ROLES.includes(role as SystemRole)) throw new BadRequestException('Vai trò không hợp lệ.');
    const permission = await this.findPermission(permissionCode);
    if (role === 'ADMIN' && ['ACCESS_CONTROL_VIEW', 'ACCESS_CONTROL_MANAGE'].includes(permission.code) && !granted) {
      throw new BadRequestException('Không thể thu hồi quyền quản trị phân quyền cốt lõi của vai trò Admin.');
    }

    if (granted) {
      await this.prisma.rolePermission.upsert({
        where: { role_permissionId: { role, permissionId: permission.id } },
        update: {},
        create: { role, permissionId: permission.id },
      });
    } else {
      await this.prisma.rolePermission.deleteMany({ where: { role, permissionId: permission.id } });
    }
    await this.audit.write({
      actorId: actor.id,
      action: granted ? 'ACCESS_ROLE_PERMISSION_GRANTED' : 'ACCESS_ROLE_PERMISSION_REVOKED',
      entityType: 'ACCESS_CONTROL',
      entityId: `${role}:${permission.code}`,
      description: `${granted ? 'Đã cấp' : 'Đã thu hồi'} quyền ${permission.name} cho vai trò ${role}.`,
      metadata: { role, permissionCode: permission.code, granted },
    });
    return { role, permissionCode: permission.code, granted };
  }

  async resetRolePermissions(actor: { id: number }, role: string) {
    await this.ensureCatalog();
    if (!ROLES.includes(role as SystemRole)) throw new BadRequestException('Vai trò không hợp lệ.');
    const defaults = PERMISSIONS.filter((permission) => permission.roles.includes(role as SystemRole));
    const permissions = await this.prisma.permission.findMany({ where: { code: { in: defaults.map((permission) => permission.code) } }, select: { id: true, code: true } });

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { role } });
      if (permissions.length) {
        await tx.rolePermission.createMany({ data: permissions.map((permission) => ({ role, permissionId: permission.id })), skipDuplicates: true });
      }
      await this.audit.write({
        actorId: actor.id,
        action: 'ACCESS_ROLE_PERMISSION_RESET',
        entityType: 'ACCESS_CONTROL',
        entityId: role,
        description: `Đã khôi phục quyền mặc định cho vai trò ${role}.`,
        metadata: { role, permissionCodes: permissions.map((permission) => permission.code) },
      }, tx);
    });

    return { role, reset: true, permissionCount: permissions.length };
  }

  async upsertUserOverride(actor: { id: number }, userId: number, dto: UpsertUserPermissionOverrideDto) {
    await this.ensureCatalog();
    await this.assertUser(userId);
    const permission = await this.findPermission(dto.permissionCode);
    const override = await this.prisma.userPermissionOverride.upsert({
      where: { userId_permissionId: { userId, permissionId: permission.id } },
      update: { effect: dto.effect, reason: dto.reason?.trim() || null },
      create: { userId, permissionId: permission.id, effect: dto.effect, reason: dto.reason?.trim() || null },
      include: { permission: { select: { code: true, name: true } } },
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'ACCESS_USER_OVERRIDE_SET',
      entityType: 'ACCESS_CONTROL',
      entityId: String(userId),
      description: `Đã đặt quyền riêng ${dto.effect === 'ALLOW' ? 'cho phép' : 'từ chối'} ${permission.name} cho tài khoản #${userId}.`,
      metadata: { userId, permissionCode: permission.code, effect: dto.effect, reason: dto.reason?.trim() || null },
    });
    return override;
  }

  async removeUserOverride(actor: { id: number }, userId: number, permissionCode: string) {
    await this.ensureCatalog();
    const permission = await this.findPermission(permissionCode);
    await this.prisma.userPermissionOverride.deleteMany({ where: { userId, permissionId: permission.id } });
    await this.audit.write({
      actorId: actor.id,
      action: 'ACCESS_USER_OVERRIDE_REMOVED',
      entityType: 'ACCESS_CONTROL',
      entityId: String(userId),
      description: `Đã gỡ quyền riêng ${permission.name} của tài khoản #${userId}.`,
      metadata: { userId, permissionCode: permission.code },
    });
    return { userId, permissionCode: permission.code, removed: true };
  }

  async removeAllUserOverrides(actor: { id: number }, userId: number) {
    await this.assertUser(userId);
    const result = await this.prisma.userPermissionOverride.deleteMany({ where: { userId } });
    await this.audit.write({
      actorId: actor.id,
      action: 'ACCESS_USER_OVERRIDES_RESET',
      entityType: 'ACCESS_CONTROL',
      entityId: String(userId),
      description: `Đã khôi phục toàn bộ quyền riêng của tài khoản #${userId}.`,
      metadata: { userId, removedCount: result.count },
    });
    return { userId, reset: true, removedCount: result.count };
  }

  async replaceUserScopes(actor: { id: number }, userId: number, dto: ReplaceUserScopesDto) {
    await this.assertUser(userId);
    const normalized = this.normalizeScopes(dto.scopes || []);
    await this.validateScopes(normalized);
    await this.prisma.$transaction(async (tx) => {
      await tx.userAccessScope.deleteMany({ where: { userId } });
      if (normalized.length) await tx.userAccessScope.createMany({ data: normalized.map((scope) => ({ userId, ...scope })) });
      await this.audit.write({
        actorId: actor.id,
        action: 'ACCESS_SCOPE_REPLACED',
        entityType: 'ACCESS_CONTROL',
        entityId: String(userId),
        description: `Đã cập nhật phạm vi dữ liệu cho tài khoản #${userId}.`,
        metadata: { userId, scopes: normalized },
      }, tx);
    });
    return this.prisma.userAccessScope.findMany({ where: { userId }, orderBy: [{ type: 'asc' }, { resourceId: 'asc' }] });
  }

  async resetUserScopes(actor: { id: number }, userId: number) {
    await this.assertUser(userId);
    const result = await this.prisma.userAccessScope.deleteMany({ where: { userId } });
    await this.audit.write({
      actorId: actor.id,
      action: 'ACCESS_SCOPE_RESET',
      entityType: 'ACCESS_CONTROL',
      entityId: String(userId),
      description: `Đã xóa toàn bộ phạm vi truy cập riêng của tài khoản #${userId}.`,
      metadata: { userId, removedCount: result.count },
    });
    return { userId, reset: true, removedCount: result.count };
  }

  async resetUserAccess(actor: { id: number }, userId: number) {
    await this.assertUser(userId);
    const result = await this.prisma.$transaction(async (tx) => {
      const overrides = await tx.userPermissionOverride.deleteMany({ where: { userId } });
      const scopes = await tx.userAccessScope.deleteMany({ where: { userId } });
      await this.audit.write({
        actorId: actor.id,
        action: 'ACCESS_USER_ACCESS_RESET',
        entityType: 'ACCESS_CONTROL',
        entityId: String(userId),
        description: `Đã khôi phục toàn bộ cấu hình quyền của tài khoản #${userId} về mặc định theo vai trò.`,
        metadata: { userId, removedOverrides: overrides.count, removedScopes: scopes.count },
      }, tx);
      return { removedOverrides: overrides.count, removedScopes: scopes.count };
    });
    return { userId, reset: true, ...result };
  }

  async getEffectivePermissions(userId: number) {
    await this.ensureCatalog();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true, status: true, permissionOverrides: { include: { permission: true } }, accessScopes: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản.');
    const permissions = await this.prisma.permission.findMany({ include: { rolePermissions: { where: { role: user.role } } }, orderBy: { code: 'asc' } });
    const overrides = new Map(user.permissionOverrides.map((entry) => [entry.permission.code, entry]));
    return {
      user: { id: user.id, username: user.username, role: user.role, status: user.status },
      permissions: permissions.map((permission) => {
        const override = overrides.get(permission.code);
        const allowed = override?.effect === 'DENY' ? false : override?.effect === 'ALLOW' || permission.rolePermissions.length > 0;
        return { code: permission.code, name: permission.name, module: permission.module, allowed, source: override ? `USER_${override.effect}` : permission.rolePermissions.length ? 'ROLE' : 'NONE' };
      }),
      scopes: user.accessScopes,
    };
  }

  async getHistory(limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { entityType: 'ACCESS_CONTROL' },
      include: { actor: { select: { id: true, username: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 200),
    });
  }

  private async findPermission(code: string) {
    const permission = await this.prisma.permission.findUnique({ where: { code } });
    if (!permission) throw new NotFoundException('Không tìm thấy quyền được yêu cầu.');
    return permission;
  }

  private async assertUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản.');
  }

  private normalizeScopes(scopes: Array<{ type: 'DEPARTMENT' | 'CLASS' | 'SUBJECT'; resourceId: number }>) {
    const deduplicated = new Map<string, { type: 'DEPARTMENT' | 'CLASS' | 'SUBJECT'; resourceId: number }>();
    for (const scope of scopes) {
      if (!['DEPARTMENT', 'CLASS', 'SUBJECT'].includes(scope.type) || !Number.isInteger(scope.resourceId) || scope.resourceId < 1) {
        throw new BadRequestException('Phạm vi truy cập không hợp lệ.');
      }
      deduplicated.set(`${scope.type}:${scope.resourceId}`, { type: scope.type, resourceId: scope.resourceId });
    }
    return [...deduplicated.values()];
  }

  private async validateScopes(scopes: Array<{ type: 'DEPARTMENT' | 'CLASS' | 'SUBJECT'; resourceId: number }>) {
    const idsByType = new Map<'DEPARTMENT' | 'CLASS' | 'SUBJECT', number[]>();
    for (const scope of scopes) idsByType.set(scope.type, [...(idsByType.get(scope.type) || []), scope.resourceId]);
    const checks = await Promise.all([
      idsByType.get('DEPARTMENT')?.length ? this.prisma.department.count({ where: { id: { in: idsByType.get('DEPARTMENT') } } }) : 0,
      idsByType.get('CLASS')?.length ? this.prisma.class.count({ where: { id: { in: idsByType.get('CLASS') } } }) : 0,
      idsByType.get('SUBJECT')?.length ? this.prisma.subject.count({ where: { id: { in: idsByType.get('SUBJECT') } } }) : 0,
    ]);
    const expected = [idsByType.get('DEPARTMENT')?.length || 0, idsByType.get('CLASS')?.length || 0, idsByType.get('SUBJECT')?.length || 0];
    if (checks.some((count, index) => count !== expected[index])) throw new BadRequestException('Có phạm vi tham chiếu đến dữ liệu không tồn tại.');
  }
}
