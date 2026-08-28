import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ReplaceUserScopesDto,
  SystemRole,
  UpdateRolePermissionsBatchDto,
  UpsertUserPermissionOverrideDto,
} from './dto/access-control.dto';

type PermissionSeed = {
  code: string;
  name: string;
  module: string;
  description: string;
  sensitive?: boolean;
  roles: SystemRole[];
};

export const ACCESS_PERMISSION_CATALOG: PermissionSeed[] = [
  { code: 'ACCESS_CONTROL_VIEW', name: 'Xem phân quyền', module: 'Quản trị hệ thống', description: 'Xem ma trận quyền, quyền riêng và phạm vi truy cập.', sensitive: true, roles: ['ADMIN'] },
  { code: 'ACCESS_CONTROL_MANAGE', name: 'Quản lý phân quyền', module: 'Quản trị hệ thống', description: 'Cấp, thu hồi quyền và thay đổi phạm vi truy cập.', sensitive: true, roles: ['ADMIN'] },
  { code: 'AUDIT_LOG_VIEW', name: 'Xem nhật ký hệ thống', module: 'Quản trị hệ thống', description: 'Tra cứu lịch sử thao tác và thay đổi bảo mật.', sensitive: true, roles: ['ADMIN'] },
  { code: 'SECURITY_AUDIT_VIEW', name: 'Xem kiểm toán bảo mật', module: 'Quản trị hệ thống', description: 'Tra cứu sự kiện bảo mật, truy cập dữ liệu nhạy cảm và kiểm tra tính toàn vẹn log.', sensitive: true, roles: ['ADMIN'] },
  { code: 'SECURITY_AUDIT_MANAGE', name: 'Quản lý kiểm toán bảo mật', module: 'Quản trị hệ thống', description: 'Thiết lập thời hạn lưu giữ và legal hold cho nhật ký kiểm toán.', sensitive: true, roles: ['ADMIN'] },
  { code: 'BACKUP_MANAGE', name: 'Quản lý sao lưu', module: 'Quản trị hệ thống', description: 'Tạo, khôi phục và duyệt sao lưu dữ liệu.', sensitive: true, roles: ['ADMIN'] },
  { code: 'USER_MANAGE', name: 'Quản lý tài khoản', module: 'Quản trị hệ thống', description: 'Tạo, cập nhật, khóa và quản lý tài khoản người dùng.', sensitive: true, roles: ['ADMIN'] },
  { code: 'ACADEMIC_STRUCTURE_MANAGE', name: 'Quản lý danh mục đào tạo', module: 'Danh mục', description: 'Quản lý khoa, lớp sinh viên và môn học.', roles: ['ADMIN'] },
  { code: 'EXAM_PERIOD_MANAGE', name: 'Quản lý kỳ thi', module: 'Tổ chức thi', description: 'Tạo và điều chỉnh kỳ thi.', roles: ['ADMIN'] },
  { code: 'EXAM_ROOM_MANAGE', name: 'Quản lý phòng thi', module: 'Tổ chức thi', description: 'Quản lý phòng và sức chứa phòng thi.', roles: ['ADMIN'] },
  { code: 'EXAM_ARRANGEMENT_MANAGE', name: 'Xếp phòng thi', module: 'Tổ chức thi', description: 'Xếp thí sinh vào phòng và vị trí thi.', sensitive: true, roles: ['ADMIN'] },
  { code: 'EXAM_SUPERVISOR_MANAGE', name: 'Phân công coi thi', module: 'Tổ chức thi', description: 'Phân công và điều chỉnh giảng viên coi thi.', sensitive: true, roles: ['ADMIN'] },
  { code: 'EXAM_SCHEDULE_MANAGE', name: 'Quản lý lịch thi', module: 'Tổ chức thi', description: 'Tạo và điều chỉnh lịch thi.', roles: ['ADMIN', 'TEACHER'] },
  { code: 'QUESTION_MANAGE', name: 'Quản lý ngân hàng câu hỏi', module: 'Ngân hàng đề', description: 'Tạo, cập nhật và quản lý câu hỏi trong phạm vi được phép.', roles: ['ADMIN', 'TEACHER'] },
  { code: 'EXAM_PAPER_MANAGE', name: 'Quản lý đề thi', module: 'Ngân hàng đề', description: 'Tạo và quản lý đề thi trong phạm vi được phép.', roles: ['ADMIN', 'TEACHER'] },
  { code: 'SYSTEM_REPORT_VIEW', name: 'Xem báo cáo tổng quan hệ thống', module: 'Báo cáo', description: 'Xem báo cáo tổng thể về lịch thi, phòng thi, sinh viên, ngân hàng đề và hoạt động khảo thí.', sensitive: true, roles: ['ADMIN'] },
  { code: 'EXAM_REPORT_VIEW', name: 'Xem báo cáo thống kê kỳ thi', module: 'Báo cáo', description: 'Xem thống kê kết quả, phổ điểm, tỷ lệ đạt và tình trạng bài thi trong phạm vi được phép.', roles: ['ADMIN', 'TEACHER'] },
  { code: 'EXAM_REPORT_EXPORT', name: 'Xuất báo cáo kỳ thi', module: 'Báo cáo', description: 'Xuất dữ liệu báo cáo kỳ thi ra CSV, Excel hoặc bản in trong phạm vi được phép.', sensitive: true, roles: ['ADMIN', 'TEACHER'] },
  { code: 'ESSAY_GRADE', name: 'Chấm bài tự luận', module: 'Chấm thi', description: 'Chấm bài tự luận được phân công.', sensitive: true, roles: ['ADMIN', 'TEACHER'] },
  { code: 'ESSAY_PUBLISH', name: 'Công bố điểm tự luận', module: 'Chấm thi', description: 'Duyệt và công bố điểm tự luận.', sensitive: true, roles: ['ADMIN'] },
  { code: 'GRADE_APPEAL_REVIEW', name: 'Xử lý phúc khảo', module: 'Chấm thi', description: 'Xem xét và xử lý đơn phúc khảo.', sensitive: true, roles: ['ADMIN', 'TEACHER'] },
  { code: 'PROCTOR_ASSIGNMENT_VIEW', name: 'Xem lịch coi thi', module: 'Giảng viên', description: 'Xem các ca coi thi được phân công.', roles: ['TEACHER'] },
  { code: 'TRASH_MANAGE', name: 'Quản lý thùng rác', module: 'Quản trị hệ thống', description: 'Xem, khôi phục hoặc xóa vĩnh viễn dữ liệu trong thùng rác.', sensitive: true, roles: ['ADMIN'] },
  { code: 'DOCUMENT_TEMPLATE_MANAGE', name: 'Quản lý biểu mẫu', module: 'Quản trị hệ thống', description: 'Tạo, sửa, phát hành và khôi phục phiên bản biểu mẫu in.', sensitive: true, roles: ['ADMIN'] },
  { code: 'DOCUMENT_TEMPLATE_USE', name: 'In theo biểu mẫu', module: 'Báo cáo', description: 'Xem trước và in tài liệu theo biểu mẫu đã phát hành trong phạm vi được phép.', roles: ['ADMIN', 'TEACHER'] },
  { code: 'STUDENT_SCHEDULE_VIEW', name: 'Xem lịch thi cá nhân', module: 'Sinh viên', description: 'Xem lịch thi thuộc tài khoản sinh viên.', roles: ['STUDENT'] },
  { code: 'STUDENT_RESULT_VIEW', name: 'Xem kết quả cá nhân', module: 'Sinh viên', description: 'Xem kết quả đủ điều kiện công bố.', sensitive: true, roles: ['STUDENT'] },
  { code: 'STUDENT_CURRICULUM_VIEW', name: 'Xem chương trình đào tạo', module: 'Sinh viên', description: 'Xem chương trình đào tạo thuộc hồ sơ sinh viên.', roles: ['STUDENT'] },
  { code: 'ONLINE_EXAM_TAKE', name: 'Làm bài trực tuyến', module: 'Sinh viên', description: 'Truy cập lượt thi trực tuyến hợp lệ.', roles: ['STUDENT'] },
];

const ROLES: SystemRole[] = ['ADMIN', 'TEACHER', 'STUDENT'];
const CORE_ADMIN_PERMISSIONS = new Set(['ACCESS_CONTROL_VIEW', 'ACCESS_CONTROL_MANAGE']);
// These permissions are intentionally never delegable to an individual account.
// They remain manageable only through the protected role matrix flow.
const PROTECTED_USER_OVERRIDE_PERMISSIONS = new Set([
  'ACCESS_CONTROL_VIEW',
  'ACCESS_CONTROL_MANAGE',
  'AUDIT_LOG_VIEW',
  'SECURITY_AUDIT_VIEW',
  'SECURITY_AUDIT_MANAGE',
  'BACKUP_MANAGE',
  'USER_MANAGE',
  'TRASH_MANAGE',
  'SYSTEM_REPORT_VIEW',
]);

@Injectable()
export class AccessControlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async ensureCatalog() {
    const existing = await this.prisma.permission.findMany({
      where: { code: { in: ACCESS_PERMISSION_CATALOG.map((permission) => permission.code) } },
      select: { code: true },
    });
    const existingCodes = new Set(existing.map((permission) => permission.code));

    await this.prisma.$transaction(async (tx) => {
      for (const seed of ACCESS_PERMISSION_CATALOG) {
        const permission = await tx.permission.upsert({
          where: { code: seed.code },
          update: {
            name: seed.name,
            module: seed.module,
            description: seed.description,
            sensitive: Boolean(seed.sensitive),
          },
          create: {
            code: seed.code,
            name: seed.name,
            module: seed.module,
            description: seed.description,
            sensitive: Boolean(seed.sensitive),
          },
        });

        // Default grants are applied only when a permission code is introduced.
        // Existing role configuration is administrator-owned and must never be
        // silently restored during a read or authorization check.
        if (!existingCodes.has(seed.code) && seed.roles.length) {
          await tx.rolePermission.createMany({
            data: seed.roles.map((role) => ({ role, permissionId: permission.id })),
            skipDuplicates: true,
          });
        }
      }
    });
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
        userOverrideAllowed: !PROTECTED_USER_OVERRIDE_PERMISSIONS.has(permission.code),
        userOverrideRoles: ROLES.filter((role) => this.canUseUserOverride(role, permission.code)),
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

  async setRolePermission(
    actor: { id: number; username?: string },
    role: string,
    permissionCode: string,
    granted: boolean,
    reason: string,
  ) {
    await this.ensureCatalog();
    this.assertRole(role);
    const permission = await this.findPermission(permissionCode);
    this.assertRolePermissionChange(role as SystemRole, permission.code, granted);

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
      metadata: { role, permissionCode: permission.code, granted, reason: reason.trim() },
    });
    return { role, permissionCode: permission.code, granted };
  }

  async setRolePermissionsBatch(
    actor: { id: number; username?: string },
    role: string,
    dto: UpdateRolePermissionsBatchDto,
  ) {
    await this.ensureCatalog();
    this.assertRole(role);
    const normalized = new Map<string, boolean>();
    for (const change of dto.changes) normalized.set(change.permissionCode.trim(), change.granted);
    const codes = [...normalized.keys()];
    const permissions = await this.prisma.permission.findMany({ where: { code: { in: codes } } });
    if (permissions.length !== codes.length) {
      throw new BadRequestException('Danh sách thay đổi chứa quyền không tồn tại.');
    }
    for (const permission of permissions) {
      this.assertRolePermissionChange(role as SystemRole, permission.code, normalized.get(permission.code) === true);
    }

    await this.prisma.$transaction(async (tx) => {
      for (const permission of permissions) {
        const granted = normalized.get(permission.code) === true;
        if (granted) {
          await tx.rolePermission.upsert({
            where: { role_permissionId: { role, permissionId: permission.id } },
            update: {},
            create: { role, permissionId: permission.id },
          });
        } else {
          await tx.rolePermission.deleteMany({ where: { role, permissionId: permission.id } });
        }
      }
      await this.audit.write({
        actorId: actor.id,
        action: 'ACCESS_ROLE_PERMISSIONS_BATCH_UPDATED',
        entityType: 'ACCESS_CONTROL',
        entityId: role,
        description: `Đã cập nhật ${permissions.length} quyền cho vai trò ${role}.`,
        metadata: {
          role,
          reason: dto.reason.trim(),
          changes: permissions.map((permission) => ({
            permissionCode: permission.code,
            granted: normalized.get(permission.code) === true,
          })),
        },
      }, tx);
    });

    return { role, updatedCount: permissions.length };
  }

  async resetRolePermissions(actor: { id: number }, role: string) {
    await this.ensureCatalog();
    this.assertRole(role);
    const defaults = ACCESS_PERMISSION_CATALOG.filter((permission) => permission.roles.includes(role as SystemRole));
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
    const targetUser = await this.getUserForAccessChange(userId);
    const permission = await this.findPermission(dto.permissionCode);
    const reason = dto.reason?.trim();
    if (!reason || reason.length < 5) {
      throw new BadRequestException('Phải nhập lý do thay đổi quyền riêng (tối thiểu 5 ký tự).');
    }
    if (!this.canUseUserOverride(targetUser.role as SystemRole, permission.code)) {
      throw new BadRequestException(
        'Quyền này không thể cấu hình riêng cho vai trò của tài khoản. Hãy dùng Ma trận vai trò hoặc chọn quyền nghiệp vụ tương thích.',
      );
    }
    const override = await this.prisma.userPermissionOverride.upsert({
      where: { userId_permissionId: { userId, permissionId: permission.id } },
      update: { effect: dto.effect, reason },
      create: { userId, permissionId: permission.id, effect: dto.effect, reason },
      include: { permission: { select: { code: true, name: true } } },
    });
    await this.audit.write({
      actorId: actor.id,
      action: 'ACCESS_USER_OVERRIDE_SET',
      entityType: 'ACCESS_CONTROL',
      entityId: String(userId),
      description: `Đã đặt quyền riêng ${dto.effect === 'ALLOW' ? 'cho phép' : 'từ chối'} ${permission.name} cho tài khoản #${userId}.`,
      metadata: { userId, permissionCode: permission.code, effect: dto.effect, reason },
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
    const targetUser = await this.getUserForAccessChange(userId);
    if (targetUser.role !== 'TEACHER') {
      throw new BadRequestException('Chỉ tài khoản Giảng viên hoặc cán bộ nghiệp vụ mới được cấu hình phạm vi dữ liệu riêng.');
    }
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
        metadata: { userId, scopes: normalized, reason: dto.reason.trim() },
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
        const storedOverride = overrides.get(permission.code);
        // Invalid legacy overrides must never create an effective privilege.
        // The same rule is enforced at request time by AccessPolicyService.
        const override = this.canUseUserOverride(user.role as SystemRole, permission.code)
          ? storedOverride
          : undefined;
        const allowed = override?.effect === 'DENY' ? false : override?.effect === 'ALLOW' || permission.rolePermissions.length > 0;
        return {
          code: permission.code,
          name: permission.name,
          module: permission.module,
          allowed,
          source: override ? `USER_${override.effect}` : permission.rolePermissions.length ? 'ROLE' : 'NONE',
        };
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

  private async getUserForAccessChange(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, status: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản.');
    return user;
  }

  private assertRole(role: string): asserts role is SystemRole {
    if (!ROLES.includes(role as SystemRole)) throw new BadRequestException('Vai trò không hợp lệ.');
  }

  private permissionSeed(code: string) {
    return ACCESS_PERMISSION_CATALOG.find((permission) => permission.code === code);
  }

  /**
   * An individual override is an exception inside a role's supported API
   * surface; it is not a mechanism for bypassing @Roles on another module.
   */
  canUseUserOverride(role: SystemRole, permissionCode: string) {
    const seed = this.permissionSeed(permissionCode);
    if (!seed) return false;
    // Core system protected permissions are strictly non-delegable
    if (PROTECTED_USER_OVERRIDE_PERMISSIONS.has(permissionCode)) return false;
    // Student can only override student permissions
    if (role === 'STUDENT') {
      return seed.roles.includes('STUDENT');
    }
    // Teachers/Staff can receive all non-protected operational & academic permissions
    if (role === 'TEACHER') {
      const studentOnlyCodes = ['STUDENT_SCHEDULE_VIEW', 'STUDENT_RESULT_VIEW', 'STUDENT_CURRICULUM_VIEW', 'ONLINE_EXAM_TAKE'];
      return !studentOnlyCodes.includes(permissionCode);
    }
    return true;
  }

  private assertRolePermissionChange(role: SystemRole, permissionCode: string, granted: boolean) {
    if (role === 'ADMIN' && CORE_ADMIN_PERMISSIONS.has(permissionCode) && !granted) {
      throw new BadRequestException('Không thể thu hồi quyền quản trị phân quyền cốt lõi của vai trò Admin.');
    }
    const seed = this.permissionSeed(permissionCode);
    if (granted && (!seed || !seed.roles.includes(role))) {
      throw new BadRequestException('Không thể cấp quyền này ngoài phạm vi chức năng của vai trò.');
    }
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
