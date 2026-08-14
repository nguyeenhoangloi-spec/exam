'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { downloadCsv } from '../../lib/export-csv';
import { printReport } from '../../lib/export-print';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ProfileDrawer } from '../../components/ProfileDrawer';
import { TabBar } from '../../components/ui/TabBar';
import { Button } from '../../components/ui/Button';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { IdentifierBadge } from '../../components/ui/IdentifierBadge';
import {
 UserCheck,
 Trash2,
 UserPlus,
 ShieldCheck,
 GraduationCap,
 DoorOpen,
 Calendar,
 Clock,
 Download,
 Eye,
 CheckCircle2,
 RefreshCw,
 XCircle,
 Printer,
 SlidersHorizontal,
 ChevronDown,
 List,
 LayoutGrid,
 Layers,
 Check,
} from 'lucide-react';
import { SortDropdown } from '../../components/ui/SortDropdown';
import { ExamSchedule, Teacher } from '../../types';

export default function ExamSupervisorsPage() {
 usePageTitle('Quản lý & Phân công Giám thị');
 const router = useRouter();
 const [currentUser, setCurrentUser] = useState<any>(null);
 const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
 const [teachers, setTeachers] = useState<Teacher[]>([]);
 const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
 const [selectedScheduleRoomId, setSelectedScheduleRoomId] = useState<string>('');
 const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
 const [role, setRole] = useState<string>('SUPERVISOR_1');
 const [note, setNote] = useState<string>('');
 const [drawerSupervisor, setDrawerSupervisor] = useState<any | null>(null);

 const [assignedSupervisors, setAssignedSupervisors] = useState<any[]>([]);
 const [allScheduleSupervisors, setAllScheduleSupervisors] = useState<any[]>([]);
 const [statusFilter, setStatusFilter] = useState<string>('ALL');
 const [sortOrder, setSortOrder] = useState<string>('newest');
 const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
 const [openColumnMenu, setOpenColumnMenu] = useState(false);
 const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
   code: true,
   name: true,
   room: true,
   role: true,
   status: true,
   actions: true,
 });
 const [showSchedulePicker, setShowSchedulePicker] = useState(false);

 const [autoProposal, setAutoProposal] = useState<any | null>(null);
 const [selectedAutoProposalKeys, setSelectedAutoProposalKeys] = useState<string[]>([]);
 const [autoLoading, setAutoLoading] = useState(false);
 const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
 const [confirmModal, setConfirmModal] = useState<{
 isOpen: boolean;
 title: string;
 message: string;
 type: 'danger' | 'warning' | 'info' | 'success';
 onConfirm: () => void;
 }>({
 isOpen: false,
 title: '',
 message: '',
 type: 'danger',
 onConfirm: () => { },
 });

 const fetchSupervisors = useCallback(async (scheduleRoomId: string, scheduleId?: number) => {
 try {
 if (scheduleId) {
 const resAll = await api.get(`/exam-supervisors?examScheduleId=${scheduleId}`);
 setAllScheduleSupervisors(resAll.data);
 }
 if (scheduleRoomId) {
 const resRoom = await api.get(`/exam-supervisors?examScheduleRoomId=${scheduleRoomId}`);
 setAssignedSupervisors(resRoom.data);
 } else {
 setAssignedSupervisors([]);
 }
 } catch (err: any) {
 setToast({ message: err.message || 'Lỗi tải danh sách giám thị', type: 'error' });
 }
 }, []);

 const selectSchedule = useCallback(async (scheduleId: number) => {
 try {
 const res = await api.get(`/exam-schedules/${scheduleId}`);
 setSelectedSchedule(res.data);
 setAutoProposal(null);
 setSelectedAutoProposalKeys([]);
 const firstRoomId = res.data.examScheduleRooms?.[0]?.id?.toString() || '';
 setSelectedScheduleRoomId(firstRoomId);
 await fetchSupervisors(firstRoomId, scheduleId);
 } catch (err: any) {
 setToast({ message: err.message || 'Lỗi tải chi tiết ca thi', type: 'error' });
 }
 }, [fetchSupervisors]);

 const fetchData = useCallback(async () => {
 try {
 const [resSchedules, resTeachers] = await Promise.all([
 api.get('/exam-schedules'),
 api.get('/teachers'),
 ]);
 setSchedules(resSchedules.data);
 setTeachers(resTeachers.data);
 if (resTeachers.data.length > 0) {
 setSelectedTeacherId(resTeachers.data[0].id.toString());
 }
 if (resSchedules.data.length > 0) {
 await selectSchedule(resSchedules.data[0].id);
 }
 } catch (err: any) {
 setToast({ message: err.message || 'Lỗi tải dữ liệu', type: 'error' });
 }
 }, [selectSchedule]);

 useEffect(() => {
 const u = getAuthUser();
 if (!u) {
 router.push('/login');
 return;
 }
 setCurrentUser(u);
 void fetchData();
 }, [fetchData, router]);

 const handleAssign = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!selectedScheduleRoomId || !selectedTeacherId) {
 setToast({ message: 'Vui lòng chọn phòng thi và giảng viên', type: 'error' });
 return;
 }
 try {
 await api.post('/exam-supervisors/assign', {
 examScheduleRoomId: Number(selectedScheduleRoomId),
 teacherId: Number(selectedTeacherId),
 role,
 note,
 });
 setToast({ message: 'Phân công giám thị thành công!', type: 'success' });
 setNote('');
 await selectSchedule(selectedSchedule.id);
 } catch (err: any) {
 setToast({ message: err.message || 'Lỗi phân công giám thị', type: 'error' });
 }
 };

 const handleUpdateStatus = (id: number, status: string, actionName: string) => {
 const sup = [...assignedSupervisors, ...allScheduleSupervisors].find((s) => s.id === id);
 const type = status === 'REJECTED' || status === 'ABSENT' ? 'danger' : status === 'COMPLETED' ? 'warning' : 'success';
 setConfirmModal({
 isOpen: true,
 title: `Xác nhận ${actionName}`,
 message: `Bạn có chắc chắn muốn ${actionName} giám thị ${sup?.teacher?.fullName || ''}?`,
 type,
 onConfirm: async () => {
 setConfirmModal((prev) => ({ ...prev, isOpen: false }));
 try {
 await api.patch(`/exam-supervisors/${id}/status`, { status });
 setToast({ message: `Đã ${actionName} thành công!`, type: 'success' });
 if (selectedSchedule?.id) {
 await selectSchedule(selectedSchedule.id);
 }
 } catch (err: any) {
 setToast({ message: err.message || 'Lỗi cập nhật trạng thái ca thi', type: 'error' });
 }
 },
 });
 };

 const previewAutoAssign = async () => {
 if (!selectedSchedule?.id) return;
 setAutoLoading(true);
 try {
 const res = await api.post('/exam-supervisors/auto-preview', { examScheduleId: selectedSchedule.id });
 setAutoProposal(res.data);
 setSelectedAutoProposalKeys(res.data.proposals.map((p: any) => `${p.examScheduleRoomId}-${p.role}`));
 setToast({ message: 'Đã tạo phương án giám thị xem trước. Chưa ghi dữ liệu.', type: 'success' });
 } catch (err: any) {
 setToast({ message: err.message || 'Không thể tạo phương án tự động', type: 'error' });
 } finally {
 setAutoLoading(false);
 }
 };

 const acceptAutoAssign = () => {
 if (!autoProposal?.proposals?.length) return;
 const count = selectedAutoProposalKeys.length;
 setConfirmModal({
 isOpen: true,
 title: 'Xác nhận lưu phương án tự động',
 message: `Bạn có chắc chắn muốn lưu ${count} lượt phân công giám thị từ phương án tự động? Hành động này sẽ ghi dữ liệu vào hệ thống.`,
 type: 'info',
 onConfirm: async () => {
 setConfirmModal((prev) => ({ ...prev, isOpen: false }));
 setAutoLoading(true);
 try {
 const proposals = autoProposal.proposals
 .filter((p: any) => selectedAutoProposalKeys.includes(`${p.examScheduleRoomId}-${p.role}`))
 .map((p: any) => ({ examScheduleRoomId: p.examScheduleRoomId, teacherId: p.teacherId, role: p.role }));
 if (!proposals.length) return;
 await api.post('/exam-supervisors/auto-assign', { proposals });
 setAutoProposal(null);
 setSelectedAutoProposalKeys([]);
 setToast({ message: 'Đã lưu phương án phân công tự động.', type: 'success' });
 await selectSchedule(selectedSchedule.id);
 } catch (err: any) {
 setToast({ message: err.message || 'Phương án đã thay đổi, vui lòng xem lại', type: 'error' });
 } finally {
 setAutoLoading(false);
 }
 },
 });
 };

 const handleDelete = (id: number) => {
 const sup = assignedSupervisors.find((s) => s.id === id) || allScheduleSupervisors.find((s) => s.id === id);
 setConfirmModal({
 isOpen: true,
 title: 'Hủy Phân công Giám thị',
 message: `Bạn có chắc chắn muốn hủy phân công giám thị ${sup?.teacher?.fullName || ''}? Hành động này không thể hoàn tác.`,
 type: 'danger',
 onConfirm: async () => {
 setConfirmModal((prev) => ({ ...prev, isOpen: false }));
 try {
 await api.delete(`/exam-supervisors/${id}`);
 setToast({ message: 'Đã hủy phân công giám thị thành công!', type: 'success' });
 await selectSchedule(selectedSchedule.id);
 } catch (err: any) {
 setToast({ message: err.message || 'Hủy phân công giám thị thất bại. Vui lòng thử lại.', type: 'error' });
 }
 },
 });
 };

 const exportCsv = () => {
 const headers = 'Môn thi,Phòng thi,Giám thị,Học vị,Vai trò,Trạng thái,Ghi chú\n';
 const rows = displayedSupervisors
 .map((s) => {
 const roomObj = s.examScheduleRoom?.room || s.examScheduleRoom?.examRoom;
 const rName = roomObj?.roomName || roomObj?.roomCode || '';
 const statusLabel = ({ CONFIRMED: 'Đã xác nhận', CHANGE_REQUESTED: 'Xin đổi ca', COMPLETED: 'Hoàn thành', ABSENT: 'Vắng mặt', PENDING: 'Chờ phản hồi', REJECTED: 'Đã từ chối' } as Record<string, string>)[s.status || 'PENDING'] || 'Chờ phản hồi';
 return `"${selectedSchedule?.subject?.subjectName || ''}","${rName}","${s.teacher?.fullName || ''}","${s.teacher?.degree || 'TS'}","${s.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2'}","${statusLabel}","${s.note || ''}"`;
 })
 .join('\n');
 downloadCsv('danh_sach_giam_thi_phan_cong.csv', headers + rows);
 };

 const handlePrintReport = () => {
 printReport({
 title: 'BÁO CÁO PHÂN CÔNG GIÁM THỊ VÀ TRẠNG THÁI GÁC THI',
 subtitle: selectedSchedule
 ? `Môn thi: ${selectedSchedule.subject?.subjectName} (${selectedSchedule.subject?.subjectCode}) - Ngày thi: ${new Date(selectedSchedule.examDate).toLocaleDateString('vi-VN')}`
 : 'Tổng hợp tất cả các ca coi thi',
 metaInfo: [
 { label: 'Tổng số lượt phân công', value: String(displayedSupervisors.length) },
 { label: 'Đã xác nhận', value: String(confirmedCount) },
 { label: 'Yêu cầu đổi ca', value: String(changeRequestedCount) },
 ],
 columns: [
 { header: 'STT', width: '40px' },
 { header: 'Môn thi', width: '160px' },
 { header: 'Phòng thi', width: '90px', align: 'center' },
 { header: 'Giám thị', width: '150px' },
 { header: 'Học vị', width: '70px', align: 'center' },
 { header: 'Vai trò', width: '90px', align: 'center' },
 { header: 'Trạng thái', width: '110px', align: 'center' },
 ],
 rows: displayedSupervisors.map((s, idx) => {
 const roomObj = s.examScheduleRoom?.room || s.examScheduleRoom?.examRoom;
 const rName = roomObj?.roomName || roomObj?.roomCode || '---';
 return [
 idx + 1,
 selectedSchedule?.subject?.subjectName || '---',
 rName,
s.teacher?.fullName || '---',
 s.teacher?.degree || 'TS',
 s.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2',
 s.status === 'CONFIRMED' ? 'Đã xác nhận' : s.status === 'CHANGE_REQUESTED' ? 'Xin đổi ca' : 'Chờ xác nhận',
 ];
 }),
 });
 };

 const totalAssignments = allScheduleSupervisors.length;
 const changeRequestedCount = allScheduleSupervisors.filter((s) => s.status === 'CHANGE_REQUESTED').length;
 const confirmedCount = allScheduleSupervisors.filter((s) => s.status === 'CONFIRMED').length;
 const completedCount = allScheduleSupervisors.filter((s) => s.status === 'COMPLETED').length;

 const displayedSupervisors = (statusFilter === 'ALL' ? assignedSupervisors : allScheduleSupervisors).filter((s) => {
 if (statusFilter === 'ALL') return true;
 return s.status === statusFilter;
 });

 const renderStatusBadge = (status: string) => {
 switch (status) {
 case 'CONFIRMED':
 return <StatusBadge status="CONFIRMED" customLabel="Đã xác nhận" />;
 case 'CHANGE_REQUESTED':
 return <StatusBadge status="CHANGE_REQUESTED" customLabel="Xin đổi ca" />;
 case 'COMPLETED':
 return <StatusBadge status="COMPLETED" customLabel="Hoàn thành" />;
 case 'ABSENT':
 return <StatusBadge status="ABSENT" customLabel="Vắng mặt" />;
 default:
 return <StatusBadge status="PENDING" customLabel="Chờ phản hồi" />;
 }
 };

 return (
 <>
 <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen">
 {/* Header */}
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
 <div className="space-y-0.5">
 <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
 Quản lý & Phân công Giám thị
 </h1>
 <p className="text-[14.5px] font-normal leading-[22px] text-slate-500 dark:text-slate-400">
 Theo dõi trạng thái xác nhận, phê duyệt yêu cầu đổi ca và đánh dấu điểm danh gác thi
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-2.5">
 <Button
 type="button"
 variant="secondary"
 size="md"
 onClick={exportCsv}
 leftIcon={<Download className="h-4 w-4 text-slate-500" />}
 >
 Xuất CSV
 </Button>

 <Button
 type="button"
 variant="secondary"
 size="md"
 onClick={handlePrintReport}
 leftIcon={<Printer className="h-4 w-4 text-slate-500" />}
 >
 In Báo cáo
 </Button>
 </div>
 </div>

 {/* 4 KPI Cards With Micro Progress Tracks */}
 <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
 {[
 {
 title: 'Lượt phân công',
 value: totalAssignments,
 subtext: `Lịch thi: ${(selectedSchedule?.examScheduleRooms || []).length} phòng`,
 progressPercent: totalAssignments > 0 ? 100 : 0,
 icon: ShieldCheck,
 },
 {
 title: 'Yêu cầu đổi ca',
 value: changeRequestedCount,
 subtext: changeRequestedCount > 0 ? 'Cần quản trị viên duyệt' : 'Không có yêu cầu mới',
 progressPercent: changeRequestedCount > 0 ? 100 : 0,
 icon: RefreshCw,
 },
 {
 title: 'Đã xác nhận ca',
 value: `${confirmedCount}/${totalAssignments}`,
 subtext: 'Sẵn sàng gác thi',
 progressPercent: totalAssignments > 0 ? Math.round((confirmedCount / totalAssignments) * 100) : 100,
 icon: CheckCircle2,
 },
 {
 title: 'Hoàn thành gác thi',
 value: `${completedCount}/${totalAssignments}`,
 subtext: 'Theo báo cáo phòng thi',
 progressPercent: totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 100,
 icon: UserCheck,
 },
 ].map((item) => {
 const IconComponent = item.icon;
 return (
 <div
 key={item.title}
 className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md cursor-pointer"
 >
 <div className="flex items-start justify-between gap-3">
 <div className="space-y-1 min-w-0">
 <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
 {item.title}
 </span>
 <div className="text-[32px] font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
 {item.value}
 </div>
 </div>
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
 <IconComponent className="h-5 w-5 stroke-[2.2]" />
 </div>
 </div>

 {/* Thanh đo tiến độ tỷ lệ động nhỏ mảnh, tinh tế (Micro Progress Track) */}
 <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
 <div
 className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
 style={{ width: `${Math.min(Math.max(item.progressPercent, 5), 100)}%` }}
 />
 </div>

 <div className="mt-2.5">
 <span
 title={item.subtext}
 className="text-[13px] font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
 >
 {item.subtext}
 </span>
 </div>
 </div>
 );
 })}
 </div>

 {/* Status Tabs */}
 <TabBar
 tabs={[
 { key: 'ALL', label: 'Tất cả theo phòng', count: assignedSupervisors.length },
 { key: 'CHANGE_REQUESTED', label: 'Xin đổi ca', count: changeRequestedCount },
 { key: 'CONFIRMED', label: 'Đã xác nhận', count: confirmedCount },
 { key: 'PENDING', label: 'Chờ phản hồi', count: allScheduleSupervisors.filter((s) => s.status === 'PENDING').length },
 { key: 'COMPLETED', label: 'Hoàn thành', count: completedCount },
 { key: 'ABSENT', label: 'Vắng mặt', count: allScheduleSupervisors.filter((s) => s.status === 'ABSENT').length },
 ]}
 active={statusFilter}
 onChange={setStatusFilter}
 />

 {/* Main Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
 {/* Left: Select Schedule & Room */}
 <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
 <h3 className="text-sm font-semibold tracking-wider text-slate-700 flex items-center gap-2">
 <Calendar className="h-4 w-4 text-blue-600" /> Chọn Ca thi & Phòng thi
 </h3>

 <div>
 <label className="block text-[15px] font-medium text-slate-500 mb-1.5">Ca thi Môn học</label>

 {/* Custom grouped picker trigger */}
 <button
 type="button"
 onClick={() => setShowSchedulePicker(true)}
 className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[15px] font-medium text-left hover:bg-white hover:border-blue-300 transition cursor-pointer"
 >
 <span className={selectedSchedule ? 'text-slate-800' : 'text-slate-400'}>
 {selectedSchedule
 ? `[${(selectedSchedule as any).subject?.subjectCode || 'MH'}] ${(selectedSchedule as any).subject?.subjectName} (· ${(selectedSchedule as any).startTime} – ${(selectedSchedule as any).endTime})`
 : '-- Chọn ca thi --'}
 </span>
 <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
 </button>

 {/* Modal popup */}
 {showSchedulePicker && (
 <>
 <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={() => setShowSchedulePicker(false)} />
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
 <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">

 {/* Header */}
 <div className="flex items-center justify-between px-6 py-4 bg-primary-600 text-white">
 <div>
 <p className="text-lg font-semibold text-white tracking-tight">Chọn Ca thi</p>
 <p className="text-xs font-semibold text-blue-100 mt-0.5">
 {schedules.filter((s: any) => !s.examSupervisors?.length && !s.supervisorCount).length} ca chưa phân công
 · {schedules.filter((s: any) => s.examSupervisors?.length || s.supervisorCount).length} ca đã có giám thị
 </p>
 </div>
 <button type="button" onClick={() => setShowSchedulePicker(false)}
 className="flex h-8 w-8 items-center justify-center rounded-xl text-blue-100 hover:text-white hover:bg-blue-700/80 transition cursor-pointer">
 <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
 </button>
 </div>

 {/* Body: 2 columns */}
 <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-700" style={{ maxHeight: '60vh', overflowY: 'auto' }}>

 {/* LEFT: Chưa phân công */}
 {(() => {
 const unassigned = schedules.filter((s: any) => !s.examSupervisors?.length && !s.supervisorCount);
 const activeUnassigned = unassigned.filter((s: any) => {
 if (!s.examDate || !s.endTime) return true;
 const d = new Date(s.examDate);
 const [h, m] = (s.endTime || '23:59').split(':').map(Number);
 d.setHours(h, m, 0, 0);
 return d >= new Date();
 });
 const expiredUnassigned = unassigned.filter((s: any) => !activeUnassigned.includes(s));

 return (
 <div>
 <div className="sticky top-0 bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-100 dark:border-slate-700 z-10 flex items-center justify-between">
 <span className="text-[12px] font-semibold text-slate-700 tracking-wider">
 Chưa phân công ({unassigned.length})
 </span>
 {expiredUnassigned.length > 0 && (
 <span className="text-[12px] font-semibold text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded">
 {expiredUnassigned.length} quá hạn
 </span>
 )}
 </div>

 {unassigned.length === 0 ? (
 <p className="px-4 py-6 text-xs text-slate-400 text-center font-semibold">Tất cả đã phân công</p>
 ) : (
 <>
 {/* Ca thi sắp & đang diễn ra */}
 {activeUnassigned.map((s: any) => {
 const isActive = selectedSchedule?.id === s.id;
 return (
 <button key={s.id} type="button"
 onClick={() => { void selectSchedule(s.id); setShowSchedulePicker(false); }}
 className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer ${isActive ? 'bg-blue-50 dark:bg-blue-950/50 border-l-[3px] border-l-blue-500' : ''}`}
 >
 <p className={`text-xs font-semibold truncate ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-100'}`}>
 {s.mode === 'MOCK' ? '[THI THỬ] ' : '[CHÍNH THỨC] '}
 {s.subject?.subjectName || s.subjectName}
 </p>
 <p className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 flex items-center gap-1.5">
 <span>{s.startTime} – {s.endTime}</span>
 {s.examDate && <span>· {new Date(s.examDate).toLocaleDateString('vi-VN')}</span>}
 </p>
 </button>
 );
 })}

 {/* Ca thi đã kết thúc / quá hạn - Gom nhóm riêng */}
 {expiredUnassigned.length > 0 && (
 <div className="bg-slate-50/80 dark:bg-slate-800/60 border-t-2 border-slate-200/80 dark:border-slate-700/80 mt-1">
 <div className="px-4 py-1.5 text-[12px] font-semibold text-slate-400 dark:text-slate-300 tracking-wider bg-slate-100 dark:bg-slate-700 flex items-center gap-1">
 <span>📁 Ca thi đã kết thúc / Quá hạn ({expiredUnassigned.length})</span>
 </div>
 {expiredUnassigned.map((s: any) => {
 const isActive = selectedSchedule?.id === s.id;
 return (
 <button key={s.id} type="button"
 onClick={() => { void selectSchedule(s.id); setShowSchedulePicker(false); }}
 className={`w-full text-left px-4 py-2.5 border-b border-slate-100 hover:bg-slate-100 transition cursor-pointer ${isActive ? 'bg-slate-200 border-l-[3px] border-l-slate-600' : ''}`}
 >
 <div className="flex items-center justify-between gap-1">
 <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 truncate">
 {s.subject?.subjectName || s.subjectName}
 </p>
 <span className="text-[12px] font-semibold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded shrink-0">Đã kết thúc</span>
 </div>
 <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
 {s.startTime} – {s.endTime} {s.examDate ? `· ${new Date(s.examDate).toLocaleDateString('vi-VN')}` : ''}
 </p>
 </button>
 );
 })}
 </div>
 )}
 </>
 )}
 </div>
 );
 })()}

 {/* RIGHT: Đã có giám thị */}
 {(() => {
 const assigned = schedules.filter((s: any) => s.examSupervisors?.length || s.supervisorCount);
 const activeAssigned = assigned.filter((s: any) => {
 if (!s.examDate || !s.endTime) return true;
 const d = new Date(s.examDate);
 const [h, m] = (s.endTime || '23:59').split(':').map(Number);
 d.setHours(h, m, 0, 0);
 return d >= new Date();
 });
 const expiredAssigned = assigned.filter((s: any) => !activeAssigned.includes(s));

 return (
 <div>
 <div className="sticky top-0 bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-100 dark:border-slate-700 z-10 flex items-center justify-between">
 <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 tracking-wider">
 Đã phân công ({assigned.length})
 </span>
 {expiredAssigned.length > 0 && (
 <span className="text-[12px] font-semibold text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded">
 {expiredAssigned.length} quá hạn
 </span>
 )}
 </div>

 {assigned.length === 0 ? (
 <p className="px-4 py-6 text-xs text-slate-400 text-center font-semibold">Chưa có</p>
 ) : (
 <>
 {/* Đã phân công & đang/sắp diễn ra */}
 {activeAssigned.map((s: any) => {
 const isActive = selectedSchedule?.id === s.id;
 const count = s.examSupervisors?.length || s.supervisorCount || 0;
 return (
 <button key={s.id} type="button"
 onClick={() => { void selectSchedule(s.id); setShowSchedulePicker(false); }}
 className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer ${isActive ? 'bg-blue-50 dark:bg-blue-950/50 border-l-[3px] border-l-blue-500' : ''}`}
 >
 <div className="flex items-center gap-2">
 <p className={`text-xs font-semibold truncate flex-1 ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
 {s.subject?.subjectName || s.subjectName}
 </p>
 <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[12px] font-semibold px-1.5 py-0.5">
 {count} GT
 </span>
 </div>
 <p className="text-[12px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
 {s.startTime} – {s.endTime} {s.examDate ? `· ${new Date(s.examDate).toLocaleDateString('vi-VN')}` : ''}
 </p>
 </button>
 );
 })}

 {/* Đã phân công & đã kết thúc / quá hạn - Gom nhóm riêng */}
 {expiredAssigned.length > 0 && (
 <div className="bg-slate-50/80 dark:bg-slate-800/60 border-t-2 border-slate-200/80 dark:border-slate-700/80 mt-1">
 <div className="px-4 py-1.5 text-[12px] font-semibold text-slate-400 dark:text-slate-300 tracking-wider bg-slate-100 dark:bg-slate-700 flex items-center gap-1">
 <span>📁 Ca thi đã xong / Quá hạn ({expiredAssigned.length})</span>
 </div>
 {expiredAssigned.map((s: any) => {
 const isActive = selectedSchedule?.id === s.id;
 const count = s.examSupervisors?.length || s.supervisorCount || 0;
 return (
 <button key={s.id} type="button"
 onClick={() => { void selectSchedule(s.id); setShowSchedulePicker(false); }}
 className={`w-full text-left px-4 py-2.5 border-b border-slate-100 hover:bg-slate-100 transition cursor-pointer ${isActive ? 'bg-slate-200 border-l-[3px] border-l-slate-600' : ''}`}
 >
 <div className="flex items-center justify-between gap-1">
 <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 truncate flex-1">
 {s.subject?.subjectName || s.subjectName}
 </p>
 <span className="text-[12px] font-semibold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded shrink-0">
 {count} GT · Đã xong
 </span>
 </div>
 <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
 {s.startTime} – {s.endTime} {s.examDate ? `· ${new Date(s.examDate).toLocaleDateString('vi-VN')}` : ''}
 </p>
 </button>
 );
 })}
 </div>
 )}
 </>
 )}
 </div>
 );
 })()}
 </div>

 {/* Footer */}
 <div className="flex items-center justify-end px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60">
 <Button type="button" variant="secondary" size="md" onClick={() => setShowSchedulePicker(false)}>
 Đóng
 </Button>
 </div>
 </div>
 </div>
 </>
 )}
 </div>

 {selectedSchedule && (
 <div className={`rounded-xl border p-3.5 text-xs space-y-1.5 ${
 selectedSchedule.mode === 'MOCK'
 ? 'bg-blue-50/90 border-blue-200 text-blue-950'
 : 'bg-slate-50 border-slate-200 text-slate-800'
 }`}>
 {selectedSchedule.mode === 'MOCK' && (
 <span className="inline-block mb-1 font-semibold text-[12px] bg-blue-100 border border-blue-300 text-blue-900 px-2.5 py-0.5 rounded-full">
 Ca Thi Thử (Tự Do) - Không bắt buộc phân công Giám thị
 </span>
 )}
 <p className="font-semibold text-slate-700">
 Môn: <strong className="font-semibold text-slate-900">{selectedSchedule.subject?.subjectName}</strong>
 </p>
 <p className="font-medium text-slate-600">
 Mã môn: <IdentifierBadge>{selectedSchedule.subject?.subjectCode}</IdentifierBadge>
 </p>
 <p className="font-medium text-slate-600">
 Ngày thi: <span className="font-semibold text-slate-900">{selectedSchedule.examDate ? new Date(selectedSchedule.examDate).toLocaleDateString('vi-VN') : '---'}</span>
 </p>
 <p className="font-medium text-slate-600">
 Giờ thi: <span className="font-semibold text-slate-900">{selectedSchedule.startTime} - {selectedSchedule.endTime}</span>
 </p>
 </div>
 )}

 <div>
 <label className="block text-[15px] font-medium text-slate-500 mb-1">Phòng thi được phân công</label>
 <FilterSelect containerClassName="w-full"
    value={selectedScheduleRoomId}
    onChange={(e) => {
      setSelectedScheduleRoomId(e.target.value);
      void fetchSupervisors(e.target.value, selectedSchedule?.id);
    }}
    
  >
    {selectedSchedule?.examScheduleRooms?.map((sr: any) => {
      const roomObj = sr.room || sr.examRoom;
      const name = roomObj?.roomName || roomObj?.name || roomObj?.roomCode || roomObj?.code || '---';
      const capacity = roomObj?.capacity ?? '---';
      return (
        <option key={sr.id} value={sr.id}>
          Phòng: {name} (Sức chứa: {capacity} chỗ)
        </option>
      );
    })}
  </FilterSelect>
 </div>
 </div>

 {/* Right: Assignment Form & Table */}
 <div className="lg:col-span-2 space-y-5">
 {/* Assignment Form - Admin only */}
 {currentUser?.role === 'ADMIN' && (
 <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
 <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
 <h3 className="text-[14px] leading-5 font-semibold tracking-wider text-slate-800">
 THÊM PHÂN CÔNG GIÁM THỊ
 </h3>
 <Button
 type="button"
 variant="primary"
 size="md"
 onClick={() => void previewAutoAssign()}
 disabled={autoLoading || !selectedSchedule?.id}
 isLoading={autoLoading}
 >
 Đề xuất tự động
 </Button>
 </div>

 {autoProposal && (
 <div className="mb-4 space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
 <p className="text-xs font-semibold text-slate-500">
 Đề xuất tự động · <span className="text-emerald-600 font-semibold">{autoProposal.score}/100 điểm</span>
 </p>
 <div className="flex flex-wrap gap-x-5 gap-y-1">
 {autoProposal.proposals.map((p: any) => {
 const key = `${p.examScheduleRoomId}-${p.role}`;
 return (
 <label key={key} className="flex items-center gap-1.5 cursor-pointer text-[15px] font-medium text-slate-700">
 <input
 type="checkbox"
 checked={selectedAutoProposalKeys.includes(key)}
 onChange={(ev) =>
 setSelectedAutoProposalKeys((cur) =>
 ev.target.checked ? [...cur, key] : cur.filter((k) => k !== key)
 )
 }
 className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 cursor-pointer"
 />
 <IdentifierBadge tone="neutral">{p.roomCode}</IdentifierBadge> · {p.teacherName} · {p.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2'}
 </label>
 );
 })}
 </div>
 {autoProposal.unassigned?.length > 0 && (
 <p className="text-xs text-amber-600 font-medium">Chưa xếp {autoProposal.unassigned.length} vị trí.</p>
 )}
 <Button
 type="button"
 variant="success"
 size="md"
 onClick={() => void acceptAutoAssign()}
 disabled={autoLoading || !selectedAutoProposalKeys.length}
 isLoading={autoLoading}
 >
 Xác nhận lưu phương án đã chọn
 </Button>
 </div>
 )}


 <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">


 <div className="md:col-span-5">
 <label className="block text-[15px] font-medium text-slate-600 mb-1.5">Giảng viên coi thi</label>
 <FilterSelect containerClassName="w-full"
    value={selectedTeacherId}
    onChange={(e) => setSelectedTeacherId(e.target.value)}
    
  >
    {teachers.map((t: Teacher) => (
      <option key={t.id} value={t.id}>
        {t.fullName}{t.teacherCode ? ` (${t.teacherCode})` : ''}
      </option>
    ))}
  </FilterSelect>
 </div>
 <div className="md:col-span-4">
 <label className="block text-[15px] font-medium text-slate-600 mb-1.5">Vai trò Coi thi</label>
 <FilterSelect containerClassName="w-full"
    value={role}
    onChange={(e) => setRole(e.target.value)}
    
  >
    <option value="SUPERVISOR_1">Giám thị 1 (Cán bộ coi thi chính)</option>
    <option value="SUPERVISOR_2">Giám thị 2 (Cán bộ coi thi phụ)</option>
  </FilterSelect>
 </div>

 <div className="md:col-span-3">
 <Button
 type="submit"
 variant="primary"
 size="md"
 className="w-full h-[42px]"
 >
 Phân công Giám thị
 </Button>
 </div>
 </form>
 </div>
 )}

 {/* Supervisors Table */}
 <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
 <div className="p-4 bg-slate-50/80 border-b border-slate-200 font-semibold text-xs tracking-wider text-slate-700 flex justify-between items-center">
 <span>
 {statusFilter === 'ALL'
 ? 'Danh sách Giám thị đã phân công cho phòng thi này'
 : `Danh sách cán bộ: ${{ CHANGE_REQUESTED: 'Xin đổi ca', CONFIRMED: 'Đã xác nhận', PENDING: 'Chờ phản hồi', COMPLETED: 'Hoàn thành', ABSENT: 'Vắng mặt', REJECTED: 'Đã từ chối' }[statusFilter] || statusFilter}`}
 </span>
 <span className="text-[12px] text-slate-500 font-normal">Hiển thị {displayedSupervisors.length} bản ghi</span>
 </div>

 {displayedSupervisors.length === 0 ? (
 <div className="p-12 text-center text-slate-500 text-sm font-semibold">
 Chưa có giám thị nào phù hợp với bộ lọc hiện tại.
 </div>
 ) : (
  <div className="ui-table-wrap overflow-x-auto">
  <table className="ui-table w-full text-left text-[15px] text-slate-700 border-collapse">
 <thead className="bg-slate-50 text-[14px] font-medium tracking-wider text-slate-600 border-b border-slate-200">
 <tr>
 <th className="p-3.5 pl-4 whitespace-nowrap">Mã GV</th>
 <th className="p-3.5 min-w-[160px]">Họ và tên Giám thị</th>
 <th className="p-3.5 whitespace-nowrap">Phòng thi</th>
 <th className="p-3.5 whitespace-nowrap">Vai trò</th>
 <th className="p-3.5 min-w-[130px]">Trạng thái ca thi</th>
 <th className="p-3.5 pr-4 text-right whitespace-nowrap">Phê duyệt / Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 font-normal">
 {displayedSupervisors.map((sup) => {
 const roomObj = sup.examScheduleRoom?.room || sup.examScheduleRoom?.examRoom;
 const rName = roomObj?.roomName || roomObj?.roomCode || '---';
 return (
 <tr key={sup.id} className="hover:bg-blue-50/40 transition">
 <td className="p-3.5 pl-4 whitespace-nowrap">
 <IdentifierBadge>{sup.teacher?.teacherCode}</IdentifierBadge>
 </td>
 <td className="p-3.5 min-w-[160px]">
 <div className="font-medium text-slate-900 text-[15px] leading-[22px]">{sup.teacher?.fullName}</div>
 <div className="text-[15px] leading-[22px] text-slate-500 font-normal">{sup.teacher?.degree || 'TS'}</div>
 </td>
 <td className="p-3.5 font-medium text-slate-900 whitespace-nowrap text-[15px]">{rName}</td>
 <td className="p-3.5 whitespace-nowrap text-[15px] font-medium text-slate-800">
 {sup.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2'}
 </td>
 <td className="p-3.5 min-w-[130px]">
 <div className="space-y-1">
 {renderStatusBadge(sup.status)}
 {sup.note && (
 <div className="text-[15px] leading-[22px] text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200 max-w-xs">
 <strong>Lý do:</strong> {sup.note}
 </div>
 )}
 </div>
 </td>
 <td className="p-3.5 pr-4 text-right whitespace-nowrap">
 <div className="flex items-center justify-end gap-1.5">
 {sup.status === 'CHANGE_REQUESTED' && currentUser?.role === 'ADMIN' && (
 <>
 <Button
 type="button"
 variant="success"
 size="sm"
 onClick={() => void handleUpdateStatus(sup.id, 'CHANGE_APPROVED', 'chấp nhận cho đổi ca')}
 >
 Duyệt đổi ca
 </Button>
 <Button
 type="button"
 variant="secondary"
 size="sm"
 onClick={() => void handleUpdateStatus(sup.id, 'REJECTED', 'từ chối yêu cầu đổi ca')}
 >
 Từ chối
 </Button>
 </>
 )}
 {sup.status === 'CONFIRMED' && currentUser?.role === 'ADMIN' && (
 <>
 <button
 type="button"
 title="Hoàn thành"
 onClick={() => void handleUpdateStatus(sup.id, 'COMPLETED', 'đánh dấu Hoàn thành ca thi')}
 className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white transition active:scale-95 cursor-pointer"
 >
 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
 </button>
 <button
 type="button"
 title="Vắng mặt"
 onClick={() => void handleUpdateStatus(sup.id, 'ABSENT', 'báo Vắng mặt')}
 className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white transition active:scale-95 cursor-pointer"
 >
 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
 </button>
 </>
 )}
 <button
 type="button"
 onClick={() => setDrawerSupervisor(sup)}
 className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
 title="Xem thông tin chi tiết"
 >
 <Eye className="h-4 w-4" />
 </button>
 {currentUser?.role === 'ADMIN' && (
 <button
 type="button"
 onClick={() => handleDelete(sup.id)}
 className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
 title="Hủy phân công"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 )}
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 </div>
 </main>

 {/* Supervisor Drawer */}
 <ProfileDrawer
 isOpen={Boolean(drawerSupervisor)}
 onClose={() => setDrawerSupervisor(null)}
 title={drawerSupervisor?.teacher?.fullName || ''}
 subtitle={`Mã cán bộ coi thi: ${drawerSupervisor?.teacher?.teacherCode}`}
 avatarText={drawerSupervisor?.teacher?.fullName ? drawerSupervisor.teacher.fullName.slice(-1) : 'GT'}
 badge={{ label: drawerSupervisor?.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2', className: 'bg-blue-50 text-blue-700 border-blue-200' }}
 details={[
 { label: 'Họ và tên cán bộ', value: drawerSupervisor?.teacher?.fullName },
 { label: 'Mã số cán bộ', value: drawerSupervisor?.teacher?.teacherCode },
 { label: 'Học vị / Học hàm', value: drawerSupervisor?.teacher?.degree || 'TS', icon: GraduationCap },
 { label: 'Nhiệm vụ phân công', value: drawerSupervisor?.role === 'SUPERVISOR_1' ? 'Cán bộ coi thi chính (Giám thị 1)' : 'Cán bộ coi thi phụ (Giám thị 2)', icon: ShieldCheck },
 {
 label: 'Trạng thái ca thi',
 value: ({ CONFIRMED: 'Đã xác nhận', CHANGE_REQUESTED: 'Xin đổi ca', COMPLETED: 'Hoàn thành', ABSENT: 'Vắng mặt', PENDING: 'Chờ phản hồi', REJECTED: 'Đã từ chối' } as Record<string, string>)[drawerSupervisor?.status || ''] || 'Chờ phản hồi',
 },
 { label: 'Ghi chú / Lý do', value: drawerSupervisor?.note || 'Không có ghi chú' },
 {
 label: 'Phòng coi thi',
 value: (() => {
 const cur = [...assignedSupervisors, ...allScheduleSupervisors].find((item) => item.id === drawerSupervisor?.id);
 const roomObj = cur?.examScheduleRoom?.room || cur?.examScheduleRoom?.examRoom;
 return roomObj?.roomName || roomObj?.roomCode || 'Chưa xác định';
 })(),
 icon: DoorOpen,
 },
 ]}
 />

 {/* Confirm Modal */}
 <ConfirmModal
 isOpen={confirmModal.isOpen}
 onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
 onConfirm={confirmModal.onConfirm}
 title={confirmModal.title}
 message={confirmModal.message}
 type={confirmModal.type}
 />

 {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
 </>
 );
}
