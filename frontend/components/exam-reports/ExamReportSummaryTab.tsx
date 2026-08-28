'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  Columns3,
  FileSpreadsheet,
  FileText,
  History,
  Search,
  Settings2,
  Users,
  X,
} from 'lucide-react';
import api from '../../lib/api';
import { printReport } from '../../lib/export-print';
import { Toast } from '../Toast';
import { TabBar, TabItem } from '../ui/TabBar';
import { DataActionsDropdown } from '../ui/DataActionsDropdown';
import { Button } from '../ui/Button';
import { PaginationBar } from '../ui/PaginationBar';

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
  filters: Record<string, unknown>;
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
    scoreDistribution: {
      excellent: number;
      good: number;
      fair: number;
      average: number;
      poor: number;
      totalGraded: number;
    };
  };
  schedules: SummaryScheduleRow[];
  options: {
    classes: Array<{ id: number; name: string }>;
    periods: Array<{ id: number; name: string }>;
    subjects: Array<{ id: number; code: string; name: string }>;
    departments: Array<{ id: number; name: string }>;
  };
}

export interface SummaryFilters {
  examPeriodId: string;
  subjectId: string;
  departmentId: string;
  classId: string;
  fromDate: string;
  toDate: string;
}

interface CatalogItem {
  type: string;
  name: string;
  description: string;
  group: string;
  formats: string[];
}

interface ReportColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

interface ReportPreview {
  type: string;
  title: string;
  description: string;
  generatedAt: string;
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
  totalRows: number;
}

interface HistoryItem {
  id: string;
  title: string;
  type: string;
  format: string;
  totalRows: number;
  createdAt: string;
}

interface Props {
  summary: SummaryData | null;
  loading: boolean;
  filters: SummaryFilters;
  setFilters: React.Dispatch<React.SetStateAction<SummaryFilters>>;
  onSelectSchedule: (id: number) => void;
  onRefresh: () => void;
}

const HISTORY_KEY = 'exam_report_export_history';

export function ExamReportSummaryTab({
  summary,
  filters,
  setFilters,
  onSelectSchedule,
}: Props) {
  const [tab, setTab] = useState<'overview' | 'builder' | 'history'>('overview');
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [type, setType] = useState('EXAM_SUMMARY');
  const [title, setTitle] = useState('');
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [busy, setBusy] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [collapseConfig, setCollapseConfig] = useState(false);
  const [openTemplateMenu, setOpenTemplateMenu] = useState(false);
  const templateMenuRef = useRef<HTMLDivElement>(null);
  const templateBtnRef = useRef<HTMLButtonElement>(null);
  const [templateMenuStyle, setTemplateMenuStyle] = useState<React.CSSProperties>({});

  const updateTemplateMenuPosition = useCallback(() => {
    if (!templateBtnRef.current) return;
    const rect = templateBtnRef.current.getBoundingClientRect();
    const width = 288; // w-72
    let left = rect.right - width;
    if (left < 16) left = 16;
    const top = rect.bottom + 6;
    setTemplateMenuStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      zIndex: 99999,
    });
  }, []);

  useEffect(() => {
    if (!openTemplateMenu) return;
    updateTemplateMenuPosition();
    const handleScrollOrResize = () => updateTemplateMenuPosition();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [openTemplateMenu, updateTemplateMenuPosition]);

  const [openColumnMenu, setOpenColumnMenu] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const columnBtnRef = useRef<HTMLButtonElement>(null);
  const [columnMenuStyle, setColumnMenuStyle] = useState<React.CSSProperties>({});

  const updateColumnMenuPosition = useCallback(() => {
    if (!columnBtnRef.current) return;
    const rect = columnBtnRef.current.getBoundingClientRect();
    const width = 288; // w-72
    let left = rect.right - width;
    if (left < 16) left = 16;
    const top = rect.bottom + 6;
    setColumnMenuStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      zIndex: 99999,
    });
  }, []);

  useEffect(() => {
    if (!openColumnMenu) return;
    updateColumnMenuPosition();
    const handleScrollOrResize = () => updateColumnMenuPosition();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [openColumnMenu, updateColumnMenuPosition]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        templateMenuRef.current &&
        !templateMenuRef.current.contains(event.target as Node) &&
        templateBtnRef.current &&
        !templateBtnRef.current.contains(event.target as Node)
      ) {
        setOpenTemplateMenu(false);
      }
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(event.target as Node) &&
        columnBtnRef.current &&
        !columnBtnRef.current.contains(event.target as Node)
      ) {
        setOpenColumnMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    api
      .get<CatalogItem[]>('/exam-reports/catalog')
      .then((r) => setCatalog(r.data))
      .catch((e: Error) => setNotice({ type: 'error', message: e.message }));
    try {
      setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'));
    } catch {
      setHistory([]);
    }
  }, []);

  const requestFilters = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filters)
          .filter(([, v]) => v && v !== 'ALL')
          .map(([k, v]) => [k, k.endsWith('Id') ? Number(v) : v]),
      ),
    [filters],
  );

  const loadPreview = useCallback(async () => {
    setBusy('preview');
    setNotice(null);
    try {
      const r = await api.post<ReportPreview>('/exam-reports/preview', {
        type,
        filters: requestFilters,
        columns: columns.length ? columns : undefined,
        title: title.trim() || undefined,
      });
      setPreview(r.data);
      setColumns(r.data.columns.map((c) => c.key));
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'Không tạo được bản xem trước.' });
    } finally {
      setBusy('');
    }
  }, [columns, requestFilters, title, type]);

  const choose = (item: CatalogItem) => {
    setType(item.type);
    setTitle(item.name);
    setPreview(null);
    setColumns([]);
    setTab('builder');
    setOpenTemplateMenu(false);
  };

  const exportFile = async (format: 'CSV' | 'XLSX') => {
    setBusy(format);
    setNotice(null);
    try {
      const r = await api.post(
        '/exam-reports/export',
        {
          type,
          format,
          filters: requestFilters,
          columns: columns.length ? columns : undefined,
          title: title.trim() || undefined,
        },
        { responseType: 'blob' },
      );
      const disposition = String(r.headers['content-disposition'] || '');
      const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
      const filename = encoded
        ? decodeURIComponent(encoded)
        : `Bao_Cao_${new Date().toISOString().slice(0, 10)}.${format.toLowerCase()}`;
      const url = URL.createObjectURL(r.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      const item: HistoryItem = {
        id: `${Date.now()}-${format}`,
        title: preview?.title || title || 'Báo cáo khảo thí',
        type,
        format,
        totalRows: preview?.totalRows || 0,
        createdAt: new Date().toISOString(),
      };
      setHistory((current) => {
        const next = [item, ...current].slice(0, 30);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        return next;
      });
      setNotice({ type: 'success', message: `Đã tạo file ${format} theo đúng phạm vi đang chọn.` });
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'Không xuất được báo cáo.' });
    } finally {
      setBusy('');
    }
  };

  const printPreview = () => {
    if (!preview) return;
    const selectedCols = preview.columns.filter((c) => columns.includes(c.key));
    const ok = printReport({
      title: preview.title,
      subtitle: `Thời điểm lập: ${new Date(preview.generatedAt).toLocaleString('vi-VN')}, ${preview.totalRows} bản ghi`,
      orientation: selectedCols.length > 6 ? 'landscape' : 'portrait',
      columns: selectedCols.map((c) => ({
        header: c.label,
        align: c.align,
        width: ['periodName', 'subjectName', 'departmentName'].includes(c.key)
          ? '18%'
          : ['subjectCode', 'examDate'].includes(c.key)
            ? '11%'
            : '7%',
      })),
      rows: preview.rows.map((row) => selectedCols.map((c) => row[c.key])),
      footerNotes: 'Dữ liệu chính thức trong phạm vi được phép truy cập.',
    });
    if (!ok) setNotice({ type: 'error', message: 'Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup.' });
  };

  const schedules = useMemo(() => {
    const key = search.trim().toLocaleLowerCase('vi');
    return (summary?.schedules || [])
      .filter(
        (r) =>
          !key ||
          [r.subjectCode, r.subjectName, r.periodName, r.departmentName].some((v) =>
            v.toLocaleLowerCase('vi').includes(key),
          ),
      )
      .slice(0, 8);
  }, [search, summary?.schedules]);

  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * historyLimit;
    return history.slice(start, start + historyLimit);
  }, [history, historyPage, historyLimit]);

  const navigationTabs = useMemo<TabItem<'overview' | 'builder' | 'history'>[]>(
    () => [
      { key: 'overview', label: 'Tổng quan ca thi' },
      { key: 'builder', label: 'Tạo báo cáo theo mẫu' },
      { key: 'history', label: 'Lịch sử xuất', count: history.length || undefined },
    ],
    [history.length],
  );

  return (
    <div className="space-y-5">
      {notice && <Toast message={notice.message} type={notice.type} onClose={() => setNotice(null)} />}

      {/* ── 1. TabBar Chuẩn Hệ Thống (Đồng bộ 100% với activity-logs & settings) ── */}
      <TabBar<'overview' | 'builder' | 'history'>
        tabs={navigationTabs}
        active={tab}
        onChange={setTab}
        variant="line"
      />

      {/* ── TAB 1: BẢNG CA THI GẦN ĐÂY (PHẲNG, LIỀN MẠCH, THOÁNG ĐÃNG) ── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Unified Search & Action Toolbar Row (Chuẩn đồng bộ 100% với các trang khác) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            {/* Left: Search Bar with 40px height, shortcut /, clear X button */}
            <div className="relative flex-1 max-w-xl min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo mã môn, tên môn, kỳ thi, khoa..."
                className="h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-12 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-0.5"
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
              </div>
            </div>

            {/* Right: Mẫu báo cáo dropdown button (Pure Ghost Button) */}
            <div className="relative shrink-0">
              <button
                ref={templateBtnRef}
                type="button"
                onClick={() => setOpenTemplateMenu((v) => !v)}
                className={`h-9 inline-flex items-center gap-1.5 px-2.5 rounded-xl text-type-body font-medium transition cursor-pointer select-none bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none ${
                  openTemplateMenu
                    ? 'text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Chọn mẫu báo cáo"
              >
                <FileSpreadsheet className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Mẫu báo cáo</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                    openTemplateMenu ? 'rotate-180 text-slate-600 dark:text-slate-300' : ''
                  }`}
                />
              </button>

              {/* Menu Popover qua Portal */}
              {openTemplateMenu &&
                typeof document !== 'undefined' &&
                createPortal(
                  <div
                    ref={templateMenuRef}
                    style={templateMenuStyle}
                    className="rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-1.5 z-30 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="px-3 py-2">
                      <p className="text-type-body-sm font-semibold text-slate-900 dark:text-white">
                        Chọn mẫu báo cáo
                      </p>
                      <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5">
                        Mở nhanh cấu hình và xem trước dữ liệu
                      </p>
                    </div>

                    <div className="pt-1 space-y-0.5 max-h-80 overflow-y-auto custom-scrollbar">
                      {catalog.map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => choose(item)}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="text-type-body-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                              {item.name}
                            </p>
                            <p className="text-type-helper text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5">
                              {item.description}
                            </p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>,
                  document.body,
                )}
            </div>
          </div>

          {/* Bảng Ca thi gần đây (Khung Bảng Duy Nhất, phẳng và liền mạch) */}
          <div className="ui-table-wrap rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
            <table className="ui-table w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 text-type-body-sm font-medium text-slate-600 dark:text-slate-400">
                  <th className="py-3.5 px-5">Môn thi & Khoa</th>
                  <th className="py-3.5 px-5">Kỳ thi</th>
                  <th className="py-3.5 px-5">Ngày thi</th>
                  <th className="py-3.5 px-5 text-center">Tiến độ chấm</th>
                  <th className="py-3.5 px-5 text-center">Điểm TB</th>
                  <th className="py-3.5 px-5 text-right w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {schedules.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => onSelectSchedule(r.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-type-body text-slate-900 dark:text-slate-100">
                          {r.subjectName}
                        </span>
                        <span className="table-meta text-type-helper text-slate-400 tabular-nums">
                          #{r.subjectCode}
                        </span>
                      </div>
                      <p className="table-meta text-type-helper text-slate-500 dark:text-slate-400 mt-0.5">
                        {r.departmentName}
                      </p>
                    </td>
                    <td className="py-4 px-5 whitespace-nowrap text-type-body text-slate-700 dark:text-slate-300">
                      {r.periodName}
                    </td>
                    <td className="py-4 px-5 whitespace-nowrap text-type-body tabular-nums text-slate-500 dark:text-slate-400">
                      {new Date(r.examDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-4 px-5 text-center whitespace-nowrap">
                      <span className="table-badge inline-flex items-center px-2.5 py-0.5 rounded-full ui-pill text-type-helper font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800 tabular-nums">
                        {r.graded}/{r.submitted} bài
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center whitespace-nowrap text-type-body font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      {r.avgScore}
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <ArrowUpRight className="h-4 w-4 inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: TẠO BÁO CÁO THEO MẪU (1 KHUNG DUY NHẤT CHIA 2 BÊN LIỀN NHAU) ── */}
      {tab === 'builder' && (
        <div className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden flex flex-col xl:flex-row">
          {/* CỘT TRÁI: Cấu hình báo cáo (Sliding drawer êm ái, nội dung giữ nguyên kích thước cố định để chống giật chữ và tràn bóng) */}
          <aside
            aria-label="Cấu hình báo cáo"
            className={`transition-[width,opacity] duration-300 ease-in-out shrink-0 bg-white dark:bg-slate-900 overflow-hidden flex flex-col justify-between ${
              collapseConfig
                ? 'w-0 opacity-0 pointer-events-none'
                : 'w-full xl:w-[320px] 2xl:w-[340px] opacity-100 border-b xl:border-b-0 xl:border-r border-slate-100 dark:border-slate-800'
            }`}
          >
            {/* Lớp bọc bên trong có kích thước cố định, chống bóp méo text và tràn shadow khi thu phóng */}
            <div className="w-[320px] 2xl:w-[340px] p-5 flex flex-col justify-between min-h-full space-y-4 shrink-0">
              <div className="space-y-4">
                <div>
                  <h2 className="text-type-section font-semibold text-slate-900 dark:text-white">
                    Cấu hình báo cáo
                  </h2>
                  <p className="mt-0.5 text-type-helper text-slate-500 dark:text-slate-400">
                    Chọn phạm vi dữ liệu để xem trước và xuất file
                  </p>
                </div>

                <Select
                  label="Loại báo cáo"
                  value={type}
                  onChange={(v) => {
                    setType(v);
                    setPreview(null);
                    setColumns([]);
                  }}
                  options={catalog.map((i) => ({ value: i.type, label: i.name }))}
                  all={false}
                />

                <label className="block">
                  <span className="mb-1.5 block text-type-body font-medium text-slate-900 dark:text-slate-100">
                    Tiêu đề báo cáo
                  </span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={catalog.find((i) => i.type === type)?.name}
                    className="h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 transition shadow-2xs"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Select
                    label="Kỳ thi"
                    value={filters.examPeriodId}
                    onChange={(v) => setFilters((f) => ({ ...f, examPeriodId: v }))}
                    options={summary?.options.periods.map((i) => ({ value: String(i.id), label: i.name })) || []}
                  />
                  <Select
                    label="Môn học"
                    value={filters.subjectId}
                    onChange={(v) => setFilters((f) => ({ ...f, subjectId: v }))}
                    options={
                      summary?.options.subjects.map((i) => ({ value: String(i.id), label: `[${i.code}] ${i.name}` })) || []
                    }
                  />
                  <Select
                    label="Khoa"
                    value={filters.departmentId}
                    onChange={(v) => setFilters((f) => ({ ...f, departmentId: v }))}
                    options={summary?.options.departments.map((i) => ({ value: String(i.id), label: i.name })) || []}
                  />
                  <Select
                    label="Lớp học"
                    value={filters.classId}
                    onChange={(v) => setFilters((f) => ({ ...f, classId: v }))}
                    options={summary?.options.classes.map((i) => ({ value: String(i.id), label: i.name })) || []}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <DateInput
                    label="Từ ngày"
                    value={filters.fromDate}
                    onChange={(v) => setFilters((f) => ({ ...f, fromDate: v }))}
                  />
                  <DateInput
                    label="Đến ngày"
                    value={filters.toDate}
                    onChange={(v) => setFilters((f) => ({ ...f, toDate: v }))}
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={loadPreview}
                  isLoading={busy === 'preview'}
                  className="w-full justify-center h-10"
                >
                  Xem trước báo cáo
                </Button>
              </div>
            </div>
          </aside>

          {/* CỘT PHẢI: Bảng xem trước dữ liệu (Dính liền trong khung) */}
          <div className="flex-1 min-w-0 flex flex-col divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {/* Header Toolbar phẳng nền trắng tinh gọn */}
            <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-3.5 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setCollapseConfig(!collapseConfig)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                  title={collapseConfig ? 'Mở rộng cột cấu hình' : 'Thu gọn cột cấu hình'}
                >
                  <ChevronLeft
                    className={`h-4 w-4 transition-transform duration-200 ease-in-out ${
                      collapseConfig ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-type-section font-semibold text-slate-900 dark:text-white truncate">
                      {preview?.title || 'Bản xem trước dữ liệu'}
                    </h2>
                    {preview && (
                      <span className="text-type-helper text-slate-400 font-normal tabular-nums shrink-0">
                        ({preview.totalRows} bản ghi)
                      </span>
                    )}
                  </div>
                  <p className="text-type-helper text-slate-400 font-normal truncate mt-0.5">
                    {preview
                      ? `Tạo lúc ${new Date(preview.generatedAt).toLocaleString('vi-VN')} | Đang xuất ${columns.length}/${preview.columns.length} cột`
                      : 'Thiết lập cấu hình bên trái rồi nhấn Xem trước báo cáo'}
                  </p>
                </div>
              </div>

              {preview && (
                <div className="flex items-center gap-2">
                  {/* Smart Column Selector Popover - Tối giản, thanh lịch, trung tính */}
                  <div className="relative">
                    <button
                      ref={columnBtnRef}
                      type="button"
                      onClick={() => setOpenColumnMenu((v) => !v)}
                      className={`h-9 inline-flex items-center gap-1.5 px-2 rounded-xl text-type-body-sm font-medium transition cursor-pointer select-none bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none ${
                        openColumnMenu
                          ? 'text-slate-900 dark:text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Tùy chỉnh cột xuất file"
                    >
                      <Columns3 className="h-4 w-4 text-slate-400" />
                      <span>Cột xuất file</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                          openColumnMenu ? 'rotate-180 text-slate-600 dark:text-slate-300' : ''
                        }`}
                      />
                    </button>

                    {/* Popover Dropdown qua Portal */}
                    {openColumnMenu &&
                      typeof document !== 'undefined' &&
                      createPortal(
                        <div
                          ref={columnMenuRef}
                          style={columnMenuStyle}
                          className="rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="text-type-body-sm font-semibold text-slate-900 dark:text-white">
                              Cột xuất ({columns.length}/{preview.columns.length})
                            </span>
                            <div className="flex items-center gap-1.5 text-type-helper font-medium">
                              <button
                                type="button"
                                onClick={() => setColumns(preview.columns.map((c) => c.key))}
                                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                              >
                                Tất cả
                              </button>
                              <span className="text-slate-300 dark:text-slate-700">|</span>
                              <button
                                type="button"
                                onClick={() => setColumns([])}
                                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                              >
                                Bỏ hết
                              </button>
                            </div>
                          </div>

                          <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
                            {preview.columns.map((c) => {
                              const isChecked = columns.includes(c.key);
                              return (
                                <label
                                  key={c.key}
                                  className="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition select-none text-type-body"
                                >
                                  <span
                                    className={`text-type-body-sm ${
                                      isChecked
                                        ? 'font-medium text-slate-900 dark:text-slate-100'
                                        : 'text-slate-400 dark:text-slate-500'
                                    }`}
                                  >
                                    {c.label}
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() =>
                                      setColumns((prev) =>
                                        prev.includes(c.key) ? prev.filter((k) => k !== c.key) : [...prev, c.key],
                                      )
                                    }
                                    className="h-4 w-4 rounded-md border-slate-300 dark:border-slate-600 text-slate-900 focus:ring-slate-400 cursor-pointer"
                                  />
                                </label>
                              );
                            })}
                          </div>
                        </div>,
                        document.body,
                      )}
                  </div>

                  <DataActionsDropdown
                    onExportExcel={() => exportFile('XLSX')}
                    onExportCsv={() => exportFile('CSV')}
                    onPrint={printPreview}
                    printLabel="In báo cáo"
                  />
                </div>
              )}
            </div>

            {!preview ? (
              <div className="flex min-h-96 flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-3 border border-slate-200/60 dark:border-slate-700">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="font-semibold text-type-body text-slate-900 dark:text-white">
                  Chưa có bản xem trước
                </p>
                <p className="mt-1 max-w-md text-type-helper text-slate-400">
                  Vui lòng chọn loại báo cáo và các điều kiện lọc bên trái, sau đó nhấn &ldquo;Xem trước báo cáo&rdquo; để kiểm tra dữ liệu trước khi xuất file.
                </p>
              </div>
            ) : (
              <>
                {/* Thông báo thanh mảnh khi có cột bị ẩn */}
                {columns.length < preview.columns.length && (
                  <div className="px-5 py-2 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-type-helper text-slate-600 dark:text-slate-400 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span>Đang ẩn <strong>{preview.columns.length - columns.length}</strong> cột trong bản xem trước và file xuất.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setColumns(preview.columns.map((c) => c.key))}
                      className="font-medium text-slate-900 dark:text-slate-100 hover:underline cursor-pointer"
                    >
                      Hiện lại tất cả ({preview.columns.length} cột)
                    </button>
                  </div>
                )}

                {/* Bảng xem trước dữ liệu phẳng tràn viền */}
                <div className="w-full overflow-x-auto max-h-[640px] custom-scrollbar flex-1">
                  <table className="ui-table w-full min-w-[760px] text-type-body text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                      <tr className="border-b border-slate-200/90 dark:border-slate-700">
                        {preview.columns
                          .filter((c) => columns.includes(c.key))
                          .map((c) => (
                            <th
                              key={c.key}
                              className="group/th py-3 px-4 text-type-body-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 whitespace-nowrap select-none"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span>{c.label}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setColumns((prev) => prev.filter((k) => k !== c.key));
                                  }}
                                  className="min-h-0 min-w-0 p-0.5 opacity-0 group-hover/th:opacity-100 hover:scale-125 active:scale-95 transition-all text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer shrink-0"
                                  title={`Ẩn cột "${c.label}" khỏi file xuất`}
                                >
                                  <X className="h-3 w-3 stroke-[2.5]" />
                                </button>
                              </div>
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {preview.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors">
                          {preview.columns
                            .filter((c) => columns.includes(c.key))
                            .map((c) => (
                              <td
                                key={c.key}
                                className={`py-3.5 px-4 text-type-body text-slate-800 dark:text-slate-200 ${
                                  c.align === 'right' ? 'text-right tabular-nums' : ''
                                }`}
                              >
                                {String(row[c.key] ?? '—')}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!preview.rows.length && (
                    <p className="p-10 text-center text-type-body text-slate-400">
                      Không tìm thấy dữ liệu nào phù hợp với phạm vi lọc đã chọn.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: LỊCH SỬ XUẤT BÁO CÁO (Chuẩn Bảng & Phân trang như /exam-rooms) ── */}
      {tab === 'history' && (
        <div className="space-y-4">
          {/* Header Thông tin */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-type-section font-semibold text-slate-900 dark:text-white">
                Lịch sử xuất báo cáo trên thiết bị
              </h2>
              <p className="mt-0.5 text-type-helper text-slate-500 dark:text-slate-400">
                Các thao tác xuất file chính thức đồng thời được lưu lại trong nhật ký kiểm toán hệ thống
              </p>
            </div>
            {history.length > 0 && (
              <span className="text-type-helper text-slate-400 font-normal tabular-nums">
                Tổng cộng {history.length} bản ghi
              </span>
            )}
          </div>

          {/* Bảng Dữ liệu Phẳng Chuẩn Hệ Thống (y hệt /exam-rooms) */}
          <div className="ui-table-wrap rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
            <table className="ui-table w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 text-type-body-sm font-medium text-slate-600 dark:text-slate-400">
                  <th className="py-3.5 px-5">Tiêu đề báo cáo</th>
                  <th className="py-3.5 px-5">Loại báo cáo</th>
                  <th className="py-3.5 px-5 text-center">Định dạng</th>
                  <th className="py-3.5 px-5 text-center">Số bản ghi</th>
                  <th className="py-3.5 px-5 text-right">Thời gian xuất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <span className="font-semibold text-type-body text-slate-900 dark:text-slate-100">
                        {item.title}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-type-body text-slate-600 dark:text-slate-300">
                      {catalog.find((c) => c.type === item.type)?.name || item.type}
                    </td>
                    <td className="py-4 px-5 text-center whitespace-nowrap">
                      <span className="table-badge inline-flex items-center px-2.5 py-0.5 rounded-full ui-pill text-type-helper font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800">
                        {item.format}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center whitespace-nowrap text-type-body tabular-nums text-slate-700 dark:text-slate-300">
                      {item.totalRows}
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap text-type-body tabular-nums text-slate-500 dark:text-slate-400">
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!history.length && (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                <p className="text-type-body font-medium">Chưa có báo cáo nào được xuất trên thiết bị này</p>
                <p className="text-type-helper text-slate-400 mt-1">Khi bạn xuất file Excel hoặc CSV, lịch sử sẽ xuất hiện tại đây.</p>
              </div>
            )}
          </div>

          {/* Thanh phân trang PaginationBar nằm bên dưới bảng (y hệt /exam-rooms) */}
          {history.length > 0 && (
            <PaginationBar
              page={historyPage}
              totalPages={Math.ceil(history.length / historyLimit) || 1}
              limit={historyLimit}
              totalItems={history.length}
              unit="báo cáo"
              onPage={(p) => setHistoryPage(p)}
              onLimit={(l) => {
                setHistoryLimit(l);
                setHistoryPage(1);
              }}
              limitOptions={[10, 20, 50]}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  all = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  all?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-type-body font-medium text-slate-900 dark:text-slate-100">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-normal text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition shadow-2xs cursor-pointer"
      >
        {all && <option value="ALL">Tất cả</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-type-body font-medium text-slate-900 dark:text-slate-100">
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-type-body font-normal text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition shadow-2xs"
      />
    </label>
  );
}
