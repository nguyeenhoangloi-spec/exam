import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BackupJobStatus, BackupJobType, BackupRestoreStatus, BackupRestoreTarget, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApproveRestoreRequestDto, CreateBackupJobDto, CreateRestoreRequestDto, RejectRestoreRequestDto } from './dto/backup.dto';

const ACTIVE_ATTEMPT_STATUSES = ['DEVICE_CHECK', 'READY', 'IN_PROGRESS', 'DISCONNECTED'] as const;

@Injectable()
export class BackupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private serializeJob(job: any) {
    return {
      ...job,
      sizeBytes: job.sizeBytes == null ? null : String(job.sizeBytes),
    };
  }

  private serializeRestore(request: any) {
    return {
      ...request,
      confirmationPhrase: undefined,
    };
  }

  async overview() {
    const [latest, running, failed24h, totalBytes, pendingRestores] = await Promise.all([
      this.prisma.backupJob.findFirst({ where: { status: BackupJobStatus.SUCCEEDED }, orderBy: { completedAt: 'desc' } }),
      this.prisma.backupJob.count({ where: { status: { in: [BackupJobStatus.QUEUED, BackupJobStatus.RUNNING, BackupJobStatus.VERIFYING] } } }),
      this.prisma.backupJob.count({
        where: {
          status: { in: [BackupJobStatus.FAILED, BackupJobStatus.VERIFY_FAILED] },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.backupJob.aggregate({ where: { status: BackupJobStatus.SUCCEEDED }, _sum: { sizeBytes: true } }),
      this.prisma.backupRestoreRequest.count({ where: { status: { in: [BackupRestoreStatus.PENDING_APPROVAL, BackupRestoreStatus.APPROVED, BackupRestoreStatus.RUNNING] } } }),
    ]);

    const ageHours = latest?.completedAt ? (Date.now() - latest.completedAt.getTime()) / 3_600_000 : Infinity;
    const status = failed24h > 0 || ageHours > 26 ? 'WARNING' : latest ? 'HEALTHY' : 'ERROR';

    return {
      status,
      timezone: process.env.BACKUP_TIMEZONE || 'Asia/Ho_Chi_Minh',
      schedule: process.env.BACKUP_SCHEDULE || '02:00',
      retention: {
        daily: Number(process.env.BACKUP_RETENTION_DAILY || 14),
        weekly: Number(process.env.BACKUP_RETENTION_WEEKLY || 8),
        monthly: Number(process.env.BACKUP_RETENTION_MONTHLY || 12),
      },
      latest: latest ? this.serializeJob(latest) : null,
      running,
      failed24h,
      pendingRestores,
      totalBytes: totalBytes._sum.sizeBytes == null ? '0' : String(totalBytes._sum.sizeBytes),
    };
  }

  async listJobs(page = 1, limit = 20, status?: BackupJobStatus) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.prisma.backupJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        include: { initiatedBy: { select: { id: true, username: true } } },
      }),
      this.prisma.backupJob.count({ where }),
    ]);
    return { items: items.map((item) => this.serializeJob(item)), total, page: safePage, limit: safeLimit };
  }

  async getJob(id: string) {
    const job = await this.prisma.backupJob.findUnique({
      where: { id },
      include: { initiatedBy: { select: { id: true, username: true } }, restoreRequests: true },
    });
    if (!job) throw new NotFoundException('Không tìm thấy snapshot backup.');
    return this.serializeJob(job);
  }

  async listRestoreRequests() {
    const requests = await this.prisma.backupRestoreRequest.findMany({
      where: { status: { in: [BackupRestoreStatus.PENDING_APPROVAL, BackupRestoreStatus.APPROVED, BackupRestoreStatus.RUNNING] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        backupJob: true,
        requestedBy: { select: { id: true, username: true } },
        approvedBy: { select: { id: true, username: true } },
      },
    });
    return requests.map((request) => this.serializeRestore(request));
  }

  async createJob(actorId: number, dto: CreateBackupJobDto) {
    const active = await this.prisma.backupJob.findFirst({
      where: { status: { in: [BackupJobStatus.QUEUED, BackupJobStatus.RUNNING, BackupJobStatus.VERIFYING] } },
    });
    if (active) throw new ConflictException('Đã có một job backup đang chờ hoặc đang chạy.');

    const job = await this.prisma.backupJob.create({
      data: {
        snapshotId: `snap_${new Date().toISOString().replace(/[-:.TZ]/g, '')}_${randomUUID().slice(0, 8)}`,
        type: dto.type || BackupJobType.FULL,
        initiatedById: actorId,
      },
    });
    await this.audit.write({
      actorId,
      action: 'BACKUP_QUEUED',
      entityType: 'BACKUP_JOB',
      entityId: job.id,
      description: `Đã tạo job backup ${job.snapshotId}.`,
      metadata: { type: job.type, reason: dto.reason || null } as Prisma.InputJsonValue,
    });
    return this.serializeJob(job);
  }

  async createRestoreRequest(actorId: number, dto: CreateRestoreRequestDto) {
    const job = await this.prisma.backupJob.findUnique({ where: { id: dto.backupJobId } });
    if (!job || job.status !== BackupJobStatus.SUCCEEDED) {
      throw new BadRequestException('Chỉ được restore từ snapshot đã verify thành công.');
    }

    if (dto.target === BackupRestoreTarget.PRODUCTION) {
      const activeAttemptCount = await this.prisma.examAttempt.count({
        where: { mode: 'OFFICIAL', status: { in: [...ACTIVE_ATTEMPT_STATUSES] } },
      });
      if (activeAttemptCount > 0) {
        throw new ConflictException('Không thể tạo yêu cầu restore production khi đang có bài thi hoạt động.');
      }
    }

    const phrase = `RESTORE ${randomBytes(4).toString('hex').toUpperCase()}`;
    const request = await this.prisma.backupRestoreRequest.create({
      data: {
        backupJobId: job.id,
        target: dto.target,
        reason: dto.reason,
        requestedById: actorId,
        confirmationHash: createHash('sha256').update(phrase).digest('hex'),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
      include: { backupJob: true, requestedBy: { select: { id: true, username: true } } },
    });

    await this.audit.write({
      actorId,
      action: 'BACKUP_RESTORE_REQUESTED',
      entityType: 'BACKUP_RESTORE_REQUEST',
      entityId: request.id,
      description: `Đã tạo yêu cầu restore ${dto.target} từ ${job.snapshotId}.`,
      metadata: { target: dto.target, snapshotId: job.snapshotId, reason: dto.reason } as Prisma.InputJsonValue,
    });

    return { ...this.serializeRestore(request), confirmationPhrase: phrase };
  }

  async approveRestoreRequest(actorId: number, id: string, dto: ApproveRestoreRequestDto) {
    const request = await this.prisma.backupRestoreRequest.findUnique({
      where: { id },
      include: { backupJob: true, requestedBy: true },
    });
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu restore.');
    if (request.status !== BackupRestoreStatus.PENDING_APPROVAL || request.expiresAt <= new Date()) {
      throw new ConflictException('Yêu cầu restore đã hết hạn hoặc không còn chờ duyệt.');
    }
    if (request.target === BackupRestoreTarget.PRODUCTION && request.requestedById === actorId) {
      throw new ConflictException('Production restore phải được duyệt bởi admin khác người tạo yêu cầu.');
    }
    const approver = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (!approver || approver.role !== 'ADMIN' || !(await bcrypt.compare(dto.currentPassword, approver.password))) {
      throw new UnauthorizedException('Mật khẩu xác thực không chính xác.');
    }
    const confirmationHash = createHash('sha256').update(dto.confirmationPhrase.trim()).digest('hex');
    if (confirmationHash !== request.confirmationHash) {
      throw new BadRequestException('Cụm xác nhận restore không chính xác.');
    }

    const updated = await this.prisma.backupRestoreRequest.update({
      where: { id },
      data: { status: BackupRestoreStatus.APPROVED, approvedById: actorId },
      include: { backupJob: true, requestedBy: { select: { id: true, username: true } }, approvedBy: { select: { id: true, username: true } } },
    });
    await this.audit.write({
      actorId,
      action: 'BACKUP_RESTORE_APPROVED',
      entityType: 'BACKUP_RESTORE_REQUEST',
      entityId: id,
      description: `Đã phê duyệt restore ${request.target} từ ${request.backupJob.snapshotId}.`,
    });
    return this.serializeRestore(updated);
  }

  async rejectRestoreRequest(actorId: number, id: string, dto: RejectRestoreRequestDto) {
    const request = await this.prisma.backupRestoreRequest.findUnique({ where: { id }, include: { backupJob: true } });
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu restore.');
    if (request.status !== BackupRestoreStatus.PENDING_APPROVAL) throw new ConflictException('Yêu cầu restore không còn chờ duyệt.');
    const updated = await this.prisma.backupRestoreRequest.update({
      where: { id },
      data: { status: BackupRestoreStatus.REJECTED, errorMessage: dto.reason },
      include: { backupJob: true },
    });
    await this.audit.write({
      actorId,
      action: 'BACKUP_RESTORE_REJECTED',
      entityType: 'BACKUP_RESTORE_REQUEST',
      entityId: id,
      description: `Đã từ chối restore từ ${request.backupJob.snapshotId}.`,
      metadata: { reason: dto.reason } as Prisma.InputJsonValue,
    });
    return this.serializeRestore(updated);
  }

  async claimNextJob() {
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.backupJob.findFirst({ where: { status: BackupJobStatus.QUEUED }, orderBy: { createdAt: 'asc' } });
      if (!job) return null;
      return tx.backupJob.update({ where: { id: job.id }, data: { status: BackupJobStatus.RUNNING, startedAt: new Date() } });
    });
  }

  async claimNextRestore() {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.backupRestoreRequest.findFirst({
        where: { status: BackupRestoreStatus.APPROVED, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'asc' },
        include: { backupJob: true },
      });
      if (!request) return null;
      return tx.backupRestoreRequest.update({ where: { id: request.id }, data: { status: BackupRestoreStatus.RUNNING, startedAt: new Date() }, include: { backupJob: true } });
    });
  }

  async markJobVerifying(id: string) {
    return this.prisma.backupJob.update({ where: { id }, data: { status: BackupJobStatus.VERIFYING } });
  }

  async completeJob(id: string, data: { storageKey: string; manifestKey: string; checksum: string; sizeBytes: bigint; migration?: string; appCommit?: string }) {
    return this.prisma.backupJob.update({
      where: { id },
      data: { status: BackupJobStatus.SUCCEEDED, completedAt: new Date(), ...data },
    });
  }

  async getRetainedSucceededJobs() {
    return this.prisma.backupJob.findMany({
      where: { status: BackupJobStatus.SUCCEEDED, retained: true, type: { not: BackupJobType.SAFETY } },
      orderBy: { completedAt: 'desc' },
      select: { id: true, snapshotId: true },
    });
  }

  async markJobPruned(id: string) {
    return this.prisma.backupJob.update({ where: { id }, data: { retained: false, storageKey: null, manifestKey: null } });
  }

  async failJob(id: string, message: string, verifyFailed = false) {
    return this.prisma.backupJob.update({
      where: { id },
      data: { status: verifyFailed ? BackupJobStatus.VERIFY_FAILED : BackupJobStatus.FAILED, completedAt: new Date(), errorMessage: message.slice(0, 2000) },
    });
  }

  async completeRestore(id: string) {
    return this.prisma.backupRestoreRequest.update({ where: { id }, data: { status: BackupRestoreStatus.SUCCEEDED, completedAt: new Date() } });
  }

  async failRestore(id: string, message: string) {
    return this.prisma.backupRestoreRequest.update({ where: { id }, data: { status: BackupRestoreStatus.FAILED, completedAt: new Date(), errorMessage: message.slice(0, 2000) } });
  }

  async hasActiveOfficialAttempt() {
    return (await this.prisma.examAttempt.count({ where: { mode: 'OFFICIAL', status: { in: [...ACTIVE_ATTEMPT_STATUSES] } } })) > 0;
  }
}
