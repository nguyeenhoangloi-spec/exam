'use client';

import React from 'react';
import { CheckCircle2, FileSpreadsheet, Printer } from 'lucide-react';
import { BulkActionDock, BulkActionButton } from '@/components/common/BulkActionDock';

interface TeacherAssignmentBulkActionProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onConfirmAll?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  onClear: () => void;
}

export function TeacherAssignmentBulkAction({
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  onConfirmAll,
  onExportExcel,
  onPrint,
  onClear,
}: TeacherAssignmentBulkActionProps) {
  return (
    <BulkActionDock
      selectedCount={selectedCount}
      totalCount={totalCount}
      allSelected={allSelected}
      onToggleAll={onToggleAll}
      onClear={onClear}
    >
      {onConfirmAll && (
        <BulkActionButton
          onClick={onConfirmAll}
          variant="primary"
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Xác nhận tham gia"
        />
      )}
      {onExportExcel && (
        <BulkActionButton
          onClick={onExportExcel}
          variant="secondary"
          icon={<FileSpreadsheet className="h-4 w-4 text-slate-400" />}
          label="Xuất lịch"
        />
      )}
      {onPrint && (
        <BulkActionButton
          onClick={onPrint}
          variant="secondary"
          icon={<Printer className="h-4 w-4 text-slate-400" />}
          label="In lịch coi thi"
        />
      )}
    </BulkActionDock>
  );
}
