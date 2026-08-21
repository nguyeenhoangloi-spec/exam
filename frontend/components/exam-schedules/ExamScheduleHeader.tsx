'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Button, DataActionsDropdown } from '../ui';

interface ExamScheduleHeaderProps {
  onAdd?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  isAdmin?: boolean;
  teacherMockMode?: boolean;
}

export function ExamScheduleHeader({
  onAdd,
  onExport,
  onPrint,
  isAdmin = true,
  teacherMockMode = false,
}: ExamScheduleHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      {/* Title & Description */}
      <div className="space-y-0.5">
        <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
          {teacherMockMode ? 'Quản lý lịch thi thử' : 'Quản lý lịch thi'}
        </h1>
        <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          {teacherMockMode
            ? 'Tạo và quản lý các ca thi thử trực tuyến; không áp dụng xếp phòng hoặc phân công giám thị.'
            : 'Tạo, quản lý và theo dõi lịch thi của các kỳ thi trong hệ thống'}
        </p>
      </div>

      {/* Action Buttons: 1 Action dropdown + 1 Primary Blue */}
      <div className="flex items-center gap-2.5 shrink-0">
        {(onExport || onPrint) && (
          <DataActionsDropdown
            onExport={onExport}
            onPrint={onPrint}
          />
        )}

        {isAdmin && onAdd && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onAdd}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            {teacherMockMode ? 'Tạo lịch thi thử' : 'Tạo lịch thi'}
          </Button>
        )}
      </div>
    </div>
  );
}
