import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { BackupConfigService } from './backup-config.service';
import { BackupStorageService } from './backup-storage.service';
import { BackupStorageTarget } from './backup-storage.types';
import { GoogleDriveBackupStorageAdapter } from './backup-storage.adapters';

describe('Backup storage configuration', () => {
  const previousSecret = process.env.JWT_SECRET;

  beforeAll(() => { process.env.JWT_SECRET = 'test-only-backup-encryption-secret-32'; });
  afterAll(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });

  it('encrypts secrets at rest and never exposes them in safe output', () => {
    const service = new BackupConfigService();
    const now = new Date().toISOString();
    const target: BackupStorageTarget = {
      id: 'r2', name: 'R2', provider: 'R2', role: 'PRIMARY', priority: 1, enabled: true,
      config: { accountId: 'account', bucket: 'bucket', accessKeyId: 'key', secretAccessKey: 'super-secret' },
      createdAt: now, updatedAt: now,
    };
    const encrypted = service.encryptTarget(target);
    expect(encrypted.config.secretAccessKey).toMatch(/^enc:v1:/);
    expect(encrypted.config.secretAccessKey).not.toContain('super-secret');
    expect(service.decryptTarget(encrypted).config.secretAccessKey).toBe('super-secret');
    const safe = service.sanitizeTarget(encrypted);
    expect(safe.config.hasSecretAccessKey).toBe(true);
    expect('secretAccessKey' in safe.config).toBe(false);
  });

  it('writes to primary and mirror, then restores from configured storage', async () => {
    const root = await mkdtemp(join(tmpdir(), 'exam-storage-test-'));
    try {
      const primary = join(root, 'primary');
      const mirror = join(root, 'mirror');
      const now = new Date().toISOString();
      const targets: BackupStorageTarget[] = [
        { id: 'primary', name: 'Chính', provider: 'LOCAL', role: 'PRIMARY', priority: 1, enabled: true, config: { path: primary, prefix: 'exam-system' }, createdAt: now, updatedAt: now },
        { id: 'mirror', name: 'Phụ', provider: 'LOCAL', role: 'MIRROR', priority: 2, enabled: true, config: { path: mirror, prefix: 'exam-system' }, createdAt: now, updatedAt: now },
      ];
      const storage = new BackupStorageService();
      storage.setTargets(targets);
      storage.setDualStorageEnabled(true);
      const key = storage.key('snapshots', 'sample', 'manifest.json');
      await storage.put(key, '{"ok":true}', 'application/json');
      expect(await readFile(join(primary, 'exam-system', 'snapshots', 'sample', 'manifest.json'), 'utf8')).toBe('{"ok":true}');
      expect(await readFile(join(mirror, 'exam-system', 'snapshots', 'sample', 'manifest.json'), 'utf8')).toBe('{"ok":true}');
      expect((await storage.get(key)).toString('utf8')).toBe('{"ok":true}');
      await rm(join(primary, 'exam-system', 'snapshots', 'sample', 'manifest.json'), { force: true });
      expect((await storage.get(key)).toString('utf8')).toBe('{"ok":true}');
      const overview = await storage.getStorageStatusOverview();
      expect(overview.primary.status).toBe('ONLINE');
      expect(overview.secondary.status).toBe('ONLINE');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('uses a refresh token without exposing it to connect Google Drive', async () => {
    const originalFetch = global.fetch;
    const calls: string[] = [];
    global.fetch = jest.fn(async (input: string | URL | Request) => {
      const url = String(input);
      calls.push(url);
      if (url.includes('oauth2.googleapis.com/token')) {
        return new Response(JSON.stringify({ access_token: 'temporary-access-token' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ id: 'root', name: 'My Drive', mimeType: 'application/vnd.google-apps.folder' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as typeof fetch;
    try {
      const now = new Date().toISOString();
      const adapter = new GoogleDriveBackupStorageAdapter({
        id: 'drive', name: 'Drive', provider: 'GOOGLE_DRIVE', role: 'MIRROR', priority: 2, enabled: true,
        config: { clientId: 'client', clientSecret: 'secret', refreshToken: 'refresh', folderId: 'root' },
        createdAt: now, updatedAt: now,
      });
      await expect(adapter.test()).resolves.toContain('Google Drive');
      expect(calls).toHaveLength(2);
      expect(calls[0]).toContain('oauth2.googleapis.com/token');
      expect(calls[1]).toContain('/drive/v3/files/root');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
