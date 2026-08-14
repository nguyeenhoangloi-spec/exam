'use client';

import React, { useState } from 'react';
import { Calendar, Clock, GraduationCap, Filter, ChevronDown, RotateCcw } from 'lucide-react';
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
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [
    summaryFilters?.examPeriodId !== 'ALL',
    summaryFilters?.subjectId !== 'ALL',
    summaryFilters?.departmentId !== 'ALL',
    summaryFilters?.classId !== 'ALL',
    Boolean(summaryFilters?.fromDate),
    Boolean(summaryFilters?.toDate),
  ].filter(Boolean).length;

  const isFiltered = activeFilterCount > 0;

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

          <Button
            type="button"
            variant={showFilters || isFiltered ? 'primary' : 'secondary'}
            size="md"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="h-4 w-4" />}
            rightIcon={
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  showFilters ? 'rotate-180' : ''
                }`}
              />
            }
            className="font-semibold shadow-2xs cursor-pointer"
          >
            <span>Bộ lọc phạm vi</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/25 text-[11px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ── 2. Hàng bộ lọc thống kê (Chỉ mở ra mượt mà khi người dùng cần lọc) ── */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2.5 pt-1 animate-in fade-in-50 slide-in-from-top-1 duration-150">
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

          {/* Khoảng ngày */}
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
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 animate-pulse">
              Đang tải...
            </span>
          )}

          {isFiltered && (
            <button
              type="button"
              onClick={resetFilters}
              className="h-10 px-3 flex items-center gap-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title="Xóa tất cả bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
