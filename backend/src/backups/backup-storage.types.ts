export type BackupStorageProvider =
  | 'LOCAL'
  | 'R2'
  | 'B2'
  | 'S3'
  | 'WASABI'
  | 'MINIO'
  | 'GOOGLE_DRIVE';

export type BackupStorageRole = 'PRIMARY' | 'MIRROR';

export interface BackupStorageTargetConfig {
  path?: string;
  endpoint?: string;
  region?: string;
  bucket?: string;
  prefix?: string;
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle?: boolean;
  serverSideEncryption?: boolean;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  folderId?: string;
}

export interface BackupStorageTarget {
  id: string;
  name: string;
  provider: BackupStorageProvider;
  role: BackupStorageRole;
  /** 1 is primary; 2+ are ordered mirrors. */
  priority: number;
  enabled: boolean;
  config: BackupStorageTargetConfig;
  createdAt: string;
  updatedAt: string;
  lastTestedAt?: string;
  lastTestStatus?: 'ONLINE' | 'ERROR';
  lastTestMessage?: string;
}

export interface SafeBackupStorageTarget extends Omit<BackupStorageTarget, 'config'> {
  config: Omit<BackupStorageTargetConfig, 'secretAccessKey' | 'clientSecret' | 'refreshToken'> & {
    hasSecretAccessKey?: boolean;
    hasClientSecret?: boolean;
    googleConnected?: boolean;
  };
}

export const STORAGE_SECRET_FIELDS = ['secretAccessKey', 'clientSecret', 'refreshToken'] as const;
