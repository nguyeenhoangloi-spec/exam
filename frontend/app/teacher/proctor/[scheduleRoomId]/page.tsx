'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService } from '@/lib/services/online-exam.service';
import {
 Users,
 Wifi,
 WifiOff,
 CheckCircle2,
 AlertTriangle,
 RefreshCw,
 Clock,
 ShieldAlert,
 ArrowLeft,
 X,
 ChevronDown,
 Activity,
 Flag,
 RotateCcw,
 PlusCircle,
 FileText,
 Search,
 SlidersHorizontal,
 List,
 LayoutGrid,
 Layers,
 Check,
 ChevronLeft,
 ChevronRight,
 Eye,
} from 'lucide-react';

import { usePageTitle } from '@/components/PageTitleContext';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Toast } from '@/components/Toast';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/Button';

const EMPTY_STUDENTS: any[] = [];

/* ─── helpers ─── */
function statusMeta(att: any) {
 if (!att) return { label: 'Chưa bắt đầu', cls: 'text-slate-500 font-semibold' };
 if (att.status === 'IN_PROGRESS')
 return { label: 'Đang làm bài', cls: 'text-blue-700 font-semibold' };
 if (att.status === 'DISCONNECTED')
 return { label: 'Mất kết nối', cls: 'text-amber-700 font-semibold' };
 if (['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(att.status))
 return { label: att.status === 'AUTO_SUBMITTED' ? 'Nộp tự động' : 'Đã nộp bài', cls: 'text-emerald-700 font-semibold' };
 if (att.status === 'ABSENT') return { label: 'Vắng mặt', cls: 'text-rose-700 font-semibold' };
 return { label: att.status, cls: 'text-slate-700 font-semibold' };
}

function riskMeta(score: number) {
 if (score >= 40) return { cls: 'text-rose-600 font-semibold', level: 'Cao' };
 if (score >= 15) return { cls: 'text-amber-600 font-semibold', level: 'Trung bình' };
 return { cls: 'text-slate-600 font-semibold', level: 'Thấp' };
}

const FILTER_LABELS: Record<string, string> = {
 ALL: 'Tất cả',
 IN_PROGRESS: 'Đang làm bài',
 FLAGGED: 'Có cảnh báo',
 SUBMITTED: 'Đã nộp bài',
 DISCONNECTED: 'Mất kết nối',
};

export default function ProctorDashboardPage() {
 usePageTitle('Giám thị ca thi trực tiếp');
 const router = useRouter();
 const params = useParams();
 const scheduleRoomId = Number(params?.scheduleRoomId);

 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [data, setData] = useState<any>(null);
 const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

 // Filters & Search
 const [search, setSearch] = useState('');
 const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'FLAGGED' | 'SUBMITTED' | 'DISCONNECTED'>('ALL');
 const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

 // Toolbar & View state
 const [sortOrder, setSortOrder] = useState('seat_asc');
 const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
 const [openColumnMenu, setOpenColumnMenu] = useState(false);
 const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
 seat: true,
 name: true,
 code: true,
 status: true,
 risk: true,
 actions: true,
 });

 // Selection & Pagination
 const [selectedIds, setSelectedIds] = useState<number[]>([]);
 const [page, setPage] = useState(1);
 const [limit, setLimit] = useState(20);

 // Action modal states
 const [selectedStudent, setSelectedStudent] = useState<any>(null);
 const [actionType, setActionType] = useState<'EXTEND' | 'REOPEN' | 'FLAG' | 'RESOLVE' | null>(null);
 const [extraMinutes, setExtraMinutes] = useState(10);
 const [reason, setReason] = useState('');
 const [incidentDecision, setIncidentDecision] = useState('UNDER_REVIEW');
 const [resolutionDecision, setResolutionDecision] = useState<'REOPEN' | 'PENALTY' | 'TERMINATE'>('REOPEN');
 const [penaltyPoints, setPenaltyPoints] = useState(1);
 const [processing, setProcessing] = useState(false);
 const [actionError, setActionError] = useState<string | null>(null);

 // Bulk Modal
 const [showBulkModal, setShowBulkModal] = useState(false);
 const [bulkMinutes, setBulkMinutes] = useState(15);
 const [bulkReason, setBulkReason] = useState('Sự cố kỹ thuật mạng / hệ thống diện rộng');
 const [bulkProcessing, setBulkProcessing] = useState(false);
 const [bulkError, setBulkError] = useState<string | null>(null);
 const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

 // Reopen Entry Modal
 const [showReopenEntryModal, setShowReopenEntryModal] = useState(false);
 const [lateWindowMinutes, setLateWindowMinutes] = useState(30);
 const [reopenEntryProcessing, setReopenEntryProcessing] = useState(false);
 const [reopenEntryError, setReopenEntryError] = useState<string | null>(null);

 // General Confirm & Toast state
 const [confirmModal, setConfirmModal] = useState<{
 isOpen: boolean;
 title: string;
 message: string;
 type?: 'danger' | 'success' | 'warning' | 'info';
 onConfirm: () => void;
 }>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => {} });

 const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

 const loadDashboardRef = useRef<((isBackground?: boolean) => Promise<void>) | null>(null);

 const handleBulkExtend = async () => {
 try {
 setBulkError(null);
 setBulkSuccessMsg(null);
 setBulkProcessing(true);
 const res = await onlineExamService.bulkExtendTime(scheduleRoomId, bulkMinutes, bulkReason);
 setBulkSuccessMsg(res.message || `Đã bù giờ +${bulkMinutes} phút cho tất cả thí sinh thành công!`);
 setTimeout(() => {
 setShowBulkModal(false);
 setBulkSuccessMsg(null);
 void loadDashboard(true);
 }, 1500);
 } catch (err: any) {
 setBulkError(err?.response?.data?.message || err?.message || 'Không thể bù giờ toàn phòng.');
 } finally {
 setBulkProcessing(false);
 }
 };

 const handleReopenEntryConfirm = () => {
 if (!data?.scheduleId) return;
 setConfirmModal({
 isOpen: true,
 title: 'Xác nhận Mở Giờ Vào Thi Muộn',
 message: `Bạn có chắc chắn muốn gia hạn thời gian cho sinh viên vào thi muộn thêm ${lateWindowMinutes} phút nữa (tính từ thời điểm hiện tại)?`,
 type: 'info',
 onConfirm: () => executeReopenEntry(),
 });
 };

 const executeReopenEntry = async () => {
 if (!data?.scheduleId) return;
 setConfirmModal((prev) => ({ ...prev, isOpen: false }));
 try {
 setReopenEntryProcessing(true);
 setReopenEntryError(null);
 const res = await onlineExamService.reopenEntry(data.scheduleId, lateWindowMinutes);
 setShowReopenEntryModal(false);
 setToast({
 message: res.message || `Đã mở lại thời gian cho phép vào thi thêm ${lateWindowMinutes} phút thành công!`,
 type: 'success',
 });
 void loadDashboard(true);
 } catch (e: any) {
 const errText = e?.response?.data?.message || e?.message || 'Không thể gia hạn giờ vào thi';
 setReopenEntryError(errText);
 setToast({ message: errText, type: 'error' });
 } finally {
 setReopenEntryProcessing(false);
 }
 };

 const loadDashboard = useCallback(async (isBackground = false) => {
 try {
 if (!isBackground) setLoading(true);
 const res = await onlineExamService.getLiveDashboard(scheduleRoomId);
 setData(res);
 setLastUpdated(new Date());
 setError(null);
 } catch (err: any) {
 if (!isBackground) setError(err.message || 'Không thể tải dashboard giám thị');
 } finally {
 if (!isBackground) setLoading(false);
 }
 }, [scheduleRoomId]);
 loadDashboardRef.current = loadDashboard;

 useEffect(() => {
 if (!scheduleRoomId) return;
 void loadDashboardRef.current?.();
 const interval = setInterval(() => { void loadDashboardRef.current?.(true); }, 3000);
 return () => clearInterval(interval);
 }, [scheduleRoomId]);

 const handleAction = async () => {
 if (!selectedStudent?.attempt?.id) return;
 try {
 setActionError(null);
 setProcessing(true);
 if (actionType === 'EXTEND') await onlineExamService.extendTime(selectedStudent.attempt.id, extraMinutes, reason);
 else if (actionType === 'REOPEN') await onlineExamService.reopenAttempt(selectedStudent.attempt.id, reason);
 else if (actionType === 'FLAG') await onlineExamService.flagIncident(selectedStudent.attempt.id, reason, incidentDecision);
 else if (actionType === 'RESOLVE') await onlineExamService.resolveIncident(selectedStudent.attempt.id, resolutionDecision, penaltyPoints, reason);
 setActionType(null);
 setSelectedStudent(null);
 setReason('');
 loadDashboard(true);
 } catch (err: any) {
 setActionError(err?.response?.data?.message || err?.message || 'Thao tác thất bại. Vui lòng kiểm tra lại dữ liệu và thử lại.');
 } finally {
 setProcessing(false);
 }
 };

 const students = data?.students ?? EMPTY_STUDENTS;

 // Filtered & Sorted student list
 const filteredStudents = useMemo(() => {
 let result = students.filter((s: any) => {
 const matchSearch =
 !search ||
 (s.student?.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
 (s.student?.studentCode || '').toLowerCase().includes(search.toLowerCase()) ||
 String(s.examNumber || '').toLowerCase().includes(search.toLowerCase()) ||
 String(s.seatNumber || '').toLowerCase().includes(search.toLowerCase());

 const matchStatus =
 filter === 'ALL' ||
 (filter === 'IN_PROGRESS' && s.attempt?.status === 'IN_PROGRESS') ||
 (filter === 'FLAGGED' && s.attempt?.isFlagged) ||
 (filter === 'SUBMITTED' && ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(s.attempt?.status)) ||
 (filter === 'DISCONNECTED' && s.attempt?.status === 'DISCONNECTED');

 const riskScore = s.attempt?.riskScore || 0;
 const matchRisk =
 riskFilter === 'ALL' ||
 (riskFilter === 'HIGH' && riskScore >= 40) ||
 (riskFilter === 'MEDIUM' && riskScore >= 15 && riskScore < 40) ||
 (riskFilter === 'LOW' && riskScore < 15);

 return matchSearch && matchStatus && matchRisk;
 });

 result = [...result].sort((a: any, b: any) => {
 if (sortOrder === 'seat_asc') return (a.seatNumber || 0) - (b.seatNumber || 0);
 if (sortOrder === 'seat_desc') return (b.seatNumber || 0) - (a.seatNumber || 0);
 if (sortOrder === 'name_asc') return (a.student?.fullName || '').localeCompare(b.student?.fullName || '', 'vi');
 if (sortOrder === 'name_desc') return (b.student?.fullName || '').localeCompare(a.student?.fullName || '', 'vi');
 if (sortOrder === 'risk_desc') return (b.attempt?.riskScore || 0) - (a.attempt?.riskScore || 0);
 if (sortOrder === 'code_asc') return (a.student?.studentCode || '').localeCompare(b.student?.studentCode || '');
 return 0;
 });

 return result;
 }, [students, search, filter, riskFilter, sortOrder]);

 const stats = data?.stats || {};

 // Pagination calculation
 const totalItems = filteredStudents.length;
 const totalPages = Math.max(1, Math.ceil(totalItems / limit));
 const currentStudents = useMemo(() => {
 const start = (page - 1) * limit;
 return filteredStudents.slice(start, start + limit);
 }, [filteredStudents, page, limit]);

 const allSelected = currentStudents.length > 0 && currentStudents.every((s: any) => selectedIds.includes(s.student.id));

 const handleSelectAll = (checked: boolean) => {
 if (checked) {
 const pageIds = currentStudents.map((s: any) => s.student.id);
 setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
 } else {
 const pageIds = new Set(currentStudents.map((s: any) => s.student.id));
 setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
 }
 };

 const handleSelectOne = (id: number, checked: boolean) => {
 if (checked) {
 setSelectedIds((prev) => [...prev, id]);
 } else {
 setSelectedIds((prev) => prev.filter((item) => item !== id));
 }
 };

 const columnsList = [
 { key: 'seat', label: 'SBD & Số ghế' },
 { key: 'name', label: 'Họ và tên thí sinh' },
 { key: 'code', label: 'Mã sinh viên' },
 { key: 'status', label: 'Trạng thái thi' },
 { key: 'risk', label: 'Mức cảnh báo' },
 { key: 'actions', label: 'Thao tác' },
 ];

 const handleColumnToggle = (key: string) => {
 setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
 };

 const startItem = totalItems > 0 ? (page - 1) * limit + 1 : 0;
 const endItem = Math.min(page * limit, totalItems);

 const paginationPages: (number | string)[] = [];
 if (totalPages <= 7) {
 for (let i = 1; i <= totalPages; i++) paginationPages.push(i);
 } else {
 paginationPages.push(1);
 if (page > 3) paginationPages.push('...');
 const start = Math.max(2, page - 1);
 const end = Math.min(totalPages - 1, page + 1);
 for (let i = start; i <= end; i++) {
 if (!paginationPages.includes(i)) paginationPages.push(i);
 }
 if (page < totalPages - 2) paginationPages.push('...');
 if (!paginationPages.includes(totalPages)) paginationPages.push(totalPages);
 }

 /* ── Loading ── */
 if (loading) {
 return (
 <main className="w-full px-6 py-6 min-h-screen bg-slate-50/50 flex flex-col items-center justify-center gap-3">
 <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
 <p className="text-xs font-semibold text-slate-500">Đang kết nối bảng điều khiển giám thị trực tiếp...</p>
 </main>
 );
 }

 /* ── Error ── */
 if (error || !data) {
 return (
 <main className="w-full px-6 py-6 min-h-screen bg-slate-50/50 flex items-center justify-center">
 <div className="bg-white border border-slate-200/90 p-8 rounded-2xl max-w-md w-full text-center shadow-2xs space-y-4">
 <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto">
 <AlertTriangle className="w-6 h-6 text-rose-600" />
 </div>
 <h2 className="text-lg font-semibold text-slate-900">Lỗi tải bảng điều khiển giám thị</h2>
 <p className="text-slate-500 text-xs font-medium">{error}</p>
 <button
 type="button"
 onClick={() => router.back()}
 className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
 >
 <ArrowLeft className="w-4 h-4" />
 <span>Quay lại trang trước</span>
 </button>
 </div>
 </main>
 );
 }

 const KPI_CARDS = [
 { label: 'Tổng thí sinh', value: stats.total ?? 0, subtext: 'Trong danh sách phòng', icon: Users, iconBg: 'bg-blue-50 text-blue-600 border-blue-100' },
 { label: 'Đang làm bài', value: stats.inProgress ?? 0, subtext: 'Đang thao tác trực tuyến', icon: Activity, iconBg: 'bg-blue-50 text-blue-600 border-blue-100' },
 { label: 'Mất kết nối', value: stats.disconnected ?? 0, subtext: 'Cần hỗ trợ mạng / thiết bị', icon: WifiOff, iconBg: 'bg-amber-50 text-amber-600 border-amber-100' },
 { label: 'Đã nộp bài', value: stats.submitted ?? 0, subtext: 'Hoàn tất gửi bài thi', icon: CheckCircle2, iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
 { label: 'Có cảnh báo', value: stats.flagged ?? 0, subtext: 'Vi phạm quy chế thi', icon: ShieldAlert, iconBg: 'bg-rose-50 text-rose-600 border-rose-100' },
 ];

 const actionMeta: Record<string, { title: string; desc: string; icon: React.ElementType; color: string; iconBg: string }> = {
 EXTEND: { title: 'Gia hạn thời gian làm bài', desc: 'Cộng thêm thời gian cho phiên đang thi hoặc vừa mất kết nối.', icon: Clock, color: 'text-blue-600', iconBg: 'bg-blue-50 border-blue-200' },
 REOPEN: { title: 'Mở lại phiên thi', desc: 'Cho phép sinh viên tiếp tục phiên thi đã kết thúc hoặc bị gián đoạn.', icon: RotateCcw, color: 'text-amber-600', iconBg: 'bg-amber-50 border-amber-200' },
 FLAG: { title: 'Lập biên bản sự cố vi phạm', desc: 'Ghi nhận sự cố; giám thị có thể xử lý và quyết định kết quả sau.', icon: Flag, color: 'text-rose-600', iconBg: 'bg-rose-50 border-rose-200' },
 RESOLVE: { title: 'Xử lý biên bản vi phạm', desc: 'Chọn mở lại, giữ điểm và trừ điểm, hoặc đình chỉ bài thi.', icon: ShieldAlert, color: 'text-blue-600', iconBg: 'bg-blue-50 border-blue-200' },
 };

 return (
 <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">

 {/* ── 1. Standard Page Header ── */}
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
 <div className="flex items-center gap-3">
 <button
 type="button"
 onClick={() => router.back()}
 className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#64748B] shadow-2xs transition hover:bg-slate-50 hover:text-[#0F172A] active:scale-95 cursor-pointer"
 title="Quay lại danh sách phân công"
 >
 <ArrowLeft className="h-4 w-4" />
 </button>

 <div className="space-y-0.5">
 <div className="flex items-center gap-2.5 flex-wrap">
 <h1 className="text-[28px] font-semibold leading-[36px] text-[#0F172A] tracking-tight">
 Giám Thị Phòng: <span className="text-[#2563EB]">{data.roomName}</span>
 </h1>
 <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600">
 <span className="relative flex w-2 h-2">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
 </span>
 Trực tiếp
 </span>
 </div>

 <p className="text-[15px] font-normal leading-[22px] text-[#64748B]">
 Môn thi: <strong className="text-[#0F172A] font-semibold">{data.subjectName}</strong> &nbsp;•&nbsp; Ngày thi: <strong className="text-[#0F172A] font-semibold">{new Date(data.examDate).toLocaleDateString('vi-VN')}</strong> &nbsp;•&nbsp; Ca thi: <strong className="text-[#0F172A] font-semibold">{data.startTime} – {data.endTime}</strong>
 {lastUpdated && (
 <span className="ml-2 text-[#64748B] font-normal">
 (Cập nhật lúc {lastUpdated.toLocaleTimeString('vi-VN')})
 </span>
 )}
 </p>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2.5">
 <Button
 type="button"
 variant="primary"
 size="md"
 onClick={() => setShowReopenEntryModal(true)}
 leftIcon={<PlusCircle className="h-4 w-4" />}
 >
 Cho vào trễ (+30p)
 </Button>

 <Button
 type="button"
 variant="secondary"
 size="md"
 onClick={() => setShowBulkModal(true)}
 leftIcon={<Clock className="h-4 w-4 text-[#64748B]" />}
 >
 Bù giờ toàn phòng (+15p)
 </Button>

 <button
 type="button"
 onClick={() => loadDashboard(false)}
 className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition active:scale-95 cursor-pointer select-none"
 title="Làm mới dữ liệu"
 >
 <RefreshCw className="h-4 w-4" />
 </button>
 </div>
 </div>

 {/* ── Banner Cảnh Báo Sự Cố Ngắt Kết Nối Hàng Loạt ── */}
 {(stats.disconnected ?? 0) > 0 && (
 <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-[15px] font-medium text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-rose-600 text-white shadow-2xs">
 <AlertTriangle className="w-5 h-5 shrink-0" />
 </div>
 <div>
 <span className="text-[18px] font-semibold text-rose-950 block">Cảnh báo mất kết nối mạng</span>
 <span className="text-rose-800 font-normal text-[15px]">
 Hiện có <strong className="font-semibold">{stats.disconnected}</strong> sinh viên bị ngắt kết nối trong phòng thi. Vui lòng kiểm tra lại đường truyền mạng.
 </span>
 </div>
 </div>
 <button
 type="button"
 onClick={() => {
 setBulkMinutes(15);
 setBulkReason('Sự cố gián đoạn kỹ thuật / mạng toàn phòng thi');
 setShowBulkModal(true);
 }}
 className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-[15px] rounded-xl shadow-xs transition active:scale-95 cursor-pointer shrink-0"
 >
 Bù giờ khẩn cấp toàn phòng (+15p)
 </button>
 </div>
 )}

 {/* ── 2. Standard KPI Cards ── */}
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
 {KPI_CARDS.map(({ label, value, subtext, icon: Icon, iconBg }) => (
 <div
 key={label}
 className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md cursor-pointer"
 >
 <div className="flex items-start justify-between gap-3">
 <div className="space-y-1">
 <span className="text-[13px] font-semibold text-[#64748B] tracking-wider">
 {label}
 </span>
 <p className="text-[32px] font-semibold text-[#0F172A] leading-[38px]">
 {value}
 </p>
 </div>

 <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconBg} transition-all duration-200 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600`}>
 <Icon className="h-5 w-5" />
 </div>
 </div>

 <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[13px]">
 <span className="font-normal text-[#64748B]">{subtext}</span>
 </div>
 </div>
 ))}
 </div>

 {/* ── 3. Standard Filter Card Toolbar (Grid Inputs & TabBar) ── */}
 <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
 {/* Search Box */}
 <div className="relative">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B] pointer-events-none" />
 <input
 type="text"
 placeholder="Tìm theo tên, mã SV, SBD, ghế..."
 value={search}
 onChange={(e) => {
 setSearch(e.target.value);
 setPage(1);
 }}
 className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-9 py-2 text-[15px] font-medium text-[#0F172A] focus:bg-white focus:border-blue-500 focus:outline-none transition"
 />
 {search && (
 <button
 type="button"
 onClick={() => setSearch('')}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 {/* Status Select */}
 <div className="relative">
 <select
 value={filter}
 onChange={(e) => {
 setFilter(e.target.value as any);
 setPage(1);
 }}
 className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-[15px] font-medium text-[#0F172A] focus:border-blue-500 focus:outline-none cursor-pointer transition"
 >
 <option value="ALL">Tất cả trạng thái thi</option>
 <option value="IN_PROGRESS">Đang làm bài trực tuyến</option>
 <option value="FLAGGED">Có cảnh báo vi phạm</option>
 <option value="SUBMITTED">Đã hoàn thành nộp bài</option>
 <option value="DISCONNECTED">Mất kết nối đường truyền</option>
 </select>
 <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
 </div>

 {/* Risk Level Select */}
 <div className="relative">
 <select
 value={riskFilter}
 onChange={(e) => {
 setRiskFilter(e.target.value as any);
 setPage(1);
 }}
 className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-[15px] font-medium text-[#0F172A] focus:border-blue-500 focus:outline-none cursor-pointer transition"
 >
 <option value="ALL">Tất cả mức rủi ro</option>
 <option value="HIGH">Rủi ro cao (≥ 40 điểm)</option>
 <option value="MEDIUM">Rủi ro trung bình (15 - 39 điểm)</option>
 <option value="LOW">Rủi ro thấp (&lt; 15 điểm)</option>
 </select>
 <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
 </div>

 {/* Quick Sort Filter */}
 <div className="relative">
 <select
 value={sortOrder}
 onChange={(e) => setSortOrder(e.target.value)}
 className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-[15px] font-medium text-[#0F172A] focus:border-blue-500 focus:outline-none cursor-pointer transition"
 >
 <option value="seat_asc">Số ghế: Tăng dần (1 - 50)</option>
 <option value="seat_desc">Số ghế: Giảm dần</option>
 <option value="name_asc">Tên thí sinh: A - Z</option>
 <option value="name_desc">Tên thí sinh: Z - A</option>
 <option value="risk_desc">Mức rủi ro: Cao nhất trước</option>
 <option value="code_asc">Mã sinh viên: Tăng dần</option>
 </select>
 <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
 </div>
 </div>

 {/* TabBar Filter Buttons */}
 <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-[15px] font-medium text-[#64748B] mr-1">Trạng thái:</span>
 {(['ALL', 'IN_PROGRESS', 'FLAGGED', 'SUBMITTED', 'DISCONNECTED'] as const).map((f) => {
 const isActive = filter === f;
 return (
 <button
 key={f}
 type="button"
 onClick={() => {
 setFilter(f);
 setPage(1);
 }}
 className={[
 'px-3.5 py-1.5 rounded-xl text-[15px] font-medium transition cursor-pointer shadow-2xs',
 isActive
 ? 'bg-blue-600 text-white shadow-xs font-semibold'
 : 'bg-white text-[#0F172A] border border-slate-200/90 hover:bg-slate-50',
 ].join(' ')}
 >
 {FILTER_LABELS[f]}
 <span
 className={[
 'ml-1.5 text-[13px] font-semibold',
 isActive ? 'text-blue-100' : 'text-[#64748B]',
 ].join(' ')}
 >
 {f === 'ALL' && students.length}
 {f === 'IN_PROGRESS' && students.filter((s: any) => s.attempt?.status === 'IN_PROGRESS').length}
 {f === 'FLAGGED' && students.filter((s: any) => s.attempt?.isFlagged).length}
 {f === 'SUBMITTED' && students.filter((s: any) => ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(s.attempt?.status)).length}
 {f === 'DISCONNECTED' && students.filter((s: any) => s.attempt?.status === 'DISCONNECTED').length}
 </span>
 </button>
 );
 })}
 </div>

 <span className="text-[15px] font-medium text-[#64748B]">
 Hiển thị <strong className="text-[#0F172A] font-semibold">{totalItems}</strong> / {students.length} thí sinh
 </span>
 </div>
 </div>

 {/* ── 4. Standard Table Toolbar (Item Count, Sort Dropdown, Column Chooser, ViewMode, Refresh) ── */}
 <div className="flex flex-wrap items-center justify-between gap-3 py-1">
 <span className="text-[15px] font-medium text-[#334155]">
 <span className="font-semibold text-[#0F172A]">{totalItems}</span> thí sinh trong phòng thi
 </span>

 <div className="flex items-center gap-2">
 {/* Sort */}
 <div className="relative">
 <select
 value={sortOrder}
 onChange={(e) => setSortOrder(e.target.value)}
 className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-[15px] font-medium text-[#0F172A] outline-none hover:bg-slate-50 transition cursor-pointer shadow-2xs"
 >
 <option value="seat_asc">Sắp xếp: Số ghế tăng dần</option>
 <option value="seat_desc">Sắp xếp: Số ghế giảm dần</option>
 <option value="name_asc">Tên thí sinh: A - Z</option>
 <option value="risk_desc">Mức cảnh báo cao nhất</option>
 <option value="code_asc">Mã SV tăng dần</option>
 </select>
 <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
 </div>

 {/* Column Selector */}
 <div className="relative">
 <button
 type="button"
 onClick={() => setOpenColumnMenu(!openColumnMenu)}
 className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[15px] font-medium text-[#0F172A] transition hover:bg-slate-50 shadow-2xs cursor-pointer active:scale-95"
 >
 <SlidersHorizontal className="h-4 w-4 text-blue-600" />
 <span>Chọn cột</span>
 <ChevronDown className={`h-4 w-4 text-[#64748B] transition-transform ${openColumnMenu ? 'rotate-180' : ''}`} />
 </button>

 {openColumnMenu && (
 <div
 className="absolute right-0 top-full z-30 mt-1.5 w-56 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl text-[15px] space-y-2"
 onMouseLeave={() => setOpenColumnMenu(false)}
 >
 <div className="flex items-center justify-between border-b border-slate-100 pb-2">
 <span className="font-semibold text-[#0F172A]">Hiển thị cột</span>
 <span className="text-[13px] text-[#64748B] font-normal">Click để ẩn/hiện</span>
 </div>

 <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
 {columnsList.map((col) => {
 const isVisible = visibleColumns[col.key] !== false;
 return (
 <label
 key={col.key}
 className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-slate-50 cursor-pointer font-semibold text-slate-700 select-none transition"
 >
 <span className="flex items-center gap-2">
 <input
 type="checkbox"
 checked={isVisible}
 onChange={() => handleColumnToggle(col.key)}
 className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 <span className={isVisible ? 'text-slate-900' : 'text-slate-400 line-through'}>
 {col.label}
 </span>
 </span>
 {isVisible && <Check className="h-3.5 w-3.5 text-blue-600" />}
 </label>
 );
 })}
 </div>
 </div>
 )}
 </div>

 {/* View Mode Group */}
 <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
 <button
 type="button"
 onClick={() => setViewMode('list')}
 className={`rounded-lg p-1.5 transition cursor-pointer ${
 viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-700'
 }`}
 title="Dạng Danh sách chuẩn"
 >
 <List className="h-4 w-4" />
 </button>
 <button
 type="button"
 onClick={() => setViewMode('grid')}
 className={`rounded-lg p-1.5 transition cursor-pointer ${
 viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-700'
 }`}
 title="Dạng Lưới card"
 >
 <LayoutGrid className="h-4 w-4" />
 </button>
 <button
 type="button"
 onClick={() => setViewMode('compact')}
 className={`rounded-lg p-1.5 transition cursor-pointer ${
 viewMode === 'compact' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-700'
 }`}
 title="Dạng Thu gọn"
 >
 <Layers className="h-4 w-4" />
 </button>
 </div>

 {/* Refresh */}
 <button
 type="button"
 onClick={() => loadDashboard(false)}
 className="flex h-8 w-8 items-center justify-center rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition cursor-pointer active:scale-95 select-none"
 title="Làm mới dữ liệu"
 >
 <RefreshCw className="h-4 w-4" />
 </button>
 </div>
 </div>

 {/* ── 5. Main Content (List / Grid / Compact) ── */}
 {totalItems === 0 ? (
 <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs p-12 flex flex-col items-center gap-3 text-center">
 <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
 <Users className="w-7 h-7 text-slate-400" />
 </div>
 <h3 className="text-base font-semibold text-slate-800">Không tìm thấy thí sinh nào</h3>
 <p className="text-xs font-medium text-slate-500 max-w-sm">
 Không có thí sinh nào phù hợp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
 </p>
 </div>
 ) : viewMode === 'grid' ? (
 /* ── 5.1 Grid View Mode ── */
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
 {currentStudents.map((s: any) => {
 const att = s.attempt;
 const riskScore = att?.riskScore || 0;
 const { label: statusLabel, cls: statusCls } = statusMeta(att);
 const { cls: riskCls, level: riskLevel } = riskMeta(riskScore);
 const hasFlagged = att?.isFlagged;
 const isChecked = selectedIds.includes(s.student.id);

 return (
 <div
 key={s.student.id}
 className={`rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 flex flex-col justify-between ${
 isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
 }`}
 >
 <div className="space-y-2.5">
 <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={(e) => handleSelectOne(s.student.id, e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 <span className=" tabular-nums font-medium text-slate-900 text-xs">
 {s.examNumber}
 </span>
 </div>

 <span className="font-semibold text-xs text-slate-500">
 Ghế: <strong className="text-slate-900 font-semibold">{s.seatNumber}</strong>
 </span>
 </div>

 <div>
 <div className="flex items-center gap-1.5">
 <h4 className="text-sm font-semibold text-slate-900 leading-snug truncate">
 {s.student.fullName}
 </h4>
 {hasFlagged && <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />}
 </div>

 <span className=" tabular-nums font-medium text-[12px] text-[#475569] inline-block mt-1">
 {s.student.studentCode}
 </span>
 </div>

 <div className="space-y-1.5 text-xs text-slate-600 font-medium pt-1">
 <div className="flex items-center justify-between">
 <span className="text-slate-400">Trạng thái:</span>
 <StatusBadge status={att?.status || 'NOT_STARTED'} customLabel={statusLabel} />
 </div>

 <div className="flex items-center justify-between text-xs">
 <span className="text-slate-400">Mức rủi ro:</span>
 <span className={riskCls}>
 {riskScore}đ ({riskLevel})
 </span>
 </div>
 </div>
 </div>

 <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 text-xs">
 {att && ['IN_PROGRESS', 'DISCONNECTED'].includes(att.status) && (
 <button
 type="button"
 onClick={() => { setActionError(null); setSelectedStudent(s); setActionType('EXTEND'); }}
 className="group/btn inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-3 py-1.5 text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
 >
 <Clock className="w-3.5 h-3.5 text-slate-500 group-hover/btn:text-blue-600 transition-colors" />
 <span>Gia hạn</span>
 </button>
 )}
 {att && (
 <button
 type="button"
 onClick={() => { setActionError(null); setSelectedStudent(s); setActionType('FLAG'); }}
 className="group/btn inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white hover:border-rose-300 hover:bg-rose-50 text-slate-700 hover:text-rose-700 px-3 py-1.5 text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
 >
 <FileText className="w-3.5 h-3.5 text-slate-500 group-hover/btn:text-rose-600 transition-colors" />
 <span>Biên bản</span>
 </button>
 )}
 </div>
 </div>
 );
 })}
 </div>
 ) : viewMode === 'compact' ? (
 /* ── 5.2 Compact View Mode ── */
 <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
 <table className="w-full text-left text-[15px] text-[#334155] border-collapse">
 <thead className="bg-slate-50 text-[14px] font-semibold tracking-wider text-[#475569] border-b border-slate-200">
 <tr>
 <th scope="col" className="p-2 pl-3 text-center w-8">
 <input
 type="checkbox"
 checked={allSelected}
 onChange={(e) => handleSelectAll(e.target.checked)}
 className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </th>
 <th scope="col" className="p-2 whitespace-nowrap">SBD / Ghế</th>
 <th scope="col" className="p-2 min-w-[180px]">Họ tên thí sinh</th>
 <th scope="col" className="p-2 whitespace-nowrap">Mã SV</th>
 <th scope="col" className="p-2 whitespace-nowrap">Trạng thái thi</th>
 <th scope="col" className="p-2 text-center whitespace-nowrap">Cảnh báo</th>
 <th scope="col" className="p-2 pr-3 text-right whitespace-nowrap">Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 font-medium">
 {currentStudents.map((s: any) => {
 const att = s.attempt;
 const riskScore = att?.riskScore || 0;
 const { label: statusLabel, cls: statusCls } = statusMeta(att);
 const { cls: riskCls, level: riskLevel } = riskMeta(riskScore);
 const hasFlagged = att?.isFlagged;
 const isChecked = selectedIds.includes(s.student.id);

 return (
 <tr key={s.student.id} className={`transition hover:bg-blue-50/40 ${isChecked ? 'bg-blue-50/60' : ''}`}>
 <td className="p-2 pl-3 text-center">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={(e) => handleSelectOne(s.student.id, e.target.checked)}
 className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </td>
 <td className="p-2 whitespace-nowrap">
 <span className=" tabular-nums font-medium text-slate-900 text-[15px] leading-[22px]">{s.examNumber}</span>
 <span className="ml-1 text-slate-500 font-semibold text-[15px] leading-[22px]">G:{s.seatNumber}</span>
 </td>
 <td className="p-2 min-w-[180px]">
 <div className="flex items-center gap-1.5">
 <span className="font-semibold text-slate-900 text-[15px] leading-[22px] truncate">{s.student.fullName}</span>
 {hasFlagged && <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
 </div>
 </td>
 <td className="p-2 whitespace-nowrap">
 <span className=" tabular-nums font-medium text-[15px] leading-[22px] text-[#475569]">
 {s.student.studentCode}
 </span>
 </td>
 <td className="p-2 whitespace-nowrap">
 <StatusBadge status={att?.status || 'NOT_STARTED'} customLabel={statusLabel} />
 </td>
 <td className="p-2 text-center whitespace-nowrap">
 <span className={`text-[15px] leading-[22px] ${riskCls}`}>
 {riskScore}đ
 </span>
 </td>
 <td className="p-2 pr-3 text-right whitespace-nowrap">
 {att && (
 <div className="inline-flex items-center gap-1">
 <button
 type="button"
 onClick={() => { setActionError(null); setSelectedStudent(s); setActionType('EXTEND'); }}
 className="p-1.5 rounded-xl border border-slate-200/90 bg-white text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition cursor-pointer active:scale-95 shadow-2xs"
 title="Gia hạn"
 >
 <Clock className="w-3.5 h-3.5" />
 </button>
 <button
 type="button"
 onClick={() => { setActionError(null); setSelectedStudent(s); setActionType('FLAG'); }}
 className="p-1.5 rounded-xl border border-slate-200/90 bg-white text-slate-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer active:scale-95 shadow-2xs"
 title="Biên bản sự cố"
 >
 <FileText className="w-3.5 h-3.5" />
 </button>
 </div>
 )}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 ) : (
 /* ── 5.3 Standard List View Mode (Default Table) ── */
 <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
 <table className="w-full text-left text-[15px] text-[#334155] border-collapse">
 <thead className="bg-slate-50 text-[14px] font-semibold tracking-wider text-[#475569] border-b border-slate-200">
 <tr>
 <th scope="col" className="p-3.5 pl-4 text-center w-10">
 <input
 type="checkbox"
 checked={allSelected}
 onChange={(e) => handleSelectAll(e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </th>
 {visibleColumns.seat !== false && <th scope="col" className="p-3.5 whitespace-nowrap">SBD / Ghế</th>}
 {visibleColumns.name !== false && <th scope="col" className="p-3.5 min-w-[200px]">Họ và tên thí sinh</th>}
 {visibleColumns.code !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Mã SV</th>}
 {visibleColumns.status !== false && <th scope="col" className="p-3.5 whitespace-nowrap">Trạng thái thi</th>}
 {visibleColumns.risk !== false && <th scope="col" className="p-3.5 text-center whitespace-nowrap">Mức cảnh báo</th>}
 {visibleColumns.actions !== false && <th scope="col" className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác giám thị</th>}
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 font-medium">
 {currentStudents.map((s: any) => {
 const att = s.attempt;
 const riskScore = att?.riskScore || 0;
 const { label: statusLabel, cls: statusCls } = statusMeta(att);
 const { cls: riskCls, level: riskLevel } = riskMeta(riskScore);
 const hasFlagged = att?.isFlagged;
 const isChecked = selectedIds.includes(s.student.id);

 return (
 <tr key={s.student.id} className={`hover:bg-blue-50/40 transition ${isChecked ? 'bg-blue-50/60' : ''}`}>
 {/* Checkbox */}
 <td className="p-3.5 pl-4 text-center">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={(e) => handleSelectOne(s.student.id, e.target.checked)}
 className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
 />
 </td>

 {/* SBD / Seat */}
 {visibleColumns.seat !== false && (
 <td className="p-3.5 whitespace-nowrap">
 <span className=" tabular-nums font-medium text-slate-900 text-[15px] leading-[22px]">{s.examNumber}</span>
 <span className="ml-1.5 text-slate-500 font-semibold text-[15px] leading-[22px]">G:{s.seatNumber}</span>
 </td>
 )}

 {/* Name */}
 {visibleColumns.name !== false && (
 <td className="p-3.5 min-w-[200px]">
 <div className="flex items-center gap-2">
 <p className="font-semibold text-slate-900 text-[15px] leading-[22px] truncate">{s.student.fullName}</p>
 {hasFlagged && <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
 </div>
 </td>
 )}

 {/* Student code */}
 {visibleColumns.code !== false && (
 <td className="p-3.5 whitespace-nowrap">
 <span className=" tabular-nums font-medium text-[15px] leading-[22px] text-[#475569]">
 {s.student.studentCode}
 </span>
 </td>
 )}

 {/* Status */}
 {visibleColumns.status !== false && (
 <td className="p-3.5 whitespace-nowrap">
 <StatusBadge
 status={att?.status || 'NOT_STARTED'}
 customLabel={`${statusLabel}${att?.extraMinutes > 0 ? ` (+${att.extraMinutes}p)` : ''}`}
 />
 </td>
 )}

 {/* Risk */}
 {visibleColumns.risk !== false && (
 <td className="p-3.5 text-center whitespace-nowrap">
 <span className={`text-[15px] leading-[22px] ${riskCls}`}>
 {riskScore}đ ({riskLevel})
 </span>
 </td>
 )}

 {/* Actions */}
 {visibleColumns.actions !== false && (
 <td className="p-3.5 pr-4 text-right whitespace-nowrap">
 {att && (
 <div className="inline-flex items-center gap-1.5">
 {['IN_PROGRESS', 'DISCONNECTED'].includes(att.status) && (
 <button
 type="button"
 onClick={() => { setActionError(null); setSelectedStudent(s); setActionType('EXTEND'); }}
 title="Gia hạn thời gian làm bài"
 className="group/btn inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-3 py-1.5 text-[15px] leading-[22px] font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
 >
 <Clock className="w-3.5 h-3.5 text-slate-500 group-hover/btn:text-blue-600 transition-colors" />
 <span>Gia hạn</span>
 </button>
 )}
 {['DISCONNECTED', 'UNDER_REVIEW'].includes(att.status) && (
 <button
 type="button"
 onClick={() => { setActionError(null); setSelectedStudent(s); setActionType('REOPEN'); }}
 title="Mở lại phiên thi khi có sự cố"
 className="group/btn inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white hover:border-amber-300 hover:bg-amber-50 text-slate-700 hover:text-amber-700 px-3 py-1.5 text-[15px] leading-[22px] font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
 >
 <RotateCcw className="w-3.5 h-3.5 text-slate-500 group-hover/btn:text-amber-600 transition-colors" />
 <span>Mở lại</span>
 </button>
 )}
 {att.isFlagged && (
 <button
 type="button"
 onClick={() => { setActionError(null); setSelectedStudent(s); setActionType('RESOLVE'); }}
 title="Xử lý biên bản vi phạm"
 className="group/btn inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-3 py-1.5 text-[15px] leading-[22px] font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
 >
 <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 group-hover/btn:text-emerald-600 transition-colors" />
 <span>Xử lý</span>
 </button>
 )}
 <button
 type="button"
 onClick={() => { setActionError(null); setSelectedStudent(s); setActionType('FLAG'); }}
 title="Lập biên bản sự cố"
 className="group/btn inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white hover:border-rose-300 hover:bg-rose-50 text-slate-700 hover:text-rose-700 px-3 py-1.5 text-[15px] leading-[22px] font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
 >
 <FileText className="w-3.5 h-3.5 text-slate-500 group-hover/btn:text-rose-600 transition-colors" />
 <span>Biên bản</span>
 </button>
 </div>
 )}
 </td>
 )}
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}

 {/* ── 6. Standard Pagination Bar ── */}
 {totalItems > 0 && (
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
 <p className="text-xs font-semibold text-slate-500">
 Hiển thị <span className="font-semibold text-slate-900">{startItem}</span> -{' '}
 <span className="font-semibold text-slate-900">{endItem}</span> trong{' '}
 <span className="font-semibold text-slate-900">{totalItems.toLocaleString('vi-VN')}</span> Thí sinh
 </p>

 <div className="flex items-center gap-3">
 <div className="flex items-center gap-1">
 <button
 type="button"
 disabled={page <= 1}
 onClick={() => setPage(page - 1)}
 className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-40 disabled:hover:bg-white cursor-pointer shadow-2xs"
 title="Trang trước"
 >
 <ChevronLeft className="h-4 w-4" />
 </button>

 {paginationPages.map((p, idx) => {
 if (p === '...') {
 return (
 <span key={`dots-${idx}`} className="px-1 text-xs font-semibold text-slate-400">
 ...
 </span>
 );
 }

 const pNum = Number(p);
 const isCurrent = pNum === page;

 return (
 <button
 key={pNum}
 type="button"
 onClick={() => setPage(pNum)}
 className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2.5 text-xs font-semibold transition cursor-pointer shadow-2xs ${
 isCurrent
 ? 'bg-blue-600 text-white shadow-xs'
 : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
 }`}
 >
 {pNum}
 </button>
 );
 })}

 <button
 type="button"
 disabled={page >= totalPages}
 onClick={() => setPage(page + 1)}
 className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-40 disabled:hover:bg-white cursor-pointer shadow-2xs"
 title="Trang sau"
 >
 <ChevronRight className="h-4 w-4" />
 </button>
 </div>

 {/* Rows Per Page Dropdown */}
 <div className="relative">
 <select
 value={limit}
 onChange={(e) => {
 setLimit(Number(e.target.value));
 setPage(1);
 }}
 className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 transition cursor-pointer shadow-2xs"
 >
 <option value={10}>10 / trang</option>
 <option value={20}>20 / trang</option>
 <option value={50}>50 / trang</option>
 <option value={100}>100 / trang</option>
 </select>
 <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
 </div>
 </div>
 </div>
 )}

 {/* ═══════ ACTION MODAL ═══════ */}
 {actionType && selectedStudent && (() => {
 const meta = actionMeta[actionType];
 const MetaIcon = meta.icon;
 return (
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
 <div className="relative w-full max-w-md my-auto overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200/90 dark:border-slate-700">
 {/* Modal header */}
 <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 px-6 py-4">
 <div className="flex items-center gap-2.5">
 <div className={`flex h-8.5 w-8.5 items-center justify-center rounded-xl border ${meta.iconBg} shadow-2xs shrink-0`}>
 <MetaIcon className={`h-4.5 w-4.5 ${meta.color}`} />
 </div>
 <div>
 <h3 className="text-[20px] font-semibold text-[#0F172A] dark:text-slate-100 tracking-tight leading-none">{meta.title}</h3>
 <p className="mt-1 text-[13px] text-[#64748B] font-semibold leading-none">{meta.desc}</p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setActionType(null)}
 className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 {/* Student info */}
 <div className="mx-6 mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 flex items-center justify-between">
 <span>Thí sinh: <strong className="text-slate-900 font-semibold">{selectedStudent.student.fullName}</strong></span>
 <span className=" tabular-nums font-medium text-xs text-[#475569]">
 {selectedStudent.student.studentCode}
 </span>
 </div>

 {/* Modal body */}
 <div className="p-6 space-y-4 text-xs font-semibold">
 {actionError && (
 <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 shrink-0" />
 <span>{actionError}</span>
 </div>
 )}

 {actionType === 'EXTEND' && (
 <div>
 <label className="block text-slate-700 font-semibold mb-1.5">Số phút cộng thêm vào bài thi:</label>
 <div className="flex gap-2">
 {[5, 10, 15, 20, 30].map((m) => (
 <button
 key={m}
 type="button"
 onClick={() => setExtraMinutes(m)}
 className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
 extraMinutes === m
 ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
 : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
 }`}
 >
 +{m}p
 </button>
 ))}
 </div>
 </div>
 )}

 {actionType === 'RESOLVE' && (
 <div className="space-y-3">
 <div>
 <label className="block text-slate-700 font-semibold mb-1.5">Quyết định xử lý sự cố:</label>
 <select
 value={resolutionDecision}
 onChange={(e) => setResolutionDecision(e.target.value as any)}
 className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
 >
 <option value="REOPEN">Cho phép mở lại phiên thi để làm tiếp</option>
 <option value="PENALTY">Giữ nguyên bài thi & Áp dụng trừ điểm</option>
 <option value="TERMINATE">Đình chỉ thi & Hủy kết quả bài làm</option>
 </select>
 </div>

 {resolutionDecision === 'PENALTY' && (
 <div>
 <label className="block text-slate-700 font-semibold mb-1.5">Số điểm trừ trực tiếp (thang 10):</label>
 <input
 type="number"
 min="0.5"
 max="10"
 step="0.5"
 value={penaltyPoints}
 onChange={(e) => setPenaltyPoints(Number(e.target.value))}
 className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
 />
 </div>
 )}
 </div>
 )}

 {actionType === 'FLAG' && (
 <div>
 <label className="block text-slate-700 font-semibold mb-1.5">Phân loại sự cố ghi nhận:</label>
 <select
 value={incidentDecision}
 onChange={(e) => setIncidentDecision(e.target.value)}
 className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
 >
 <option value="UNDER_REVIEW">Tạm giữ để hội đồng thi kiểm tra lại</option>
 <option value="CONFIRMED_VIOLATION">Xác nhận có hành vi vi phạm quy chế</option>
 <option value="DISMISSED">Bỏ qua (Sự cố khách quan ngoài ý muốn)</option>
 </select>
 </div>
 )}

 <div>
 <label className="block text-slate-700 font-semibold mb-1.5">
 {actionType === 'FLAG' ? 'Lý do / Mô tả chi tiết vi phạm:' : 'Lý do thực hiện:'}
 </label>
 <textarea
 rows={3}
 placeholder="Nhập lý do hoặc ghi chú cho hội đồng thi..."
 value={reason}
 onChange={(e) => setReason(e.target.value)}
 className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
 />
 </div>
 </div>

 {/* Modal footer */}
 <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-3">
 <button
 type="button"
 onClick={() => setActionType(null)}
 disabled={processing}
 className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
 >
 Hủy
 </button>
 <button
 type="button"
 onClick={handleAction}
 disabled={processing}
 className={`rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50 ${
 actionType === 'FLAG'
 ? 'bg-rose-600 hover:bg-rose-700'
 : actionType === 'RESOLVE'
 ? 'bg-emerald-600 hover:bg-emerald-700'
 : 'bg-blue-600 hover:bg-blue-700'
 }`}
 >
 {processing ? 'Đang xử lý...' : 'Xác nhận'}
 </button>
 </div>
 </div>
 </div>
 );
 })()}

 {/* ═══════ BULK EXTEND MODAL ═══════ */}
 {showBulkModal && (
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
 <div className="relative w-full max-w-md my-auto overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200/90">
 <div className="flex items-center justify-between border-b border-slate-100 bg-amber-50/60 px-6 py-4">
 <div className="flex items-center gap-2.5">
 <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-amber-200 bg-amber-100/70 text-amber-700 shadow-2xs shrink-0">
 <Clock className="h-4.5 w-4.5" />
 </div>
 <div>
                <h3 className="text-[20px] font-semibold text-[#0F172A] leading-none">Bù giờ toàn phòng thi khẩn cấp</h3>
 <p className="mt-1 text-[13px] text-[#64748B] font-semibold leading-none">Cộng bù thời gian làm bài cho tất cả sinh viên</p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setShowBulkModal(false)}
 className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="p-6 space-y-4 text-xs font-semibold">
 {bulkError && (
 <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 shrink-0" />
 <span>{bulkError}</span>
 </div>
 )}

 {bulkSuccessMsg && (
 <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 shrink-0" />
 <span>{bulkSuccessMsg}</span>
 </div>
 )}

 <div>
 <label className="block text-slate-700 font-semibold mb-1.5">Chọn số phút cộng bù hàng loạt:</label>
 <div className="flex gap-2">
 {[5, 10, 15, 20, 30].map((m) => (
 <button
 key={m}
 type="button"
 onClick={() => setBulkMinutes(m)}
 className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
 bulkMinutes === m
 ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
 : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
 }`}
 >
 +{m}p
 </button>
 ))}
 </div>
 </div>

 <div>
 <label className="block text-slate-700 font-semibold mb-1.5">Lý do bù giờ (Ghi rõ để lưu biên bản thanh tra):</label>
 <textarea
 rows={3}
 value={bulkReason}
 onChange={(e) => setBulkReason(e.target.value)}
 className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500"
 />
 </div>
 </div>

 <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/80 px-6 py-3">
 <Button
 type="button"
 variant="secondary"
 size="md"
 onClick={() => setShowBulkModal(false)}
 disabled={bulkProcessing}
 >
 Hủy
 </Button>
 <Button
 type="button"
 variant="warning"
 size="md"
 onClick={handleBulkExtend}
 disabled={bulkProcessing}
 isLoading={bulkProcessing}
 >
 Bù Giờ Ngay
 </Button>
 </div>
 </div>
 </div>
 )}

 {/* ═══════ REOPEN ENTRY MODAL ═══════ */}
 {showReopenEntryModal && (
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
 <div className="relative w-full max-w-md my-auto overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200/90">
 <div className="flex items-center justify-between border-b border-slate-100 bg-blue-50/60 px-6 py-4">
 <div className="flex items-center gap-2.5">
 <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-blue-200 bg-blue-100/70 text-blue-700 shadow-2xs shrink-0">
 <PlusCircle className="h-4.5 w-4.5" />
 </div>
 <div>
 <h3 className="text-[20px] font-semibold text-[#0F172A] leading-none">Mở Giờ Cho Vào Thi Muộn</h3>
 <p className="mt-1 text-[13px] text-[#64748B] font-semibold leading-none">Gia hạn thời gian cho phép sinh viên bắt đầu làm bài</p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setShowReopenEntryModal(false)}
 className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="p-6 space-y-4 text-xs font-semibold">
 {reopenEntryError && (
 <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 shrink-0" />
 <span>{reopenEntryError}</span>
 </div>
 )}

 <div>
 <label className="block text-slate-700 font-semibold mb-1.5">Số phút cho phép vào thi kể từ bây giờ:</label>
 <div className="flex gap-2">
 {[15, 30, 45, 60].map((m) => (
 <button
 key={m}
 type="button"
 onClick={() => setLateWindowMinutes(m)}
 className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
 lateWindowMinutes === m
 ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
 : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
 }`}
 >
 +{m}p
 </button>
 ))}
 </div>
 </div>
 </div>

 <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/80 px-6 py-3">
 <Button
 type="button"
 variant="secondary"
 size="md"
 onClick={() => setShowReopenEntryModal(false)}
 disabled={reopenEntryProcessing}
 >
 Hủy
 </Button>
 <Button
 type="button"
 variant="primary"
 size="md"
 onClick={handleReopenEntryConfirm}
 disabled={reopenEntryProcessing}
 isLoading={reopenEntryProcessing}
 >
 Mở Giờ Vào Thi
 </Button>
 </div>
 </div>
 </div>
 )}

 {/* Confirm Popup Modal */}
 <ConfirmModal
 isOpen={confirmModal.isOpen}
 onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
 onConfirm={confirmModal.onConfirm}
 title={confirmModal.title}
 message={confirmModal.message}
 type={confirmModal.type}
 />

 {/* Toast Notification */}
 {toast && <Toast message={toast.message} type={toast.type === 'info' ? 'success' : toast.type} onClose={() => setToast(null)} />}
 </main>
 );
}
