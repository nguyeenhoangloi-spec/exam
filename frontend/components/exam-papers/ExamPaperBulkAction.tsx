'use client';

import React from 'react';
import { Send, Archive, FileSpreadsheet, Trash2 } from 'lucide-react';
import { BulkActionDock, BulkActionButton } from '@/components/common/BulkActionDock';

interface ExamPaperBulkActionProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onExportExcel?: () => void;
  onDelete?: () => void;
  onClear: () => void;
}

export function ExamPaperBulkAction({
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  onPublish,
  onArchive,
  onExportExcel,
  onDelete,
  onClear,
}: ExamPaperBulkActionProps) {
  return (
    <BulkActionDock
      selectedCount={selectedCount}
      totalCount={totalCount}
      allSelected={allSelected}
      onToggleAll={onToggleAll}
      onClear={onClear}
    >
      {onPublish && (
        <BulkActionButton
          onClick={onPublish}
          variant="primary"
          icon={<Send className="h-4 w-4" />}
          label="Phát hành"
        />
      )}
      {onArchive && (
        <BulkActionButton
          onClick={onArchive}
          variant="secondary"
          icon={<Archive className="h-4 w-4 text-slate-400" />}
          label="Lưu trữ"
        />
      )}
      {onExportExcel && (
        <BulkActionButton
          onClick={onExportExcel}
          variant="secondary"
          icon={<FileSpreadsheet className="h-4 w-4 text-slate-400" />}
          label="Xuất Excel"
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
