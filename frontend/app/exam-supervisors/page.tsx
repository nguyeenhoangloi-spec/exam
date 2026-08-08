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
} from 'lucide-react';
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
          setToast({ message: err.message, type: 'error' });
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
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Quản lý & Phân công Giám thị
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              Theo dõi trạng thái xác nhận, phê duyệt yêu cầu đổi ca và đánh dấu điểm danh gác thi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={exportCsv}
              className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Xuất CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrintReport}
              className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 cursor-pointer"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              <span>In Báo cáo</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'Lượt phân công',
              value: totalAssignments,
              subtext: `Lịch thi: ${(selectedSchedule?.examScheduleRooms || []).length} phòng`,
              icon: ShieldCheck,
              iconBg: 'bg-slate-100 text-slate-500 border-slate-200',
            },
            {
              title: 'Yêu cầu đổi ca',
              value: changeRequestedCount,
              subtext: changeRequestedCount > 0 ? 'Cần quản trị viên phê duyệt' : 'Không có yêu cầu mới',
              icon: RefreshCw,
              iconBg: 'bg-slate-100 text-slate-500 border-slate-200',
            },
            {
              title: 'Đã xác nhận ca',
              value: `${confirmedCount}/${totalAssignments}`,
              subtext: 'Sẵn sàng gác thi',
              icon: CheckCircle2,
              iconBg: 'bg-slate-100 text-slate-500 border-slate-200',
            },
            {
              title: 'Hoàn thành gác thi',
              value: `${completedCount}/${totalAssignments}`,
              subtext: 'Theo báo cáo phòng thi',
              icon: UserCheck,
              iconBg: 'bg-slate-100 text-slate-500 border-slate-200',
            },
          ].map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.title}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{item.title}</span>
                    <p className="text-2xl font-black text-slate-900 leading-tight">{item.value}</p>
                  </div>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.iconBg} transition-transform group-hover:scale-110`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                </div>
                <span className="text-[10.5px] font-semibold text-slate-400 mt-2">{item.subtext}</span>
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
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" /> Chọn Ca thi & Phòng thi
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Ca thi Môn học</label>

              {/* Custom grouped picker trigger */}
              <button
                type="button"
                onClick={() => setShowSchedulePicker(true)}
                className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-left hover:bg-white hover:border-blue-300 transition cursor-pointer"
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
                    <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">

                      {/* Header */}
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                        <div>
                          <p className="text-sm font-black text-slate-900">Chọn Ca thi</p>
                          <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
                            {schedules.filter((s: any) => !s.examSupervisors?.length && !s.supervisorCount).length} ca chưa phân công
                            · {schedules.filter((s: any) => s.examSupervisors?.length || s.supervisorCount).length} ca đã có giám thị
                          </p>
                        </div>
                        <button type="button" onClick={() => setShowSchedulePicker(false)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>

                      {/* Body: 2 columns */}
                      <div className="grid grid-cols-2 divide-x divide-slate-100" style={{ maxHeight: '60vh', overflowY: 'auto' }}>

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
                              <div className="sticky top-0 bg-slate-50 px-4 py-2 border-b border-slate-100 z-10 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                                  Chưa phân công ({unassigned.length})
                                </span>
                                {expiredUnassigned.length > 0 && (
                                  <span className="text-[9.5px] font-bold text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded">
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
                                        className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-blue-50 transition cursor-pointer ${isActive ? 'bg-blue-50 border-l-[3px] border-l-blue-500' : ''}`}
                                      >
                                        <p className={`text-xs font-black truncate ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>
                                          {s.mode === 'MOCK' ? '[THI THỬ] ' : '[CHÍNH THỨC] '}
                                          {s.subject?.subjectName || s.subjectName}
                                        </p>
                                        <p className="text-[10.5px] text-slate-500 font-semibold mt-0.5 flex items-center gap-1.5">
                                          <span>{s.startTime} – {s.endTime}</span>
                                          {s.examDate && <span>· {new Date(s.examDate).toLocaleDateString('vi-VN')}</span>}
                                        </p>
                                      </button>
                                    );
                                  })}

                                  {/* Ca thi đã kết thúc / quá hạn - Gom nhóm riêng */}
                                  {expiredUnassigned.length > 0 && (
                                    <div className="bg-slate-50/80 border-t-2 border-slate-200/80 mt-1">
                                      <div className="px-4 py-1.5 text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-100 flex items-center gap-1">
                                        <span>📁 Ca thi đã kết thúc / Quá hạn ({expiredUnassigned.length})</span>
                                      </div>
                                      {expiredUnassigned.map((s: any) => {
                                        const isActive = selectedSchedule?.id === s.id;
                                        return (
                                          <button key={s.id} type="button"
                                            onClick={() => { void selectSchedule(s.id); setShowSchedulePicker(false); }}
                                            className={`w-full text-left px-4 py-2.5 border-b border-slate-100 opacity-60 hover:opacity-100 hover:bg-slate-100 transition cursor-pointer ${isActive ? 'bg-slate-200 border-l-[3px] border-l-slate-600 opacity-100' : ''}`}
                                          >
                                            <div className="flex items-center justify-between gap-1">
                                              <p className="text-[11px] font-bold text-slate-600 truncate">
                                                {s.subject?.subjectName || s.subjectName}
                                              </p>
                                              <span className="text-[9px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded shrink-0">Đã kết thúc</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
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
                              <div className="sticky top-0 bg-slate-50 px-4 py-2 border-b border-slate-100 z-10 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                                  Đã phân công ({assigned.length})
                                </span>
                                {expiredAssigned.length > 0 && (
                                  <span className="text-[9.5px] font-bold text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded">
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
                                        className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-blue-50 transition cursor-pointer ${isActive ? 'bg-blue-50 border-l-[3px] border-l-blue-500' : ''}`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <p className={`text-xs font-black truncate flex-1 ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                                            {s.subject?.subjectName || s.subjectName}
                                          </p>
                                          <span className="shrink-0 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black px-1.5 py-0.5">
                                            {count} GT
                                          </span>
                                        </div>
                                        <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
                                          {s.startTime} – {s.endTime} {s.examDate ? `· ${new Date(s.examDate).toLocaleDateString('vi-VN')}` : ''}
                                        </p>
                                      </button>
                                    );
                                  })}

                                  {/* Đã phân công & đã kết thúc / quá hạn - Gom nhóm riêng */}
                                  {expiredAssigned.length > 0 && (
                                    <div className="bg-slate-50/80 border-t-2 border-slate-200/80 mt-1">
                                      <div className="px-4 py-1.5 text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-100 flex items-center gap-1">
                                        <span>📁 Ca thi đã xong / Quá hạn ({expiredAssigned.length})</span>
                                      </div>
                                      {expiredAssigned.map((s: any) => {
                                        const isActive = selectedSchedule?.id === s.id;
                                        const count = s.examSupervisors?.length || s.supervisorCount || 0;
                                        return (
                                          <button key={s.id} type="button"
                                            onClick={() => { void selectSchedule(s.id); setShowSchedulePicker(false); }}
                                            className={`w-full text-left px-4 py-2.5 border-b border-slate-100 opacity-60 hover:opacity-100 hover:bg-slate-100 transition cursor-pointer ${isActive ? 'bg-slate-200 border-l-[3px] border-l-slate-600 opacity-100' : ''}`}
                                          >
                                            <div className="flex items-center justify-between gap-1">
                                              <p className="text-[11px] font-bold text-slate-600 truncate flex-1">
                                                {s.subject?.subjectName || s.subjectName}
                                              </p>
                                              <span className="text-[9px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded shrink-0">
                                                {count} GT · Đã xong
                                              </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
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
                      <div className="flex items-center justify-end px-5 py-3 border-t border-slate-100 bg-slate-50/60">
                        <button type="button" onClick={() => setShowSchedulePicker(false)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer">
                          Đóng
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {selectedSchedule && (
              <div className={`rounded-xl border p-3.5 text-xs space-y-1.5 ${
                selectedSchedule.mode === 'MOCK'
                  ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                {selectedSchedule.mode === 'MOCK' && (
                  <span className="inline-block mb-1 font-extrabold text-[11px] bg-amber-100 border border-amber-300 text-amber-900 px-2.5 py-0.5 rounded-full">
                    Ca Thi Thử (Tự Do) - Không bắt buộc phân công Giám thị
                  </span>
                )}
                <p className="font-bold text-slate-700">
                  Môn: <strong className="font-black text-slate-900">{selectedSchedule.subject?.subjectName}</strong>
                </p>
                <p className="font-medium text-slate-600">
                  Mã môn: <span className="font-mono font-black text-slate-900">{selectedSchedule.subject?.subjectCode}</span>
                </p>
                <p className="font-medium text-slate-600">
                  Ngày thi: <span className="font-bold text-slate-900">{selectedSchedule.examDate ? new Date(selectedSchedule.examDate).toLocaleDateString('vi-VN') : '---'}</span>
                </p>
                <p className="font-medium text-slate-600">
                  Giờ thi: <span className="font-bold text-slate-900">{selectedSchedule.startTime} - {selectedSchedule.endTime}</span>
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Phòng thi được phân công</label>
              <select
                value={selectedScheduleRoomId}
                onChange={(e) => {
                  setSelectedScheduleRoomId(e.target.value);
                  void fetchSupervisors(e.target.value, selectedSchedule?.id);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
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
              </select>
            </div>
          </div>

          {/* Right: Assignment Form & Table */}
          <div className="lg:col-span-2 space-y-5">
            {/* Assignment Form - Admin only */}
            {currentUser?.role === 'ADMIN' && (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    THÊM PHÂN CÔNG GIÁM THỊ
                  </h3>
                  <button
                    type="button"
                    onClick={() => void previewAutoAssign()}
                    disabled={autoLoading || !selectedSchedule?.id}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {autoLoading ? 'Đang tạo phương án...' : 'Đề xuất tự động'}
                  </button>
                </div>

                {autoProposal && (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <p className="font-bold">Phương án xem trước · điểm {autoProposal.score}/100</p>
                    <div className="mt-2 space-y-1">
                      {autoProposal.proposals.map((p: any) => {
                        const key = `${p.examScheduleRoomId}-${p.role}`;
                        return (
                          <label key={key} className="flex items-center gap-2 cursor-pointer">
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
                            {p.roomCode} · {p.teacherName} · {p.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2'}
                          </label>
                        );
                      })}
                    </div>
                    {autoProposal.unassigned?.length > 0 && (
                      <p className="mt-2 text-rose-700">Chưa xếp {autoProposal.unassigned.length} vị trí.</p>
                    )}
                    <button
                      type="button"
                      onClick={() => void acceptAutoAssign()}
                      disabled={autoLoading || !selectedAutoProposalKeys.length}
                      className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
                    >
                      Xác nhận lưu phương án đã chọn
                    </button>
                  </div>
                )}

                <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-5">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Giảng viên coi thi</label>
                    <select
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      className="w-full h-[42px] rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-800 focus:border-blue-600 focus:outline-none transition cursor-pointer shadow-2xs"
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({t.degree || 'TS'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Vai trò Coi thi</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full h-[42px] rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-800 focus:border-blue-600 focus:outline-none transition cursor-pointer shadow-2xs"
                    >
                      <option value="SUPERVISOR_1">Giám thị 1 (Cán bộ coi thi chính)</option>
                      <option value="SUPERVISOR_2">Giám thị 2 (Cán bộ coi thi phụ)</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <button
                      type="submit"
                      className="w-full h-[42px] flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer"
                    >
                      Phân công Giám thị
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Supervisors Table */}
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 font-extrabold text-xs uppercase tracking-wider text-slate-700 flex justify-between items-center">
                <span>
                  {statusFilter === 'ALL'
                    ? 'Danh sách Giám thị đã phân công cho phòng thi này'
                    : `Danh sách cán bộ: ${{ CHANGE_REQUESTED: 'Xin đổi ca', CONFIRMED: 'Đã xác nhận', PENDING: 'Chờ phản hồi', COMPLETED: 'Hoàn thành', ABSENT: 'Vắng mặt', REJECTED: 'Đã từ chối' }[statusFilter] || statusFilter}`}
                </span>
                <span className="text-[11px] text-slate-500 font-normal">Hiển thị {displayedSupervisors.length} bản ghi</span>
              </div>

              {displayedSupervisors.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm font-bold">
                  Chưa có giám thị nào phù hợp với bộ lọc hiện tại.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead className="bg-slate-50/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                      <tr>
                        <th className="p-3.5 pl-4 whitespace-nowrap">Mã GV</th>
                        <th className="p-3.5 min-w-[160px]">Họ và tên Giám thị</th>
                        <th className="p-3.5 whitespace-nowrap">Phòng thi</th>
                        <th className="p-3.5 whitespace-nowrap">Vai trò</th>
                        <th className="p-3.5 min-w-[130px]">Trạng thái ca thi</th>
                        <th className="p-3.5 pr-4 text-right whitespace-nowrap">Phê duyệt / Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {displayedSupervisors.map((sup) => {
                        const roomObj = sup.examScheduleRoom?.room || sup.examScheduleRoom?.examRoom;
                        const rName = roomObj?.roomName || roomObj?.roomCode || '---';
                        return (
                          <tr key={sup.id} className="hover:bg-blue-50/40 transition">
                            <td className="p-3.5 pl-4 font-mono font-black text-slate-900 whitespace-nowrap">
                              {sup.teacher?.teacherCode}
                            </td>
                            <td className="p-3.5 min-w-[160px]">
                              <div className="font-extrabold text-slate-900 text-xs">{sup.teacher?.fullName}</div>
                              <div className="text-[11px] text-slate-500 font-normal">{sup.teacher?.degree || 'TS'}</div>
                            </td>
                            <td className="p-3.5 font-extrabold text-slate-900 whitespace-nowrap text-xs">{rName}</td>
                            <td className="p-3.5 whitespace-nowrap text-xs font-extrabold text-slate-800">
                              {sup.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2'}
                            </td>
                            <td className="p-3.5 min-w-[130px]">
                              <div className="space-y-1">
                                {renderStatusBadge(sup.status)}
                                {sup.note && (
                                  <div className="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200 max-w-xs">
                                    <strong>Lý do:</strong> {sup.note}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {sup.status === 'CHANGE_REQUESTED' && currentUser?.role === 'ADMIN' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => void handleUpdateStatus(sup.id, 'CHANGE_APPROVED', 'chấp nhận cho đổi ca')}
                                      className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition cursor-pointer"
                                    >
                                      Duyệt đổi ca
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleUpdateStatus(sup.id, 'REJECTED', 'từ chối yêu cầu đổi ca')}
                                      className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition cursor-pointer"
                                    >
                                      Từ chối
                                    </button>
                                  </>
                                )}
                                {sup.status === 'CONFIRMED' && currentUser?.role === 'ADMIN' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => void handleUpdateStatus(sup.id, 'COMPLETED', 'đánh dấu Hoàn thành ca thi')}
                                      className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition cursor-pointer"
                                    >
                                      Hoàn thành
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleUpdateStatus(sup.id, 'ABSENT', 'báo Vắng mặt')}
                                      className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer"
                                    >
                                      Vắng mặt
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
