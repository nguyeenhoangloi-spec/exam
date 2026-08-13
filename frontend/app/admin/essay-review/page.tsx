'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../../../lib/api';
import { usePageTitle } from '../../../components/PageTitleContext';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { TabBar } from '../../../components/ui/TabBar';
import { Button } from '../../../components/ui/Button';
import { FilterSelect } from '../../../components/ui/FilterSelect';
import {
 FileCheck,
 ShieldCheck,
 RotateCcw,
 Send,
 Clock,
 AlertTriangle,
 FileText,
 User,
 BookOpen,
 CheckCircle2,
 XCircle,
 History,
 Download,
 Loader2,
 Search,
 X,
 Sparkles,
} from 'lucide-react';

export default function AdminEssayReviewPage() {
 usePageTitle('Duyệt bài thi Tự luận');
 const [rows, setRows] = useState<any[]>([]);
 const [selected, setSelected] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [message, setMessage] = useState('');
 const [statusFilter, setStatusFilter] = useState<string>('ALL');
 const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
 const [searchQuery, setSearchQuery] = useState<string>('');

 // Action inputs
 const [actionReason, setActionReason] = useState<string>('');
 const [extraMinutes, setExtraMinutes] = useState<number>(15);
 const [penaltyInput, setPenaltyInput] = useState<number>(0);

 const [confirmModal, setConfirmModal] = useState<{
 isOpen: boolean;
 title: string;
 message: string;
 type?: 'danger' | 'success' | 'warning' | 'info';
 requireReason?: boolean;
 reasonPlaceholder?: string;
 confirmText?: string;
 cancelText?: string;
 onConfirm: (reason?: string) => void;
 }>({ isOpen: false, title: '', message: '', type: 'info', confirmText: 'Xác nhận', cancelText: 'Hủy bỏ', onConfirm: () => { } });

 const loadAssignments = async () => {
 setLoading(true);
 try {
 const res = await api.get('/essay/grading/assignments', { params: { noCache: true } });
 setRows(res.data || []);
 } catch (e: any) {
 setMessage(e?.response?.data?.message || 'Không thể tải danh sách bài tự luận.');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 loadAssignments();
 }, []);

 const openAttempt = useCallback(async (id: string) => {
 try {
 const res = await api.get(`/essay/grading/attempts/${id}`, { params: { noCache: true } });
 setSelected(res.data);
 setMessage('');
 } catch (e: any) {
 setMessage(e?.response?.data?.message || 'Không thể tải bài làm.');
 }
 }, []);

 const showResultPopup = (title: string, message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success') => {
 setConfirmModal({
 isOpen: true,
 title,
 message,
 type,
 requireReason: false,
 confirmText: 'Đã hiểu',
 cancelText: '',
 onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
 });
 };

 const handleApprove = (publish = false) => {
 if (!selected) return;
 setConfirmModal({
 isOpen: true,
 title: publish ? 'Công bố điểm chính thức' : 'Duyệt điểm bài thi',
 message: publish
 ? `Bạn có chắc chắn muốn CÔNG BỐ điểm bài thi của thí sinh ${selected.student?.fullName}? Sau khi công bố, sinh viên sẽ nhìn thấy điểm số và kết quả bài làm.`
 : `Xác nhận duyệt điểm bài thi của thí sinh ${selected.student?.fullName}?`,
 type: publish ? 'info' : 'success',
 requireReason: false,
 confirmText: publish ? 'Công bố ngay' : 'Duyệt điểm',
 cancelText: 'Hủy bỏ',
 onConfirm: async () => {
 setConfirmModal((prev) => ({ ...prev, isOpen: false }));
 try {
 await api.post(`/essay/grading/attempts/${selected.id}/${publish ? 'publish' : 'approve'}`);
 const msg = publish ? 'Đã công bố điểm cho Sinh viên thành công.' : 'Đã duyệt điểm bài thi thành công.';
 setMessage(msg);
 await loadAssignments();
 await openAttempt(selected.id);
 showResultPopup(publish ? 'Đã Công Bố Điểm' : 'Đã Duyệt Điểm', msg, 'success');
 } catch (e: any) {
 const errMsg = e?.response?.data?.message || 'Thao tác không thành công.';
 setMessage(errMsg);
 showResultPopup('Không Thể Thực Hiện', errMsg, 'danger');
 }
 },
 });
 };

 const handleReturn = () => {
 if (!selected) return;
 setConfirmModal({
 isOpen: true,
 title: 'Trả lại bài thi để chấm lại',
 message: `Bạn có chắc chắn muốn trả lại bài thi của ${selected.student?.fullName} cho Giảng viên chấm lại?`,
 type: 'danger',
 requireReason: true,
 reasonPlaceholder: 'Nhập lý do trả lại bài thi (tối thiểu 3 ký tự)...',
 confirmText: 'Trả lại chấm lại',
 cancelText: 'Hủy bỏ',
 onConfirm: async (reasonFromModal) => {
 const finalReason = reasonFromModal?.trim() || actionReason.trim();
 setConfirmModal((prev) => ({ ...prev, isOpen: false }));
 try {
 await api.post(`/essay/grading/attempts/${selected.id}/return`, { reason: finalReason });
 const msg = 'Đã yêu cầu Giảng viên chấm lại bài thi thành công.';
 setMessage(msg);
 await loadAssignments();
 await openAttempt(selected.id);
 showResultPopup('Đã Yêu Cầu Chấm Lại', msg, 'success');
 } catch (e: any) {
 const errMsg = e?.response?.data?.message || 'Không thể trả lại bài thi.';
 setMessage(errMsg);
 showResultPopup('Không Thể Trả Bài', errMsg, 'danger');
 }
 },
 });
 };

 const handleReopen = () => {
 if (!selected) return;
 setConfirmModal({
 isOpen: true,
 title: 'Mở lại phiên bài thi',
 message: `Xác nhận mở lại phiên thi cho sinh viên ${selected.student?.fullName}?`,
 type: 'warning',
 requireReason: true,
 reasonPlaceholder: 'Nhập lý do mở lại bài thi (tối thiểu 3 ký tự)...',
 confirmText: 'Mở lại bài thi',
 cancelText: 'Hủy bỏ',
 onConfirm: async (reasonFromModal) => {
 const finalReason = reasonFromModal?.trim() || actionReason.trim();
 setConfirmModal((prev) => ({ ...prev, isOpen: false }));
 try {
 await api.post(`/essay/grading/attempts/${selected.id}/reopen`, { reason: finalReason });
 const msg = 'Đã mở lại bài thi cho sinh viên tiếp tục.';
 setMessage(msg);
 await loadAssignments();
 await openAttempt(selected.id);
 showResultPopup('Đã Mở Lại Bài Thi', msg, 'success');
 } catch (e: any) {
 const errMsg = e?.response?.data?.message || 'Không thể mở lại bài thi.';
 setMessage(errMsg);
 showResultPopup('Không Thể Mở Lại Bài', errMsg, 'danger');
 }
 },
 });
 };

 const handleExtend = () => {
 if (!selected) return;
 if (extraMinutes <= 0) {
 showResultPopup('Số Phút Không Hợp Lệ', 'Số phút gia hạn phải lớn hơn 0.', 'warning');
 return;
 }
 setConfirmModal({
 isOpen: true,
 title: `Gia hạn ${extraMinutes} phút`,
 message: `Gia hạn thêm ${extraMinutes} phút làm bài cho ${selected.student?.fullName}?`,
 type: 'info',
 requireReason: true,
 reasonPlaceholder: 'Nhập lý do gia hạn thời gian làm bài...',
 confirmText: 'Gia hạn ngay',
 cancelText: 'Hủy bỏ',
 onConfirm: async (reasonFromModal) => {
 const finalReason = reasonFromModal?.trim() || actionReason.trim() || 'Gia hạn thời gian làm bài';
 setConfirmModal((prev) => ({ ...prev, isOpen: false }));
 try {
 await api.post(`/essay/grading/attempts/${selected.id}/extend-time`, {
 reason: finalReason,
 extraMinutes: Number(extraMinutes),
 });
 const msg = `Đã gia hạn thêm ${extraMinutes} phút làm bài thành công.`;
 setMessage(msg);
 await loadAssignments();
 await openAttempt(selected.id);
 showResultPopup('Đã Gia Hạn Thời Gian', msg, 'success');
 } catch (e: any) {
 const errMsg = e?.response?.data?.message || 'Không thể gia hạn.';
 setMessage(errMsg);
 showResultPopup('Không Thể Gia Hạn', errMsg, 'danger');
 }
 },
 });
 };

 const handlePenalty = () => {
 if (!selected) return;
 if (penaltyInput < 0) {
 showResultPopup('Điểm Phạt Không Hợp Lệ', 'Điểm phạt không được âm.', 'warning');
 return;
 }
 setConfirmModal({
 isOpen: true,
 title: `Trừ ${penaltyInput} điểm`,
 message: `Xác nhận trừ ${penaltyInput} điểm của bài thi ${selected.student?.fullName}?`,
 type: 'danger',
 requireReason: true,
 reasonPlaceholder: 'Nhập lý do áp dụng điểm phạt...',
 confirmText: 'Trừ điểm ngay',
 cancelText: 'Hủy bỏ',
 onConfirm: async (reasonFromModal) => {
 const finalReason = reasonFromModal?.trim() || actionReason.trim() || 'Điểm phạt vi phạm quy chế';
 setConfirmModal((prev) => ({ ...prev, isOpen: false }));
 try {
 await api.post(`/essay/grading/attempts/${selected.id}/penalty`, {
 reason: finalReason,
 penaltyPoints: Number(penaltyInput),
 });
 const msg = `Đã áp dụng điểm phạt trừ ${penaltyInput} điểm thành công.`;
 setMessage(msg);
 await loadAssignments();
 await openAttempt(selected.id);
 showResultPopup('Đã Áp Dụng Điểm Phạt', msg, 'success');
 } catch (e: any) {
 const errMsg = e?.response?.data?.message || 'Không thể trừ điểm.';
 setMessage(errMsg);
 showResultPopup('Không Thể Trừ Điểm', errMsg, 'danger');
 }
 },
 });
 };

 const [dateFilter, setDateFilter] = useState<string>('ALL');
 const [scheduleFilter, setScheduleFilter] = useState<string>('ALL');

 const availableSubjects = useMemo(() => {
 const map = new Map<string, string>();
 rows.forEach((r) => {
 if (dateFilter !== 'ALL') {
 const rawDate = r.onlineExamConfig?.examSchedule?.examDate || r.submittedAt || r.createdAt;
 const dStr = rawDate ? new Date(rawDate).toLocaleDateString('vi-VN') : '';
 if (dStr !== dateFilter) return;
 }
 const s = r.onlineExamConfig?.examSchedule?.subject;
 const code = s?.subjectCode || r.subjectCode;
 const name = s?.subjectName || r.subjectName;
 if (code && name && !map.has(code)) {
 map.set(code, name);
 }
 });
 return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
 }, [rows, dateFilter]);

 const availableDates = useMemo(() => {
 const set = new Set<string>();
 rows.forEach((r) => {
 if (subjectFilter !== 'ALL') {
 const code = r.onlineExamConfig?.examSchedule?.subject?.subjectCode || r.subjectCode;
 if (code !== subjectFilter) return;
 }
 const rawDate = r.onlineExamConfig?.examSchedule?.examDate || r.submittedAt || r.createdAt;
 if (rawDate) {
 const dStr = new Date(rawDate).toLocaleDateString('vi-VN');
 set.add(dStr);
 }
 });
 return Array.from(set);
 }, [rows, subjectFilter]);

 const availableSchedules = useMemo(() => {
 const map = new Map<string, string>();
 rows.forEach((r) => {
 if (dateFilter !== 'ALL') {
 const rawDate = r.onlineExamConfig?.examSchedule?.examDate || r.submittedAt || r.createdAt;
 const dStr = rawDate ? new Date(rawDate).toLocaleDateString('vi-VN') : '';
 if (dStr !== dateFilter) return;
 }
 if (subjectFilter !== 'ALL') {
 const code = r.onlineExamConfig?.examSchedule?.subject?.subjectCode || r.subjectCode;
 if (code !== subjectFilter) return;
 }
 const sched = r.onlineExamConfig?.examSchedule;
 if (sched?.id) {
 const code = sched.code || `Ca #${sched.id}`;
 const timeStr = sched.startTime && sched.endTime ? `${sched.startTime}–${sched.endTime}` : '';
 const subjName = sched.subject?.subjectName || r.subjectName || '';
 const label = `${code}${timeStr ? ` (${timeStr})` : ''} · ${subjName}`;
 map.set(sched.id.toString(), label);
 }
 });
 return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
 }, [rows, dateFilter, subjectFilter]);

 const counts = useMemo(() => {
 let all = 0, waiting = 0, grading = 0, published = 0;
 rows.forEach((r) => {
 all++;
 if (r.gradingStatus === 'PUBLISHED') published++;
 else if (r.gradingStatus === 'WAITING_APPROVAL') waiting++;
 else grading++;
 });
 return { all, waiting, grading, published };
 }, [rows]);

 const filteredRows = useMemo(() => {
 return rows.filter((r) => {
 // 1. Status Filter
 if (statusFilter !== 'ALL') {
 if (statusFilter === 'WAITING_APPROVAL' && r.gradingStatus !== 'WAITING_APPROVAL') return false;
 if (statusFilter === 'PUBLISHED' && r.gradingStatus !== 'PUBLISHED') return false;
 if (statusFilter === 'GRADING' && (r.gradingStatus === 'PUBLISHED' || r.gradingStatus === 'WAITING_APPROVAL')) return false;
 }
 // 2. Subject Filter
 if (subjectFilter !== 'ALL') {
 const code = r.onlineExamConfig?.examSchedule?.subject?.subjectCode || r.subjectCode;
 if (code !== subjectFilter) return false;
 }
 // 3. Date Filter
 if (dateFilter !== 'ALL') {
 const rawDate = r.onlineExamConfig?.examSchedule?.examDate || r.submittedAt || r.createdAt;
 const dStr = rawDate ? new Date(rawDate).toLocaleDateString('vi-VN') : '';
 if (dStr !== dateFilter) return false;
 }
 // 4. Schedule Filter
 if (scheduleFilter !== 'ALL') {
 const schedId = r.onlineExamConfig?.examSchedule?.id?.toString();
 if (schedId !== scheduleFilter) return false;
 }
 // 5. Search Query
 if (searchQuery.trim()) {
 const q = searchQuery.toLowerCase();
 const code = (r.student?.studentCode || '').toLowerCase();
 const name = (r.student?.fullName || '').toLowerCase();
 const subj = (r.onlineExamConfig?.examSchedule?.subject?.subjectName || r.subjectName || '').toLowerCase();
 const schedCode = (r.onlineExamConfig?.examSchedule?.code || '').toLowerCase();
 return code.includes(q) || name.includes(q) || subj.includes(q) || schedCode.includes(q);
 }
 return true;
 });
 }, [rows, statusFilter, subjectFilter, dateFilter, scheduleFilter, searchQuery]);

 return (
 <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen text-slate-900">
 {/* Page Header matching system standards */}
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
 <div className="space-y-1">
 <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 tracking-tight">
 Duyệt & Quản Lý Bài Thi Tự Luận
 </h1>
 <p className="text-[15px] font-normal leading-[22px] text-slate-500">
 Khu vực ADMIN duyệt điểm, công bố kết quả, xử lý phúc khảo, gia hạn bài thi hoặc chấm phạt.
 </p>
 </div>

 <button
 type="button"
 onClick={loadAssignments}
 disabled={loading}
 title="Làm mới danh sách"
 className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer active:scale-95 shrink-0 select-none disabled:opacity-50"
 >
 <RotateCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
 </button>
 </div>

 {message && (
 <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs font-semibold text-blue-800 flex items-center justify-between shadow-2xs">
 <span>{message}</span>
 <button onClick={() => setMessage('')} className="text-blue-500 hover:text-blue-700 font-semibold ml-4">
 ✕
 </button>
 </div>
 )}

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
 {/* Left panel: List */}
 <div className="lg:col-span-4 space-y-4">
 <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-slate-700 tracking-wider">
 Danh sách bài thi ({filteredRows.length}/{rows.length})
 </span>
 {(statusFilter !== 'ALL' || subjectFilter !== 'ALL' || dateFilter !== 'ALL' || scheduleFilter !== 'ALL' || searchQuery) && (
 <button
 type="button"
 onClick={() => {
 setStatusFilter('ALL');
 setSubjectFilter('ALL');
 setDateFilter('ALL');
 setScheduleFilter('ALL');
 setSearchQuery('');
 }}
 className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer select-none"
 title="Đặt lại bộ lọc"
 >
 <RotateCcw className="h-3.5 w-3.5" />
 </button>
 )}
 </div>

 {/* Status Tabs */}
 <TabBar
 tabs={[
 { key: 'ALL', label: 'Tất cả', count: counts.all },
 { key: 'WAITING_APPROVAL', label: 'Chờ duyệt', count: counts.waiting },
 { key: 'GRADING', label: 'Đang chấm', count: counts.grading },
 { key: 'PUBLISHED', label: 'Công bố', count: counts.published },
 ]}
 active={statusFilter}
 onChange={setStatusFilter}
 />

 {/* Search Bar */}
 <div className="relative w-full">
 <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
 <input
 type="text"
 placeholder="Tìm mã SV, tên SV, môn, ca thi..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-[15px] font-normal text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-2xs"
 />
 {searchQuery && (
 <button
 type="button"
 onClick={() => setSearchQuery('')}
 className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
 >
 <X className="h-3.5 w-3.5" />
 </button>
 )}
 </div>

 {/* Dropdown Filters Row: Môn thi & Ngày thi */}
 <div className="grid grid-cols-2 gap-2">
 {availableSubjects.length > 0 && (
 <FilterSelect
 value={subjectFilter}
 onChange={(e) => setSubjectFilter(e.target.value)}
 containerClassName="w-full"
 className="w-full"
 >
 <option value="ALL">Tất cả môn ({availableSubjects.length})</option>
 {availableSubjects.map((s) => (
 <option key={s.code} value={s.code}>
 [{s.code}] {s.name}
 </option>
 ))}
 </FilterSelect>
 )}

 {availableDates.length > 0 && (
 <FilterSelect
 value={dateFilter}
 onChange={(e) => setDateFilter(e.target.value)}
 containerClassName="w-full"
 className="w-full"
 >
 <option value="ALL">Tất cả ngày thi</option>
 {availableDates.map((d) => (
 <option key={d} value={d}>
 Ngày {d}
 </option>
 ))}
 </FilterSelect>
 )}
 </div>

 {/* Optional Schedule / Ca thi Filter if multiple schedules exist */}
 {availableSchedules.length > 1 && (
 <div>
  <FilterSelect
  value={scheduleFilter}
  onChange={(e) => setScheduleFilter(e.target.value)}
  containerClassName="w-full"
  className="w-full"
  >
  <option value="ALL">Tất cả ca thi / lịch thi</option>
  {availableSchedules.map((s) => (
  <option key={s.id} value={s.id}>
  {s.label}
  </option>
  ))}
  </FilterSelect>
 </div>
 )}

 {loading ? (
 <div className="py-10 flex flex-col items-center gap-3">
 <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
 <p className="text-xs font-semibold text-slate-500">Đang tải danh sách bài làm...</p>
 </div>
 ) : filteredRows.length === 0 ? (
 <div className="text-center py-10 text-[15px] font-normal text-slate-500">
 Không tìm thấy bài thi tự luận nào phù hợp bộ lọc.
 </div>
 ) : (
 <div className="space-y-2 max-h-[64vh] overflow-y-auto pr-1">
 {filteredRows.map((row) => {
 const isSel = selected?.id === row.id;
 const dateStr = row.onlineExamConfig?.examSchedule?.examDate
 ? new Date(row.onlineExamConfig.examSchedule.examDate).toLocaleDateString('vi-VN')
 : row.submittedAt
 ? new Date(row.submittedAt).toLocaleDateString('vi-VN')
 : null;
 const schedCode = row.onlineExamConfig?.examSchedule?.code;
 return (
 <button
 key={row.id}
 type="button"
 onClick={() => openAttempt(row.id)}
 className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${isSel
 ? 'border-blue-500 bg-blue-50/50 border-l-4 shadow-2xs'
 : 'border-slate-200/90 bg-white hover:bg-slate-50/80 hover:border-slate-300'
 }`}
 >
 <div className="flex justify-between items-center gap-2">
 <span className="font-semibold text-[15px] text-slate-900">{row.student?.fullName}</span>
 <StatusBadge status={row.gradingStatus} />
 </div>
 <p className="text-[13px] text-slate-500 tabular-nums font-normal">
 Mã SV: {row.student?.studentCode} · Điểm: <strong className="text-slate-900 font-semibold">{row.totalScore ?? 'Chưa chấm'}</strong>
 </p>
 <div className="flex items-center justify-between gap-1 text-[13px] text-slate-500 font-normal border-t border-slate-100 pt-1.5 mt-0.5">
 <span className="truncate flex-1 font-medium text-slate-700">
 {row.onlineExamConfig?.examSchedule?.subject?.subjectName || row.subjectName || 'Môn thi'}
 {schedCode ? ` (${schedCode})` : ''}
 </span>
 {dateStr && (
 <span className="shrink-0 text-[13px] font-semibold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
 {dateStr}
 </span>
 )}
 </div>
 </button>
 );
 })}
 </div>
 )}
 </div>
 </div>

 {/* Right panel: Detail & Admin Controls */}
 <div className="lg:col-span-8 space-y-4">
 {!selected ? (
 <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm font-semibold">
 Chọn một bài thi ở danh sách bên trái để xem chi tiết và thực hiện các thao tác quản trị.
 </div>
 ) : (
 <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
 {/* Attempt Meta */}
 <div className="flex justify-between items-start border-b border-slate-100 pb-4 flex-wrap gap-2">
 <div>
 <h2 className="text-lg font-semibold text-slate-900">{selected.student?.fullName}</h2>
 <p className="text-xs text-slate-500 tabular-nums">
 Mã SV: {selected.student?.studentCode} · Lớp: {selected.student?.className || 'N/A'}
 </p>
 </div>
 <div className="text-right">
 <span className="edu-kpi tabular-nums text-slate-900">
 {selected.totalScore ?? '--'} <span className="text-xs text-slate-500 font-semibold">/ {selected.maxScore || 10}đ</span>
 </span>
 {selected.penaltyPoints > 0 && (
 <p className="text-xs font-semibold text-rose-600">Phạt: -{selected.penaltyPoints}đ ({selected.penaltyReason})</p>
 )}
 </div>
 </div>

 {/* Answers & Rubric Details */}
 <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
 {(selected.questions || []).filter((q: any) => q.type === 'ESSAY').map((q: any, idx: number) => {
 const ans = (selected.attemptAnswers || []).find((a: any) => a.questionId === q.questionId);
 return (
 <div key={q.questionId || idx} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
 <div className="flex justify-between font-semibold text-xs text-slate-900 border-b border-slate-200 pb-2">
 <span>Câu {idx + 1}: {q.content}</span>
 <span className="text-slate-900 tabular-nums font-medium">{ans?.finalScore ?? '--'} / {q.score}đ</span>
 </div>

 {/* Student Answer */}
 <div className="space-y-1">
 <p className="text-[12px] font-semibold text-slate-400">Bài làm sinh viên:</p>
 <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap">
 {ans?.textAnswer || <span className="italic text-slate-400">Không có văn bản</span>}
 </div>
 </div>

 {/* Files */}
 {ans?.submissionFiles?.length > 0 && (
 <div className="space-y-1">
 <p className="text-[12px] font-semibold text-slate-400">File đính kèm:</p>
 <div className="flex gap-2 flex-wrap">
 {ans.submissionFiles.map((f: any) => (
 <a
 key={f.id}
 href={f.url}
 target="_blank"
 rel="noreferrer"
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
 >
 <Download className="w-3.5 h-3.5" />
 {f.fileName} ({(f.size / 1024 / 1024).toFixed(2)} MB)
 </a>
 ))}
 </div>
 </div>
 )}

 {/* Rubric Grades */}
 {q.rubric?.length > 0 && (
 <div className="space-y-2 pt-2 border-t border-slate-200">
 <p className="text-[12px] font-semibold text-slate-400">Điểm theo Rubric:</p>
 {q.rubric.map((r: any) => {
 const g = (ans?.essayGrades || []).find((item: any) => item.criterionId === r.id);
 return (
 <div key={r.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
 <div>
 <span className="font-semibold text-slate-800">{r.label}: </span>
 <span className="text-slate-600">{g?.comment || 'Không có nhận xét'}</span>
 </div>
 <span className=" tabular-nums font-medium text-slate-700">{g?.score ?? 0} / {r.maxScore}đ</span>
 </div>
 );
 })}
 </div>
 )}

 {/* AI Suggestion */}
 {ans?.aiSuggestedScore !== undefined && ans?.aiSuggestedScore !== null && (
 <div className="p-3 rounded-xl bg-blue-50/70 text-xs text-blue-900 space-y-1">
 <div className="flex justify-between font-semibold">
 <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-blue-600" /> AI Đề xuất: {ans.aiSuggestedScore}đ</span>
 <span>Tin cậy: {Math.round((ans.aiConfidence || 0) * 100)}%</span>
 </div>
 {ans.aiSuggestedComment && <p className="text-[12px] text-blue-800">{ans.aiSuggestedComment}</p>}
 </div>
 )}

 {/* Score History */}
 {ans?.gradeHistories?.length > 0 && (
 <div className="p-3 rounded-lg bg-slate-100 text-xs space-y-1">
 <p className="font-semibold text-slate-600 flex items-center gap-1">
 <History className="w-3.5 h-3.5" /> Lịch sử chỉnh điểm ({ans.gradeHistories.length})
 </p>
 {ans.gradeHistories.map((h: any) => (
 <div key={h.id} className="text-[12px] text-slate-600 border-b border-slate-200 pb-1">
 {new Date(h.createdAt).toLocaleString('vi-VN')}: Điểm cũ {h.oldScore ?? '--'} → Điểm mới {h.newScore}đ ({h.reason || 'Sửa điểm'}) bởi {h.actor?.username}
 </div>
 ))}
 </div>
 )}
 </div>
 );
 })}
 </div>

 {/* Admin Actions Panel - Premium UI/UX Pro Max */}
 <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
 {/* Header & Status Indicator */}
 <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
 <div className="flex items-center gap-2">
 <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
 <h3 className="text-[20px] font-semibold text-slate-900 tracking-tight">Thao tác Quản trị Admin</h3>
 </div>
 {selected.gradingStatus === 'PUBLISHED' ? (
 <StatusBadge status="PUBLISHED" customLabel="Điểm số đã công bố chính thức" />
 ) : selected.gradingStatus === 'WAITING_APPROVAL' ? (
 <StatusBadge status="WAITING_APPROVAL" customLabel="Bài thi đang chờ duyệt" />
 ) : (
 <StatusBadge status="GRADING" customLabel="Đang chấm thi" />
 )}
 </div>

 {/* Input Reason with Icon & Micro-Interaction */}
 <div className="space-y-1.5">
 <div className="flex items-center justify-between text-[15px]">
 <label className="text-[15px] font-medium text-slate-900">Lý do thao tác</label>
 <span className="text-slate-500 font-normal">(Bắt buộc khi Trả lại, Mở lại, Gia hạn, Trừ điểm)</span>
 </div>
 <div className="relative">
 <input
 type="text"
 placeholder="Nhập ghi chú hoặc lý do chi tiết..."
 value={actionReason}
 onChange={(e) => setActionReason(e.target.value)}
 className="w-full bg-slate-50/70 border border-slate-200/90 rounded-lg px-3.5 py-2.5 text-[15px] font-normal text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs placeholder-slate-400"
 />
 </div>
 </div>

 {/* Context-Aware Action Buttons Row */}
 <div className="flex flex-wrap items-center gap-2.5 pt-1">
 {selected.gradingStatus !== 'PUBLISHED' && (
 <>
 <Button
 type="button"
 variant="primary"
 size="md"
 onClick={() => handleApprove(true)}
 leftIcon={<Send className="w-4 h-4" />}
 >
 Công bố điểm
 </Button>
 <Button
 type="button"
 variant="primary"
 size="md"
 onClick={() => handleApprove(false)}
 leftIcon={<ShieldCheck className="w-4 h-4" />}
 >
 Duyệt điểm
 </Button>
 </>
 )}
 <Button
 type="button"
 variant="warning"
 size="md"
 onClick={handleReopen}
 leftIcon={<RotateCcw className="w-4 h-4" />}
 >
 Mở lại bài thi
 </Button>
 <Button
 type="button"
 variant="secondary"
 size="md"
 onClick={handleReturn}
 leftIcon={<XCircle className="w-4 h-4" />}
 >
 Trả lại chấm lại
 </Button>
 </div>

 {/* Adjustment Controls Grid: Gia hạn & Trừ điểm */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
 {/* Gia hạn làm bài */}
 <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs">
 <div className="flex items-center gap-2">
 <span className="text-[15px] font-medium text-slate-900">Gia hạn:</span>
 <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
 <input
 type="number"
 min={1}
 max={240}
 value={extraMinutes}
 onChange={(e) => setExtraMinutes(Number(e.target.value))}
 className="w-12 text-[15px] font-medium text-center text-slate-900 focus:outline-none"
 />
 <span className="text-[13px] font-semibold text-slate-500 ml-1">phút</span>
 </div>
 </div>
 <Button
 type="button"
 variant="secondary"
 size="sm"
 onClick={handleExtend}
 >
 Gia hạn
 </Button>
 </div>

 {/* Trừ điểm phạt */}
 <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs">
 <div className="flex items-center gap-2">
 <span className="text-[15px] font-medium text-slate-900">Điểm phạt:</span>
 <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
 <input
 type="number"
 min={0}
 step={0.5}
 value={penaltyInput}
 onChange={(e) => setPenaltyInput(Number(e.target.value))}
 className="w-12 text-[15px] font-medium text-center text-slate-900 focus:outline-none"
 />
 <span className="text-[12px] font-semibold text-slate-800 ml-1">điểm</span>
 </div>
 </div>
 <Button
 type="button"
 variant="secondary"
 size="sm"
 onClick={handlePenalty}
 >
 Trừ điểm
 </Button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>

 <ConfirmModal
 isOpen={confirmModal.isOpen}
 title={confirmModal.title}
 message={confirmModal.message}
 type={confirmModal.type}
 requireReason={confirmModal.requireReason}
 reasonPlaceholder={confirmModal.reasonPlaceholder}
 confirmText={confirmModal.confirmText}
 cancelText={confirmModal.cancelText}
 onConfirm={confirmModal.onConfirm}
 onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
 />
 </main>
 );
}
