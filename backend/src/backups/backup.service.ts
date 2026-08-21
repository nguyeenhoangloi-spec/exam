import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BackupJobStatus, BackupJobType, BackupRestoreStatus, BackupRestoreTarget, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApproveRestoreRequestDto, CreateBackupJobDto, CreateRestoreRequestDto, RejectRestoreRequestDto } from './dto/backup.dto';
import { UpdateBackupSettingsDto } from './dto/backup-settings.dto';
import { BackupStorageService } from './backup-storage.service';

export interface BackupSettings {
  autoBackupEnabled: boolean;
  intervalDays: number;
  backupTime: string;
  maxRetentionCount: number;
  dualStorageEnabled: boolean;
  primaryPath: string;
  secondaryPath: string;
}

const ACTIVE_ATTEMPT_STATUSES = ['DEVICE_CHECK', 'READY', 'IN_PROGRESS', 'DISCONNECTED'] as const;
export const PRODUCTION_MAINTENANCE_LOCK_PREFIX = '[MAINTENANCE_LOCKED]';
export const BACKUP_WORKER_ADVISORY_KEY = 84921031;
export const PRODUCTION_MAINTENANCE_ADVISORY_KEY = 84921032;
type BackupDb = PrismaService | Prisma.TransactionClient;

@Injectable()
export class BackupService {
  private readonly configPath = join(process.cwd(), 'backup-runtime', 'backup-config.json');

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: BackupStorageService,
  ) {}

  private restoreConfirmationPhrase(requestId: string) {
    return `RESTORE ${requestId.slice(0, 8).toUpperCase()}`;
  }

  private serializeJob(job: any) {
    const { storageKey: _storageKey, manifestKey: _manifestKey, restoreRequests: _restoreRequests, ...safeJob } = job;
    return {
      ...safeJob,
      sizeBytes: safeJob.sizeBytes == null ? null : String(safeJob.sizeBytes),
    };
  }

  private serializeRestore(request: any) {
    const { confirmationHash: _confirmationHash, ...safeRequest } = request;
    const confirmationPhrase = typeof request.confirmationHash === 'string' && request.confirmationHash.startsWith('v2:')
      ? this.restoreConfirmationPhrase(request.id)
      : undefined;
    return {
      ...safeRequest,
      // BackupJob.sizeBytes is a Prisma BigInt. Normalize the nested job too
      // or JSON serialization makes GET /backups/restore-requests return 500.
      backupJob: request.backupJob ? this.serializeJob(request.backupJob) : request.backupJob,
      confirmationPhrase,
    };
  }

  private toolPath(tool: 'pg_dump' | 'pg_restore') {
    const configured = process.env[tool === 'pg_dump' ? 'BACKUP_PG_DUMP_PATH' : 'BACKUP_PG_RESTORE_PATH'];
    return configured?.trim() || tool;
  }

  private checkToolAvailable(tool: 'pg_dump' | 'pg_restore'): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const child = spawn(this.toolPath(tool), ['--version'], { windowsHide: true });
        child.on('error', () => resolve(false));
        child.on('close', (code) => resolve(code === 0));
      } catch {
        resolve(false);
      }
    });
  }

  async getSettings(): Promise<BackupSettings> {
    try {
      const content = await readFile(this.configPath, 'utf-8');
      const parsed = JSON.parse(content);
      const settings: BackupSettings = {
        autoBackupEnabled: parsed.autoBackupEnabled !== false,
        intervalDays: Number(parsed.intervalDays) || 1,
        backupTime: parsed.backupTime || '02:00',
        maxRetentionCount: Number(parsed.maxRetentionCount) || 10,
        dualStorageEnabled: parsed.dualStorageEnabled !== false,
        primaryPath: parsed.primaryPath || this.storage.getPrimaryPath(),
        secondaryPath: parsed.secondaryPath || this.storage.getSecondaryPath(),
      };
      this.storage.setDualStorageEnabled(settings.dualStorageEnabled);
      this.storage.setSecondaryPath(settings.secondaryPath);
      return settings;
    } catch {
      const defaultSettings: BackupSettings = {
        autoBackupEnabled: true,
        intervalDays: Number(process.env.BACKUP_INTERVAL_DAYS || 1),
        backupTime: process.env.BACKUP_SCHEDULE || '02:00',
        maxRetentionCount: Number(process.env.BACKUP_MAX_RETENTION || 10),
        dualStorageEnabled: true,
        primaryPath: this.storage.getPrimaryPath(),
        secondaryPath: this.storage.getSecondaryPath(),
      };
      try {
        await mkdir(dirname(this.configPath), { recursive: true });
        await writeFile(this.configPath, JSON.stringify(defaultSettings, null, 2), 'utf-8');
      } catch {}
      this.storage.setDualStorageEnabled(defaultSettings.dualStorageEnabled);
      this.storage.setSecondaryPath(defaultSettings.secondaryPath);
      return defaultSettings;
    }
  }

  async updateSettings(dto: UpdateBackupSettingsDto, user?: { id: number; username: string }): Promise<BackupSettings> {
    const current = await this.getSettings();
    const updated: BackupSettings = {
      autoBackupEnabled: dto.autoBackupEnabled !== undefined ? dto.autoBackupEnabled : current.autoBackupEnabled,
      intervalDays: dto.intervalDays !== undefined ? dto.intervalDays : current.intervalDays,
      backupTime: dto.backupTime !== undefined ? dto.backupTime : current.backupTime,
      maxRetentionCount: dto.maxRetentionCount !== undefined ? dto.maxRetentionCount : current.maxRetentionCount,
      dualStorageEnabled: dto.dualStorageEnabled !== undefined ? dto.dualStorageEnabled : current.dualStorageEnabled,
      primaryPath: current.primaryPath,
      secondaryPath: dto.secondaryPath !== undefined && dto.secondaryPath.trim() ? dto.secondaryPath.trim() : current.secondaryPath,
    };

    await mkdir(dirname(this.configPath), { recursive: true });
    await writeFile(this.configPath, JSON.stringify(updated, null, 2), 'utf-8');

    this.storage.setDualStorageEnabled(updated.dualStorageEnabled);
    this.storage.setSecondaryPath(updated.secondaryPath);

    await this.audit.write({
      action: 'BACKUP_SETTINGS_UPDATED',
      entityType: 'BACKUP_SETTINGS',
      entityId: 'GLOBAL',
      description: `Cập nhật cấu hình sao lưu tự động & lưu trữ: Chu kỳ ${updated.intervalDays} ngày, chạy lúc ${updated.backupTime}, giữ tối đa ${updated.maxRetentionCount} bản, lưu 2 nơi: ${updated.dualStorageEnabled ? 'BẬT' : 'TẮT'}.`,
      metadata: updated as any,
      actorId: user?.id,
    });

    return updated;
  }

  async overview() {
    const [latest, running, failed24h, totalBytes, pendingRestores, lastFailedJob, pgDumpOk, pgRestoreOk, settings, storageOverview] = await Promise.all([
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
      this.prisma.backupJob.findFirst({
        where: { status: { in: [BackupJobStatus.FAILED, BackupJobStatus.VERIFY_FAILED] } },
        orderBy: { createdAt: 'desc' },
        select: { errorMessage: true, createdAt: true },
      }),
      this.checkToolAvailable('pg_dump'),
      this.checkToolAvailable('pg_restore'),
      this.getSettings(),
      this.storage.getStorageStatusOverview(),
    ]);

    const ageHours = latest?.completedAt ? (Date.now() - latest.completedAt.getTime()) / 3_600_000 : Infinity;
    const status = failed24h > 0 || ageHours > 26 ? 'WARNING' : latest ? 'HEALTHY' : 'ERROR';
    const isWorkerEnabled = process.env.BACKUP_WORKER_ENABLED === 'true';
    const isLocal = !process.env.BACKUP_STORAGE_BUCKET;

    return {
      status,
      timezone: process.env.BACKUP_TIMEZONE || 'Asia/Ho_Chi_Minh',
      schedule: settings.backupTime,
      retention: {
        daily: settings.maxRetentionCount,
        weekly: Number(process.env.BACKUP_RETENTION_WEEKLY || 8),
        monthly: Number(process.env.BACKUP_RETENTION_MONTHLY || 12),
      },
      settings,
      worker: {
        enabled: settings.autoBackupEnabled && isWorkerEnabled,
        schedule: settings.backupTime,
        lastError: lastFailedJob?.errorMessage || null,
        lastErrorAt: lastFailedJob?.createdAt ? lastFailedJob.createdAt.toISOString() : null,
      },
      storage: {
        provider: isLocal ? 'LOCAL' : 'S3',
        isLocal,
        dualStorageEnabled: storageOverview.dualStorageEnabled,
        primary: storageOverview.primary,
        secondary: storageOverview.secondary,
        warning: !storageOverview.dualStorageEnabled && isLocal ? 'Backup hiện chỉ lưu tại 1 vị trí local, chưa kích hoạt kho lưu trữ dự phòng thứ 2.' : null,
      },
      tools: {
        pgDumpAvailable: pgDumpOk,
        pgRestoreAvailable: pgRestoreOk,
      },
      latest: latest ? this.serializeJob(latest) : null,
      running,
      failed24h,
      pendingRestores,
      totalBytes: totalBytes._sum.sizeBytes == null ? '0' : String(totalBytes._sum.sizeBytes),
    };
  }

  async listJobs(options: {
    page?: number;
    limit?: number;
    type?: BackupJobType;
    status?: BackupJobStatus;
    isScheduled?: boolean;
    fromDate?: string;
    toDate?: string;
    search?: string;
  } = {}) {
    const safePage = Math.max(1, Number(options.page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    
    const where: Prisma.BackupJobWhereInput = {};

    if (options.status) where.status = options.status;
    if (options.type) where.type = options.type;

    if (options.isScheduled !== undefined) {
      if (options.isScheduled) {
        where.initiatedById = null;
      } else {
        where.initiatedById = { not: null };
      }
    }

    if (options.fromDate || options.toDate) {
      where.createdAt = {};
      if (options.fromDate) where.createdAt.gte = new Date(options.fromDate);
      if (options.toDate) where.createdAt.lte = new Date(options.toDate);
    }

    if (options.search?.trim()) {
      const q = options.search.trim();
      where.OR = [
        { snapshotId: { contains: q, mode: 'insensitive' } },
        { errorMessage: { contains: q, mode: 'insensitive' } },
      ];
    }

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
      where: {
        OR: [
          { status: { in: [BackupRestoreStatus.PENDING_APPROVAL, BackupRestoreStatus.APPROVED, BackupRestoreStatus.RUNNING] } },
          { target: BackupRestoreTarget.PRODUCTION, status: BackupRestoreStatus.FAILED, errorMessage: { startsWith: PRODUCTION_MAINTENANCE_LOCK_PREFIX } },
        ],
      },
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

    const requestId = randomUUID();
    const phrase = this.restoreConfirmationPhrase(requestId);
    const request = await this.prisma.backupRestoreRequest.create({
      data: {
        id: requestId,
        backupJobId: job.id,
        target: dto.target,
        reason: dto.reason,
        requestedById: actorId,
        confirmationHash: `v2:${createHash('sha256').update(phrase).digest('hex')}`,
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
    const expectedConfirmationHash = request.confirmationHash?.startsWith('v2:')
      ? request.confirmationHash.slice(3)
      : request.confirmationHash;
    if (confirmationHash !== expectedConfirmationHash) {
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
    const isMaintenanceUnlock = request.target === BackupRestoreTarget.PRODUCTION
      && request.status === BackupRestoreStatus.FAILED
      && request.errorMessage?.startsWith(PRODUCTION_MAINTENANCE_LOCK_PREFIX);
    if (request.status !== BackupRestoreStatus.PENDING_APPROVAL && !isMaintenanceUnlock) {
      throw new ConflictException('Yêu cầu restore không còn chờ duyệt hoặc không cần mở khóa.');
    }
    const updated = await this.prisma.backupRestoreRequest.update({
      where: { id },
      data: { status: BackupRestoreStatus.REJECTED, errorMessage: dto.reason },
      include: { backupJob: true },
    });
    await this.audit.write({
      actorId,
      action: isMaintenanceUnlock ? 'BACKUP_MAINTENANCE_UNLOCKED' : 'BACKUP_RESTORE_REJECTED',
      entityType: 'BACKUP_RESTORE_REQUEST',
      entityId: id,
      description: `Đã từ chối restore từ ${request.backupJob.snapshotId}.`,
      metadata: { reason: dto.reason } as Prisma.InputJsonValue,
    });
    return this.serializeRestore(updated);
  }

  async claimNextJob(db: BackupDb = this.prisma) {
    const job = await db.backupJob.findFirst({ where: { status: BackupJobStatus.QUEUED }, orderBy: { createdAt: 'asc' } });
    if (!job) return null;
    const claimed = await db.backupJob.updateMany({
      where: { id: job.id, status: BackupJobStatus.QUEUED },
      data: { status: BackupJobStatus.RUNNING, startedAt: new Date() },
    });
    if (claimed.count !== 1) return null;
    return db.backupJob.findUnique({ where: { id: job.id } });
  }

  async claimNextRestore(db: BackupDb = this.prisma) {
    const request = await db.backupRestoreRequest.findFirst({
      where: { status: BackupRestoreStatus.APPROVED, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'asc' },
      include: { backupJob: true },
    });
    if (!request) return null;
    const claimed = await db.backupRestoreRequest.updateMany({
      where: { id: request.id, status: BackupRestoreStatus.APPROVED },
      data: { status: BackupRestoreStatus.RUNNING, startedAt: new Date() },
    });
    if (claimed.count !== 1) return null;
    return db.backupRestoreRequest.findUnique({ where: { id: request.id }, include: { backupJob: true } });
  }

  async markJobVerifying(id: string, db: BackupDb = this.prisma) {
    return db.backupJob.update({ where: { id }, data: { status: BackupJobStatus.VERIFYING } });
  }

  async markRestoreRunning(id: string, db: BackupDb = this.prisma) {
    return db.backupRestoreRequest.update({ where: { id }, data: { status: BackupRestoreStatus.RUNNING, startedAt: new Date() } });
  }

  async completeJob(id: string, data: { storageKey: string; manifestKey: string; checksum: string; sizeBytes: bigint; migration?: string; appCommit?: string }, db: BackupDb = this.prisma) {
    return db.backupJob.update({
      where: { id },
      data: { status: BackupJobStatus.SUCCEEDED, completedAt: new Date(), ...data },
    });
  }

  async getRetainedSucceededJobs(db: BackupDb = this.prisma) {
    return db.backupJob.findMany({
      where: { status: BackupJobStatus.SUCCEEDED, retained: true, type: { not: BackupJobType.SAFETY } },
      orderBy: { completedAt: 'desc' },
      select: { id: true, snapshotId: true },
    });
  }

  async markJobPruned(id: string, db: BackupDb = this.prisma) {
    return db.backupJob.update({ where: { id }, data: { retained: false, storageKey: null, manifestKey: null } });
  }

  async failJob(id: string, message: string, verifyFailed = false, db: BackupDb = this.prisma) {
    return db.backupJob.update({
      where: { id },
      data: { status: verifyFailed ? BackupJobStatus.VERIFY_FAILED : BackupJobStatus.FAILED, completedAt: new Date(), errorMessage: message.slice(0, 2000) },
    });
  }

  async completeRestore(id: string, db: BackupDb = this.prisma) {
    return db.backupRestoreRequest.update({ where: { id }, data: { status: BackupRestoreStatus.SUCCEEDED, completedAt: new Date() } });
  }

  async failRestore(id: string, message: string, db: BackupDb = this.prisma, keepMaintenanceLock = false) {
    const errorMessage = keepMaintenanceLock
      ? `${PRODUCTION_MAINTENANCE_LOCK_PREFIX} ${message}`
      : message;
    return db.backupRestoreRequest.update({ where: { id }, data: { status: BackupRestoreStatus.FAILED, completedAt: new Date(), errorMessage: errorMessage.slice(0, 2000) } });
  }

  async hasActiveOfficialAttempt(db: BackupDb = this.prisma) {
    return (await db.examAttempt.count({ where: { mode: 'OFFICIAL', status: { in: [...ACTIVE_ATTEMPT_STATUSES] } } })) > 0;
  }
}
