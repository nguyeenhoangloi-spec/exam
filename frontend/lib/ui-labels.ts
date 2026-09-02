export const BACKUP_TYPE_LABELS = {
  FULL: 'Toàn bộ',
  DATABASE: 'Cơ sở dữ liệu',
  UPLOADS: 'Tệp tải lên',
  SAFETY: 'Bản an toàn',
} as const;

export type BackupTypeKey = keyof typeof BACKUP_TYPE_LABELS;

export function getBackupTypeLabel(type: string): string {
  return BACKUP_TYPE_LABELS[type as BackupTypeKey] || 'Loại khác';
}
