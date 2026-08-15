'use client';

import React from 'react';
import { Calendar, Clock, GraduationCap } from 'lucide-react';
import { Button } from '../ui/Button';
import { IdentifierBadge } from '../ui/IdentifierBadge';

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
  if (formattedDate.includes('T')) {
    formattedDate = formattedDate.split('T')[0];
  }
  if (formattedDate.includes('-')) {
    const parts = formattedDate.split('-');
    if (parts.length === 3) {
      formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  return (
    <div className="pt-1">
      {/* ── Dải Ca Thi Hiện Tại Tinh Gọn (Clean Frameless Session Row) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        {/* Left: Icon Avatar + Subject & Schedule Meta */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs">
            <GraduationCap className="h-5 w-5" />
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[12px] font-semibold tracking-wider shrink-0  shadow-2xs">
                {activeTypeBadge?.label || 'Chính thức'}
              </span>

              {reportSchedule ? (
                <>
                  <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                    {reportSchedule.subjectName}
                  </h2>
                  <IdentifierBadge>{reportSchedule.subjectCode}</IdentifierBadge>
                </>
              ) : (
                <span className="text-sm text-slate-500 font-medium">
                  {loadingSchedules ? 'Đang tải ca thi...' : 'Chưa chọn ca thi cụ thể'}
                </span>
              )}
            </div>

            {reportSchedule && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                <span className="text-slate-600 dark:text-slate-300 font-semibold">{reportSchedule.periodName}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <strong>{reportSchedule.startTime} – {reportSchedule.endTime}</strong>
                  {formattedDate && ` (${formattedDate})`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={loadingSchedules}
            onClick={onOpenSchedulePicker}
            leftIcon={<Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
            className="font-semibold shadow-2xs cursor-pointer"
          >
            Đổi ca thi khác
          </Button>
        </div>
      </div>
    </div>
  );
}
