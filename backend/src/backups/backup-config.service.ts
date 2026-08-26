import { BadRequestException, Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  BackupStorageTarget,
  SafeBackupStorageTarget,
  STORAGE_SECRET_FIELDS,
} from './backup-storage.types';

export interface BackupRuntimeConfig {
  autoBackupEnabled: boolean;
  intervalDays: number;
  backupTime: string;
  maxRetentionCount: number;
  dualStorageEnabled: boolean;
  primaryPath: string;
  secondaryPath: string;
  storageTargets: BackupStorageTarget[];
}

@Injectable()
export class BackupConfigService {
  readonly configPath = join(process.cwd(), 'backup-runtime', 'backup-config.json');

  private encryptionKey() {
    const secret = process.env.BACKUP_CONFIG_ENCRYPTION_KEY || process.env.JWT_SECRET;
    if (!secret || secret.length < 16) {
      throw new BadRequestException('Hệ thống chưa có khóa mã hóa an toàn để lưu thông tin kết nối backup.');
    }
    return createHash('sha256').update(secret).digest();
  }

  encrypt(value?: string) {
    if (!value) return value;
    if (value.startsWith('enc:v1:')) return value;
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `enc:v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  decrypt(value?: string) {
    if (!value || !value.startsWith('enc:v1:')) return value;
    const [, , ivRaw, tagRaw, encryptedRaw] = value.split(':');
    try {
      const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey(), Buffer.from(ivRaw, 'base64'));
      decipher.setAuthTag(Buffer.from(tagRaw, 'base64'));
      return Buffer.concat([
        decipher.update(Buffer.from(encryptedRaw, 'base64')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new BadRequestException('Không thể giải mã thông tin kết nối backup. Vui lòng kiểm tra khóa mã hóa hệ thống.');
    }
  }

  encryptTarget(target: BackupStorageTarget): BackupStorageTarget {
    const config = { ...target.config };
    for (const field of STORAGE_SECRET_FIELDS) config[field] = this.encrypt(config[field]);
    return { ...target, config };
  }

  decryptTarget(target: BackupStorageTarget): BackupStorageTarget {
    const config = { ...target.config };
    for (const field of STORAGE_SECRET_FIELDS) config[field] = this.decrypt(config[field]);
    return { ...target, config };
  }

  sanitizeTarget(target: BackupStorageTarget): SafeBackupStorageTarget {
    const decrypted = this.decryptTarget(target);
    const { secretAccessKey, clientSecret, refreshToken, ...safeConfig } = decrypted.config;
    return {
      ...decrypted,
      config: {
        ...safeConfig,
        hasSecretAccessKey: Boolean(secretAccessKey),
        hasClientSecret: Boolean(clientSecret),
        googleConnected: Boolean(refreshToken),
      },
    };
  }

  async read<T>(fallback: T): Promise<T> {
    try {
      return JSON.parse(await readFile(this.configPath, 'utf8')) as T;
    } catch {
      return fallback;
    }
  }

  async write(value: unknown) {
    await mkdir(dirname(this.configPath), { recursive: true });
    const temporaryPath = `${this.configPath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
    await rename(temporaryPath, this.configPath);
  }
}

