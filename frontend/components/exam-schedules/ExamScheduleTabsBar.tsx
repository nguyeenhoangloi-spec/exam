'use client';

import React, { startTransition } from 'react';

interface ExamScheduleTabsBarProps {
  activeStatus: string;
  counts?: {
    total?: number;
    upcoming?: number;
    ongoing?: number;
    completed?: number;
    cancelled?: number;
  };
  onSelectStatus: (status: string) => void;
}

export function ExamScheduleTabsBar({
  activeStatus,
  counts = {},
  onSelectStatus,
}: ExamScheduleTabsBarProps) {
  const tabs = [
    { key: '', label: 'Tất cả', count: counts.total ?? 128 },
    { key: 'UPCOMING', label: 'Sắp diễn ra', count: counts.upcoming ?? 18 },
    { key: 'ONGOING', label: 'Đang diễn ra', count: counts.ongoing ?? 6 },
    { key: 'COMPLETED', label: 'Đã diễn ra', count: counts.completed ?? 96 },
    { key: 'CANCELLED', label: 'Đã hủy', count: counts.cancelled ?? 8 },
  ];

  const handleTabClick = (key: string) => {
    startTransition(() => {
      onSelectStatus(key);
    });
  };

  return (
    <div className="flex items-center gap-2 border-b border-slate-200/80 overflow-x-auto no-scrollbar pt-2">
      {tabs.map((tab) => {
        const isActive = activeStatus === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabClick(tab.key)}
            className={`group relative flex items-center gap-1.5 px-4 py-3 text-[15px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-xl px-2 py-0.5 text-[13px] font-semibold transition ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
              }`}
            >
              ({tab.count.toLocaleString('vi-VN')})
            </span>

            {/* Active Bottom Bar */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-blue-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}
