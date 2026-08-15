'use client';

import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
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
import { Button } from '../../components/ui/Button';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { IdentifierBadge } from '../../components/ui/IdentifierBadge';
import { ExamSupervisorFilterPopover } from '../../components/exam-supervisors/ExamSupervisorFilterPopover';
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
  Search,
  X,
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
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [degreeFilter, setDegreeFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
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

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const totalAssignments = allScheduleSupervisors.length;
  const changeRequestedCount = allScheduleSupervisors.filter((s) => s.status === 'CHANGE_REQUESTED').length;
  const confirmedCount = allScheduleSupervisors.filter((s) => s.status === 'CONFIRMED').length;
  const completedCount = allScheduleSupervisors.filter((s) => s.status === 'COMPLETED').length;

  const baseSupervisors = statusFilter === 'ALL' ? assignedSupervisors : allScheduleSupervisors;

  const displayedSupervisors = useMemo(() => {
    return baseSupervisors.filter((s) => {
      const teacherName = s.teacher?.fullName || '';
      const teacherCode = s.teacher?.teacherCode || '';
      const roomObj = s.examScheduleRoom?.room || s.examScheduleRoom?.examRoom;
      const roomName = roomObj?.roomName || roomObj?.roomCode || '';

      const matchesSearch =
        teacherName.toLowerCase().includes(search.toLowerCase()) ||
        teacherCode.toLowerCase().includes(search.toLowerCase()) ||
        roomName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const matchesRole = !roleFilter || s.role === roleFilter;
      const matchesDegree = !degreeFilter || s.teacher?.degree === degreeFilter;

      return matchesSearch && matchesStatus && matchesRole && matchesDegree;
    });
  }, [baseSupervisors, search, statusFilter, roleFilter, degreeFilter]);

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
              title: 'Đã hoàn thành',
              value: completedCount,
              subtext: 'Đã kết thúc gác thi',
              progressPercent: totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0,
              icon: UserCheck,
            },
          ].map((card, idx) => {
            const IconComp = card.icon;
            return (
              <div key={idx} className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-semibold">{card.title}</span>
                  <IconComp className="h-4 w-4" />
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{card.value}</div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{card.subtext}</div>
                <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${card.progressPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 2-Column Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Ca thi picker */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Chọn ca thi & Phòng
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSchedulePicker(true)}
                  className="text-xs text-blue-600"
                >
                  Đổi ca thi
                </Button>
              </div>

              {selectedSchedule && (
                <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3 space-y-1 text-xs">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{selectedSchedule.subject?.subjectName || selectedSchedule.subjectName}</div>
                  <div className="text-slate-500 text-[11px]">
                    {selectedSchedule.startTime} - {selectedSchedule.endTime} • {selectedSchedule.examDate ? new Date(selectedSchedule.examDate).toLocaleDateString('vi-VN') : ''}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Phòng thi</label>
                <FilterSelect
                  containerClassName="w-full"
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
                        Phòng: {name} ({capacity} chỗ)
                      </option>
                    );
                  })}
                </FilterSelect>
              </div>
            </div>
          </div>

          {/* Right: Phân công & Table */}
          <div className="lg:col-span-2 space-y-4">
            {/* Form Phân công (Admin) */}
            {currentUser?.role === 'ADMIN' && (
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Phân công Giám thị
                  </h3>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={previewAutoAssign}
                    disabled={autoLoading}
                  >
                    Tự động phân công
                  </Button>
                </div>

                <form onSubmit={handleAssign} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Giảng viên</label>
                    <FilterSelect
                      containerClassName="w-full"
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({t.teacherCode})
                        </option>
                      ))}
                    </FilterSelect>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Vai trò</label>
                    <FilterSelect
                      containerClassName="w-full"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="SUPERVISOR_1">Giám thị 1 (Chính)</option>
                      <option value="SUPERVISOR_2">Giám thị 2 (Phụ)</option>
                    </FilterSelect>
                  </div>

                  <div className="flex items-end">
                    <Button type="submit" variant="primary" size="md" className="w-full h-10">
                      Thêm phân công
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* ── Search & Filter Popover Row ── */}
            <div className="flex items-center gap-2 max-w-xl">
              {/* Search input */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Tìm theo tên giám thị, mã số, phòng..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-9 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                    title="Xóa tìm kiếm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <kbd
                    className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-5 items-center justify-center px-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-400 select-none cursor-pointer"
                    onClick={() => searchInputRef.current?.focus()}
                    title="Nhấn phím / để tìm nhanh"
                  >
                    /
                  </kbd>
                )}
              </div>

              {/* 1 Unified Filter Popover */}
              <ExamSupervisorFilterPopover
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                roleFilter={roleFilter}
                onRoleChange={setRoleFilter}
                degreeFilter={degreeFilter}
                onDegreeChange={setDegreeFilter}
                supervisors={baseSupervisors}
                totalFilteredCount={displayedSupervisors.length}
                onResetAll={() => {
                  setStatusFilter('ALL');
                  setRoleFilter('');
                  setDegreeFilter('');
                  setSearch('');
                }}
              />
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/90 dark:border-slate-800 font-semibold text-xs text-slate-700 dark:text-slate-300 flex justify-between items-center">
                <span>Danh sách Giám thị phòng thi</span>
                <span className="text-[11px] text-slate-400">Hiển thị {displayedSupervisors.length} bản ghi</span>
              </div>

              {displayedSupervisors.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                  Chưa có giám thị nào phù hợp với bộ lọc hiện tại.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="p-3 pl-4">Mã GV</th>
                        <th className="p-3">Họ và tên</th>
                        <th className="p-3">Phòng thi</th>
                        <th className="p-3">Vai trò</th>
                        <th className="p-3">Trạng thái</th>
                        <th className="p-3 pr-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {displayedSupervisors.map((sup) => {
                        const roomObj = sup.examScheduleRoom?.room || sup.examScheduleRoom?.examRoom;
                        const rName = roomObj?.roomName || roomObj?.roomCode || '---';

                        return (
                          <tr key={sup.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                            <td className="p-3 pl-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                              <IdentifierBadge>{sup.teacher?.teacherCode}</IdentifierBadge>
                            </td>
                            <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                              <div>{sup.teacher?.fullName}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{sup.teacher?.degree || 'TS'}</div>
                            </td>
                            <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{rName}</td>
                            <td className="p-3 font-semibold">
                              <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] ${
                                sup.role === 'SUPERVISOR_1'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {sup.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2'}
                              </span>
                            </td>
                            <td className="p-3">{renderStatusBadge(sup.status)}</td>
                            <td className="p-3 pr-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {sup.status === 'CHANGE_REQUESTED' && currentUser?.role === 'ADMIN' && (
                                  <>
                                    <Button
                                      type="button"
                                      variant="success"
                                      size="sm"
                                      onClick={() => void handleUpdateStatus(sup.id, 'CHANGE_APPROVED', 'chấp nhận cho đổi ca')}
                                    >
                                      Duyệt
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
                                <button
                                  type="button"
                                  onClick={() => setDrawerSupervisor(sup)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition"
                                  title="Xem chi tiết"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                {currentUser?.role === 'ADMIN' && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(sup.id)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 transition"
                                    title="Hủy phân công"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
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
