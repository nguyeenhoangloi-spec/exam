import { Injectable } from '@nestjs/common';
import { DeleteObjectsCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

@Injectable()
export class BackupStorageService {
  private readonly bucket = process.env.BACKUP_STORAGE_BUCKET || '';
  private readonly prefix = (process.env.BACKUP_STORAGE_PREFIX || 'exam-system').replace(/^\/+|\/+$/g, '');
  private readonly localRoot = process.env.BACKUP_LOCAL_ROOT || join(process.cwd(), 'backup-runtime');
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

  key(...parts: string[]) {
    return [this.prefix, ...parts].filter(Boolean).join('/');
  }

  isConfigured() {
    return Boolean(this.client && this.bucket) || Boolean(this.localRoot);
  }

  async put(key: string, body: Buffer | string, contentType = 'application/octet-stream') {
    if (this.client && this.bucket) {
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ServerSideEncryption: process.env.BACKUP_STORAGE_SSE === 'AES256' ? 'AES256' : undefined,
      }));
      return;
    }

    const target = join(this.localRoot, key.replaceAll('/', '\\'));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, body);
  }

  async putFile(key: string, path: string, contentType = 'application/octet-stream') {
    if (this.client && this.bucket) {
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: createReadStream(path),
        ContentType: contentType,
        ServerSideEncryption: process.env.BACKUP_STORAGE_SSE === 'AES256' ? 'AES256' : undefined,
      }));
      return;
    }

    await this.put(key, await readFile(path), contentType);
  }

  async get(key: string) {
    if (this.client && this.bucket) {
      const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      const body = response.Body;
      if (!body) throw new Error(`Storage không trả về dữ liệu cho ${key}`);
      return Buffer.from(await body.transformToByteArray());
    }
    return readFile(join(this.localRoot, key.replaceAll('/', '\\')));
  }

  async exists(key: string) {
    if (this.client && this.bucket) {
      try {
        await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
        return true;
      } catch {
        return false;
      }
    }
    try {
      await readFile(join(this.localRoot, key.replaceAll('/', '\\')));
      return true;
    } catch {
      return false;
    }
  }

  async removePrefix(prefix: string) {
    if (this.client && this.bucket) {
      let continuationToken: string | undefined;
      do {
        const listed = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix, ContinuationToken: continuationToken }));
        const objects = (listed.Contents || []).filter((item) => item.Key).map((item) => ({ Key: item.Key! }));
        if (objects.length) await this.client.send(new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: objects, Quiet: true } }));
        continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
      } while (continuationToken);
      return;
    }

    const root = join(this.localRoot, prefix.replaceAll('/', '\\'));
    await rm(root, { recursive: true, force: true });
  }
}
