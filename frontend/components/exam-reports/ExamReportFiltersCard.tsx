'use client';

import React from 'react';
import { ArrowLeftRight, Calendar, Clock, DoorOpen, GraduationCap } from 'lucide-react';

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
    <div className="py-0.5">
      {/* ── Active Schedule Shift Banner (Chuẩn đồng nhất như exam-supervisors) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <GraduationCap className="h-5 w-5 stroke-[2]" />
          </div>

          <div className="space-y-0.5 min-w-0">
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

            <div className="flex items-center gap-2.5 text-type-helper text-slate-500 dark:text-slate-400 flex-wrap min-h-[20px]">
              {reportSchedule && (
                <>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {reportSchedule.startTime} - {reportSchedule.endTime}
                  </span>
                  {formattedDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formattedDate}
                    </span>
                  )}
                  {reportSchedule.periodName && (
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <DoorOpen className="h-3.5 w-3.5 text-blue-600" />
                      {reportSchedule.periodName}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
