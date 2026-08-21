import { Injectable, Logger } from '@nestjs/common';
import { DeleteObjectsCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, rm, writeFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export interface StorageStatusOverview {
  dualStorageEnabled: boolean;
  primary: {
    name: string;
    type: 'LOCAL' | 'S3';
    path: string;
    isAvailable: boolean;
    status: 'ONLINE' | 'ERROR';
  };
  secondary: {
    name: string;
    type: 'LOCAL_MIRROR';
    path: string;
    isAvailable: boolean;
    status: 'ONLINE' | 'STANDBY' | 'ERROR';
  };
}

@Injectable()
export class BackupStorageService {
  private readonly logger = new Logger(BackupStorageService.name);
  private readonly bucket = process.env.BACKUP_STORAGE_BUCKET || '';
  private readonly prefix = (process.env.BACKUP_STORAGE_PREFIX || 'exam-system').replace(/^\/+|\/+$/g, '');
  
  // Kho lưu trữ chính (Primary Location)
  private readonly localRoot = process.env.BACKUP_LOCAL_ROOT || join(process.cwd(), 'backup-runtime', 'primary');
  
  // Kho lưu trữ dự phòng thứ 2 (Secondary / Mirror Replica Location)
  private secondaryRoot = process.env.BACKUP_SECONDARY_ROOT || join(process.cwd(), 'backup-runtime', 'mirror_backup');
  private dualStorageEnabled = true;

  private readonly client = this.bucket
    ? new S3Client({
        endpoint: process.env.BACKUP_STORAGE_ENDPOINT || undefined,
        region: process.env.BACKUP_STORAGE_REGION || 'us-east-1',
        forcePathStyle: process.env.BACKUP_STORAGE_FORCE_PATH_STYLE === 'true',
        credentials: process.env.BACKUP_STORAGE_ACCESS_KEY && process.env.BACKUP_STORAGE_SECRET_KEY
          ? { accessKeyId: process.env.BACKUP_STORAGE_ACCESS_KEY, secretAccessKey: process.env.BACKUP_STORAGE_SECRET_KEY }
          : undefined,
      })
    : null;

  setSecondaryPath(path: string) {
    if (path && path.trim()) {
      this.secondaryRoot = path.trim();
    }
  }

  setDualStorageEnabled(enabled: boolean) {
    this.dualStorageEnabled = enabled;
  }

  getPrimaryPath() {
    return this.bucket ? `s3://${this.bucket}/${this.prefix}` : this.localRoot;
  }

  getSecondaryPath() {
    return this.secondaryRoot;
  }

  isDualStorageActive() {
    return this.dualStorageEnabled;
  }

  key(...parts: string[]) {
    return [this.prefix, ...parts].filter(Boolean).join('/');
  }

  isConfigured() {
    return Boolean(this.client && this.bucket) || Boolean(this.localRoot);
  }

  /**
   * Ghi dữ liệu đồng thời vào Kho chính và Kho dự phòng (nếu bật Dual Storage)
   */
  async put(key: string, body: Buffer | string, contentType = 'application/octet-stream') {
    let primarySuccess = false;

    // 1. Ghi vào Kho lưu trữ chính (Primary)
    if (this.client && this.bucket) {
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ServerSideEncryption: process.env.BACKUP_STORAGE_SSE === 'AES256' ? 'AES256' : undefined,
      }));
      primarySuccess = true;
    } else {
      const target = join(this.localRoot, key.replaceAll('/', '\\'));
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, body);
      primarySuccess = true;
    }

    // 2. Ghi song song vào Kho lưu trữ dự phòng thứ 2 (Secondary Mirror)
    if (this.dualStorageEnabled && this.secondaryRoot) {
      try {
        const mirrorTarget = join(this.secondaryRoot, key.replaceAll('/', '\\'));
        await mkdir(dirname(mirrorTarget), { recursive: true });
        await writeFile(mirrorTarget, body);
      } catch (err: any) {
        this.logger.warn(`Không thể ghi vào kho lưu trữ dự phòng (${this.secondaryRoot}): ${err.message}`);
        // Nếu primary thành công thì không throw để không ngắt luồng sao lưu
        if (!primarySuccess) throw err;
      }
    }
  }

  /**
   * Ghi file đồng thời vào Kho chính và Kho dự phòng
   */
  async putFile(key: string, path: string, contentType = 'application/octet-stream') {
    const fileBuffer = await readFile(path);
    await this.put(key, fileBuffer, contentType);
  }

  /**
   * Đọc dữ liệu: Ưu tiên Kho chính, tự động Failover sang Kho dự phòng nếu Kho chính lỗi
   */
  async get(key: string): Promise<Buffer> {
    // Thử đọc từ Kho chính
    try {
      if (this.client && this.bucket) {
        const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
        const body = response.Body;
        if (!body) throw new Error(`Storage không trả về dữ liệu cho ${key}`);
        return Buffer.from(await body.transformToByteArray());
      }
      return await readFile(join(this.localRoot, key.replaceAll('/', '\\')));
    } catch (primaryError: any) {
      this.logger.warn(`Kho chính không thể đọc ${key}: ${primaryError.message}. Kích hoạt đọc dự phòng từ Kho thứ 2...`);
      
      // Failover sang Kho lưu trữ dự phòng (Secondary Mirror)
      if (this.dualStorageEnabled && this.secondaryRoot) {
        try {
          const mirrorPath = join(this.secondaryRoot, key.replaceAll('/', '\\'));
          const buffer = await readFile(mirrorPath);
          this.logger.log(`Phục hồi đọc thành công từ Kho lưu trữ dự phòng (${mirrorPath})!`);
          return buffer;
        } catch (secondaryError: any) {
          throw new Error(`Cả 2 kho lưu trữ (Chính & Dự phòng) đều không thể đọc dữ liệu ${key}: ${primaryError.message} / ${secondaryError.message}`);
        }
      }
      throw primaryError;
    }
  }

  /**
   * Kiểm tra tồn tại ở Kho chính hoặc Kho dự phòng
   */
  async exists(key: string): Promise<boolean> {
    if (this.client && this.bucket) {
      try {
        await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
        return true;
      } catch {
        // Fallback check secondary
      }
    } else {
      try {
        await readFile(join(this.localRoot, key.replaceAll('/', '\\')));
        return true;
      } catch {
        // Fallback check secondary
      }
    }

    if (this.dualStorageEnabled && this.secondaryRoot) {
      try {
        await readFile(join(this.secondaryRoot, key.replaceAll('/', '\\')));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Xóa prefix ở cả Kho chính và Kho dự phòng (dọn dẹp retention)
   */
  async removePrefix(prefix: string) {
    // Xóa kho chính
    try {
      if (this.client && this.bucket) {
        let continuationToken: string | undefined;
        do {
          const listed = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix, ContinuationToken: continuationToken }));
          const objects = (listed.Contents || []).filter((item) => item.Key).map((item) => ({ Key: item.Key! }));
          if (objects.length) await this.client.send(new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: objects, Quiet: true } }));
          continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
        } while (continuationToken);
      } else {
        const root = join(this.localRoot, prefix.replaceAll('/', '\\'));
        await rm(root, { recursive: true, force: true });
      }
    } catch (err: any) {
      this.logger.warn(`Lỗi xóa prefix ở kho chính: ${err.message}`);
    }

    // Xóa kho dự phòng
    if (this.dualStorageEnabled && this.secondaryRoot) {
      try {
        const mirrorRoot = join(this.secondaryRoot, prefix.replaceAll('/', '\\'));
        await rm(mirrorRoot, { recursive: true, force: true });
      } catch (err: any) {
        this.logger.warn(`Lỗi xóa prefix ở kho dự phòng: ${err.message}`);
      }
    }
  }

  /**
   * Lấy thông tin trạng thái chi tiết của cả 2 kho lưu trữ
   */
  async getStorageStatusOverview(): Promise<StorageStatusOverview> {
    const isS3 = Boolean(this.client && this.bucket);
    let primaryOnline = true;
    let secondaryOnline = true;

    try {
      if (!isS3) {
        await mkdir(this.localRoot, { recursive: true });
      }
    } catch {
      primaryOnline = false;
    }

    try {
      if (this.dualStorageEnabled && this.secondaryRoot) {
        await mkdir(this.secondaryRoot, { recursive: true });
      }
    } catch {
      secondaryOnline = false;
    }

    return {
      dualStorageEnabled: this.dualStorageEnabled,
      primary: {
        name: isS3 ? 'Cloud S3 Bucket' : 'Kho lưu trữ chính (Primary Disk)',
        type: isS3 ? 'S3' : 'LOCAL',
        path: isS3 ? `s3://${this.bucket}/${this.prefix}` : this.localRoot,
        isAvailable: primaryOnline,
        status: primaryOnline ? 'ONLINE' : 'ERROR',
      },
      secondary: {
        name: 'Kho lưu trữ dự phòng (Secondary Mirror)',
        type: 'LOCAL_MIRROR',
        path: this.secondaryRoot,
        isAvailable: secondaryOnline,
        status: !this.dualStorageEnabled ? 'STANDBY' : secondaryOnline ? 'ONLINE' : 'ERROR',
      },
    };
  }
}
