import React from 'react';
import { CategoryBadge, CategoryBadgeTone } from '../ui/CategoryBadge';
import { getBackupTypeLabel } from '../../lib/ui-labels';

type BackupTypeBadgeProps = {
  type: string;
  className?: string;
};

const toneByType: Record<string, CategoryBadgeTone> = {
  FULL: 'blue',
  DATABASE: 'neutral',
  UPLOADS: 'sky',
  SAFETY: 'amber',
};

/** User-facing backup type label backed by the shared Vietnamese label registry. */
export function BackupTypeBadge({ type, className = '' }: BackupTypeBadgeProps) {
  const label = getBackupTypeLabel(type);

  return (
    <CategoryBadge
      tone={toneByType[type] || 'neutral'}
      title={`Loại sao lưu: ${label}`}
      className={className}
    >
      {label}
    </CategoryBadge>
  );
}
