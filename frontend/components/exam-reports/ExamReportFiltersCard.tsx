'use client';

import React from 'react';
import { Calendar, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { FilterSelect } from '../ui/FilterSelect';

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
  const isFiltered =
    summaryFilters.examPeriodId !== 'ALL' ||
    summaryFilters.subjectId !== 'ALL' ||
    summaryFilters.departmentId !== 'ALL' ||
    summaryFilters.classId !== 'ALL' ||
    summaryFilters.fromDate !== '' ||
    summaryFilters.toDate !== '';

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
    <div className="space-y-3">
      {/* ── 1. Active Schedule Strip ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <span className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white text-[12px] font-semibold tracking-wider shrink-0">
            {activeTypeBadge?.label || 'Chính thức'}
          </span>

          {reportSchedule ? (
            <>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {reportSchedule.subjectName}
              </h3>
              <IdentifierBadge>{reportSchedule.subjectCode}</IdentifierBadge>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden xl:inline-block">
                • {reportSchedule.periodName}
              </span>
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium shrink-0">
                • Thời gian: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{reportSchedule.startTime} – {reportSchedule.endTime} ({formattedDate})</strong>
              </span>
            </>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {loadingSchedules ? 'Đang tải thông tin ca thi...' : 'Chưa chọn ca thi cụ thể'}
            </span>
          )}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="md"
          disabled={loadingSchedules}
          onClick={onOpenSchedulePicker}
          leftIcon={<Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
          className="shrink-0 self-start sm:self-auto cursor-pointer"
        >
          Đổi ca thi khác
        </Button>
      </div>

      {/* ── 2. Sleek Inline Filters Row (Standard h-10 size) ── */}
      <div className="flex flex-wrap items-center gap-2.5">
        {summaryOptions?.periods && summaryOptions.periods.length > 0 && (
          <FilterSelect
            size="md"
            value={summaryFilters.examPeriodId}
            onChange={(e) => setSummaryFilters((f) => ({ ...f, examPeriodId: e.target.value }))}
          >
            <option value="ALL">Tất cả kỳ thi</option>
            {summaryOptions.periods.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </FilterSelect>
        )}

        {summaryOptions?.subjects && summaryOptions.subjects.length > 0 && (
          <FilterSelect
            size="md"
            value={summaryFilters.subjectId}
            onChange={(e) => setSummaryFilters((f) => ({ ...f, subjectId: e.target.value }))}
          >
            <option value="ALL">Tất cả môn học</option>
            {summaryOptions.subjects.map((item) => (
              <option key={item.id} value={item.id}>
                [{item.code}] {item.name}
              </option>
            ))}
          </FilterSelect>
        )}

        {summaryOptions?.departments && summaryOptions.departments.length > 0 && (
          <FilterSelect
            size="md"
            value={summaryFilters.departmentId}
            onChange={(e) => setSummaryFilters((f) => ({ ...f, departmentId: e.target.value }))}
          >
            <option value="ALL">Tất cả khoa</option>
            {summaryOptions.departments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </FilterSelect>
        )}

        {summaryOptions?.classes && summaryOptions.classes.length > 0 && (
          <FilterSelect
            size="md"
            value={summaryFilters.classId}
            onChange={(e) => setSummaryFilters((f) => ({ ...f, classId: e.target.value }))}
          >
            <option value="ALL">Tất cả lớp học</option>
            {summaryOptions.classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </FilterSelect>
        )}

        <div className="flex items-center gap-2 h-10 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl px-3 shadow-2xs">
          <span className="text-slate-400 font-medium text-xs shrink-0">Từ:</span>
          <input
            type="date"
            value={summaryFilters.fromDate}
            onChange={(e) => setSummaryFilters((f) => ({ ...f, fromDate: e.target.value }))}
            className="bg-transparent text-slate-700 dark:text-slate-200 text-xs focus:outline-none cursor-pointer"
          />
          <span className="text-slate-400 font-medium text-xs shrink-0 ml-1">Đến:</span>
          <input
            type="date"
            value={summaryFilters.toDate}
            onChange={(e) => setSummaryFilters((f) => ({ ...f, toDate: e.target.value }))}
            className="bg-transparent text-slate-700 dark:text-slate-200 text-xs focus:outline-none cursor-pointer"
          />
        </div>

        {summaryLoading && (
          <span className="text-xs font-medium text-blue-600 animate-pulse">
            Đang cập nhật...
          </span>
        )}

        {isFiltered && (
          <button
            type="button"
            onClick={resetFilters}
            className="h-10 px-3 flex items-center gap-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer shrink-0"
            title="Xóa tất cả bộ lọc thống kê"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa lọc</span>
          </button>
        )}
      </div>
    </div>
  );
}
