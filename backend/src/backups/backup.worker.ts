import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BackupJobStatus, BackupJobType, BackupRestoreTarget } from '@prisma/client';
import * as cron from 'node-cron';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { BackupService } from './backup.service';
import { BackupStorageService } from './backup-storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

type ManifestEntry = { path: string; size: number; modifiedAt: string; sha256: string };

@Injectable()
export class BackupWorker implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private scheduledTask?: cron.ScheduledTask;
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
    const [hour, minute] = (process.env.BACKUP_SCHEDULE || '02:00').split(':').map(Number);
    const expression = `${Number.isFinite(minute) ? minute : 0} ${Number.isFinite(hour) ? hour : 2} * * *`;
    this.scheduledTask = cron.schedule(expression, () => void this.enqueueScheduledBackup(), {
      timezone: process.env.BACKUP_TIMEZONE || 'Asia/Ho_Chi_Minh',
    });
    void this.enqueueScheduledBackupIfMissed();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    this.scheduledTask?.stop();
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const lock = await this.tryLock();
      if (!lock) return;
      try {
        const job = await this.backup.claimNextJob();
        if (job) await this.runJob(job);
        const restore = await this.backup.claimNextRestore();
        if (restore) await this.runRestore(restore);
      } finally {
        await this.unlock();
      }
    } finally {
      this.running = false;
    }
  }

  private async enqueueScheduledBackupIfMissed() {
    const latest = await this.prisma.backupJob.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!latest || latest.createdAt < new Date(Date.now() - 26 * 60 * 60 * 1000)) {
      await this.enqueueScheduledBackup();
    }
  }

  private async enqueueScheduledBackup() {
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

  private async tryLock() {
    const result = await this.prisma.$queryRaw<{ locked: boolean }[]>`SELECT pg_try_advisory_lock(84921031) AS locked`;
    return Boolean(result[0]?.locked);
  }

  private async unlock() {
    await this.prisma.$executeRaw`SELECT pg_advisory_unlock(84921031)`;
  }

  private async runJob(job: { id: string; snapshotId: string; type: BackupJobType }) {
    const workDir = await mkdtemp(join(tmpdir(), 'exam-backup-'));
    try {
      if (process.env.NODE_ENV === 'production' && !process.env.BACKUP_STORAGE_BUCKET) {
        throw new Error('Production backup yêu cầu BACKUP_STORAGE_BUCKET; không dùng local fallback.');
      }
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) throw new Error('Thiếu DATABASE_URL để thực hiện backup.');
      const dumpPath = join(workDir, 'database.dump');
      await this.runCommand('pg_dump', ['--format=custom', '--file', dumpPath, '--dbname', databaseUrl]);
      await this.backup.markJobVerifying(job.id);
      await this.runCommand('pg_restore', ['--list', dumpPath]);

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
      });
      if (job.type !== BackupJobType.SAFETY) await this.applyRetention();
      return true;
    } catch (error: any) {
      await this.backup.failJob(job.id, error?.message || 'Backup thất bại.');
      return false;
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  private async runRestore(request: any) {
    try {
      if (request.target === BackupRestoreTarget.PRODUCTION) {
        if (process.env.BACKUP_ALLOW_PRODUCTION_RESTORE !== 'true') {
          throw new Error('Production restore đang bị khóa bởi BACKUP_ALLOW_PRODUCTION_RESTORE.');
        }
        if (await this.backup.hasActiveOfficialAttempt()) {
          throw new Error('Không thể restore production khi đang có bài thi hoạt động.');
        }
        await this.createSafetySnapshot();
      }

      const workDir = await mkdtemp(join(tmpdir(), 'exam-restore-'));
      try {
        const prefix = this.storage.key('snapshots', request.backupJob.snapshotId);
        const dumpPath = join(workDir, 'database.dump');
        const manifestPath = join(workDir, 'manifest.json');
        await writeFile(dumpPath, await this.storage.get(`${prefix}/database.dump`));
        await writeFile(manifestPath, await this.storage.get(`${prefix}/manifest.json`));
        const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as { entries: ManifestEntry[] };
        const databaseUrl = request.target === BackupRestoreTarget.STAGING ? process.env.STAGING_DATABASE_URL : process.env.DATABASE_URL;
        if (!databaseUrl) throw new Error(`Thiếu database URL cho môi trường ${request.target}.`);
        await this.runCommand('pg_restore', ['--clean', '--if-exists', '--no-owner', '--exit-on-error', '--dbname', databaseUrl, dumpPath]);
        const targetRoot = request.target === BackupRestoreTarget.STAGING
          ? (process.env.BACKUP_STAGING_UPLOADS_ROOT || join(process.cwd(), 'backup-staging-uploads'))
          : this.uploadRoot();
        for (const entry of manifest.entries) {
          const target = resolve(targetRoot, entry.path.replaceAll('/', '\\'));
          if (!target.startsWith(resolve(targetRoot) + '\\') && target !== resolve(targetRoot)) throw new Error('Manifest chứa path không an toàn.');
          await mkdir(dirname(target), { recursive: true });
          await writeFile(target, await this.storage.get(`${prefix}/uploads/${entry.path}`));
        }
        await this.backup.completeRestore(request.id);
      } finally {
        await rm(workDir, { recursive: true, force: true });
      }
    } catch (error: any) {
      await this.backup.failRestore(request.id, error?.message || 'Restore thất bại.');
      await this.audit.write({
        action: 'BACKUP_RESTORE_FAILED',
        entityType: 'BACKUP_RESTORE_REQUEST',
        entityId: request.id,
        description: error?.message || 'Restore thất bại.',
      });
    }
  }

  private async createSafetySnapshot() {
    const job = await this.prisma.backupJob.create({
      data: { snapshotId: `safety_${new Date().toISOString().replace(/[-:.TZ]/g, '')}`, type: BackupJobType.SAFETY, status: BackupJobStatus.RUNNING, startedAt: new Date() },
    });
    if (!(await this.runJob(job))) throw new Error('Không tạo được safety snapshot trước production restore.');
  }

  private async applyRetention() {
    const jobs = await this.backup.getRetainedSucceededJobs();
    const daily = Math.max(1, Number(process.env.BACKUP_RETENTION_DAILY || 14));
    const weekly = Math.max(1, Number(process.env.BACKUP_RETENTION_WEEKLY || 8));
    const monthly = Math.max(1, Number(process.env.BACKUP_RETENTION_MONTHLY || 12));
    const keep = new Set<string>(jobs.slice(0, daily).map((job) => job.id));
    let weeklyKept = 0;
    for (let index = daily; index < jobs.length && weeklyKept < weekly; index += 7) {
      keep.add(jobs[index].id);
      weeklyKept += 1;
    }
    let monthlyKept = 0;
    for (let index = daily + 7 * weekly; index < jobs.length && monthlyKept < monthly; index += 30) {
      keep.add(jobs[index].id);
      monthlyKept += 1;
    }

    for (const job of jobs) {
      if (keep.has(job.id)) continue;
      await this.storage.removePrefix(this.storage.key('snapshots', job.snapshotId));
      await this.backup.markJobPruned(job.id);
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
