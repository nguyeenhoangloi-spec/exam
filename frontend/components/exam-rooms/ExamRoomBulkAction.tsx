'use client';

import React from 'react';
import { FileSpreadsheet, Printer, Trash2 } from 'lucide-react';
import { BulkActionDock, BulkActionButton } from '@/components/common/BulkActionDock';

interface ExamRoomBulkActionProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  onDelete?: () => void;
  onClear: () => void;
}

export function ExamRoomBulkAction({
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  onExportExcel,
  onPrint,
  onDelete,
  onClear,
}: ExamRoomBulkActionProps) {
  return (
    <BulkActionDock
      selectedCount={selectedCount}
      totalCount={totalCount}
      allSelected={allSelected}
      onToggleAll={onToggleAll}
      onClear={onClear}
    >
      {onExportExcel && (
        <BulkActionButton
          onClick={onExportExcel}
          variant="primary"
          icon={<FileSpreadsheet className="h-4 w-4" />}
          label="Xuất Excel"
        />
      )}
      {onPrint && (
        <BulkActionButton
          onClick={onPrint}
          variant="secondary"
          icon={<Printer className="h-4 w-4 text-slate-400" />}
          label="In báo cáo"
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
