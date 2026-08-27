'use client';

import React from 'react';
import { CheckCircle2, XCircle, Download } from 'lucide-react';
import { BulkActionDock, BulkActionButton } from '@/components/common/BulkActionDock';

interface RegradeBulkActionProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onExport?: () => void;
  onClear: () => void;
}

export function RegradeBulkAction({
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  onApprove,
  onReject,
  onExport,
  onClear,
}: RegradeBulkActionProps) {
  return (
    <BulkActionDock
      selectedCount={selectedCount}
      totalCount={totalCount}
      allSelected={allSelected}
      onToggleAll={onToggleAll}
      onClear={onClear}
    >
      {onApprove && (
        <BulkActionButton
          onClick={onApprove}
          variant="primary"
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Duyệt phúc khảo"
        />
      )}
      {onReject && (
        <BulkActionButton
          onClick={onReject}
          variant="warning"
          icon={<XCircle className="h-4 w-4" />}
          label="Từ chối"
        />
      )}
      {onExport && (
        <BulkActionButton
          onClick={onExport}
          variant="secondary"
          icon={<Download className="h-4 w-4 text-slate-400" />}
          label="Xuất danh sách"
        />
      )}
    </BulkActionDock>
  );
}
