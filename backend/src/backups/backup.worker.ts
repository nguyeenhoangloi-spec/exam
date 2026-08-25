import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BackupJobStatus, BackupJobType, BackupRestoreTarget, Prisma } from '@prisma/client';
import * as cron from 'node-cron';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { BackupService, BACKUP_WORKER_ADVISORY_KEY, PRODUCTION_MAINTENANCE_ADVISORY_KEY } from './backup.service';
import { BackupStorageService } from './backup-storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

type ManifestEntry = { path: string; size: number; modifiedAt: string; sha256: string };

@Injectable()
export class BackupWorker implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private scheduledTask?: cron.ScheduledTask;
  private lastScheduledSlot?: string;
  private running = false;

  constructor(
    private readonly backup: BackupService,
    private readonly storage: BackupStorageService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  onModuleInit() {
    if (process.env.BACKUP_WORKER_ENABLED !== 'true') return;
    this.timer = setInterval(() => void this.tick(), 5_000);
    // Poll once per minute so a schedule changed from the admin UI takes effect
    // without restarting the worker. The configured time is checked inside the callback.
    this.scheduledTask = cron.schedule('* * * * *', () => void this.checkAutoBackupSchedule(), {
      timezone: process.env.BACKUP_TIMEZONE || 'Asia/Ho_Chi_Minh',
    });
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    this.scheduledTask?.stop();
  }

  private toolPath(tool: 'pg_dump' | 'pg_restore') {
    const configured = process.env[tool === 'pg_dump' ? 'BACKUP_PG_DUMP_PATH' : 'BACKUP_PG_RESTORE_PATH'];
    return configured?.trim() || tool;
  }

  // Prisma accepts `schema=...` in DATABASE_URL; libpq tools do not.
  private cliDatabaseUrl(databaseUrl: string) {
    try {
      const url = new URL(databaseUrl);
      url.searchParams.delete('schema');
      return url.toString();
    } catch {
      return databaseUrl;
    }
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const configuredTimeout = Number(process.env.BACKUP_LOCK_TIMEOUT_MS);
      const lockTimeout = Number.isFinite(configuredTimeout) && configuredTimeout >= 30_000 ? configuredTimeout : 7_200_000;
      await this.prisma.$transaction(async (tx) => {
        const lock = await tx.$queryRaw<{ locked: boolean }[]>`SELECT pg_try_advisory_xact_lock(${BACKUP_WORKER_ADVISORY_KEY}) AS locked`;
        if (!lock[0]?.locked) return;
        const job = await this.backup.claimNextJob(tx);
        if (job) await this.runJob(job, tx);
        const restore = await this.backup.claimNextRestore(tx);
        if (restore) await this.runRestore(restore, tx);
      }, { maxWait: 10_000, timeout: lockTimeout });
    } finally {
      this.running = false;
    }
  }

  private async checkAutoBackupSchedule() {
    try {
      const settings = await this.backup.getSettings();
      if (!settings.autoBackupEnabled) return;

      const timezone = process.env.BACKUP_TIMEZONE || 'Asia/Ho_Chi_Minh';
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(new Date()).reduce<Record<string, string>>((acc, part) => {
        if (part.type !== 'literal') acc[part.type] = part.value;
        return acc;
      }, {});
      const currentTime = `${parts.hour}:${parts.minute}`;
      const slot = `${parts.year}-${parts.month}-${parts.day} ${currentTime}`;
      if (currentTime !== settings.backupTime || this.lastScheduledSlot === slot) return;
      this.lastScheduledSlot = slot;

      const intervalMs = Math.max(1, settings.intervalDays) * 24 * 60 * 60 * 1000;
      const latest = await this.prisma.backupJob.findFirst({
        where: { status: BackupJobStatus.SUCCEEDED, initiatedById: null },
        orderBy: { createdAt: 'desc' },
      });

      const timeSinceLast = latest ? Date.now() - latest.createdAt.getTime() : Infinity;
      if (timeSinceLast >= intervalMs) {
        await this.enqueueScheduledBackup();
      }
    } catch {}
  }

  private async enqueueScheduledBackup() {
    const settings = await this.backup.getSettings();
    if (!settings.autoBackupEnabled) return;
    const active = await this.prisma.backupJob.findFirst({ where: { status: { in: [BackupJobStatus.QUEUED, BackupJobStatus.RUNNING, BackupJobStatus.VERIFYING] } } });
    if (active) return;
    if (await this.backup.hasActiveOfficialAttempt()) return;
    await this.prisma.backupJob.create({
      data: {
        snapshotId: `snap_${new Date().toISOString().replace(/[-:.TZ]/g, '')}_scheduled`,
        type: BackupJobType.FULL,
      },
    });
  }

  private async runJob(job: { id: string; snapshotId: string; type: BackupJobType }, db: Prisma.TransactionClient) {
    const workDir = await mkdtemp(join(tmpdir(), 'exam-backup-'));
    let verifying = false;
    try {
      if (process.env.NODE_ENV === 'production' && !process.env.BACKUP_STORAGE_BUCKET) {
        throw new Error('Production backup yêu cầu BACKUP_STORAGE_BUCKET; không dùng local fallback.');
      }
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) throw new Error('Thiếu DATABASE_URL để thực hiện backup.');
      const dumpPath = join(workDir, 'database.dump');
      await this.runCommand(this.toolPath('pg_dump'), ['--format=custom', '--file', dumpPath, '--dbname', this.cliDatabaseUrl(databaseUrl)]);
      await this.backup.markJobVerifying(job.id, db);
      verifying = true;
      await this.runCommand(this.toolPath('pg_restore'), ['--list', dumpPath]);

      const entries = await this.collectUploads();
      const snapshotPrefix = this.storage.key('snapshots', job.snapshotId);
      for (const entry of entries) {
        const source = join(this.uploadRoot(), entry.path.replaceAll('/', '\\'));
        await this.storage.putFile(`${snapshotPrefix}/uploads/${entry.path}`, source);
      }
      const manifest = Buffer.from(JSON.stringify({ snapshotId: job.snapshotId, createdAt: new Date().toISOString(), entries }, null, 2));
      const manifestKey = `${snapshotPrefix}/manifest.json`;
      const databaseKey = `${snapshotPrefix}/database.dump`;
      await this.storage.put(manifestKey, manifest, 'application/json');
      await this.storage.putFile(databaseKey, dumpPath);

      const digest = createHash('sha256');
      digest.update(await readFile(dumpPath));
      digest.update(manifest);
      const dumpStat = await stat(dumpPath);
      const totalSize = BigInt(dumpStat.size + entries.reduce((sum, entry) => sum + entry.size, 0) + manifest.byteLength);
      await this.backup.completeJob(job.id, {
        storageKey: databaseKey,
        manifestKey,
        checksum: digest.digest('hex'),
        sizeBytes: totalSize,
        migration: await this.latestMigration(),
        appCommit: process.env.APP_COMMIT || undefined,
      }, db);
      await this.audit.write({
        action: 'BACKUP_SUCCEEDED',
        entityType: 'BACKUP_JOB',
        entityId: job.id,
        description: `Backup ${job.snapshotId} đã hoàn tất và verify thành công.`,
        metadata: { snapshotId: job.snapshotId } as any,
      }, db);
      if (job.type !== BackupJobType.SAFETY) await this.applyRetention(db);
      return true;
    } catch (error: any) {
      const message = error?.message || 'Backup thất bại.';
      await this.backup.failJob(job.id, message, verifying, db);
      await this.audit.write({
        action: 'BACKUP_FAILED',
        entityType: 'BACKUP_JOB',
        entityId: job.id,
        description: message,
      }, db);
      return false;
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  private async runRestore(
    request: {
      id: string;
      target: BackupRestoreTarget;
      backupJob: { id: string; snapshotId: string; storageKey: string | null; manifestKey: string | null; checksum: string | null };
    },
    db: Prisma.TransactionClient,
  ) {
    let productionMaintenanceLocked = false;
    try {
      if (request.target === BackupRestoreTarget.PRODUCTION) {
        const prodLock = await db.$queryRaw<{ locked: boolean }[]>`SELECT pg_try_advisory_xact_lock(${PRODUCTION_MAINTENANCE_ADVISORY_KEY}) AS locked`;
        if (!prodLock[0]?.locked) throw new Error('Không thể lấy advisory lock cho production restore.');
        productionMaintenanceLocked = true;
      }
      await this.backup.markRestoreRunning(request.id, db);
      if (request.target === BackupRestoreTarget.PRODUCTION) {
        await this.createSafetySnapshot(db);
      }
      const workDir = await mkdtemp(join(tmpdir(), 'exam-restore-'));
      try {
        const prefix = this.storage.key('snapshots', request.backupJob.snapshotId);
        const dumpBuffer = await this.storage.get(`${prefix}/database.dump`);
        const manifestBuffer = await this.storage.get(`${prefix}/manifest.json`);
        const manifest: { snapshotId: string; entries: ManifestEntry[] } = JSON.parse(manifestBuffer.toString('utf-8'));
        const dumpPath = join(workDir, 'database.dump');
        await writeFile(dumpPath, dumpBuffer);
        const digest = createHash('sha256');
        digest.update(dumpBuffer);
        digest.update(manifestBuffer);
        if (request.backupJob.checksum && digest.digest('hex') !== request.backupJob.checksum) {
          throw new Error('Checksum snapshot không khớp; dừng restore để bảo vệ dữ liệu đích.');
        }
        await this.runCommand(this.toolPath('pg_restore'), ['--list', dumpPath]);
        const databaseUrl = request.target === BackupRestoreTarget.STAGING ? process.env.STAGING_DATABASE_URL : process.env.DATABASE_URL;
        if (!databaseUrl) throw new Error(`Thiếu database URL cho môi trường ${request.target}.`);
        await this.runCommand(this.toolPath('pg_restore'), ['--clean', '--if-exists', '--no-owner', '--exit-on-error', '--dbname', this.cliDatabaseUrl(databaseUrl), dumpPath]);
        const targetRoot = request.target === BackupRestoreTarget.STAGING
          ? (process.env.BACKUP_STAGING_UPLOADS_ROOT || join(process.cwd(), 'backup-staging-uploads'))
          : this.uploadRoot();
        for (const entry of manifest.entries) {
          const target = resolve(targetRoot, entry.path.replaceAll('/', '\\'));
          if (!target.startsWith(resolve(targetRoot) + '\\') && target !== resolve(targetRoot)) throw new Error('Manifest chứa path không an toàn.');
          const content = await this.storage.get(`${prefix}/uploads/${entry.path}`);
          if (content.byteLength !== entry.size) throw new Error(`Kích thước file không khớp: ${entry.path}`);
          const fileDigest = createHash('sha256').update(content).digest('hex');
          if (fileDigest !== entry.sha256) throw new Error(`Checksum file không khớp: ${entry.path}`);
          await mkdir(dirname(target), { recursive: true });
          await writeFile(target, content);
        }
        await this.backup.completeRestore(request.id, db);
        await this.audit.write({
          action: 'BACKUP_RESTORE_SUCCEEDED',
          entityType: 'BACKUP_RESTORE_REQUEST',
          entityId: request.id,
          description: `Restore ${request.target} từ ${request.backupJob.snapshotId} đã hoàn tất.`,
          metadata: { target: request.target, snapshotId: request.backupJob.snapshotId } as any,
        }, db);
      } finally {
        await rm(workDir, { recursive: true, force: true });
      }
    } catch (error: any) {
      await this.backup.failRestore(request.id, error?.message || 'Restore thất bại.', db, productionMaintenanceLocked);
      await this.audit.write({
        action: 'BACKUP_RESTORE_FAILED',
        entityType: 'BACKUP_RESTORE_REQUEST',
        entityId: request.id,
        description: error?.message || 'Restore thất bại.',
      }, db);
    }
  }

  private async createSafetySnapshot(db: Prisma.TransactionClient) {
    const job = await db.backupJob.create({
      data: { snapshotId: `safety_${new Date().toISOString().replace(/[-:.TZ]/g, '')}`, type: BackupJobType.SAFETY, status: BackupJobStatus.RUNNING, startedAt: new Date() },
    });
    return this.runJob(job, db);
  }

  private async applyRetention(db: Prisma.TransactionClient) {
    const jobs = await this.backup.getRetainedSucceededJobs(db);
    const settings = await this.backup.getSettings();
    const maxCount = Math.max(1, settings.maxRetentionCount || 10);
    const keep = new Set<string>(jobs.slice(0, maxCount).map((job) => job.id));

    for (const job of jobs) {
      if (keep.has(job.id)) continue;
      await this.storage.removePrefix(this.storage.key('snapshots', job.snapshotId));
      await this.backup.markJobPruned(job.id, db);
    }
  }

  private uploadRoot() {
    return process.env.BACKUP_UPLOADS_ROOT || join(process.cwd(), 'uploads');
  }

  private async collectUploads() {
    const root = this.uploadRoot();
    const result: ManifestEntry[] = [];
    const visit = async (dir: string) => {
      let names: string[] = [];
      try { names = await readdir(dir); } catch { return; }
      for (const name of names) {
        const full = join(dir, name);
        const info = await stat(full);
        if (info.isDirectory()) await visit(full);
        else if (info.isFile()) {
          const relativePath = relative(root, full).replaceAll('\\', '/');
          const digest = createHash('sha256');
          digest.update(await readFile(full));
          result.push({ path: relativePath, size: info.size, modifiedAt: info.mtime.toISOString(), sha256: digest.digest('hex') });
        }
      }
    };
    await visit(root);
    return result;
  }

  private async latestMigration() {
    try {
      const migrations = await readdir(join(process.cwd(), 'prisma', 'migrations'));
      return migrations.sort().at(-1) || undefined;
    } catch {
      return undefined;
    }
  }

  private runCommand(command: string, args: string[]) {
    return new Promise<void>((resolvePromise, reject) => {
      const child = spawn(command, args, { env: process.env, windowsHide: true });
      let stderr = '';
      child.stderr.on('data', (chunk) => { stderr += String(chunk); });
      child.on('error', (error) => reject(new Error(`${command} không khả dụng: ${error.message}`)));
      child.on('close', (code) => code === 0 ? resolvePromise() : reject(new Error(`${command} thất bại (${code}): ${stderr.slice(-1000)}`)));
    });
  }
}
