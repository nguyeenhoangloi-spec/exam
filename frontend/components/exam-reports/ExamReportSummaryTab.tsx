'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Download, Eye, FileSpreadsheet, FileText, History, Loader2, Printer, RefreshCw, Search, Settings2, Users } from 'lucide-react';
import api from '../../lib/api';
import { printReport } from '../../lib/export-print';
import { Toast } from '../Toast';
import { SlidingSegmentedControl } from '../ui/SlidingSegmentedControl';
import { DataActionsDropdown } from '../ui/DataActionsDropdown';

export interface SummaryScheduleRow {
  id: number; examPeriodId: number; periodName: string; subjectId: number; subjectCode: string;
  subjectName: string; departmentId: number; departmentName: string; examDate: string;
  assigned: number; submitted: number; graded: number; absent: number; ungraded: number;
  flagged: number; passCount: number; avgScore: number;
}

export interface SummaryData {
  filters: Record<string, unknown>;
  stats: {
    totalExams: number; totalSchedules: number; totalAssigned: number; totalSubmitted: number;
    totalGraded: number; totalAbsent: number; totalUngraded: number; totalFlagged: number;
    passCount: number; passRate: number; avgScore: number;
    scoreDistribution: { excellent: number; good: number; fair: number; average: number; poor: number; totalGraded: number };
  };
  schedules: SummaryScheduleRow[];
  options: {
    classes: Array<{ id: number; name: string }>;
    periods: Array<{ id: number; name: string }>;
    subjects: Array<{ id: number; code: string; name: string }>;
    departments: Array<{ id: number; name: string }>;
  };
}

export interface SummaryFilters { examPeriodId: string; subjectId: string; departmentId: string; classId: string; fromDate: string; toDate: string }
interface CatalogItem { type: string; name: string; description: string; group: string; formats: string[] }
interface ReportColumn { key: string; label: string; align?: 'left' | 'center' | 'right' }
interface ReportPreview { type: string; title: string; description: string; generatedAt: string; columns: ReportColumn[]; rows: Record<string, string | number>[]; totalRows: number }
interface HistoryItem { id: string; title: string; type: string; format: string; totalRows: number; createdAt: string }
interface Props { summary: SummaryData | null; loading: boolean; filters: SummaryFilters; setFilters: React.Dispatch<React.SetStateAction<SummaryFilters>>; onSelectSchedule: (id: number) => void; onRefresh: () => void }

const HISTORY_KEY = 'exam_report_export_history';
const icons: Record<string, React.ElementType> = { 'Tổng hợp': BarChart3, 'Kết quả': FileSpreadsheet, 'Thí sinh': Users, 'Chấm thi': ClipboardList, 'An toàn thi': AlertTriangle, 'Phúc khảo': FileText };

export function ExamReportSummaryTab({ summary, loading, filters, setFilters, onSelectSchedule, onRefresh }: Props) {
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
  const [collapseConfig, setCollapseConfig] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefreshClick = async () => {
    setIsSpinning(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setNotice({ type: 'success', message: 'Đã cập nhật và làm mới dữ liệu mới nhất!' });
    } catch {
      setNotice({ type: 'error', message: 'Không thể làm mới dữ liệu.' });
    } finally {
      setTimeout(() => setIsSpinning(false), 600);
    }
  };

  useEffect(() => {
    api.get<CatalogItem[]>('/exam-reports/catalog').then((r) => setCatalog(r.data)).catch((e: Error) => setNotice({ type: 'error', message: e.message }));
    try { setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')); } catch { setHistory([]); }
  }, []);

  const requestFilters = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, v]) => v && v !== 'ALL').map(([k, v]) => [k, k.endsWith('Id') ? Number(v) : v])), [filters]);
  const loadPreview = useCallback(async () => {
    setBusy('preview'); setNotice(null);
    try {
      const r = await api.post<ReportPreview>('/exam-reports/preview', { type, filters: requestFilters, columns: columns.length ? columns : undefined, title: title.trim() || undefined });
      setPreview(r.data); setColumns(r.data.columns.map((c) => c.key));
    } catch (e) { setNotice({ type: 'error', message: e instanceof Error ? e.message : 'Không tạo được bản xem trước.' }); }
    finally { setBusy(''); }
  }, [columns, requestFilters, title, type]);

  const choose = (item: CatalogItem) => { setType(item.type); setTitle(item.name); setPreview(null); setColumns([]); setTab('builder'); };
  const exportFile = async (format: 'CSV' | 'XLSX') => {
    setBusy(format); setNotice(null);
    try {
      const r = await api.post('/exam-reports/export', { type, format, filters: requestFilters, columns: columns.length ? columns : undefined, title: title.trim() || undefined }, { responseType: 'blob' });
      const disposition = String(r.headers['content-disposition'] || '');
      const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
      const filename = encoded ? decodeURIComponent(encoded) : `Bao_Cao_${new Date().toISOString().slice(0, 10)}.${format.toLowerCase()}`;
      const url = URL.createObjectURL(r.data); const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      const item: HistoryItem = { id: `${Date.now()}-${format}`, title: preview?.title || title || 'Báo cáo khảo thí', type, format, totalRows: preview?.totalRows || 0, createdAt: new Date().toISOString() };
      setHistory((current) => { const next = [item, ...current].slice(0, 30); localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); return next; });
      setNotice({ type: 'success', message: `Đã tạo file ${format} theo đúng phạm vi đang chọn.` });
    } catch (e) { setNotice({ type: 'error', message: e instanceof Error ? e.message : 'Không xuất được báo cáo.' }); }
    finally { setBusy(''); }
  };

  const printPreview = () => {
    if (!preview) return;
    const ok = printReport({ title: preview.title, subtitle: `Thời điểm lập: ${new Date(preview.generatedAt).toLocaleString('vi-VN')} · ${preview.totalRows} bản ghi`, columns: preview.columns.filter((c) => columns.includes(c.key)).map((c) => ({ header: c.label, align: c.align })), rows: preview.rows.map((row) => preview.columns.filter((c) => columns.includes(c.key)).map((c) => row[c.key])), footerNotes: 'Dữ liệu chính thức trong phạm vi được phép truy cập.' });
    if (!ok) setNotice({ type: 'error', message: 'Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup.' });
  };

  const schedules = useMemo(() => {
    const key = search.trim().toLocaleLowerCase('vi');
    return (summary?.schedules || []).filter((r) => !key || [r.subjectCode, r.subjectName, r.periodName, r.departmentName].some((v) => v.toLocaleLowerCase('vi').includes(key))).slice(0, 8);
  }, [search, summary?.schedules]);

  return <section className="space-y-5 pb-28">
    {/* ── Floating Segmented Control Dock (Nằm ở giữa và ở góc dưới màn hình, nổi lên) ── */}
    <div className="fixed bottom-7 left-0 right-0 md:left-[252px] [html.sidebar-collapsed_&]:md:left-[72px] flex justify-center z-40 pointer-events-none px-4 transition-[left] duration-300">
      <div className="pointer-events-auto shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 rounded-full border border-slate-200/90 dark:border-slate-700/90 p-1 ring-1 ring-slate-900/5 dark:ring-white/10 animate-fade-in-up">
        <SlidingSegmentedControl<'overview' | 'builder' | 'history'>
          variant="primary"
          pillShape="pill"
          size="md"
          value={tab}
          onChange={(newTab) => setTab(newTab)}
          className="border-none bg-transparent shadow-none"
          options={[
            { value: 'overview', label: 'Tổng quan', icon: BarChart3 },
            { value: 'builder', label: 'Tạo báo cáo', icon: Settings2 },
            { value: 'history', label: 'Lịch sử xuất', icon: History },
          ]}
        />
      </div>
    </div>
    {notice && <Toast message={notice.message} type={notice.type} onClose={() => setNotice(null)} />}

    {tab === 'overview' && <div className="space-y-5">
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Ca thi chính thức',
            value: summary?.stats.totalSchedules ?? 0,
            unit: '',
            subtext: 'Trong phạm vi được phép',
            progressPercent: (summary?.stats.totalSchedules ?? 0) > 0 ? 100 : 0,
            icon: BarChart3,
          },
          {
            title: 'Bài đã nộp',
            value: summary?.stats.totalSubmitted ?? 0,
            unit: '',
            subtext: `${summary?.stats.totalAssigned ?? 0} lượt được phân công`,
            progressPercent: (summary?.stats.totalAssigned ?? 0) > 0
              ? Math.min(100, Math.round(((summary?.stats.totalSubmitted || 0) / (summary?.stats.totalAssigned || 1)) * 100))
              : 100,
            icon: Users,
          },
          {
            title: 'Tiến độ chấm',
            value: summary?.stats.totalGraded ?? 0,
            unit: '',
            subtext: `${summary?.stats.totalUngraded ?? 0} bài chưa chấm`,
            progressPercent: (summary?.stats.totalSubmitted ?? 0) > 0
              ? Math.min(100, Math.round(((summary?.stats.totalGraded || 0) / (summary?.stats.totalSubmitted || 1)) * 100))
              : 100,
            icon: ClipboardList,
          },
          {
            title: 'Tỷ lệ đạt',
            value: summary?.stats.passRate ?? 0,
            unit: '%',
            subtext: `Điểm trung bình ${summary?.stats.avgScore ?? 0}/10`,
            progressPercent: Math.min(Math.max(summary?.stats.passRate ?? 0, 0), 100),
            icon: CheckCircle2,
          },
        ].map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.title}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block truncate">
                    {item.title}
                  </span>
                  <div className="text-type-kpi font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
                    {typeof item.value === 'number' ? item.value.toLocaleString('vi-VN') : item.value}
                    {item.unit}
                  </div>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                  <IconComponent className="h-5 w-5 stroke-[2.2]" />
                </div>
              </div>

              {/* Micro Progress Track */}
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(item.progressPercent, 5), 100)}%` }}
                />
              </div>

              <div className="mt-2.5">
                <span
                  title={item.subtext}
                  className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
                >
                  {item.subtext}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <Panel
        title="Mẫu báo cáo thường dùng"
        subtitle="Chọn mẫu, điều chỉnh phạm vi rồi xem trước trước khi xuất."
        action={
          <button
            type="button"
            onClick={handleRefreshClick}
            disabled={loading || isSpinning}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`h-4 w-4 ${loading || isSpinning ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{catalog.map((item) => { const Icon = icons[item.group] || FileText; return <button key={item.type} type="button" onClick={() => choose(item)} className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-700 dark:hover:bg-blue-950/30"><div className="flex gap-3"><span className="h-fit rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-type-body font-semibold text-slate-950 dark:text-white">{item.name}</span><span className="mt-1 block text-type-body leading-5 text-slate-700 dark:text-slate-300">{item.description}</span></span><ChevronRight className="mt-1 h-4 w-4 text-slate-500 group-hover:text-blue-600" /></div></button>; })}</div>
      </Panel>
      <Panel title="Các ca thi gần đây" subtitle="Mở bảng điểm chi tiết mà không rời trung tâm báo cáo." action={<div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã môn, tên môn..." className="h-10 w-64 rounded-xl border border-slate-200 pl-9 pr-3 text-type-body font-medium text-slate-950 outline-none focus:border-blue-500" /></div>}>
        <div className="ui-table-wrap overflow-x-auto"><table className="ui-table w-full text-type-body"><thead className="bg-slate-50 text-slate-950"><tr>{['Môn thi', 'Kỳ thi', 'Ngày thi', 'Đã chấm', 'Điểm TB', ''].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr></thead><tbody>{schedules.map((r) => <tr key={r.id} className="border-t border-slate-100 text-slate-900"><td className="px-4 py-3"><b className="font-medium">{r.subjectCode}</b> {r.subjectName}</td><td className="px-4 py-3">{r.periodName}</td><td className="px-4 py-3">{new Date(r.examDate).toLocaleDateString('vi-VN')}</td><td className="px-4 py-3 font-medium tabular-nums">{r.graded}/{r.submitted}</td><td className="px-4 py-3 font-medium tabular-nums">{r.avgScore}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => onSelectSchedule(r.id)} className="rounded-xl px-3 py-2 font-medium text-blue-700 hover:bg-blue-50">Xem chi tiết</button></td></tr>)}</tbody></table></div>
      </Panel>
    </div>}

    {tab === 'builder' && <div className="flex flex-col xl:flex-row gap-5 items-start">
      <aside
        aria-label="Cấu hình báo cáo"
        className={`transition-all duration-300 ease-in-out shrink-0 xl:sticky xl:top-4 overflow-hidden ${
          collapseConfig
            ? 'max-h-0 xl:max-h-none xl:w-0 xl:opacity-0 xl:pointer-events-none xl:-mr-5 hidden xl:block'
            : 'w-full xl:w-[360px] xl:opacity-100'
        }`}
      >
        <div className="w-full xl:w-[360px] space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-slate-900">
          <div><h2 className="text-type-section font-semibold text-slate-950 dark:text-white">Cấu hình báo cáo</h2><p className="mt-1 text-type-body text-slate-700 dark:text-slate-300">Bản xem trước và file xuất dùng chung cấu hình.</p></div>
          <Select label="Loại báo cáo" value={type} onChange={(v) => { setType(v); setPreview(null); setColumns([]); }} options={catalog.map((i) => ({ value: i.type, label: i.name }))} all={false} />
          <label className="block"><span className="mb-1.5 block text-type-body font-medium text-slate-900">Tiêu đề báo cáo</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={catalog.find((i) => i.type === type)?.name} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-type-body font-medium text-slate-950 outline-none focus:border-blue-500" /></label>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1"><Select label="Kỳ thi" value={filters.examPeriodId} onChange={(v) => setFilters((f) => ({ ...f, examPeriodId: v }))} options={summary?.options.periods.map((i) => ({ value: String(i.id), label: i.name })) || []} /><Select label="Môn học" value={filters.subjectId} onChange={(v) => setFilters((f) => ({ ...f, subjectId: v }))} options={summary?.options.subjects.map((i) => ({ value: String(i.id), label: `${i.code} — ${i.name}` })) || []} /><Select label="Khoa" value={filters.departmentId} onChange={(v) => setFilters((f) => ({ ...f, departmentId: v }))} options={summary?.options.departments.map((i) => ({ value: String(i.id), label: i.name })) || []} /><Select label="Lớp" value={filters.classId} onChange={(v) => setFilters((f) => ({ ...f, classId: v }))} options={summary?.options.classes.map((i) => ({ value: String(i.id), label: i.name })) || []} /></div>
          <div className="grid grid-cols-2 gap-3"><DateInput label="Từ ngày" value={filters.fromDate} onChange={(v) => setFilters((f) => ({ ...f, fromDate: v }))} /><DateInput label="Đến ngày" value={filters.toDate} onChange={(v) => setFilters((f) => ({ ...f, toDate: v }))} /></div>
          <button type="button" onClick={loadPreview} disabled={!!busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-type-body font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{busy === 'preview' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}Xem trước báo cáo</button>
        </div>
      </aside>
      <div className="flex-1 min-w-0 rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-200 p-5">
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
              <h2 className="text-type-section font-semibold text-slate-950 dark:text-white truncate">{preview?.title || 'Bản xem trước'}</h2>
              <p className="mt-1 text-type-body text-slate-700 dark:text-slate-300 truncate">{preview ? `${preview.totalRows} bản ghi · ${new Date(preview.generatedAt).toLocaleString('vi-VN')}` : 'Chọn cấu hình rồi bấm Xem trước báo cáo.'}</p>
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
        {!preview ? <div className="flex min-h-96 flex-col items-center justify-center p-8 text-center"><FileText className="h-12 w-12 text-blue-300" /><p className="mt-4 font-semibold text-slate-950 dark:text-white">Chưa có bản xem trước</p><p className="mt-1 max-w-md text-type-body text-slate-700 dark:text-slate-300">Hệ thống yêu cầu xem trước để tránh xuất nhầm phạm vi dữ liệu.</p>{collapseConfig && <button type="button" onClick={() => setCollapseConfig(false)} className="mt-4 rounded-xl bg-blue-50 px-4 py-2 text-type-body font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300">Mở cột cấu hình</button>}</div> : <><div className="border-b border-slate-200 p-4"><p className="mb-2 text-type-body font-medium text-slate-900">Các cột được xuất</p><div className="flex flex-wrap gap-2">{preview.columns.map((c) => <button key={c.key} type="button" onClick={() => setColumns((x) => x.includes(c.key) ? x.filter((k) => k !== c.key) : [...x, c.key])} className={`rounded-xl border px-3 py-1.5 text-type-body font-medium ${columns.includes(c.key) ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700'}`}>{columns.includes(c.key) ? '✓ ' : ''}{c.label}</button>)}</div></div><div className="ui-table-wrap max-h-[560px] overflow-auto"><table className="ui-table w-full min-w-[760px] text-type-body"><thead className="sticky top-0 bg-slate-50"><tr>{preview.columns.filter((c) => columns.includes(c.key)).map((c) => <th key={c.key} className="px-4 py-3 text-left font-medium">{c.label}</th>)}</tr></thead><tbody>{preview.rows.map((row, i) => <tr key={i} className="border-t border-slate-100">{preview.columns.filter((c) => columns.includes(c.key)).map((c) => <td key={c.key} className={`px-4 py-3 ${c.align === 'right' ? 'text-right tabular-nums' : ''}`}>{String(row[c.key] ?? '')}</td>)}</tr>)}</tbody></table>{!preview.rows.length && <p className="p-10 text-center text-type-body font-medium text-slate-700">Không có dữ liệu phù hợp.</p>}</div></>}
      </div>
    </div>}

    {tab === 'history' && <Panel title="Lịch sử xuất trên thiết bị" subtitle="Thao tác xuất chính thức đồng thời được ghi trong nhật ký hệ thống.">{history.length ? <div className="divide-y divide-slate-100">{history.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 px-1 py-4"><div><p className="text-type-body font-semibold text-slate-950">{item.title}</p><p className="mt-1 text-type-body text-slate-700">{item.totalRows} bản ghi · {new Date(item.createdAt).toLocaleString('vi-VN')}</p></div><span className="rounded-xl border border-blue-200 px-3 py-1 text-type-body font-medium text-blue-700">{item.format}</span></div>)}</div> : <div className="p-10 text-center text-type-body font-medium text-slate-700">Chưa có báo cáo nào được xuất trên thiết bị này.</div>}</Panel>}
  </section>;
}

function Panel({ title, subtitle, action, children }: { title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-slate-900"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-type-section font-semibold text-slate-950 dark:text-white">{title}</h2><p className="mt-1 text-type-body text-slate-700 dark:text-slate-300">{subtitle}</p></div>{action}</div>{children}</div>; }
function Select({ label, value, onChange, options, all = true }: { label: string; value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }>; all?: boolean }) { return <label className="block"><span className="mb-1.5 block text-type-body font-medium text-slate-900">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-type-body font-medium text-slate-950 outline-none focus:border-blue-500">{all && <option value="ALL">Tất cả</option>}{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>; }
function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return <label className="block"><span className="mb-1.5 block text-type-body font-medium text-slate-900">{label}</span><input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-type-body font-medium text-slate-950 outline-none focus:border-blue-500" /></label>; }


