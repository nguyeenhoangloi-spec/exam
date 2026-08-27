'use client';

import React from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { BulkActionDock, BulkActionButton } from '@/components/common/BulkActionDock';

interface TrashBulkActionProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onRestore?: () => void;
  onHardDelete?: () => void;
  onClear: () => void;
}

export function TrashBulkAction({
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  onRestore,
  onHardDelete,
  onClear,
}: TrashBulkActionProps) {
  return (
    <BulkActionDock
      selectedCount={selectedCount}
      totalCount={totalCount}
      allSelected={allSelected}
      onToggleAll={onToggleAll}
      onClear={onClear}
    >
      {onRestore && (
        <BulkActionButton
          onClick={onRestore}
          variant="primary"
          icon={<RotateCcw className="h-4 w-4" />}
          label="Khôi phục"
        />
      )}
      {onHardDelete && (
        <BulkActionButton
          onClick={onHardDelete}
          variant="danger"
          icon={<Trash2 className="h-4 w-4" />}
          label="Xóa vĩnh viễn"
        />
      )}
    </BulkActionDock>
  );
}
