'use client';

import React from 'react';
import { ArrowLeftRight } from 'lucide-react';

interface ExamReportFiltersCardProps {
  reportSchedule?: any;
  activeTypeBadge?: { label: string; key: string } | null;
  activeFormatBadge?: { label: string; key: string } | null;
  loadingSchedules?: boolean;
  onOpenSchedulePicker: () => void;
}

export function ExamReportFiltersCard({
  reportSchedule,
  activeTypeBadge,
  loadingSchedules = false,
  onOpenSchedulePicker,
}: ExamReportFiltersCardProps) {
  let formattedDate = reportSchedule?.examDate || '';
  if (formattedDate) {
    try {
      const d = new Date(formattedDate);
      if (!isNaN(d.getTime())) {
        formattedDate = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      }
    } catch {
      // keep original
    }
  }

  return (
    <div className="py-0.5 space-y-0.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center px-2 py-0.5 ui-pill rounded-full text-type-helper font-medium ui-pill-solid bg-blue-600 text-white tracking-wide">
          {activeTypeBadge?.label ? activeTypeBadge.label.toUpperCase() : 'CHÍNH THỨC'}
        </span>

        <h3 className="text-type-body font-semibold text-slate-900 dark:text-slate-100 truncate">
          {reportSchedule?.subjectName || (loadingSchedules ? 'Đang tải ca thi...' : 'Chưa chọn ca thi')}
        </h3>

        <span className="text-type-helper font-medium text-slate-400">
          #{reportSchedule?.subjectCode || 'MH'}
        </span>

        {/* Nút Đổi Ca thuần icon, không chữ, không khung, không nền */}
        <button
          type="button"
          onClick={onOpenSchedulePicker}
          disabled={loadingSchedules}
          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer inline-flex items-center justify-center disabled:opacity-50"
          title="Đổi ca thi"
          aria-label="Đổi ca thi"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2.5 text-type-helper text-slate-500 dark:text-slate-400 flex-wrap font-normal">
        {reportSchedule && (
          <>
            {formattedDate && <span>{formattedDate}</span>}
            {reportSchedule.startTime && (
              <>
                {formattedDate && <span>|</span>}
                <span>{reportSchedule.startTime} – {reportSchedule.endTime}</span>
              </>
            )}
            {reportSchedule.periodName && (
              <>
                <span>|</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {reportSchedule.periodName}
                </span>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
