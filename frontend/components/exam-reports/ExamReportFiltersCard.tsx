'use client';

import React from 'react';
import { Calendar, RotateCcw, Filter } from 'lucide-react';
import { Button } from '../ui/Button';

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
 classes: Array<{ id: number; name: string }>;
 periods: Array<{ id: number; name: string }>;
 subjects: Array<{ id: number; code: string; name: string }>;
 departments: Array<{ id: number; name: string }>;
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
 activeFormatBadge,
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
 <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
 {/* ── 1. Integrated Active Schedule Banner ── */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70">
 <div className="flex items-center gap-2.5 flex-wrap min-w-0">
 <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-[12px] font-semibold tracking-wider shrink-0">
 {activeTypeBadge?.label || 'Chính thức'}
 </span>

 {reportSchedule ? (
 <>
 <h3 className="text-xs font-semibold text-slate-900 truncate">
 {reportSchedule.subjectName}
 </h3>
 <span className="text-[12px] tabular-nums font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80 shrink-0">
 {reportSchedule.subjectCode}
 </span>
 <span className="text-xs text-slate-500 font-medium hidden xl:inline-block">
 • {reportSchedule.periodName}
 </span>
 <span className="text-xs text-slate-700 font-semibold shrink-0">
 • Thời gian: <strong className="text-slate-900 font-semibold">{reportSchedule.startTime} – {reportSchedule.endTime} ({formattedDate})</strong>
 </span>
 </>
 ) : (
 <span className="text-xs text-slate-500 font-medium">
 {loadingSchedules ? 'Đang tải thông tin ca thi...' : 'Chưa chọn ca thi cụ thể'}
 </span>
 )}
 </div>

 <Button
 type="button"
 variant="secondary"
 size="xs"
 disabled={loadingSchedules}
 onClick={onOpenSchedulePicker}
 leftIcon={<Calendar className="h-3.5 w-3.5 text-blue-600" />}
 className="h-8 px-3 text-xs font-semibold text-blue-600 bg-white border-slate-200 hover:bg-blue-50 hover:border-blue-300 shrink-0 self-start md:self-auto shadow-2xs"
 >
 Đổi ca thi khác
 </Button>
 </div>

 {/* ── 2. Filters Grid Header Bar ── */}
 <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
 <div className="flex items-center gap-2">
 <Filter className="h-3.5 w-3.5 text-blue-600" />
 <h2 className="text-xs font-semibold tracking-wider text-slate-700">
 Bộ lọc thống kê nâng cao
 </h2>
 {summaryLoading && <span className="text-xs font-semibold text-blue-600 ml-2">Đang cập nhật...</span>}
 </div>

 {isFiltered && (
 <Button
 variant="ghost"
 size="xs"
 onClick={resetFilters}
 leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
 className="text-slate-500 hover:text-slate-800"
 >
 Xóa bộ lọc
 </Button>
 )}
 </div>

 {/* ── 3. Filters Input Grid (Responsive 3 Columns) ── */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
 <div>
 <label className="block text-[12px] font-semibold text-slate-500 tracking-wider mb-1.5">
 Kỳ thi
 </label>
 <select
 value={summaryFilters.examPeriodId}
 onChange={(e) => setSummaryFilters((f) => ({ ...f, examPeriodId: e.target.value }))}
 className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none transition shadow-2xs cursor-pointer"
 >
 <option value="ALL">Tất cả kỳ thi</option>
 {summaryOptions?.periods.map((item) => (
 <option key={item.id} value={item.id}>
 {item.name}
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-[12px] font-semibold text-slate-500 tracking-wider mb-1.5">
 Môn học
 </label>
 <select
 value={summaryFilters.subjectId}
 onChange={(e) => setSummaryFilters((f) => ({ ...f, subjectId: e.target.value }))}
 className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none transition shadow-2xs cursor-pointer"
 >
 <option value="ALL">Tất cả môn học</option>
 {summaryOptions?.subjects.map((item) => (
 <option key={item.id} value={item.id}>
 [{item.code}] {item.name}
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-[12px] font-semibold text-slate-500 tracking-wider mb-1.5">
 Khoa / Bộ môn
 </label>
 <select
 value={summaryFilters.departmentId}
 onChange={(e) => setSummaryFilters((f) => ({ ...f, departmentId: e.target.value }))}
 className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none transition shadow-2xs cursor-pointer"
 >
 <option value="ALL">Tất cả khoa</option>
 {summaryOptions?.departments.map((item) => (
 <option key={item.id} value={item.id}>
 {item.name}
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-[12px] font-semibold text-slate-500 tracking-wider mb-1.5">
 Lớp học
 </label>
 <select
 value={summaryFilters.classId}
 onChange={(e) => setSummaryFilters((f) => ({ ...f, classId: e.target.value }))}
 className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none transition shadow-2xs cursor-pointer"
 >
 <option value="ALL">Tất cả lớp học</option>
 {summaryOptions?.classes?.map((item: any) => (
 <option key={item.id} value={item.id}>
 {item.name}
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-[12px] font-semibold text-slate-500 tracking-wider mb-1.5">
 Từ ngày
 </label>
 <input
 type="date"
 value={summaryFilters.fromDate}
 onChange={(e) => setSummaryFilters((f) => ({ ...f, fromDate: e.target.value }))}
 className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none transition shadow-2xs"
 />
 </div>

 <div>
 <label className="block text-[12px] font-semibold text-slate-500 tracking-wider mb-1.5">
 Đến ngày
 </label>
 <input
 type="date"
 value={summaryFilters.toDate}
 onChange={(e) => setSummaryFilters((f) => ({ ...f, toDate: e.target.value }))}
 className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none transition shadow-2xs"
 />
 </div>
 </div>
 </div>
 );
}
