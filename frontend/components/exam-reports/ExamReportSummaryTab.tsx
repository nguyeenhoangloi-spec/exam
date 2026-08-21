'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Calendar,
  Users,
  Award,
  GraduationCap,
  Eye,
  RefreshCw,
  Building2,
  Info,
} from 'lucide-react';
import {
  Button,
  IdentifierBadge,
  PaginationBar,
  SortDropdown,
  ColumnToggleDropdown,
  ViewModeSegmentedControl,
  TabBar,
} from '../ui';
import { SummaryScheduleDrawer } from './SummaryScheduleDrawer';
import { ExamReportBulkAction } from './ExamReportBulkAction';
import { ExamReportFilterPopover } from './ExamReportFilterPopover';
import { exportToFormattedExcel } from '../../lib/export-excel';
import { printReport } from '../../lib/export-print';

export interface SummaryScheduleRow {
  id: number;
  examPeriodId: number;
  periodName: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  departmentId: number;
  departmentName: string;
  examDate: string;
  assigned: number;
  submitted: number;
  graded: number;
  absent: number;
  ungraded: number;
  flagged: number;
  passCount: number;
  avgScore: number;
}

export interface SummaryData {
  filters?: {
    examPeriodId: number | null;
    subjectId: number | null;
    departmentId: number | null;
    classId: number | null;
    fromDate: string | null;
    toDate: string | null;
  };
  stats: {
    totalExams: number;
    totalSchedules: number;
    totalAssigned: number;
    totalSubmitted: number;
    totalGraded: number;
    totalAbsent: number;
    totalUngraded: number;
    totalFlagged: number;
    passCount: number;
    passRate: number;
    avgScore: number;
    scoreDistribution?: {
      excellent: number;
      good: number;
      fair: number;
      average: number;
      poor: number;
      totalGraded: number;
    };
  };
  schedules: SummaryScheduleRow[];
  options?: {
    classes: Array<{ id: number; name: string }>;
    periods: Array<{ id: number; name: string }>;
    subjects: Array<{ id: number; code: string; name: string }>;
    departments: Array<{ id: number; name: string }>;
  };
}

interface ExamReportSummaryTabProps {
  summary: SummaryData | null;
  loading: boolean;
  onSelectSchedule: (scheduleId: number) => void;
  onRefresh: () => void;
}

export function ExamReportSummaryTab({
  summary,
  loading,
  onSelectSchedule,
  onRefresh,
}: ExamReportSummaryTabProps) {
  // ── 1. States & Filters (Identical to view=schedule) ──
  const [searchTerm, setSearchTerm] = useState('');
  const [summaryFilters, setSummaryFilters] = useState({
    examPeriodId: 'ALL',
    subjectId: 'ALL',
    departmentId: 'ALL',
    classId: 'ALL',
    fromDate: '',
    toDate: '',
  });

  const [selectedPassRateTier, setSelectedPassRateTier] = useState<string>('ALL');
  const [activeScoreTierFilter, setActiveScoreTierFilter] = useState<string | null>(null);

  // Sorting & View Mode
  const [sortOrder, setSortOrder] = useState<string>('examDate_desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection & Bulk Action
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Drawer Detail State
  const [drawerSchedule, setDrawerSchedule] = useState<SummaryScheduleRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Column Visibility
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    index: true,
    subjectCode: true,
    subjectName: true,
    department: true,
    period: true,
    examDate: true,
    assigned: true,
    submitted: true,
    absent: true,
    passRate: true,
    avgScore: true,
    actions: true,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Hotkey "/" to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const columnsList = [
    { key: 'subjectCode', label: 'Mã môn học' },
    { key: 'subjectName', label: 'Tên môn học' },
    { key: 'department', label: 'Khoa / Bộ môn' },
    { key: 'period', label: 'Kỳ thi' },
    { key: 'examDate', label: 'Ngày thi' },
    { key: 'assigned', label: 'Số SV xếp phòng' },
    { key: 'submitted', label: 'Số bài nộp' },
    { key: 'absent', label: 'Vắng thi' },
    { key: 'passRate', label: 'Tỷ lệ đạt (%)' },
    { key: 'avgScore', label: 'Điểm trung bình' },
  ];

  const handleColumnToggle = (columnKey: string) => {
    setVisibleColumns((prev) => ({ ...prev, [columnKey]: !prev[columnKey] }));
  };

  const resetSummaryFilters = () => {
    setSummaryFilters({
      examPeriodId: 'ALL',
      subjectId: 'ALL',
      departmentId: 'ALL',
      classId: 'ALL',
      fromDate: '',
      toDate: '',
    });
    setSearchTerm('');
    setSelectedPassRateTier('ALL');
    setActiveScoreTierFilter(null);
    setPage(1);
  };

  // ── 2. Filter & Sort Logic ──
  const filteredSchedules = useMemo(() => {
    if (!summary?.schedules) return [];
    return summary.schedules.filter((s) => {
      // Exam Period Filter
      if (
        summaryFilters.examPeriodId !== 'ALL' &&
        String(s.examPeriodId) !== summaryFilters.examPeriodId
      ) {
        return false;
      }
      // Subject Filter
      if (
        summaryFilters.subjectId !== 'ALL' &&
        String(s.subjectId) !== summaryFilters.subjectId
      ) {
        return false;
      }
      // Department Filter
      if (
        summaryFilters.departmentId !== 'ALL' &&
        String(s.departmentId) !== summaryFilters.departmentId
      ) {
        return false;
      }
      // From Date
      if (summaryFilters.fromDate) {
        const scheduleDate = new Date(s.examDate).getTime();
        const from = new Date(summaryFilters.fromDate).getTime();
        if (scheduleDate < from) return false;
      }
      // To Date
      if (summaryFilters.toDate) {
        const scheduleDate = new Date(s.examDate).getTime();
        const to = new Date(summaryFilters.toDate).getTime();
        if (scheduleDate > to) return false;
      }

      // Pass rate tier tab filter
      const passRate = s.graded > 0 ? (s.passCount / s.graded) * 100 : 0;
      if (selectedPassRateTier === 'HIGH' && passRate < 80) return false;
      if (selectedPassRateTier === 'MEDIUM' && (passRate < 50 || passRate >= 80)) return false;
      if (selectedPassRateTier === 'LOW' && passRate >= 50) return false;
      if (selectedPassRateTier === 'FLAGGED' && s.flagged <= 0) return false;

      // Score tier clicked from distribution bar
      if (activeScoreTierFilter === 'excellent' && s.avgScore < 8.5) return false;
      if (activeScoreTierFilter === 'good' && (s.avgScore < 7.5 || s.avgScore >= 8.5)) return false;
      if (activeScoreTierFilter === 'fair' && (s.avgScore < 6.5 || s.avgScore >= 7.5)) return false;
      if (activeScoreTierFilter === 'average' && (s.avgScore < 5.0 || s.avgScore >= 6.5)) return false;
      if (activeScoreTierFilter === 'poor' && s.avgScore >= 5.0) return false;

      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = s.subjectName.toLowerCase().includes(q);
        const matchCode = s.subjectCode.toLowerCase().includes(q);
        const matchPeriod = s.periodName.toLowerCase().includes(q);
        const matchDept = s.departmentName.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchPeriod && !matchDept) return false;
      }
      return true;
    });
  }, [
    summary?.schedules,
    summaryFilters,
    selectedPassRateTier,
    activeScoreTierFilter,
    searchTerm,
  ]);

  // Tab counts
  const tierCounts = useMemo(() => {
    const all = summary?.schedules || [];
    let high = 0;
    let medium = 0;
    let low = 0;
    let flagged = 0;

    all.forEach((s) => {
      const passRate = s.graded > 0 ? (s.passCount / s.graded) * 100 : 0;
      if (passRate >= 80) high++;
      else if (passRate >= 50) medium++;
      else low++;
      if (s.flagged > 0) flagged++;
    });

    return { all: all.length, high, medium, low, flagged };
  }, [summary?.schedules]);

  const sortedSchedules = useMemo(() => {
    return [...filteredSchedules].sort((a, b) => {
      const passRateA = a.graded > 0 ? (a.passCount / a.graded) * 100 : 0;
      const passRateB = b.graded > 0 ? (b.passCount / b.graded) * 100 : 0;

      switch (sortOrder) {
        case 'examDate_desc':
          return new Date(b.examDate).getTime() - new Date(a.examDate).getTime();
        case 'examDate_asc':
          return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
        case 'passRate_desc':
          return passRateB - passRateA;
        case 'passRate_asc':
          return passRateA - passRateB;
        case 'avgScore_desc':
          return b.avgScore - a.avgScore;
        case 'avgScore_asc':
          return a.avgScore - b.avgScore;
        case 'name_asc':
          return a.subjectName.localeCompare(b.subjectName, 'vi');
        case 'name_desc':
          return b.subjectName.localeCompare(a.subjectName, 'vi');
        case 'assigned_desc':
          return b.assigned - a.assigned;
        default:
          return new Date(b.examDate).getTime() - new Date(a.examDate).getTime();
      }
    });
  }, [filteredSchedules, sortOrder]);

  const totalPages = Math.ceil(sortedSchedules.length / pageSize) || 1;
  const paginatedSchedules = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedSchedules.slice(start, start + pageSize);
  }, [sortedSchedules, page, pageSize]);

  // Checkbox selections
  const allCurrentPageSelected =
    paginatedSchedules.length > 0 &&
    paginatedSchedules.every((s) => selectedIds.includes(s.id));

  const handleToggleSelectAll = () => {
    if (allCurrentPageSelected) {
      const pageIds = new Set(paginatedSchedules.map((s) => s.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const newSelected = new Set(selectedIds);
      paginatedSchedules.forEach((s) => newSelected.add(s.id));
      setSelectedIds(Array.from(newSelected));
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const dist = summary?.stats.scoreDistribution || {
    excellent: 0,
    good: 0,
    fair: 0,
    average: 0,
    poor: 0,
    totalGraded: 0,
  };

  const totalGraded = dist.totalGraded || 1;
  const calcPct = (count: number) => Math.round((count / totalGraded) * 100);
  const participationRate = summary?.stats.totalAssigned
    ? Math.round((summary.stats.totalSubmitted / summary.stats.totalAssigned) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* ── 1. KPI Cards Grid Matching ExamReportKPICards Style ── */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Tổng ca thi */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block truncate">
                Tổng số ca thi
              </span>
              <div className="text-type-kpi font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
                {loading ? '...' : (summary?.stats.totalSchedules ?? 0).toLocaleString('vi-VN')}
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
              <Calendar className="h-5 w-5 stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500 w-full" />
          </div>

          <div className="mt-2.5">
            <span className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
              Thuộc {summary?.stats.totalExams ?? 0} kỳ thi chính thức
            </span>
          </div>
        </div>

        {/* Card 2: Lượt sinh viên dự thi */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block truncate">
                Lượt sinh viên dự thi
              </span>
              <div className="text-type-kpi font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
                {loading
                  ? '...'
                  : `${(summary?.stats.totalSubmitted ?? 0).toLocaleString('vi-VN')} / ${(summary?.stats.totalAssigned ?? 0).toLocaleString('vi-VN')}`}
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white">
              <Users className="h-5 w-5 stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Math.max(participationRate, 5), 100)}%` }}
            />
          </div>

          <div className="mt-2.5">
            <span className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
              Tỷ lệ dự thi đạt {participationRate}% ({summary?.stats.totalAbsent ?? 0} vắng)
            </span>
          </div>
        </div>

        {/* Card 3: Tỷ lệ đạt */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block truncate">
                Tỷ lệ đạt toàn trường
              </span>
              <div className="text-type-kpi font-bold text-emerald-600 dark:text-emerald-400 leading-[38px] tracking-tight tabular-nums">
                {loading ? '...' : `${summary?.stats.passRate ?? 0}%`}
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white">
              <Award className="h-5 w-5 stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Math.max(summary?.stats.passRate ?? 0, 5), 100)}%` }}
            />
          </div>

          <div className="mt-2.5">
            <span className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
              {(summary?.stats.passCount ?? 0).toLocaleString('vi-VN')} bài thi đạt từ 5.0 trở lên
            </span>
          </div>
        </div>

        {/* Card 4: Điểm trung bình chung */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block truncate">
                Điểm trung bình chung
              </span>
              <div className="text-type-kpi font-bold text-blue-600 dark:text-blue-400 leading-[38px] tracking-tight tabular-nums">
                {loading ? '...' : `${summary?.stats.avgScore ? summary.stats.avgScore.toFixed(2) : '0.00'} / 10`}
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white">
              <GraduationCap className="h-5 w-5 stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Math.max((summary?.stats.avgScore ?? 0) * 10, 5), 100)}%` }}
            />
          </div>

          <div className="mt-2.5">
            <span className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
              {summary?.stats.totalFlagged ? (
                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                  {summary.stats.totalFlagged} bài có cảnh báo giám sát
                </span>
              ) : (
                'Không có cảnh báo bất thường'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Unified Search & Action Toolbar Row (Single Unified Row Exactly Matching view=schedule) ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left: Unified Search Bar with Embedded SlidersHorizontal Popover */}
          <div className="relative flex-1 max-w-xl min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm theo tên môn, mã môn, khoa, kỳ thi..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-20 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
            />

            {/* Embedded actions on right edge of search input */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setPage(1);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd
                  className="hidden sm:inline-flex h-5 items-center justify-center px-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-normal text-type-helper text-slate-400 select-none cursor-pointer"
                  onClick={() => searchInputRef.current?.focus()}
                  title="Nhấn phím / để tìm nhanh"
                >
                  /
                </kbd>
              )}

              <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

              <ExamReportFilterPopover
                summaryFilters={summaryFilters}
                setSummaryFilters={setSummaryFilters}
                summaryOptions={summary?.options}
                onResetAll={resetSummaryFilters}
              />
            </div>
          </div>

          {/* Right: Sort, Columns, ViewMode, Refresh */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Sort Dropdown */}
            <SortDropdown
              value={sortOrder}
              onChange={(val) => setSortOrder(val)}
              options={[
                { value: 'examDate_desc', label: 'Ngày thi: Mới nhất' },
                { value: 'examDate_asc', label: 'Ngày thi: Cũ nhất' },
                { value: 'passRate_desc', label: 'Tỷ lệ đạt: Cao nhất' },
                { value: 'passRate_asc', label: 'Tỷ lệ đạt: Thấp nhất' },
                { value: 'avgScore_desc', label: 'Điểm TB: Cao nhất' },
                { value: 'avgScore_asc', label: 'Điểm TB: Thấp nhất' },
                { value: 'name_asc', label: 'Tên môn: A - Z' },
                { value: 'assigned_desc', label: 'Số SV: Nhiều nhất' },
              ]}
            />

            {/* Column Selector */}
            <ColumnToggleDropdown
              columns={columnsList}
              visibleColumns={visibleColumns}
              onToggle={handleColumnToggle}
            />

            {/* View Mode Segmented Control */}
            <ViewModeSegmentedControl
              viewMode={viewMode}
              onChange={(mode) => setViewMode(mode)}
            />

            {/* Refresh Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── 4. Status / Tier TabBar (Matching view=schedule) ── */}
        <TabBar
          tabs={[
            { key: 'ALL', label: 'Tất cả môn thi', count: tierCounts.all },
            { key: 'HIGH', label: 'Tỷ lệ đạt cao (>= 80%)', count: tierCounts.high },
            { key: 'MEDIUM', label: 'Trung bình (50 - 79%)', count: tierCounts.medium },
            { key: 'LOW', label: 'Cần chú ý (< 50%)', count: tierCounts.low },
            ...(tierCounts.flagged > 0
              ? [{ key: 'FLAGGED', label: 'Có cảnh báo', count: tierCounts.flagged }]
              : []),
          ]}
          active={selectedPassRateTier}
          onChange={(key) => {
            setSelectedPassRateTier(key);
            setPage(1);
          }}
        />
      </div>

      {/* ── 5. Main Data Display: 3 Modes (List, Grid, Compact) ── */}

      {/* 5.1. LIST VIEW (Default Table View) */}
      {viewMode === 'list' && (
        <div className="ui-table-wrap rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="ui-table w-full min-w-[1200px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/60 text-type-helper font-medium text-slate-700 dark:text-slate-300">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allCurrentPageSelected}
                      onChange={handleToggleSelectAll}
                      aria-label="Chọn tất cả môn thi ở trang này"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  {visibleColumns.index && <th className="py-3 px-3 w-12 text-center">STT</th>}
                  {visibleColumns.subjectCode && <th className="py-3 px-4 min-w-[100px]">Mã môn</th>}
                  {visibleColumns.subjectName && <th className="py-3 px-4 min-w-[180px]">Tên môn học</th>}
                  {visibleColumns.department && <th className="py-3 px-4 min-w-[180px]">Khoa / Bộ môn</th>}
                  {visibleColumns.period && <th className="py-3 px-4 min-w-[160px]">Kỳ thi</th>}
                  {visibleColumns.examDate && <th className="py-3 px-4 min-w-[100px] whitespace-nowrap">Ngày thi</th>}
                  {visibleColumns.assigned && (
                    <th className="py-3 px-3 text-center min-w-[80px]">Xếp phòng</th>
                  )}
                  {visibleColumns.submitted && (
                    <th className="py-3 px-3 text-center min-w-[80px]">Đã nộp</th>
                  )}
                  {visibleColumns.absent && (
                    <th className="py-3 px-3 text-center min-w-[70px]">Vắng</th>
                  )}
                  {visibleColumns.passRate && (
                    <th className="py-3 px-4 text-center min-w-[100px]">Tỷ lệ đạt</th>
                  )}
                  {visibleColumns.avgScore && (
                    <th className="py-3 px-4 text-center min-w-[90px]">Điểm TB</th>
                  )}
                  {visibleColumns.actions && (
                    <th className="py-3 px-4 text-right min-w-[110px]">Thao tác</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-type-body text-slate-800 dark:text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-slate-400 font-normal">
                      <div className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        <span>Đang nạp dữ liệu thống kê...</span>
                      </div>
                    </td>
                  </tr>
                ) : !paginatedSchedules.length ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                      <div className="space-y-2">
                        <p>Không tìm thấy môn thi nào phù hợp với điều kiện lọc.</p>
                        {(Boolean(searchTerm) || selectedPassRateTier !== 'ALL') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetSummaryFilters}
                            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                          >
                            Đặt lại bộ lọc
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedSchedules.map((row, idx) => {
                    const isChecked = selectedIds.includes(row.id);
                    const passRate =
                      row.graded > 0 ? Math.round((row.passCount / row.graded) * 100) : 0;
                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                          isChecked ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectRow(row.id)}
                            aria-label={`Chọn môn ${row.subjectName}`}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        {visibleColumns.index && (
                          <td className="py-3 px-3 text-center table-meta text-slate-500 dark:text-slate-400 font-normal">
                            {(page - 1) * pageSize + idx + 1}
                          </td>
                        )}
                        {visibleColumns.subjectCode && (
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                            <IdentifierBadge>{row.subjectCode}</IdentifierBadge>
                          </td>
                        )}
                        {visibleColumns.subjectName && (
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setDrawerSchedule(row);
                                setIsDrawerOpen(true);
                              }}
                              className="hover:text-blue-600 dark:hover:text-blue-400 text-left font-semibold transition cursor-pointer"
                            >
                              {row.subjectName}
                            </button>
                          </td>
                        )}
                        {visibleColumns.department && (
                          <td className="py-3 px-4 table-meta text-slate-600 dark:text-slate-400 font-normal">
                            {row.departmentName}
                          </td>
                        )}
                        {visibleColumns.period && (
                          <td className="py-3 px-4 table-meta text-slate-600 dark:text-slate-400 font-normal">
                            {row.periodName}
                          </td>
                        )}
                        {visibleColumns.examDate && (
                          <td className="py-3 px-4 table-meta text-slate-600 dark:text-slate-400 font-normal whitespace-nowrap">
                            {new Date(row.examDate).toLocaleDateString('vi-VN')}
                          </td>
                        )}
                        {visibleColumns.assigned && (
                          <td className="py-3 px-3 text-center font-normal text-slate-800 dark:text-slate-200">
                            {row.assigned}
                          </td>
                        )}
                        {visibleColumns.submitted && (
                          <td className="py-3 px-3 text-center font-normal text-emerald-600 dark:text-emerald-400">
                            {row.submitted}
                          </td>
                        )}
                        {visibleColumns.absent && (
                          <td className="py-3 px-3 text-center font-normal text-slate-500 dark:text-slate-400">
                            {row.absent > 0 ? (
                              <span className="text-rose-600 dark:text-rose-400 font-medium">
                                {row.absent}
                              </span>
                            ) : (
                              '0'
                            )}
                          </td>
                        )}
                        {visibleColumns.passRate && (
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`font-semibold tabular-nums ${
                                passRate >= 80
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : passRate >= 50
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {passRate}%
                            </span>
                          </td>
                        )}
                        {visibleColumns.avgScore && (
                          <td className="py-3 px-4 text-center">
                            <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                              {row.avgScore ? row.avgScore.toFixed(2) : '0.00'}
                            </span>
                          </td>
                        )}
                        {visibleColumns.actions && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDrawerSchedule(row);
                                  setIsDrawerOpen(true);
                                }}
                                leftIcon={<Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                                title="Xem chi tiết môn thi"
                              >
                                Chi tiết
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-3 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <PaginationBar
              page={page}
              totalPages={totalPages}
              limit={pageSize}
              totalItems={sortedSchedules.length}
              onPage={setPage}
              onLimit={(v) => {
                setPageSize(v);
                setPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* 5.2. GRID VIEW (Card View Mode) */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400 font-normal">
              <div className="flex items-center justify-center gap-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span>Đang nạp dữ liệu lưới...</span>
              </div>
            </div>
          ) : !paginatedSchedules.length ? (
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <p>Không tìm thấy môn thi nào phù hợp với bộ lọc.</p>
              {(Boolean(searchTerm) || selectedPassRateTier !== 'ALL') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetSummaryFilters}
                  leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                >
                  Đặt lại bộ lọc
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedSchedules.map((row) => {
                const isChecked = selectedIds.includes(row.id);
                const passRate =
                  row.graded > 0 ? Math.round((row.passCount / row.graded) * 100) : 0;
                return (
                  <div
                    key={row.id}
                    className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4.5 shadow-2xs hover:shadow-md transition-all duration-200 space-y-3.5 flex flex-col justify-between ${
                      isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header: Checkbox + Badges + Exam Period */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectRow(row.id)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <IdentifierBadge>{row.subjectCode}</IdentifierBadge>
                        </div>
                        <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400 truncate">
                          {row.periodName}
                        </span>
                      </div>

                      {/* Subject Title */}
                      <div>
                        <h3
                          onClick={() => {
                            setDrawerSchedule(row);
                            setIsDrawerOpen(true);
                          }}
                          className="text-type-section font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer line-clamp-1"
                        >
                          {row.subjectName}
                        </h3>
                        <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal pt-0.5 flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>{row.departmentName}</span>
                        </p>
                      </div>

                      {/* Meta numbers */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                        <div>
                          <span className="text-type-helper text-slate-400 font-medium block">
                            Xếp phòng
                          </span>
                          <span className="text-type-body font-semibold text-slate-800 dark:text-slate-200">
                            {row.assigned}
                          </span>
                        </div>
                        <div>
                          <span className="text-type-helper text-slate-400 font-medium block">
                            Đã nộp
                          </span>
                          <span className="text-type-body font-semibold text-emerald-600 dark:text-emerald-400">
                            {row.submitted}
                          </span>
                        </div>
                        <div>
                          <span className="text-type-helper text-slate-400 font-medium block">
                            Vắng thi
                          </span>
                          <span
                            className={`text-type-body font-semibold ${
                              row.absent > 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {row.absent}
                          </span>
                        </div>
                      </div>

                      {/* Progress bars: Pass Rate & Avg Score */}
                      <div className="space-y-2 pt-1">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-type-helper">
                            <span className="text-slate-500 font-medium">Tỷ lệ đạt</span>
                            <span
                              className={`font-semibold ${
                                passRate >= 80
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : passRate >= 50
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {passRate}% ({row.passCount} bài)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                passRate >= 80
                                  ? 'bg-emerald-600'
                                  : passRate >= 50
                                  ? 'bg-blue-600'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${passRate}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-type-helper pt-1">
                          <span className="text-slate-500 font-medium">Điểm TB:</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {row.avgScore ? row.avgScore.toFixed(2) : '0.00'} / 10
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-type-helper text-slate-400 font-normal">
                        {new Date(row.examDate).toLocaleDateString('vi-VN')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setDrawerSchedule(row);
                            setIsDrawerOpen(true);
                          }}
                          leftIcon={<Eye className="h-3.5 w-3.5 text-blue-600" />}
                        >
                          Chi tiết
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination for Grid */}
          <div className="p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <PaginationBar
              page={page}
              totalPages={totalPages}
              limit={pageSize}
              totalItems={sortedSchedules.length}
              onPage={setPage}
              onLimit={(v) => {
                setPageSize(v);
                setPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* 5.3. COMPACT VIEW (High-Density Table Mode) */}
      {viewMode === 'compact' && (
        <div className="ui-table-wrap rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="ui-table w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/60 text-type-helper font-medium text-slate-700 dark:text-slate-300">
                  <th className="py-2.5 px-2.5 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={allCurrentPageSelected}
                      onChange={handleToggleSelectAll}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
                    />
                  </th>
                  <th className="py-2.5 px-3 w-10 text-center">STT</th>
                  <th className="py-2.5 px-3">Mã môn</th>
                  <th className="py-2.5 px-3">Tên môn học</th>
                  <th className="py-2.5 px-3">Khoa</th>
                  <th className="py-2.5 px-3">Kỳ thi</th>
                  <th className="py-2.5 px-3">Ngày thi</th>
                  <th className="py-2.5 px-2.5 text-center">SV</th>
                  <th className="py-2.5 px-2.5 text-center">Nộp</th>
                  <th className="py-2.5 px-2.5 text-center">Vắng</th>
                  <th className="py-2.5 px-3 text-center">Tỷ lệ đạt</th>
                  <th className="py-2.5 px-3 text-center">Điểm TB</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-type-body text-slate-800 dark:text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-slate-400 font-normal">
                      Đang nạp dữ liệu thu gọn...
                    </td>
                  </tr>
                ) : !paginatedSchedules.length ? (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-slate-400 font-normal">
                      Không có môn thi nào.
                    </td>
                  </tr>
                ) : (
                  paginatedSchedules.map((row, idx) => {
                    const isChecked = selectedIds.includes(row.id);
                    const passRate =
                      row.graded > 0 ? Math.round((row.passCount / row.graded) * 100) : 0;
                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                          isChecked ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <td className="py-2.5 px-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectRow(row.id)}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center table-meta text-slate-400 font-normal">
                          {(page - 1) * pageSize + idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                          {row.subjectCode}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                          {row.subjectName}
                        </td>
                        <td className="py-2.5 px-3 table-meta text-slate-500 font-normal truncate max-w-[140px]">
                          {row.departmentName}
                        </td>
                        <td className="py-2.5 px-3 table-meta text-slate-500 font-normal truncate max-w-[140px]">
                          {row.periodName}
                        </td>
                        <td className="py-2.5 px-3 table-meta text-slate-500 font-normal">
                          {new Date(row.examDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-normal">{row.assigned}</td>
                        <td className="py-2.5 px-2.5 text-center font-normal text-emerald-600">
                          {row.submitted}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-normal text-slate-500">
                          {row.absent}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-emerald-600">
                          {passRate}%
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-slate-900 dark:text-slate-100">
                          {row.avgScore ? row.avgScore.toFixed(2) : '0.00'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDrawerSchedule(row);
                              setIsDrawerOpen(true);
                            }}
                            leftIcon={<Eye className="h-3.5 w-3.5 text-blue-600" />}
                          >
                            Chi tiết
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-2.5 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <PaginationBar
              page={page}
              totalPages={totalPages}
              limit={pageSize}
              totalItems={sortedSchedules.length}
              onPage={setPage}
              onLimit={(v) => {
                setPageSize(v);
                setPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* ── 6. Floating Bulk Action Bar for Selected Subjects ── */}
      <ExamReportBulkAction
        selectedCount={selectedIds.length}
        totalCount={sortedSchedules.length}
        allSelected={
          sortedSchedules.length > 0 && selectedIds.length === sortedSchedules.length
        }
        onToggleAll={() => {
          if (selectedIds.length === sortedSchedules.length) {
            setSelectedIds([]);
          } else {
            setSelectedIds(sortedSchedules.map((s) => s.id));
          }
        }}
        onExportExcel={() => {
          const targets =
            selectedIds.length > 0
              ? sortedSchedules.filter((s) => selectedIds.includes(s.id))
              : sortedSchedules;
          exportToFormattedExcel({
            filename: `Bao_Cao_Tong_Hop_${new Date().toISOString().slice(0, 10)}.xls`,
            title: 'BÁO CÁO THỐNG KÊ TỔNG HỢP KẾT QUẢ KHẢO THÍ',
            subtitle: `Số môn thi: ${targets.length} · Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,
            columns: [
              { header: 'STT', align: 'center', width: 8 },
              { header: 'Mã môn', width: 14 },
              { header: 'Tên môn học', width: 28 },
              { header: 'Khoa / Bộ môn', width: 24 },
              { header: 'Kỳ thi', width: 24 },
              { header: 'Ngày thi', align: 'center', width: 14 },
              { header: 'Xếp phòng', align: 'center', width: 12 },
              { header: 'Đã nộp', align: 'center', width: 12 },
              { header: 'Vắng', align: 'center', width: 10 },
              { header: 'Tỷ lệ đạt (%)', align: 'center', width: 14 },
              { header: 'Điểm TB', align: 'center', width: 12 },
            ],
            rows: targets.map((row, index) => [
              index + 1,
              row.subjectCode,
              row.subjectName,
              row.departmentName,
              row.periodName,
              new Date(row.examDate).toLocaleDateString('vi-VN'),
              row.assigned,
              row.submitted,
              row.absent,
              row.graded > 0 ? `${((row.passCount / row.graded) * 100).toFixed(1)}%` : '0%',
              row.avgScore ? row.avgScore.toFixed(2) : '0.00',
            ]),
          });
        }}
        onPrint={() => {
          const targets =
            selectedIds.length > 0
              ? sortedSchedules.filter((s) => selectedIds.includes(s.id))
              : sortedSchedules;
          const now = new Date();
          const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
          printReport({
            title: 'BÁO CÁO THỐNG KÊ TỔNG HỢP KẾT QUẢ KHẢO THÍ',
            subtitle: `Báo cáo số liệu toàn diện các môn thi & kỳ thi · Ngày xuất: ${dateStr}`,
            metaInfo: [
              { label: 'Đơn vị lập báo cáo', value: 'Ban Khảo thí & Đảm bảo chất lượng' },
              { label: 'Số lượng môn thi', value: `${targets.length} môn thi` },
            ],
            columns: [
              { header: 'STT', width: '40px', align: 'center' },
              { header: 'Mã môn', width: '90px', align: 'center' },
              { header: 'Tên môn học', width: '220px', align: 'left' },
              { header: 'Khoa / Bộ môn', width: '150px', align: 'left' },
              { header: 'Kỳ thi', width: '130px', align: 'left' },
              { header: 'Ngày thi', width: '95px', align: 'center' },
              { header: 'Số SV', width: '60px', align: 'center' },
              { header: 'Đã nộp', width: '65px', align: 'center' },
              { header: 'Vắng', width: '55px', align: 'center' },
              { header: 'Tỷ lệ đạt', width: '80px', align: 'center' },
              { header: 'Điểm TB', width: '75px', align: 'center' },
            ],
            rows: targets.map((row, idx) => [
              idx + 1,
              row.subjectCode,
              row.subjectName,
              row.departmentName,
              row.periodName,
              new Date(row.examDate).toLocaleDateString('vi-VN'),
              row.assigned,
              row.submitted,
              row.absent,
              row.graded > 0 ? `${((row.passCount / row.graded) * 100).toFixed(1)}%` : '0%',
              row.avgScore ? row.avgScore.toFixed(2) : '0.00',
            ]),
            footerNotes:
              'Báo cáo tổng hợp số liệu khảo thí từ cơ sở dữ liệu PostgreSQL của hệ thống khảo thí.',
            signers: [
              { title: 'NGƯỜI LẬP BÁO CÁO', subtitle: '(Ký, ghi rõ họ tên)' },
              { title: 'TRƯỞNG PHÒNG KHẢO THÍ', subtitle: '(Ký tên, đóng dấu)' },
            ],
          });
        }}
        onClear={() => setSelectedIds([])}
      />

      {/* ── 7. Drawer Xem Nhanh Chi Tiết Môn Học ── */}
      <SummaryScheduleDrawer
        schedule={drawerSchedule}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onViewDetailedSchedule={onSelectSchedule}
        onExportSingleExcel={(sched) => {
          exportToFormattedExcel({
            filename: `Bao_Cao_${sched.subjectCode}_${new Date().toISOString().slice(0, 10)}.xls`,
            title: `BÁO CÁO KẾT QUẢ MÔN: ${sched.subjectName.toUpperCase()}`,
            subtitle: `Mã môn: ${sched.subjectCode} · Khoa: ${sched.departmentName} · Kỳ thi: ${sched.periodName}`,
            columns: [
              { header: 'Chỉ số', width: 28 },
              { header: 'Giá trị', width: 24, align: 'center' },
            ],
            rows: [
              ['Số SV xếp phòng', sched.assigned],
              ['Số SV nộp bài', sched.submitted],
              ['Số SV vắng thi', sched.absent],
              ['Số bài đạt', sched.passCount],
              [
                'Tỷ lệ đạt (%)',
                sched.graded > 0 ? `${((sched.passCount / sched.graded) * 100).toFixed(1)}%` : '0%',
              ],
              ['Điểm trung bình', sched.avgScore ? sched.avgScore.toFixed(2) : '0.00'],
            ],
          });
        }}
        onPrintSingle={(sched) => {
          const passRate =
            sched.graded > 0 ? ((sched.passCount / sched.graded) * 100).toFixed(1) : '0.0';
          printReport({
            title: `BÁO CÁO KẾT QUẢ MÔN HỌC: ${sched.subjectName.toUpperCase()}`,
            subtitle: `Mã môn: ${sched.subjectCode} · ${sched.periodName} · Ngày thi: ${new Date(sched.examDate).toLocaleDateString('vi-VN')}`,
            metaInfo: [
              { label: 'Khoa / Bộ môn', value: sched.departmentName },
              { label: 'Số sinh viên dự thi', value: `${sched.submitted} / ${sched.assigned}` },
              { label: 'Tỷ lệ đạt chuẩn', value: `${passRate}%` },
              { label: 'Điểm trung bình', value: `${sched.avgScore ? sched.avgScore.toFixed(2) : '0.00'} / 10.0` },
            ],
            columns: [
              { header: 'Mã môn', width: '100px', align: 'center' },
              { header: 'Tên môn học', width: '250px', align: 'left' },
              { header: 'Số SV', width: '80px', align: 'center' },
              { header: 'Đã nộp', width: '80px', align: 'center' },
              { header: 'Vắng', width: '80px', align: 'center' },
              { header: 'Tỷ lệ đạt', width: '90px', align: 'center' },
              { header: 'Điểm TB', width: '90px', align: 'center' },
            ],
            rows: [
              [
                sched.subjectCode,
                sched.subjectName,
                sched.assigned,
                sched.submitted,
                sched.absent,
                `${passRate}%`,
                sched.avgScore ? sched.avgScore.toFixed(2) : '0.00',
              ],
            ],
          });
        }}
      />
    </div>
  );
}
