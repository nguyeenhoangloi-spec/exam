'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Calendar,
  Users,
  Award,
  GraduationCap,
  FileSpreadsheet,
  Printer,
  ArrowUpDown,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { Button, FilterSelect, IdentifierBadge, PaginationBar } from '../ui';
import { downloadCsv } from '../../lib/export-csv';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<keyof SummaryScheduleRow>('examDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter schedules
  const filteredSchedules = useMemo(() => {
    if (!summary?.schedules) return [];
    return summary.schedules.filter((s) => {
      // Period filter
      if (selectedPeriod !== 'ALL' && String(s.examPeriodId) !== selectedPeriod) {
        return false;
      }
      // Department filter
      if (selectedDepartment !== 'ALL' && String(s.departmentId) !== selectedDepartment) {
        return false;
      }
      // Search term
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
  }, [summary?.schedules, selectedPeriod, selectedDepartment, searchTerm]);

  // Sort schedules
  const sortedSchedules = useMemo(() => {
    return [...filteredSchedules].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'examDate') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else if (typeof valA === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB, 'vi')
          : valB.localeCompare(valA, 'vi');
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredSchedules, sortField, sortOrder]);

  // Paginated schedules
  const paginatedSchedules = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedSchedules.slice(start, start + pageSize);
  }, [sortedSchedules, page, pageSize]);

  const totalPages = Math.ceil(sortedSchedules.length / pageSize) || 1;

  const handleSort = (field: keyof SummaryScheduleRow) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Export Summary Excel / CSV
  const handleExportCsv = () => {
    if (!sortedSchedules.length) return;
    const headers = [
      'STT',
      'Mã môn học',
      'Tên môn học',
      'Khoa / Bộ môn',
      'Kỳ thi',
      'Ngày thi',
      'Số SV xếp phòng',
      'Số bài nộp',
      'Vắng thi',
      'Chưa chấm',
      'Có cảnh báo',
      'Số bài đạt',
      'Tỷ lệ đạt (%)',
      'Điểm trung bình',
    ];

    const rows = sortedSchedules.map((row, idx) => {
      const passRate = row.graded > 0 ? ((row.passCount / row.graded) * 100).toFixed(1) : '0.0';
      return [
        idx + 1,
        row.subjectCode,
        row.subjectName,
        row.departmentName,
        row.periodName,
        new Date(row.examDate).toLocaleDateString('vi-VN'),
        row.assigned,
        row.submitted,
        row.absent,
        row.ungraded,
        row.flagged,
        row.passCount,
        `${passRate}%`,
        row.avgScore,
      ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
    });

    downloadCsv(
      `Bao_Cao_Thong_Ke_Tong_Hop_${new Date().toISOString().slice(0, 10)}.csv`,
      `${headers.join(',')}\n${rows.join('\n')}`
    );
  };

  // Official Print Summary Report
  const handlePrintSummary = () => {
    if (!summary) return;
    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

    printReport({
      title: 'BÁO CÁO THỐNG KÊ TỔNG HỢP KẾT QUẢ KHẢO THÍ',
      subtitle: `Báo cáo số liệu toàn diện các môn thi & kỳ thi · Ngày xuất: ${dateStr}`,
      metaInfo: [
        { label: 'Đơn vị lập báo cáo', value: 'Ban Khảo thí & Đảm bảo chất lượng' },
        { label: 'Tổng số môn thi / ca thi', value: `${summary.stats.totalSchedules} ca thi` },
        { label: 'Tổng lượt dự thi', value: `${summary.stats.totalSubmitted} / ${summary.stats.totalAssigned} SV` },
        { label: 'Tỷ lệ đạt chung', value: `${summary.stats.passRate}%` },
        { label: 'Điểm trung bình', value: `${summary.stats.avgScore} / 10.0` },
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
      rows: sortedSchedules.map((row, idx) => [
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
        row.avgScore.toFixed(2),
      ]),
      footerNotes: 'Báo cáo tổng hợp số liệu khảo thí từ cơ sở dữ liệu PostgreSQL của hệ thống khảo thí.',
      signers: [
        { title: 'NGƯỜI LẬP BÁO CÁO', subtitle: '(Ký, ghi rõ họ tên)' },
        { title: 'TRƯỞNG PHÒNG KHẢO THÍ', subtitle: '(Ký tên, đóng dấu)' },
      ],
    });
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
      {/* ── 1. KPI Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng ca thi & Môn thi */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4.5 shadow-2xs space-y-3 transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">
              Tổng số ca thi
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-type-kpi font-bold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
              {loading ? '...' : summary?.stats.totalSchedules ?? 0}
            </div>
            <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
              Thuộc {summary?.stats.totalExams ?? 0} kỳ thi chính thức
            </p>
          </div>
        </div>

        {/* Card 2: Lượt thi & Tỷ lệ dự thi */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4.5 shadow-2xs space-y-3 transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">
              Lượt sinh viên dự thi
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-type-kpi font-bold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
              {loading ? '...' : `${summary?.stats.totalSubmitted ?? 0} / ${summary?.stats.totalAssigned ?? 0}`}
            </div>
            <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
              Tỷ lệ dự thi đạt {participationRate}% ({summary?.stats.totalAbsent ?? 0} vắng)
            </p>
          </div>
        </div>

        {/* Card 3: Tỷ lệ đạt */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4.5 shadow-2xs space-y-3 transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">
              Tỷ lệ đạt toàn trường
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-type-kpi font-bold leading-[36px] text-emerald-600 dark:text-emerald-400 tracking-tight">
              {loading ? '...' : `${summary?.stats.passRate ?? 0}%`}
            </div>
            <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
              {summary?.stats.passCount ?? 0} bài thi đạt điểm từ 5.0 trở lên
            </p>
          </div>
        </div>

        {/* Card 4: Điểm trung bình */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4.5 shadow-2xs space-y-3 transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">
              Điểm trung bình chung
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-type-kpi font-bold leading-[36px] text-blue-600 dark:text-blue-400 tracking-tight">
              {loading ? '...' : `${summary?.stats.avgScore ?? 0} / 10.0`}
            </div>
            <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
              {summary?.stats.totalFlagged ? (
                <span className="text-rose-600 dark:text-rose-400 font-medium">
                  {summary.stats.totalFlagged} bài có cảnh báo giám sát
                </span>
              ) : (
                'Không có cảnh báo bất thường'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Phổ Điểm Phân Phối 5 Mức (Score Distribution) ── */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-blue-600" />
            <h2 className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
              Phân tích phổ điểm toàn trường
            </h2>
          </div>
          <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400">
            Tổng số bài đã chấm: {dist.totalGraded}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
          {/* Xuất sắc */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between text-type-helper">
              <span className="font-medium text-emerald-700 dark:text-emerald-400">Xuất sắc (9.0 - 10)</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{dist.excellent} bài</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${calcPct(dist.excellent)}%` }}
              />
            </div>
            <p className="text-type-helper text-slate-500 dark:text-slate-400 text-right font-normal">{calcPct(dist.excellent)}%</p>
          </div>

          {/* Giỏi */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between text-type-helper">
              <span className="font-medium text-blue-700 dark:text-blue-400">Giỏi (8.0 - 8.9)</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{dist.good} bài</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${calcPct(dist.good)}%` }}
              />
            </div>
            <p className="text-type-helper text-slate-500 dark:text-slate-400 text-right font-normal">{calcPct(dist.good)}%</p>
          </div>

          {/* Khá */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between text-type-helper">
              <span className="font-medium text-blue-700 dark:text-blue-400">Khá (7.0 - 7.9)</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{dist.fair} bài</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${calcPct(dist.fair)}%` }}
              />
            </div>
            <p className="text-type-helper text-slate-500 dark:text-slate-400 text-right font-normal">{calcPct(dist.fair)}%</p>
          </div>

          {/* Trung bình */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between text-type-helper">
              <span className="font-medium text-amber-700 dark:text-amber-400">Trung bình (5.0 - 6.9)</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{dist.average} bài</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${calcPct(dist.average)}%` }}
              />
            </div>
            <p className="text-type-helper text-slate-500 dark:text-slate-400 text-right font-normal">{calcPct(dist.average)}%</p>
          </div>

          {/* Chưa đạt */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between text-type-helper">
              <span className="font-medium text-rose-700 dark:text-rose-400">Chưa đạt (&lt; 5.0)</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{dist.poor} bài</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${calcPct(dist.poor)}%` }}
              />
            </div>
            <p className="text-type-helper text-slate-500 dark:text-slate-400 text-right font-normal">{calcPct(dist.poor)}%</p>
          </div>
        </div>
      </div>

      {/* ── 3. Bảng Dữ Liệu Tổng Hợp Môn Thi & Lịch Thi ── */}
      <div className="space-y-4">
        {/* Toolbar: Search, Filters & Export */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          {/* Left: Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo tên môn, mã môn, kỳ thi, khoa..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-9 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Middle: Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo kỳ thi"
            >
              <option value="ALL">Tất cả kỳ thi</option>
              {summary?.options?.periods?.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo khoa"
            >
              <option value="ALL">Tất cả khoa</option>
              {summary?.options?.departments?.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </FilterSelect>

            {(searchTerm || selectedPeriod !== 'ALL' || selectedDepartment !== 'ALL') && (
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedPeriod('ALL');
                  setSelectedDepartment('ALL');
                  setPage(1);
                }}
                leftIcon={<RotateCcw className="h-4 w-4 text-slate-500" />}
              >
                Đặt lại
              </Button>
            )}
          </div>

          {/* Right: Export & Print Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="md"
              onClick={onRefresh}
              disabled={loading}
              leftIcon={<RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
            >
              Làm mới
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleExportCsv}
              leftIcon={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
              disabled={!sortedSchedules.length}
            >
              Xuất Excel
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handlePrintSummary}
              leftIcon={<Printer className="h-4 w-4 text-blue-600" />}
              disabled={!sortedSchedules.length}
            >
              In báo cáo
            </Button>
          </div>
        </div>

        {/* DataGrid Table with ui-table-wrap and ui-table */}
        <div className="ui-table-wrap rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="ui-table w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/60 text-type-helper font-medium text-slate-700 dark:text-slate-300">
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th
                    className="py-3 px-4 cursor-pointer select-none hover:text-blue-600"
                    onClick={() => handleSort('subjectCode')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Mã môn</span>
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer select-none hover:text-blue-600"
                    onClick={() => handleSort('subjectName')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Tên môn học</span>
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Khoa / Bộ môn</th>
                  <th className="py-3 px-4">Kỳ thi</th>
                  <th
                    className="py-3 px-4 cursor-pointer select-none hover:text-blue-600"
                    onClick={() => handleSort('examDate')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Ngày thi</span>
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Số SV</th>
                  <th className="py-3 px-3 text-center">Đã nộp</th>
                  <th className="py-3 px-3 text-center">Vắng</th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer select-none hover:text-blue-600"
                    onClick={() => handleSort('passCount')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Tỷ lệ đạt</span>
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer select-none hover:text-blue-600"
                    onClick={() => handleSort('avgScore')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Điểm TB</span>
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-type-body text-slate-800 dark:text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400 font-normal">
                      <div className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        <span>Đang nạp dữ liệu thống kê...</span>
                      </div>
                    </td>
                  </tr>
                ) : !paginatedSchedules.length ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                      Không tìm thấy môn thi nào phù hợp với điều kiện lọc.
                    </td>
                  </tr>
                ) : (
                  paginatedSchedules.map((row, idx) => {
                    const passRate =
                      row.graded > 0 ? Math.round((row.passCount / row.graded) * 100) : 0;
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-center table-meta text-slate-500 dark:text-slate-400 font-normal">
                          {(page - 1) * pageSize + idx + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                          <IdentifierBadge>{row.subjectCode}</IdentifierBadge>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                          {row.subjectName}
                        </td>
                        <td className="py-3 px-4 table-meta text-slate-600 dark:text-slate-400 font-normal">
                          {row.departmentName}
                        </td>
                        <td className="py-3 px-4 table-meta text-slate-600 dark:text-slate-400 font-normal">
                          {row.periodName}
                        </td>
                        <td className="py-3 px-4 table-meta text-slate-600 dark:text-slate-400 font-normal">
                          {new Date(row.examDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3 px-3 text-center font-normal text-slate-800 dark:text-slate-200">
                          {row.assigned}
                        </td>
                        <td className="py-3 px-3 text-center font-normal text-emerald-600 dark:text-emerald-400">
                          {row.submitted}
                        </td>
                        <td className="py-3 px-3 text-center font-normal text-slate-500 dark:text-slate-400">
                          {row.absent > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400 font-medium">
                              {row.absent}
                            </span>
                          ) : (
                            '0'
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`font-medium ${
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
                        <td className="py-3 px-3 text-center font-medium text-slate-900 dark:text-slate-100">
                          {row.avgScore ? row.avgScore.toFixed(2) : '0.00'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onSelectSchedule(row.id)}
                            leftIcon={<Eye className="h-3.5 w-3.5 text-blue-600" />}
                          >
                            Xem ca thi
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
      </div>
    </div>
  );
}
