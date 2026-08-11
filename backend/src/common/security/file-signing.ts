import { createHmac, timingSafeEqual } from 'node:crypto';

const DEFAULT_TTL_SECONDS = 5 * 60;

function secret() {
  const value = process.env.FILE_SIGNING_SECRET || (process.env.NODE_ENV === 'production' ? '' : process.env.JWT_SECRET);
  if (!value) throw new Error('FILE_SIGNING_SECRET or JWT_SECRET must be configured.');
  return value;
}

function digest(path: string, expiresAt: number) {
  return createHmac('sha256', secret()).update(`${path}.${expiresAt}`).digest('base64url');
}

export function signUploadPath(path: string, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  return `${path}?exp=${expiresAt}&sig=${encodeURIComponent(digest(path, expiresAt))}`;
}

export function verifyUploadSignature(path: string, expiresAtRaw?: string, signature?: string) {
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return false;
  if (!signature) return false;
  const expected = Buffer.from(digest(path, expiresAt));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
