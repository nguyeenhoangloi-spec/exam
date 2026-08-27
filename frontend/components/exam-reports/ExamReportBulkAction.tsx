'use client';

import React from 'react';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { BulkActionDock, BulkActionButton } from '@/components/common/BulkActionDock';

interface ExamReportBulkActionProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  onClear: () => void;
}

export function ExamReportBulkAction({
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  onExportExcel,
  onPrint,
  onClear,
}: ExamReportBulkActionProps) {
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
          label="In phiếu điểm"
        />
      )}
    </BulkActionDock>
  );
}
