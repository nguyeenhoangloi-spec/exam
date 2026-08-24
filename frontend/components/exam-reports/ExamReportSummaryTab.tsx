'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, CheckCircle2, ChevronRight, ClipboardList, Download, Eye, FileSpreadsheet, FileText, History, Loader2, Printer, RefreshCw, Search, Settings2, Users } from 'lucide-react';
import api from '../../lib/api';
import { printReport } from '../../lib/export-print';
import { Toast } from '../Toast';

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

  return <section className="space-y-5">
    <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-xs dark:border-slate-700 dark:bg-slate-900">
      {([{ key: 'overview', label: 'Tổng quan', icon: BarChart3 }, { key: 'builder', label: 'Tạo báo cáo', icon: Settings2 }, { key: 'history', label: 'Lịch sử xuất', icon: History }] as const).map((item) => <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`flex h-10 items-center gap-2 rounded-xl px-4 text-type-body font-medium transition ${tab === item.key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-900 hover:bg-blue-50 hover:text-blue-700 dark:text-white dark:hover:bg-blue-950'}`}><item.icon className="h-4 w-4" />{item.label}</button>)}
    </div>
    {notice && <Toast message={notice.message} type={notice.type} onClose={() => setNotice(null)} />}

    {tab === 'overview' && <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
        ['Ca thi chính thức', summary?.stats.totalSchedules ?? 0, 'Trong phạm vi được phép', BarChart3],
        ['Bài đã nộp', summary?.stats.totalSubmitted ?? 0, `${summary?.stats.totalAssigned ?? 0} lượt được phân công`, Users],
        ['Tiến độ chấm', summary?.stats.totalGraded ?? 0, `${summary?.stats.totalUngraded ?? 0} bài chưa chấm`, ClipboardList],
        ['Tỷ lệ đạt', `${summary?.stats.passRate ?? 0}%`, `Điểm trung bình ${summary?.stats.avgScore ?? 0}`, CheckCircle2],
      ].map(([label, value, helper, Icon]: any) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-slate-900"><div className="mb-4 flex justify-between"><p className="text-type-body font-medium text-slate-900 dark:text-white">{label}</p><Icon className="h-5 w-5 text-blue-600" /></div><p className="text-type-kpi font-semibold tabular-nums text-slate-950 dark:text-white">{value}</p><p className="mt-2 text-type-body text-slate-700 dark:text-slate-300">{helper}</p></article>)}</div>
      <Panel title="Mẫu báo cáo thường dùng" subtitle="Chọn mẫu, điều chỉnh phạm vi rồi xem trước trước khi xuất." action={<button type="button" onClick={onRefresh} disabled={loading} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-type-body font-medium"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Làm mới</button>}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{catalog.map((item) => { const Icon = icons[item.group] || FileText; return <button key={item.type} type="button" onClick={() => choose(item)} className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-700 dark:hover:bg-blue-950/30"><div className="flex gap-3"><span className="h-fit rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-type-body font-semibold text-slate-950 dark:text-white">{item.name}</span><span className="mt-1 block text-type-body leading-5 text-slate-700 dark:text-slate-300">{item.description}</span></span><ChevronRight className="mt-1 h-4 w-4 text-slate-500 group-hover:text-blue-600" /></div></button>; })}</div>
      </Panel>
      <Panel title="Các ca thi gần đây" subtitle="Mở bảng điểm chi tiết mà không rời trung tâm báo cáo." action={<div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã môn, tên môn..." className="h-10 w-64 rounded-xl border border-slate-200 pl-9 pr-3 text-type-body font-medium text-slate-950 outline-none focus:border-blue-500" /></div>}>
        <div className="ui-table-wrap overflow-x-auto"><table className="ui-table w-full text-type-body"><thead className="bg-slate-50 text-slate-950"><tr>{['Môn thi', 'Kỳ thi', 'Ngày thi', 'Đã chấm', 'Điểm TB', ''].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr></thead><tbody>{schedules.map((r) => <tr key={r.id} className="border-t border-slate-100 text-slate-900"><td className="px-4 py-3"><b className="font-medium">{r.subjectCode}</b> {r.subjectName}</td><td className="px-4 py-3">{r.periodName}</td><td className="px-4 py-3">{new Date(r.examDate).toLocaleDateString('vi-VN')}</td><td className="px-4 py-3 font-medium tabular-nums">{r.graded}/{r.submitted}</td><td className="px-4 py-3 font-medium tabular-nums">{r.avgScore}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => onSelectSchedule(r.id)} className="rounded-xl px-3 py-2 font-medium text-blue-700 hover:bg-blue-50">Xem chi tiết</button></td></tr>)}</tbody></table></div>
      </Panel>
    </div>}

    {tab === 'builder' && <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-slate-900"><div><h2 className="text-type-section font-semibold text-slate-950 dark:text-white">Cấu hình báo cáo</h2><p className="mt-1 text-type-body text-slate-700 dark:text-slate-300">Bản xem trước và file xuất dùng chung cấu hình.</p></div>
        <Select label="Loại báo cáo" value={type} onChange={(v) => { setType(v); setPreview(null); setColumns([]); }} options={catalog.map((i) => ({ value: i.type, label: i.name }))} all={false} />
        <label className="block"><span className="mb-1.5 block text-type-body font-medium text-slate-900">Tiêu đề báo cáo</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={catalog.find((i) => i.type === type)?.name} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-type-body font-medium text-slate-950 outline-none focus:border-blue-500" /></label>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1"><Select label="Kỳ thi" value={filters.examPeriodId} onChange={(v) => setFilters((f) => ({ ...f, examPeriodId: v }))} options={summary?.options.periods.map((i) => ({ value: String(i.id), label: i.name })) || []} /><Select label="Môn học" value={filters.subjectId} onChange={(v) => setFilters((f) => ({ ...f, subjectId: v }))} options={summary?.options.subjects.map((i) => ({ value: String(i.id), label: `${i.code} — ${i.name}` })) || []} /><Select label="Khoa" value={filters.departmentId} onChange={(v) => setFilters((f) => ({ ...f, departmentId: v }))} options={summary?.options.departments.map((i) => ({ value: String(i.id), label: i.name })) || []} /><Select label="Lớp" value={filters.classId} onChange={(v) => setFilters((f) => ({ ...f, classId: v }))} options={summary?.options.classes.map((i) => ({ value: String(i.id), label: i.name })) || []} /></div>
        <div className="grid grid-cols-2 gap-3"><DateInput label="Từ ngày" value={filters.fromDate} onChange={(v) => setFilters((f) => ({ ...f, fromDate: v }))} /><DateInput label="Đến ngày" value={filters.toDate} onChange={(v) => setFilters((f) => ({ ...f, toDate: v }))} /></div>
        <button type="button" onClick={loadPreview} disabled={!!busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-type-body font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{busy === 'preview' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}Xem trước báo cáo</button>
      </aside>
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900"><div className="flex flex-wrap justify-between gap-3 border-b border-slate-200 p-5"><div><h2 className="text-type-section font-semibold text-slate-950">{preview?.title || 'Bản xem trước'}</h2><p className="mt-1 text-type-body text-slate-700">{preview ? `${preview.totalRows} bản ghi · ${new Date(preview.generatedAt).toLocaleString('vi-VN')}` : 'Chọn cấu hình rồi bấm Xem trước báo cáo.'}</p></div>{preview && <div className="flex gap-2"><Action label="CSV" icon={Download} onClick={() => exportFile('CSV')} disabled={!!busy} /><Action label="Excel" icon={busy === 'XLSX' ? Loader2 : FileSpreadsheet} primary onClick={() => exportFile('XLSX')} disabled={!!busy} spin={busy === 'XLSX'} /><Action label="In / PDF" icon={Printer} onClick={printPreview} /></div>}</div>
        {!preview ? <div className="flex min-h-96 flex-col items-center justify-center p-8 text-center"><FileText className="h-12 w-12 text-blue-300" /><p className="mt-4 font-semibold text-slate-950">Chưa có bản xem trước</p><p className="mt-1 max-w-md text-type-body text-slate-700">Hệ thống yêu cầu xem trước để tránh xuất nhầm phạm vi dữ liệu.</p></div> : <><div className="border-b border-slate-200 p-4"><p className="mb-2 text-type-body font-medium text-slate-900">Các cột được xuất</p><div className="flex flex-wrap gap-2">{preview.columns.map((c) => <button key={c.key} type="button" onClick={() => setColumns((x) => x.includes(c.key) ? x.filter((k) => k !== c.key) : [...x, c.key])} className={`rounded-xl border px-3 py-1.5 text-type-body font-medium ${columns.includes(c.key) ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700'}`}>{columns.includes(c.key) ? '✓ ' : ''}{c.label}</button>)}</div></div><div className="ui-table-wrap max-h-[560px] overflow-auto"><table className="ui-table w-full min-w-[760px] text-type-body"><thead className="sticky top-0 bg-slate-50"><tr>{preview.columns.filter((c) => columns.includes(c.key)).map((c) => <th key={c.key} className="px-4 py-3 text-left font-medium">{c.label}</th>)}</tr></thead><tbody>{preview.rows.map((row, i) => <tr key={i} className="border-t border-slate-100">{preview.columns.filter((c) => columns.includes(c.key)).map((c) => <td key={c.key} className={`px-4 py-3 ${c.align === 'right' ? 'text-right tabular-nums' : ''}`}>{String(row[c.key] ?? '')}</td>)}</tr>)}</tbody></table>{!preview.rows.length && <p className="p-10 text-center text-type-body font-medium text-slate-700">Không có dữ liệu phù hợp.</p>}</div></>}
      </div>
    </div>}

    {tab === 'history' && <Panel title="Lịch sử xuất trên thiết bị" subtitle="Thao tác xuất chính thức đồng thời được ghi trong nhật ký hệ thống.">{history.length ? <div className="divide-y divide-slate-100">{history.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 px-1 py-4"><div><p className="text-type-body font-semibold text-slate-950">{item.title}</p><p className="mt-1 text-type-body text-slate-700">{item.totalRows} bản ghi · {new Date(item.createdAt).toLocaleString('vi-VN')}</p></div><span className="rounded-xl border border-blue-200 px-3 py-1 text-type-body font-medium text-blue-700">{item.format}</span></div>)}</div> : <div className="p-10 text-center text-type-body font-medium text-slate-700">Chưa có báo cáo nào được xuất trên thiết bị này.</div>}</Panel>}
  </section>;
}

function Panel({ title, subtitle, action, children }: { title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-slate-900"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-type-section font-semibold text-slate-950 dark:text-white">{title}</h2><p className="mt-1 text-type-body text-slate-700 dark:text-slate-300">{subtitle}</p></div>{action}</div>{children}</div>; }
function Select({ label, value, onChange, options, all = true }: { label: string; value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }>; all?: boolean }) { return <label className="block"><span className="mb-1.5 block text-type-body font-medium text-slate-900">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-type-body font-medium text-slate-950 outline-none focus:border-blue-500">{all && <option value="ALL">Tất cả</option>}{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>; }
function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return <label className="block"><span className="mb-1.5 block text-type-body font-medium text-slate-900">{label}</span><input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-type-body font-medium text-slate-950 outline-none focus:border-blue-500" /></label>; }
function Action({ label, icon: Icon, onClick, primary, disabled, spin }: { label: string; icon: React.ElementType; onClick: () => void; primary?: boolean; disabled?: boolean; spin?: boolean }) { return <button type="button" onClick={onClick} disabled={disabled} className={`flex h-10 items-center gap-2 rounded-xl px-3 text-type-body font-medium disabled:opacity-50 ${primary ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-200 text-slate-900 hover:bg-slate-50'}`}><Icon className={`h-4 w-4 ${spin ? 'animate-spin' : ''}`} />{label}</button>; }


