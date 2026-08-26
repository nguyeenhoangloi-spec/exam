import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createStorageAdapter } from './backup-storage.adapters';
import { BackupStorageTarget } from './backup-storage.types';

export interface StorageStatusItem {
  id: string;
  name: string;
  provider: string;
  role: 'PRIMARY' | 'MIRROR';
  path: string;
  isAvailable: boolean;
  status: 'ONLINE' | 'STANDBY' | 'ERROR';
  message?: string;
  lastWriteAt?: string;
  lastWriteStatus?: 'SUCCESS' | 'ERROR';
  lastWriteMessage?: string;
}

export interface StorageStatusOverview {
  dualStorageEnabled: boolean;
  primary: StorageStatusItem;
  secondary: StorageStatusItem;
  targets: StorageStatusItem[];
}

@Injectable()
export class BackupStorageService {
  private readonly logger = new Logger(BackupStorageService.name);
  private readonly namespace = (process.env.BACKUP_STORAGE_PREFIX || 'exam-system').replace(/^\/+|\/+$/g, '');
  private dualStorageEnabled = true;
  private targets: BackupStorageTarget[] = this.legacyTargets();
  private readonly lastWrites = new Map<string, { at: string; status: 'SUCCESS' | 'ERROR'; message: string }>();

  private legacyTargets(): BackupStorageTarget[] {
    const now = new Date().toISOString();
    const bucket = process.env.BACKUP_STORAGE_BUCKET?.trim();
    const primary: BackupStorageTarget = bucket ? {
      id: 'legacy-s3-primary', name: 'Kho S3 chính', provider: 'S3', role: 'PRIMARY', enabled: true,
      config: {
        endpoint: process.env.BACKUP_STORAGE_ENDPOINT || undefined,
        region: process.env.BACKUP_STORAGE_REGION || 'us-east-1', bucket, prefix: this.namespace,
        accessKeyId: process.env.BACKUP_STORAGE_ACCESS_KEY || undefined,
        secretAccessKey: process.env.BACKUP_STORAGE_SECRET_KEY || undefined,
        forcePathStyle: process.env.BACKUP_STORAGE_FORCE_PATH_STYLE === 'true',
        serverSideEncryption: process.env.BACKUP_STORAGE_SSE === 'AES256',
      }, createdAt: now, updatedAt: now,
    } : {
      id: 'legacy-local-primary', name: 'Kho local chính', provider: 'LOCAL', role: 'PRIMARY', enabled: true,
      config: { path: process.env.BACKUP_LOCAL_ROOT || join(process.cwd(), 'backup-runtime', 'primary'), prefix: this.namespace },
      createdAt: now, updatedAt: now,
    };
    return [primary, {
      id: 'legacy-local-mirror', name: 'Kho local dự phòng', provider: 'LOCAL', role: 'MIRROR', enabled: true,
      config: { path: process.env.BACKUP_SECONDARY_ROOT || join(process.cwd(), 'backup-runtime', 'mirror_backup'), prefix: this.namespace },
      createdAt: now, updatedAt: now,
    }];
  }

  getLegacyTargets() { return this.legacyTargets(); }
  setTargets(targets: BackupStorageTarget[]) { this.targets = targets.length ? targets : this.legacyTargets(); }
  getTargets() { return this.targets.map((target) => ({ ...target, config: { ...target.config } })); }

  setSecondaryPath(path: string) {
    const target = this.targets.find((item) => item.provider === 'LOCAL' && item.role === 'MIRROR');
    if (target && path?.trim()) target.config.path = path.trim();
  }

  setPrimaryPath(path: string) {
    const target = this.targets.find((item) => item.provider === 'LOCAL' && item.role === 'PRIMARY');
    if (target && path?.trim()) target.config.path = path.trim();
  }

  setDualStorageEnabled(enabled: boolean) { this.dualStorageEnabled = enabled; }

  getPrimaryPath() {
    const target = this.targets.find((item) => item.role === 'PRIMARY') || this.targets[0];
    try { return target ? createStorageAdapter(target).displayPath() : ''; } catch { return target?.config.path || ''; }
  }

  getSecondaryPath() {
    const target = this.targets.find((item) => item.role === 'MIRROR');
    try { return target ? createStorageAdapter(target).displayPath() : ''; } catch { return target?.config.path || ''; }
  }

  isDualStorageActive() { return this.dualStorageEnabled; }
  key(...parts: string[]) { return [this.namespace, ...parts].filter(Boolean).join('/'); }

  private activeTargets() {
    return this.targets
      .filter((target) => target.enabled && (target.role === 'PRIMARY' || this.dualStorageEnabled))
      .sort((a, b) => a.role === b.role ? 0 : a.role === 'PRIMARY' ? -1 : 1);
  }

  isConfigured() { return this.activeTargets().some((target) => target.role === 'PRIMARY'); }

  async put(key: string, body: Buffer | string, contentType = 'application/octet-stream') {
    const targets = this.activeTargets();
    const primary = targets.filter((target) => target.role === 'PRIMARY');
    if (primary.length !== 1) throw new Error('Cấu hình backup phải có đúng một kho chính đang hoạt động.');
    try {
      await createStorageAdapter(primary[0]).put(key, body, contentType);
      this.lastWrites.set(primary[0].id, { at: new Date().toISOString(), status: 'SUCCESS', message: `Đã ghi ${key}.` });
    } catch (error: any) {
      this.lastWrites.set(primary[0].id, { at: new Date().toISOString(), status: 'ERROR', message: error?.message || 'Ghi dữ liệu thất bại.' });
      throw error;
    }
    for (const target of targets.filter((item) => item.role === 'MIRROR')) {
      try {
        await createStorageAdapter(target).put(key, body, contentType);
        this.lastWrites.set(target.id, { at: new Date().toISOString(), status: 'SUCCESS', message: `Đã ghi ${key}.` });
      } catch (error: any) {
        this.lastWrites.set(target.id, { at: new Date().toISOString(), status: 'ERROR', message: error?.message || 'Ghi dữ liệu thất bại.' });
        this.logger.warn(`Không thể ghi vào kho phụ ${target.name}: ${error?.message || error}`);
      }
    }
  }

  async putFile(key: string, path: string, contentType = 'application/octet-stream') {
    await this.put(key, await readFile(path), contentType);
  }

  async get(key: string): Promise<Buffer> {
    const errors: string[] = [];
    for (const target of this.activeTargets()) {
      try { return await createStorageAdapter(target).get(key); }
      catch (error: any) { errors.push(`${target.name}: ${error?.message || error}`); }
    }
    throw new Error(`Không thể đọc ${key} từ bất kỳ kho lưu trữ nào. ${errors.join(' | ')}`);
  }

  async exists(key: string) {
    for (const target of this.activeTargets()) {
      try { if (await createStorageAdapter(target).exists(key)) return true; } catch {}
    }
    return false;
  }

  async removePrefix(prefix: string) {
    for (const target of this.activeTargets()) {
      try { await createStorageAdapter(target).removePrefix(prefix); }
      catch (error: any) { this.logger.warn(`Không thể dọn dữ liệu tại ${target.name}: ${error?.message || error}`); }
    }
  }

  async testTarget(target: BackupStorageTarget) { return createStorageAdapter(target).test(); }

  private async statusFor(target: BackupStorageTarget): Promise<StorageStatusItem> {
    const lastWrite = this.lastWrites.get(target.id);
    if (!target.enabled || (target.role === 'MIRROR' && !this.dualStorageEnabled)) {
      return { id: target.id, name: target.name, provider: target.provider, role: target.role, path: target.config.path || target.config.bucket || target.config.folderId || '', isAvailable: false, status: 'STANDBY', message: 'Đang tạm dừng.', lastWriteAt: lastWrite?.at, lastWriteStatus: lastWrite?.status, lastWriteMessage: lastWrite?.message };
    }
    try {
      const adapter = createStorageAdapter(target);
      const message = await adapter.test();
      return { id: target.id, name: target.name, provider: target.provider, role: target.role, path: adapter.displayPath(), isAvailable: true, status: 'ONLINE', message, lastWriteAt: lastWrite?.at, lastWriteStatus: lastWrite?.status, lastWriteMessage: lastWrite?.message };
    } catch (error: any) {
      return { id: target.id, name: target.name, provider: target.provider, role: target.role, path: target.config.path || target.config.bucket || target.config.folderId || '', isAvailable: false, status: 'ERROR', message: error?.message || 'Không thể kết nối.', lastWriteAt: lastWrite?.at, lastWriteStatus: lastWrite?.status, lastWriteMessage: lastWrite?.message };
    }
  }

  async getStorageStatusOverview(): Promise<StorageStatusOverview> {
    const targets = await Promise.all(this.targets.map((target) => this.statusFor(target)));
    const fallback: StorageStatusItem = { id: '', name: 'Chưa cấu hình', provider: 'LOCAL', role: 'MIRROR', path: '', isAvailable: false, status: 'STANDBY' };
    return {
      dualStorageEnabled: this.dualStorageEnabled,
      primary: targets.find((item) => item.role === 'PRIMARY') || { ...fallback, role: 'PRIMARY' },
      secondary: targets.find((item) => item.role === 'MIRROR') || fallback,
      targets,
    };
  }
}
