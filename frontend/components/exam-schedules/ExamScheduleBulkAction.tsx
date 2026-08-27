'use client';

import React from 'react';
import { FileSpreadsheet, Printer, Users, DoorOpen, Trash2 } from 'lucide-react';
import { BulkActionDock, BulkActionButton } from '@/components/common/BulkActionDock';

interface ExamScheduleBulkActionProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  onAssignSupervisors?: () => void;
  onArrangeRooms?: () => void;
  onDelete?: () => void;
  onClear: () => void;
}

export function ExamScheduleBulkAction({
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  onExportExcel,
  onPrint,
  onAssignSupervisors,
  onArrangeRooms,
  onDelete,
  onClear,
}: ExamScheduleBulkActionProps) {
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
      {onAssignSupervisors && (
        <BulkActionButton
          onClick={onAssignSupervisors}
          variant="secondary"
          icon={<Users className="h-4 w-4 text-slate-400" />}
          label="Phân công coi thi"
        />
      )}
      {onArrangeRooms && (
        <BulkActionButton
          onClick={onArrangeRooms}
          variant="secondary"
          icon={<DoorOpen className="h-4 w-4 text-slate-400" />}
          label="Xếp phòng thi"
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
