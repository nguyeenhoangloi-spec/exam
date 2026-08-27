'use client';

import React from 'react';
import { Download, ShieldCheck, Trash2 } from 'lucide-react';
import { BulkActionDock, BulkActionButton } from '@/components/common/BulkActionDock';

interface BackupBulkActionProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onDownload?: () => void;
  onVerify?: () => void;
  onDelete?: () => void;
  onClear: () => void;
}

export function BackupBulkAction({
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  onDownload,
  onVerify,
  onDelete,
  onClear,
}: BackupBulkActionProps) {
  return (
    <BulkActionDock
      selectedCount={selectedCount}
      totalCount={totalCount}
      allSelected={allSelected}
      onToggleAll={onToggleAll}
      onClear={onClear}
    >
      {onDownload && (
        <BulkActionButton
          onClick={onDownload}
          variant="primary"
          icon={<Download className="h-4 w-4" />}
          label="Xuất snapshot"
        />
      )}
      {onVerify && (
        <BulkActionButton
          onClick={onVerify}
          variant="secondary"
          icon={<ShieldCheck className="h-4 w-4 text-slate-400" />}
          label="Kiểm tra toàn vẹn"
        />
      )}
      {onDelete && (
        <BulkActionButton
          onClick={onDelete}
          variant="danger"
          icon={<Trash2 className="h-4 w-4" />}
          label="Xóa"
        />
      )}
    </BulkActionDock>
  );
}
