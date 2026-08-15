'use client';

import React from 'react';
import { Calendar, Clock, GraduationCap, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { ExamReportFilterPopover } from './ExamReportFilterPopover';

interface ExamReportFiltersCardProps {
  summaryFilters: {
    examPeriodId: string;
    subjectId: string;
    departmentId: string;
    classId: string;
    fromDate: string;
    toDate: string;
  };
  setSummaryFilters: React.Dispatch<React.SetStateAction<{
    examPeriodId: string;
    subjectId: string;
    departmentId: string;
    classId: string;
    fromDate: string;
    toDate: string;
  }>>;
  summaryOptions?: {
    classes?: Array<{ id: number; name: string }>;
    periods?: Array<{ id: number; name: string }>;
    subjects?: Array<{ id: number; code: string; name: string }>;
    departments?: Array<{ id: number; name: string }>;
  };
  summaryLoading?: boolean;
  reportSchedule?: any;
  activeTypeBadge?: { label: string; key: string } | null;
  activeFormatBadge?: { label: string; key: string } | null;
  loadingSchedules?: boolean;
  onOpenSchedulePicker: () => void;
}

export function ExamReportFiltersCard({
  summaryFilters,
  setSummaryFilters,
  summaryOptions,
  summaryLoading = false,
  reportSchedule,
  activeTypeBadge,
  loadingSchedules = false,
  onOpenSchedulePicker,
}: ExamReportFiltersCardProps) {
  const resetFilters = () => {
    setSummaryFilters({
      examPeriodId: 'ALL',
      subjectId: 'ALL',
      departmentId: 'ALL',
      classId: 'ALL',
      fromDate: '',
      toDate: '',
    });
  };

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
    <div className="space-y-3 pt-1">
      {/* ── 1. Dải Ca Thi Hiện Tại Tinh Gọn (Clean Frameless Session Row) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Icon Avatar + Subject & Schedule Meta */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold shadow-2xs">
            <GraduationCap className="h-5 w-5" />
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-bold tracking-wider shrink-0 uppercase shadow-2xs">
                {activeTypeBadge?.label || 'Chính thức'}
              </span>

              {reportSchedule ? (
                <>
                  <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
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

          {/* Popover Bộ lọc thống kê 2 cột */}
          <ExamReportFilterPopover
            summaryFilters={summaryFilters}
            setSummaryFilters={setSummaryFilters}
            summaryOptions={summaryOptions}
            onResetAll={resetFilters}
          />
        </div>
      </div>
    </div>
  );
}
