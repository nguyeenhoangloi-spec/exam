import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { BadRequestException } from '@nestjs/common';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { BackupStorageTarget } from './backup-storage.types';

export interface BackupStorageAdapter {
  readonly target: BackupStorageTarget;
  put(key: string, body: Buffer | string, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
  removePrefix(prefix: string): Promise<void>;
  test(): Promise<string>;
  displayPath(): string;
}

function mappedKey(target: BackupStorageTarget, logicalKey: string) {
  const clean = logicalKey.replace(/^\/+|\/+$/g, '');
  const configuredPrefix = (target.config.prefix || '').replace(/^\/+|\/+$/g, '');
  const logicalParts = clean.split('/');
  if (logicalParts[0]?.startsWith('exam-system')) logicalParts.shift();
  return [configuredPrefix, ...logicalParts].filter(Boolean).join('/');
}

export class LocalBackupStorageAdapter implements BackupStorageAdapter {
  constructor(readonly target: BackupStorageTarget) {}

  private root() {
    if (!this.target.config.path) throw new BadRequestException('Kho local chưa có đường dẫn lưu trữ.');
    return resolve(this.target.config.path);
  }

  private path(key: string) {
    const root = this.root();
    const target = resolve(root, mappedKey(this.target, key).replaceAll('/', '\\'));
    if (target !== root && !target.startsWith(`${root}\\`)) throw new Error('Đường dẫn lưu trữ không an toàn.');
    return target;
  }

  async put(key: string, body: Buffer | string) {
    const target = this.path(key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, body);
  }

  get(key: string) { return readFile(this.path(key)); }

  async exists(key: string) {
    try { await readFile(this.path(key)); return true; } catch { return false; }
  }

  async removePrefix(prefix: string) {
    await rm(this.path(prefix), { recursive: true, force: true });
  }

  async test() {
    const root = this.root();
    await mkdir(root, { recursive: true });
    const probe = join(root, `.exam-backup-probe-${Date.now()}`);
    await writeFile(probe, 'ok', 'utf8');
    await rm(probe, { force: true });
    return 'Có thể đọc và ghi vào thư mục.';
  }

  displayPath() { return this.root().replaceAll('\\', '/'); }
}

function s3Endpoint(target: BackupStorageTarget) {
  if (target.config.endpoint) return target.config.endpoint;
  if (target.provider === 'R2' && target.config.accountId) return `https://${target.config.accountId}.r2.cloudflarestorage.com`;
  if (target.provider === 'WASABI') return `https://s3.${target.config.region || 'ap-southeast-1'}.wasabisys.com`;
  return undefined;
}

export class S3CompatibleBackupStorageAdapter implements BackupStorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(readonly target: BackupStorageTarget) {
    const config = target.config;
    if (!config.bucket || !config.accessKeyId || !config.secretAccessKey) {
      throw new BadRequestException(`${target.name} chưa có đủ bucket và khóa truy cập.`);
    }
    if (['B2', 'MINIO'].includes(target.provider) && !config.endpoint) {
      throw new BadRequestException(`${target.name} cần endpoint do nhà cung cấp cấp.`);
    }
    this.bucket = config.bucket;
    this.client = new S3Client({
      endpoint: s3Endpoint(target),
      region: config.region || (target.provider === 'R2' ? 'auto' : 'us-east-1'),
      forcePathStyle: target.provider === 'MINIO' ? config.forcePathStyle !== false : Boolean(config.forcePathStyle),
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });
  }

  async put(key: string, body: Buffer | string, contentType: string) {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: mappedKey(this.target, key),
      Body: body,
      ContentType: contentType,
      // Cloudflare R2 implements the S3 API but does not accept the
      // x-amz-server-side-encryption header. R2 encrypts objects at rest itself.
      ServerSideEncryption: this.target.provider === 'S3' && this.target.config.serverSideEncryption ? 'AES256' : undefined,
    }));
  }

  async get(key: string) {
    const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: mappedKey(this.target, key) }));
    if (!response.Body) throw new Error('Kho lưu trữ không trả về dữ liệu.');
    return Buffer.from(await response.Body.transformToByteArray());
  }

  async exists(key: string) {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: mappedKey(this.target, key) }));
      return true;
    } catch { return false; }
  }

  async removePrefix(prefix: string) {
    let continuationToken: string | undefined;
    const mappedPrefix = mappedKey(this.target, prefix);
    do {
      const listed = await this.client.send(new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: mappedPrefix,
        ContinuationToken: continuationToken,
      }));
      const objects = (listed.Contents || []).flatMap((item) => item.Key ? [{ Key: item.Key }] : []);
      if (objects.length) {
        await this.client.send(new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: objects, Quiet: true } }));
      }
      continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
    } while (continuationToken);
  }

  async test() {
    await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    return 'Đã kết nối và truy cập được bucket.';
  }

  displayPath() {
    return `${this.target.provider.toLowerCase()}://${this.bucket}/${this.target.config.prefix || ''}`.replace(/\/$/, '');
  }
}

type DriveFile = { id: string; name: string; mimeType?: string };

export class GoogleDriveBackupStorageAdapter implements BackupStorageAdapter {
  constructor(readonly target: BackupStorageTarget) {
    const config = target.config;
    if (!config.clientId || !config.clientSecret || !config.refreshToken) {
      throw new BadRequestException(`${target.name} chưa hoàn tất kết nối Google Drive.`);
    }
  }

  private async accessToken() {
    const body = new URLSearchParams({
      client_id: this.target.config.clientId!,
      client_secret: this.target.config.clientSecret!,
      refresh_token: this.target.config.refreshToken!,
      grant_type: 'refresh_token',
    });
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await response.json() as { access_token?: string; error_description?: string };
    if (!response.ok || !data.access_token) throw new Error(data.error_description || 'Không thể làm mới phiên Google Drive.');
    return data.access_token;
  }

  private async driveRequest(path: string, init: RequestInit = {}) {
    const token = await this.accessToken();
    return fetch(`https://www.googleapis.com${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) },
    });
  }

  private escape(value: string) { return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

  private async findChild(parentId: string, name: string): Promise<DriveFile | null> {
    const q = `'${this.escape(parentId)}' in parents and name='${this.escape(name)}' and trashed=false`;
    const response = await this.driveRequest(`/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType)&pageSize=1`);
    const data = await response.json() as { files?: DriveFile[]; error?: { message?: string } };
    if (!response.ok) throw new Error(data.error?.message || 'Không thể đọc thư mục Google Drive.');
    return data.files?.[0] || null;
  }

  private async createFolder(parentId: string, name: string) {
    const response = await this.driveRequest('/drive/v3/files?fields=id,name,mimeType', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] }),
    });
    const data = await response.json() as DriveFile & { error?: { message?: string } };
    if (!response.ok || !data.id) throw new Error(data.error?.message || 'Không thể tạo thư mục Google Drive.');
    return data;
  }

  private async resolvePath(key: string, createFolders: boolean) {
    const segments = mappedKey(this.target, key).split('/').filter(Boolean);
    const fileName = segments.pop();
    let parentId = this.target.config.folderId || 'root';
    for (const segment of segments) {
      let folder = await this.findChild(parentId, segment);
      if (!folder && createFolders) folder = await this.createFolder(parentId, segment);
      if (!folder) return { parentId, fileName, file: null as DriveFile | null };
      if (folder.mimeType !== 'application/vnd.google-apps.folder') throw new Error(`Google Drive có tệp trùng tên thư mục: ${segment}`);
      parentId = folder.id;
    }
    const file = fileName ? await this.findChild(parentId, fileName) : null;
    return { parentId, fileName, file };
  }

  async put(key: string, body: Buffer | string, contentType: string) {
    const { parentId, fileName, file } = await this.resolvePath(key, true);
    if (!fileName) throw new Error('Tên tệp backup không hợp lệ.');
    const boundary = `exam-backup-${Date.now()}`;
    const metadata = file ? { name: fileName } : { name: fileName, parents: [parentId] };
    const payload = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`),
      Buffer.isBuffer(body) ? body : Buffer.from(body),
      Buffer.from(`\r\n--${boundary}--`),
    ]);
    const path = file
      ? `/upload/drive/v3/files/${file.id}?uploadType=multipart`
      : '/upload/drive/v3/files?uploadType=multipart';
    const response = await this.driveRequest(path, {
      method: file ? 'PATCH' : 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body: payload,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(data.error?.message || 'Không thể tải tệp lên Google Drive.');
    }
  }

  async get(key: string) {
    const { file } = await this.resolvePath(key, false);
    if (!file) throw new Error('Không tìm thấy bản backup trên Google Drive.');
    const response = await this.driveRequest(`/drive/v3/files/${file.id}?alt=media`);
    if (!response.ok) throw new Error('Không thể tải bản backup từ Google Drive.');
    return Buffer.from(await response.arrayBuffer());
  }

  async exists(key: string) { return Boolean((await this.resolvePath(key, false)).file); }

  async removePrefix(prefix: string) {
    const { file } = await this.resolvePath(prefix, false);
    if (!file) return;
    const response = await this.driveRequest(`/drive/v3/files/${file.id}`, { method: 'DELETE' });
    if (!response.ok && response.status !== 404) throw new Error('Không thể xóa bản backup trên Google Drive.');
  }

  async test() {
    const folderId = this.target.config.folderId || 'root';
    const response = await this.driveRequest(`/drive/v3/files/${folderId}?fields=id,name,mimeType`);
    if (!response.ok) throw new Error('Không thể truy cập thư mục Google Drive đã chọn.');
    return 'Đã kết nối và truy cập được Google Drive.';
  }

  displayPath() { return `gdrive://${this.target.config.folderId || 'root'}/${this.target.config.prefix || ''}`.replace(/\/$/, ''); }
}

export function createStorageAdapter(target: BackupStorageTarget): BackupStorageAdapter {
  if (target.provider === 'LOCAL') return new LocalBackupStorageAdapter(target);
  if (target.provider === 'GOOGLE_DRIVE') return new GoogleDriveBackupStorageAdapter(target);
  return new S3CompatibleBackupStorageAdapter(target);
}
