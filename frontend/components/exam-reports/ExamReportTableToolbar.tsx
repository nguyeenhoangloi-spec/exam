'use client';

import React from 'react';
import { SortDropdown } from '../ui/SortDropdown';
import { ColumnToggleDropdown } from '../ui/ColumnToggleDropdown';

interface ExamReportTableToolbarProps {
  totalCount: number;
  sortOrder?: string;
  onSortChange?: (sort: string) => void;
  visibleColumns?: Record<string, boolean>;
  onColumnToggle?: (columnKey: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function ExamReportTableToolbar({
  totalCount,
  sortOrder = 'score_desc',
  onSortChange,
  visibleColumns = {
    student: true,
    examPeriod: true,
    subject: true,
    paper: true,
    score: true,
    violations: true,
    status: true,
  },
  onColumnToggle,
}: ExamReportTableToolbarProps) {
  const columnsList = [
    { key: 'student', label: 'Mã & Họ tên thí sinh' },
    { key: 'examPeriod', label: 'Đợt / Kỳ thi' },
    { key: 'subject', label: 'Môn thi' },
    { key: 'paper', label: 'Mã đề thi' },
    { key: 'score', label: 'Điểm tổng kết' },
    { key: 'violations', label: 'Số lần vi phạm quy chế' },
    { key: 'status', label: 'Trạng thái chấm thi' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      {/* Sort */}
      <SortDropdown
        value={sortOrder}
        onChange={(val) => onSortChange?.(val)}
        options={[
          { value: 'score_desc', label: 'Điểm thi: Cao nhất' },
          { value: 'score_asc', label: 'Điểm thi: Thấp nhất' },
          { value: 'name_asc', label: 'Thí sinh: A – Z' },
          { value: 'violation_desc', label: 'Vi phạm: Nhiều nhất' },
        ]}
      />

      {/* Column Selector */}
      <ColumnToggleDropdown
        columns={columnsList}
        visibleColumns={visibleColumns}
        onToggle={(key) => onColumnToggle?.(key)}
      />
    </div>
  );
}
