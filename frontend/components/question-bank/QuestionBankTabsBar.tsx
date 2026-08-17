'use client';

import React from 'react';

interface QuestionBankTabsBarProps {
  activeStatus: string;
  counts?: Record<string, number>;
  onSelectStatus: (status: string) => void;
}

export function QuestionBankTabsBar({
  activeStatus,
  counts = {},
  onSelectStatus,
}: QuestionBankTabsBarProps) {
  const totalCount = counts.total ?? counts.all ?? 0;
  const draftCount = counts.DRAFT ?? counts.draft ?? 0;
  const pendingCount = counts.PENDING ?? counts.pending ?? 0;
  const approvedCount = counts.APPROVED ?? counts.approved ?? 0;
  const rejectedCount = counts.REJECTED ?? counts.rejected ?? 0;

  const tabs = [
    { key: '', label: 'Tất cả câu hỏi', count: totalCount },
    { key: 'DRAFT', label: 'Bản nháp', count: draftCount },
    { key: 'PENDING', label: 'Chờ duyệt', count: pendingCount },
    { key: 'APPROVED', label: 'Đã duyệt', count: approvedCount },
    { key: 'REJECTED', label: 'Bị từ chối', count: rejectedCount },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-slate-200/80 overflow-x-auto no-scrollbar pt-2">
      {tabs.map((tab) => {
        const isActive = activeStatus === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelectStatus(tab.key)}
            className={`group relative flex items-center gap-2 px-4 py-3 text-base font-medium transition-all cursor-pointer whitespace-nowrap ${isActive ? 'text-primary-600 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${isActive
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-primary-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                }`}
            >
              ({tab.count.toLocaleString('vi-VN')})
            </span>

            {/* Active Blue Bottom Bar */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-blue-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}
