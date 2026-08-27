'use client';

import React from 'react';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { BulkActionDock, BulkActionButton } from '@/components/common/BulkActionDock';

interface StudentResultBulkActionProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  onClear: () => void;
}

export function StudentResultBulkAction({
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  onExportExcel,
  onPrint,
  onClear,
}: StudentResultBulkActionProps) {
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
          label="Xuất bảng điểm"
        />
      )}
      {onPrint && (
        <BulkActionButton
          onClick={onPrint}
          variant="secondary"
          icon={<Printer className="h-4 w-4 text-slate-400" />}
          label="In kết quả"
        />
      )}
    </BulkActionDock>
  );
}
