import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BackupJobStatus, BackupJobType, BackupRestoreStatus, BackupRestoreTarget, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import { parse, resolve } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApproveRestoreRequestDto, CreateBackupJobDto, CreateRestoreRequestDto, RejectRestoreRequestDto } from './dto/backup.dto';
import { UpsertBackupStorageTargetDto, UpdateBackupSettingsDto } from './dto/backup-settings.dto';
import { BackupStorageService } from './backup-storage.service';
import { BackupConfigService, BackupRuntimeConfig } from './backup-config.service';
import { BackupStorageTarget, SafeBackupStorageTarget } from './backup-storage.types';

export interface BackupSettings {
  autoBackupEnabled: boolean;
  intervalDays: number;
  backupTime: string;
  maxRetentionCount: number;
  dualStorageEnabled: boolean;
  primaryPath: string;
  secondaryPath: string;
  storageTargets: SafeBackupStorageTarget[];
}

const ACTIVE_ATTEMPT_STATUSES = ['DEVICE_CHECK', 'READY', 'IN_PROGRESS', 'DISCONNECTED'] as const;
export const PRODUCTION_MAINTENANCE_LOCK_PREFIX = '[MAINTENANCE_LOCKED]';
export const BACKUP_WORKER_ADVISORY_KEY = 84921031;
export const PRODUCTION_MAINTENANCE_ADVISORY_KEY = 84921032;
type BackupDb = PrismaService | Prisma.TransactionClient;

@Injectable()
export class BackupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: BackupStorageService,
    private readonly config: BackupConfigService,
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
    const stored = await this.loadStoredConfig();
    const runtimeTargets = stored.storageTargets.map((target) => this.config.decryptTarget(target));
    this.storage.setTargets(runtimeTargets);
    this.storage.setDualStorageEnabled(stored.dualStorageEnabled);
    return {
      autoBackupEnabled: stored.autoBackupEnabled,
      intervalDays: stored.intervalDays,
      backupTime: stored.backupTime,
      maxRetentionCount: stored.maxRetentionCount,
      dualStorageEnabled: stored.dualStorageEnabled,
      primaryPath: runtimeTargets.find((target) => target.role === 'PRIMARY')?.config.path || this.storage.getPrimaryPath(),
      secondaryPath: runtimeTargets.find((target) => target.role === 'MIRROR' && target.provider === 'LOCAL')?.config.path || this.storage.getSecondaryPath(),
      storageTargets: stored.storageTargets.map((target) => this.config.sanitizeTarget(target)),
    };
  }

  private defaultStoredConfig(): BackupRuntimeConfig {
    const legacyTargets = this.storage.getLegacyTargets().map((target) => this.config.encryptTarget(target));
    return {
      autoBackupEnabled: true,
      intervalDays: Number(process.env.BACKUP_INTERVAL_DAYS || 1),
      backupTime: process.env.BACKUP_SCHEDULE || '02:00',
      maxRetentionCount: Number(process.env.BACKUP_MAX_RETENTION || 10),
      dualStorageEnabled: true,
      primaryPath: this.storage.getPrimaryPath(),
      secondaryPath: this.storage.getSecondaryPath(),
      storageTargets: legacyTargets,
    };
  }

  private async loadStoredConfig() {
    const fallback = this.defaultStoredConfig();
    const stored = await this.config.read<Partial<BackupRuntimeConfig>>(fallback);
    const migratedTargets = fallback.storageTargets.map((encrypted) => {
      const target = this.config.decryptTarget(encrypted);
      if (target.provider === 'LOCAL' && target.role === 'PRIMARY' && stored.primaryPath) target.config.path = stored.primaryPath;
      if (target.provider === 'LOCAL' && target.role === 'MIRROR' && stored.secondaryPath) target.config.path = stored.secondaryPath;
      return this.config.encryptTarget(target);
    });
    const result: BackupRuntimeConfig = {
      ...fallback,
      ...stored,
      autoBackupEnabled: stored.autoBackupEnabled !== false,
      intervalDays: Number(stored.intervalDays) || 1,
      backupTime: stored.backupTime || '02:00',
      maxRetentionCount: Number(stored.maxRetentionCount) || 10,
      dualStorageEnabled: stored.dualStorageEnabled !== false,
      storageTargets: Array.isArray(stored.storageTargets) && stored.storageTargets.length
        ? stored.storageTargets
        : migratedTargets,
    };
    if (!Array.isArray(stored.storageTargets)) await this.config.write(result);
    return result;
  }

  async updateSettings(dto: UpdateBackupSettingsDto, user?: { id: number; username: string }): Promise<BackupSettings> {
    const current = await this.loadStoredConfig();
    const updated: BackupRuntimeConfig = {
      ...current,
      autoBackupEnabled: dto.autoBackupEnabled ?? current.autoBackupEnabled,
      intervalDays: dto.intervalDays ?? current.intervalDays,
      backupTime: dto.backupTime ?? current.backupTime,
      maxRetentionCount: dto.maxRetentionCount ?? current.maxRetentionCount,
      dualStorageEnabled: dto.dualStorageEnabled ?? current.dualStorageEnabled,
    };
    await this.config.write(updated);
    const safeUpdated = await this.getSettings();

    await this.audit.write({
      action: 'BACKUP_SETTINGS_UPDATED',
      entityType: 'BACKUP_SETTINGS',
      entityId: 'GLOBAL',
      description: `Cập nhật lịch sao lưu: chu kỳ ${safeUpdated.intervalDays} ngày, chạy lúc ${safeUpdated.backupTime}, giữ tối đa ${safeUpdated.maxRetentionCount} bản.`,
      metadata: { autoBackupEnabled: safeUpdated.autoBackupEnabled, intervalDays: safeUpdated.intervalDays, backupTime: safeUpdated.backupTime, maxRetentionCount: safeUpdated.maxRetentionCount, dualStorageEnabled: safeUpdated.dualStorageEnabled } as any,
      actorId: user?.id,
    });

    // Tự động dọn dẹp các bản sao lưu cũ vượt quá số lượng lưu giữ mới ngay lập tức
    try {
      await this.applyRetention();
    } catch {}

    return safeUpdated;
  }

  private normalizeStoragePath(value: string, label: string) {
    const trimmed = value.trim();
    if (!trimmed) throw new BadRequestException(`Vui lòng nhập vị trí ${label}.`);
    const absolute = resolve(trimmed);
    if (absolute === parse(absolute).root || absolute === resolve(process.cwd())) {
      throw new BadRequestException(`Vị trí ${label} không được là thư mục gốc hoặc thư mục ứng dụng.`);
    }
    return absolute;
  }

  private validateTargetInput(dto: UpsertBackupStorageTargetDto) {
    const name = dto.name.trim();
    if (name.length < 2 || name.length > 80) throw new BadRequestException('Tên nơi lưu phải từ 2 đến 80 ký tự.');
    const config = { ...dto.config };
    if (dto.provider === 'LOCAL') config.path = this.normalizeStoragePath(config.path || '', 'lưu trữ local');
    if (dto.provider !== 'LOCAL' && dto.provider !== 'GOOGLE_DRIVE' && !config.bucket?.trim()) {
      throw new BadRequestException('Vui lòng nhập tên bucket.');
    }
    if (dto.provider !== 'LOCAL' && dto.provider !== 'GOOGLE_DRIVE' && (!config.accessKeyId || !config.secretAccessKey)) {
      throw new BadRequestException('Vui lòng nhập đầy đủ Access Key ID và Secret Access Key.');
    }
    if (dto.provider === 'R2' && !config.endpoint && !config.accountId) throw new BadRequestException('Cloudflare R2 cần Account ID hoặc endpoint.');
    if (['B2', 'MINIO'].includes(dto.provider) && !config.endpoint) throw new BadRequestException(`${dto.provider} cần endpoint kết nối.`);
    if (dto.provider === 'GOOGLE_DRIVE' && (!config.clientId || !config.clientSecret)) {
      throw new BadRequestException('Google Drive cần Client ID và Client Secret trước khi kết nối OAuth.');
    }
    return { name, config };
  }

  async createStorageTarget(dto: UpsertBackupStorageTargetDto, user?: { id: number }) {
    const stored = await this.loadStoredConfig();
    const validated = this.validateTargetInput(dto);
    const now = new Date().toISOString();
    if (dto.role === 'PRIMARY') {
      stored.storageTargets = stored.storageTargets.map((item) => ({ ...item, role: 'MIRROR', updatedAt: now }));
    }
    const target: BackupStorageTarget = this.config.encryptTarget({
      id: randomUUID(), name: validated.name, provider: dto.provider, role: dto.role,
      enabled: dto.enabled !== false, config: validated.config, createdAt: now, updatedAt: now,
    });
    stored.storageTargets.push(target);
    await this.config.write(stored);
    await this.getSettings();
    await this.audit.write({ actorId: user?.id, action: 'BACKUP_STORAGE_CREATED', entityType: 'BACKUP_STORAGE', entityId: target.id, description: `Đã thêm nơi lưu ${target.name} (${target.provider}).`, metadata: { provider: target.provider, role: target.role } as any });
    return this.config.sanitizeTarget(target);
  }

  async updateStorageTarget(id: string, dto: UpsertBackupStorageTargetDto, user?: { id: number }) {
    const stored = await this.loadStoredConfig();
    const index = stored.storageTargets.findIndex((item) => item.id === id);
    if (index < 0) throw new NotFoundException('Không tìm thấy nơi lưu backup.');
    const existing = this.config.decryptTarget(stored.storageTargets[index]);
    const validated = this.validateTargetInput({ ...dto, config: { ...existing.config, ...dto.config } });
    const now = new Date().toISOString();
    if (dto.role === 'PRIMARY') {
      stored.storageTargets = stored.storageTargets.map((item) => item.id === id ? item : ({ ...item, role: 'MIRROR', updatedAt: now }));
    }
    const merged: BackupStorageTarget = {
      ...existing, name: validated.name, provider: dto.provider, role: dto.role,
      enabled: dto.enabled !== false, config: validated.config, updatedAt: now,
      lastTestedAt: undefined, lastTestStatus: undefined, lastTestMessage: undefined,
    };
    stored.storageTargets[index] = this.config.encryptTarget(merged);
    const activePrimaries = stored.storageTargets.filter((item) => item.enabled && item.role === 'PRIMARY');
    if (activePrimaries.length !== 1) throw new BadRequestException('Phải có đúng một kho chính đang hoạt động.');
    await this.config.write(stored);
    await this.getSettings();
    await this.audit.write({ actorId: user?.id, action: 'BACKUP_STORAGE_UPDATED', entityType: 'BACKUP_STORAGE', entityId: id, description: `Đã cập nhật nơi lưu ${merged.name}.`, metadata: { provider: merged.provider, role: merged.role, enabled: merged.enabled } as any });
    return this.config.sanitizeTarget(stored.storageTargets[index]);
  }

  async deleteStorageTarget(id: string, user?: { id: number }) {
    const stored = await this.loadStoredConfig();
    const target = stored.storageTargets.find((item) => item.id === id);
    if (!target) throw new NotFoundException('Không tìm thấy nơi lưu backup.');
    if (target.role === 'PRIMARY') throw new BadRequestException('Hãy đặt một nơi lưu khác làm kho chính trước khi xóa.');
    stored.storageTargets = stored.storageTargets.filter((item) => item.id !== id);
    await this.config.write(stored);
    await this.getSettings();
    await this.audit.write({ actorId: user?.id, action: 'BACKUP_STORAGE_DELETED', entityType: 'BACKUP_STORAGE', entityId: id, description: `Đã xóa kết nối ${target.name}; dữ liệu trên kho không bị xóa.`, metadata: { provider: target.provider } as any });
    return { success: true, message: 'Đã xóa kết nối; dữ liệu backup trên nhà cung cấp được giữ nguyên.' };
  }

  async testStorageTarget(id: string, user?: { id: number }) {
    const stored = await this.loadStoredConfig();
    const index = stored.storageTargets.findIndex((item) => item.id === id);
    if (index < 0) throw new NotFoundException('Không tìm thấy nơi lưu backup.');
    const target = this.config.decryptTarget(stored.storageTargets[index]);
    const testedAt = new Date().toISOString();
    try {
      const message = await this.storage.testTarget(target);
      stored.storageTargets[index] = { ...stored.storageTargets[index], lastTestedAt: testedAt, lastTestStatus: 'ONLINE', lastTestMessage: message };
      await this.config.write(stored);
      await this.audit.write({ actorId: user?.id, action: 'BACKUP_STORAGE_TESTED', entityType: 'BACKUP_STORAGE', entityId: id, description: `Kiểm tra kết nối ${target.name} thành công.`, metadata: { provider: target.provider, outcome: 'SUCCESS' } as any });
      return { success: true, message, testedAt };
    } catch (error: any) {
      const message = error?.message || 'Không thể kết nối nơi lưu.';
      stored.storageTargets[index] = { ...stored.storageTargets[index], lastTestedAt: testedAt, lastTestStatus: 'ERROR', lastTestMessage: message };
      await this.config.write(stored);
      await this.audit.write({ actorId: user?.id, action: 'BACKUP_STORAGE_TEST_FAILED', entityType: 'BACKUP_STORAGE', entityId: id, description: `Kiểm tra kết nối ${target.name} thất bại.`, metadata: { provider: target.provider, outcome: 'FAILURE' } as any });
      throw new BadRequestException(message);
    }
  }

  private googleRedirectUri() {
    const frontend = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    return `${frontend}/admin/settings/google-drive/callback`;
  }

  private signGoogleState(payload: { targetId: string; userId: number; expiresAt: number }) {
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new BadRequestException('Hệ thống chưa có khóa ký OAuth.');
    const signature = createHmac('sha256', secret).update(encoded).digest('base64url');
    return `${encoded}.${signature}`;
  }

  private verifyGoogleState(state: string, targetId: string, userId: number) {
    const [encoded, signature] = state.split('.');
    const secret = process.env.JWT_SECRET;
    if (!encoded || !signature || !secret) throw new BadRequestException('Trạng thái kết nối Google Drive không hợp lệ.');
    const expected = createHmac('sha256', secret).update(encoded).digest('base64url');
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
      throw new BadRequestException('Chữ ký kết nối Google Drive không hợp lệ.');
    }
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as { targetId: string; userId: number; expiresAt: number };
    if (payload.targetId !== targetId || payload.userId !== userId || payload.expiresAt < Date.now()) {
      throw new BadRequestException('Yêu cầu kết nối Google Drive đã hết hạn hoặc không thuộc tài khoản hiện tại.');
    }
  }

  async getGoogleDriveAuthorization(id: string, user: { id: number }) {
    const stored = await this.loadStoredConfig();
    const encrypted = stored.storageTargets.find((item) => item.id === id);
    if (!encrypted) throw new NotFoundException('Không tìm thấy nơi lưu backup.');
    const target = this.config.decryptTarget(encrypted);
    if (target.provider !== 'GOOGLE_DRIVE') throw new BadRequestException('Nơi lưu này không phải Google Drive.');
    if (!target.config.clientId || !target.config.clientSecret) throw new BadRequestException('Vui lòng lưu Client ID và Client Secret trước.');
    const state = this.signGoogleState({ targetId: id, userId: user.id, expiresAt: Date.now() + 10 * 60 * 1000 });
    const query = new URLSearchParams({
      client_id: target.config.clientId,
      redirect_uri: this.googleRedirectUri(),
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/drive.file',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    return { authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${query.toString()}` };
  }

  async completeGoogleDriveConnection(id: string, code: string, state: string, user: { id: number }) {
    this.verifyGoogleState(state, id, user.id);
    const stored = await this.loadStoredConfig();
    const index = stored.storageTargets.findIndex((item) => item.id === id);
    if (index < 0) throw new NotFoundException('Không tìm thấy nơi lưu backup.');
    const target = this.config.decryptTarget(stored.storageTargets[index]);
    if (target.provider !== 'GOOGLE_DRIVE' || !target.config.clientId || !target.config.clientSecret) {
      throw new BadRequestException('Cấu hình Google Drive không hợp lệ.');
    }
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: target.config.clientId,
        client_secret: target.config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.googleRedirectUri(),
      }),
    });
    const tokenData = await tokenResponse.json() as { refresh_token?: string; error_description?: string };
    if (!tokenResponse.ok || !tokenData.refresh_token) {
      throw new BadRequestException(tokenData.error_description || 'Google không trả về quyền truy cập dài hạn. Hãy thử kết nối lại và đồng ý cấp quyền.');
    }
    target.config.refreshToken = tokenData.refresh_token;
    target.updatedAt = new Date().toISOString();
    target.lastTestStatus = undefined;
    target.lastTestMessage = undefined;
    stored.storageTargets[index] = this.config.encryptTarget(target);
    await this.config.write(stored);
    await this.getSettings();
    await this.audit.write({ actorId: user.id, action: 'BACKUP_GOOGLE_DRIVE_CONNECTED', entityType: 'BACKUP_STORAGE', entityId: id, description: `Đã kết nối Google Drive cho ${target.name}.`, metadata: { provider: 'GOOGLE_DRIVE' } as any });
    return { success: true, message: 'Đã kết nối Google Drive thành công.' };
  }

  async overview() {
    const settings = await this.getSettings();
    const [latest, running, failed24h, totalBytes, pendingRestores, lastFailedJob, pgDumpOk, pgRestoreOk, storageOverview] = await Promise.all([
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
      this.storage.getStorageStatusOverview(),
    ]);

    const ageHours = latest?.completedAt ? (Date.now() - latest.completedAt.getTime()) / 3_600_000 : Infinity;
    const status = failed24h > 0 || ageHours > 26 ? 'WARNING' : latest ? 'HEALTHY' : 'ERROR';
    const isWorkerEnabled = process.env.BACKUP_WORKER_ENABLED === 'true';
    const isLocal = storageOverview.primary.provider === 'LOCAL';

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
        provider: storageOverview.primary.provider,
        isLocal,
        dualStorageEnabled: storageOverview.dualStorageEnabled,
        primary: storageOverview.primary,
        secondary: storageOverview.secondary,
        targets: storageOverview.targets,
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
    
    const where: Prisma.BackupJobWhereInput = {
      retained: true,
    };

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
      where: { retained: true, type: { not: BackupJobType.SAFETY } },
      orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, snapshotId: true },
    });
  }

  async applyRetention(db: BackupDb = this.prisma) {
    const jobs = await this.getRetainedSucceededJobs(db);
    const settings = await this.getSettings();
    const maxCount = Math.max(1, settings.maxRetentionCount || 10);
    const keep = new Set<string>(jobs.slice(0, maxCount).map((job) => job.id));

    let prunedCount = 0;
    for (const job of jobs) {
      if (keep.has(job.id)) continue;
      try {
        await this.storage.removePrefix(this.storage.key('snapshots', job.snapshotId));
      } catch {}
      try {
        await (db as any).backupJob.delete({ where: { id: job.id } });
      } catch {
        await this.markJobPruned(job.id, db);
      }
      prunedCount++;
    }
    return { total: jobs.length, kept: Math.min(jobs.length, maxCount), pruned: prunedCount };
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
