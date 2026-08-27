'use client';

import React from 'react';
import { SortDropdown, ColumnToggleDropdown } from '../ui';

interface QuestionBankTableToolbarProps {
  totalCount: number;
  sortOrder?: string;
  onSortChange?: (sort: string) => void;
  visibleColumns?: Record<string, boolean>;
  onColumnToggle?: (columnKey: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function QuestionBankTableToolbar({
  totalCount,
  sortOrder = 'newest',
  onSortChange,
  visibleColumns = {
    code: true,
    content: true,
    subject: true,
    difficulty: true,
    status: true,
  },
  onColumnToggle,
}: QuestionBankTableToolbarProps) {
  const columnsList = [
    { key: 'code', label: 'Mã câu hỏi' },
    { key: 'content', label: 'Nội dung câu hỏi' },
    { key: 'subject', label: 'Môn học' },
    { key: 'difficulty', label: 'Mức độ khó' },
    { key: 'status', label: 'Trạng thái kiểm duyệt' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="flex items-center gap-2">
        {/* Sort selector */}
        <SortDropdown
          value={sortOrder}
          onChange={(val) => onSortChange?.(val)}
          options={[
            { value: 'newest', label: 'Mới nhất' },
            { value: 'oldest', label: 'Cũ nhất' },
            { value: 'code_asc', label: 'Mã câu hỏi: A - Z' },
          ]}
        />

        {/* Column Selector */}
        <ColumnToggleDropdown
          columns={columnsList}
          visibleColumns={visibleColumns}
          onToggle={(key) => onColumnToggle?.(key)}
        />
      </div>
    </div>
  );
}
