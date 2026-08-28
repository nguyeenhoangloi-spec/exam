'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  Eye,
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
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [collapseConfig, setCollapseConfig] = useState(false);
  const [openTemplateMenu, setOpenTemplateMenu] = useState(false);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target as Node)) {
        setOpenTemplateMenu(false);
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
    const ok = printReport({
      title: preview.title,
      subtitle: `Thời điểm lập: ${new Date(preview.generatedAt).toLocaleString('vi-VN')} · ${preview.totalRows} bản ghi`,
      columns: preview.columns
        .filter((c) => columns.includes(c.key))
        .map((c) => ({ header: c.label, align: c.align })),
      rows: preview.rows.map((row) => preview.columns.filter((c) => columns.includes(c.key)).map((c) => row[c.key])),
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

            {/* Right: Mẫu báo cáo dropdown button (Bậc 3 Secondary chuẩn 40px) */}
            <div className="relative shrink-0" ref={templateMenuRef}>
              <button
                type="button"
                onClick={() => setOpenTemplateMenu((v) => !v)}
                className={`h-10 inline-flex items-center gap-1.5 px-3.5 rounded-xl border text-type-body font-medium transition-colors cursor-pointer shadow-2xs select-none ${openTemplateMenu
                    ? 'border-blue-500 ring-2 ring-blue-500/20 text-slate-900 bg-white dark:bg-slate-900 dark:text-white'
                    : 'border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
              >
                <FileSpreadsheet className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <span>Mẫu báo cáo</span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${openTemplateMenu ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                    }`}
                />
              </button>

              {/* Menu Popover */}
              {openTemplateMenu && (
                <div className="absolute right-0 mt-1.5 w-72 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-1.5 z-30 divide-y divide-slate-100 dark:divide-slate-800/80 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2">
                    <p className="text-type-body-sm font-semibold text-slate-900 dark:text-white">
                      Chọn mẫu báo cáo
                    </p>
                    <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5">
                      Mở nhanh cấu hình và xem trước dữ liệu
                    </p>
                  </div>

                  <div className="pt-1 space-y-0.5 max-h-80 overflow-y-auto">
                    {catalog.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => choose(item)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 text-left transition-colors cursor-pointer group"
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
                </div>
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

      {/* ── TAB 2: TẠO BÁO CÁO THEO MẪU ── */}
      {tab === 'builder' && (
        <div className="flex flex-col xl:flex-row gap-5 items-start">
          {/* Cột trái: Cấu hình báo cáo */}
          <aside
            aria-label="Cấu hình báo cáo"
            className={`transition-all duration-300 ease-in-out shrink-0 xl:sticky xl:top-4 overflow-hidden ${collapseConfig
                ? 'max-h-0 xl:max-h-none xl:w-0 xl:opacity-0 xl:pointer-events-none xl:-mr-5 hidden xl:block'
                : 'w-full xl:w-[360px] xl:opacity-100'
              }`}
          >
            <div className="w-full xl:w-[360px] space-y-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
              <div>
                <h2 className="text-type-section font-semibold text-slate-900 dark:text-white">
                  Cấu hình báo cáo
                </h2>
                <p className="mt-0.5 text-type-helper text-slate-500 dark:text-slate-400">
                  Chọn phạm vi dữ liệu bên dưới để xem trước và xuất file
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

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={loadPreview}
                isLoading={busy === 'preview'}
                leftIcon={<Eye className="h-4 w-4" />}
                className="w-full justify-center"
              >
                Xem trước báo cáo
              </Button>
            </div>
          </aside>

          {/* Cột phải: Bảng xem trước */}
          <div className="flex-1 min-w-0 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-850/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setCollapseConfig(!collapseConfig)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                  title={collapseConfig ? 'Mở cột cấu hình' : 'Thu gọn cột cấu hình'}
                >
                  <ChevronLeft
                    className={`h-4 w-4 transition-transform duration-300 ease-in-out ${collapseConfig ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className="min-w-0">
                  <h2 className="text-type-section font-semibold text-slate-900 dark:text-white truncate">
                    {preview?.title || 'Bản xem trước dữ liệu'}
                  </h2>
                  <p className="mt-0.5 text-type-helper text-slate-500 dark:text-slate-400 truncate">
                    {preview
                      ? `${preview.totalRows} bản ghi · Tạo lúc: ${new Date(preview.generatedAt).toLocaleString('vi-VN')}`
                      : 'Thiết lập cấu hình bên trái rồi nhấn Xem trước báo cáo'}
                  </p>
                </div>
              </div>

              {preview && (
                <DataActionsDropdown
                  onExportExcel={() => exportFile('XLSX')}
                  onExportCsv={() => exportFile('CSV')}
                  onPrint={printPreview}
                  printLabel="In / PDF"
                />
              )}
            </div>

            {!preview ? (
              <div className="flex min-h-96 flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-3 border border-blue-100 dark:border-blue-900/50">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="font-semibold text-type-body text-slate-900 dark:text-white">
                  Chưa có bản xem trước
                </p>
                <p className="mt-1 max-w-md text-type-helper text-slate-500 dark:text-slate-400">
                  Vui lòng chọn loại báo cáo và các điều kiện lọc, sau đó nhấn &ldquo;Xem trước báo cáo&rdquo; để kiểm tra dữ liệu trước khi xuất file.
                </p>
              </div>
            ) : (
              <>
                {/* Chọn cột hiển thị */}
                <div className="border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50/40 dark:bg-slate-900/40">
                  <p className="mb-2 text-type-helper font-medium text-slate-700 dark:text-slate-300">
                    Các cột được chọn xuất file:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {preview.columns.map((c) => {
                      const isChecked = columns.includes(c.key);
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() =>
                            setColumns((x) =>
                              x.includes(c.key) ? x.filter((k) => k !== c.key) : [...x, c.key],
                            )
                          }
                          className={`rounded-xl border px-3 py-1 text-type-helper font-medium transition cursor-pointer ${isChecked
                              ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                        >
                          {isChecked ? '✓ ' : ''}
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="ui-table-wrap max-h-[560px] overflow-auto">
                  <table className="ui-table w-full min-w-[760px] text-type-body text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                      <tr className="border-b border-slate-100 dark:border-slate-700">
                        {preview.columns
                          .filter((c) => columns.includes(c.key))
                          .map((c) => (
                            <th key={c.key} className="py-3 px-4 text-type-body-sm font-medium text-slate-700 dark:text-slate-300">
                              {c.label}
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
                                className={`py-3.5 px-4 text-type-body text-slate-800 dark:text-slate-200 ${c.align === 'right' ? 'text-right tabular-nums' : ''
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
                    <p className="p-10 text-center text-type-body text-slate-500 dark:text-slate-400">
                      Không tìm thấy dữ liệu nào phù hợp với phạm vi lọc đã chọn.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: LỊCH SỬ XUẤT BÁO CÁO ── */}
      {tab === 'history' && (
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
          <div>
            <h2 className="text-type-section font-semibold text-slate-900 dark:text-white">
              Lịch sử xuất báo cáo trên thiết bị
            </h2>
            <p className="mt-0.5 text-type-helper text-slate-500 dark:text-slate-400">
              Các thao tác xuất file chính thức đồng thời được lưu lại trong nhật ký kiểm toán hệ thống
            </p>
          </div>

          {history.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-3.5">
                  <div>
                    <p className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-type-helper text-slate-500 dark:text-slate-400 tabular-nums">
                      {item.totalRows} bản ghi · Thời gian: {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <span className="table-badge inline-flex items-center px-2.5 py-0.5 rounded-full ui-pill text-type-helper font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800">
                    {item.format}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <p className="text-type-body font-medium">Chưa có báo cáo nào được xuất trên thiết bị này</p>
              <p className="text-type-helper text-slate-400 mt-1">Khi bạn xuất file Excel hoặc CSV, lịch sử sẽ xuất hiện tại đây.</p>
            </div>
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
