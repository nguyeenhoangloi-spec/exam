'use client';

import React from 'react';
import { Download, Trash2, Send } from 'lucide-react';
import { BulkActionDock, BulkActionButton } from '@/components/common/BulkActionDock';

interface ExamSupervisorBulkActionProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onNotify?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  onClear: () => void;
}

export function ExamSupervisorBulkAction({
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  onNotify,
  onExport,
  onDelete,
  onClear,
}: ExamSupervisorBulkActionProps) {
  return (
    <BulkActionDock
      selectedCount={selectedCount}
      totalCount={totalCount}
      allSelected={allSelected}
      onToggleAll={onToggleAll}
      onClear={onClear}
    >
      {onNotify && (
        <BulkActionButton
          onClick={onNotify}
          variant="primary"
          icon={<Send className="h-4 w-4" />}
          label="Gửi thông báo"
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
      {onDelete && (
        <BulkActionButton
          onClick={onDelete}
          variant="danger"
          icon={<Trash2 className="h-4 w-4" />}
          label="Hủy phân công"
        />
      )}
    </BulkActionDock>
  );
}
