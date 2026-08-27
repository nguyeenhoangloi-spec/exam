'use client';

import React from 'react';
import { SortDropdown } from '../ui/SortDropdown';
import { ColumnToggleDropdown } from '../ui/ColumnToggleDropdown';

interface RegradeTableToolbarProps {
  totalCount: number;
  sortOrder?: string;
  onSortChange?: (sort: string) => void;
  visibleColumns?: Record<string, boolean>;
  onColumnToggle?: (columnKey: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function RegradeTableToolbar({
  totalCount,
  sortOrder = 'newest',
  onSortChange,
  visibleColumns = {
    code: true,
    student: true,
    subject: true,
    oldScore: true,
    reason: true,
    status: true,
  },
  onColumnToggle,
}: RegradeTableToolbarProps) {
  const columnsList = [
    { key: 'code', label: 'Mã đơn phó/khiếu nại' },
    { key: 'student', label: 'Thí sinh gửi đơn' },
    { key: 'subject', label: 'Môn thi phúc khảo' },
    { key: 'oldScore', label: 'Điểm công bố ban đầu' },
    { key: 'reason', label: 'Lý do phúc khảo' },
    { key: 'status', label: 'Trạng thái xử lý' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="flex items-center gap-2">
        {/* Sort */}
        <SortDropdown
          value={sortOrder}
          onChange={(val) => onSortChange?.(val)}
          options={[
            { value: 'newest', label: 'Đơn mới nhất' },
            { value: 'oldest', label: 'Đơn cũ nhất' },
            { value: 'score_desc', label: 'Điểm thi: Cao nhất' },
            { value: 'score_asc', label: 'Điểm thi: Thấp nhất' },
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