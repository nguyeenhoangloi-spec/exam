'use client';

import React from 'react';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { BulkActionDock, BulkActionButton } from '@/components/common/BulkActionDock';

interface StudentCurriculumBulkActionProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  onClear: () => void;
}

export function StudentCurriculumBulkAction({
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  onExportExcel,
  onPrint,
  onClear,
}: StudentCurriculumBulkActionProps) {
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
          label="Xuất khung CTĐT"
        />
      )}
      {onPrint && (
        <BulkActionButton
          onClick={onPrint}
          variant="secondary"
          icon={<Printer className="h-4 w-4 text-slate-400" />}
          label="In chương trình"
        />
      )}
    </BulkActionDock>
  );
}
