'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { exportToFormattedExcel } from '../../lib/export-excel';
import { printReport } from '../../lib/export-print';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ProfileDrawer } from '../../components/ProfileDrawer';
import { Button } from '../../components/ui/Button';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { Search, X, Calendar, Clock, DoorOpen, GraduationCap, ShieldCheck, Trash2 } from 'lucide-react';

import { ExamSupervisorHeader } from '../../components/exam-supervisors/ExamSupervisorHeader';
import { ExamSupervisorKPICards } from '../../components/exam-supervisors/ExamSupervisorKPICards';
import { ExamSupervisorFilterPopover } from '../../components/exam-supervisors/ExamSupervisorFilterPopover';
import { ExamSupervisorTableToolbar } from '../../components/exam-supervisors/ExamSupervisorTableToolbar';
import { ExamSupervisorTable } from '../../components/exam-supervisors/ExamSupervisorTable';
import { ExamSupervisorPaginationBar } from '../../components/exam-supervisors/ExamSupervisorPaginationBar';
import { CreateAssignmentModal } from '../../components/exam-supervisors/CreateAssignmentModal';
import { AutoProposalModal } from '../../components/exam-supervisors/AutoProposalModal';
import { SchedulePickerModal } from '../../components/exam-supervisors/SchedulePickerModal';

export default function ExamSupervisorsPage() {
  usePageTitle('Quản lý & Phân công Giám thị');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [selectedScheduleRoomId, setSelectedScheduleRoomId] = useState<string>('ALL');

  const [allScheduleSupervisors, setAllScheduleSupervisors] = useState<any[]>([]);
  const [drawerSupervisor, setDrawerSupervisor] = useState<any | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [degreeFilter, setDegreeFilter] = useState<string>('');

  // Pagination, Sort & View Mode
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(8);
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    code: true,
    name: true,
    room: true,
    role: true,
    status: true,
    note: true,
  });

  const [selected, setSelected] = useState<number[]>([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [showAutoProposalModal, setShowAutoProposalModal] = useState(false);
  const [autoProposal, setAutoProposal] = useState<any | null>(null);
  const [autoLoading, setAutoLoading] = useState(false);

  // Toast & Confirm Modal
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
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

  const handleColumnToggle = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchSupervisors = useCallback(async (scheduleId: number) => {
    try {
      const res = await api.get(`/exam-supervisors?examScheduleId=${scheduleId}`);
      setAllScheduleSupervisors(res.data || []);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải danh sách giám thị', type: 'error' });
    }
  }, []);

  const selectSchedule = useCallback(
    async (scheduleId: number) => {
      try {
        const res = await api.get(`/exam-schedules/${scheduleId}`);
        setSelectedSchedule(res.data);
        setSelectedScheduleRoomId('ALL');
        setSelected([]);
        setPage(1);
        await fetchSupervisors(scheduleId);
      } catch (err: any) {
        setToast({ message: err.message || 'Lỗi tải chi tiết ca thi', type: 'error' });
      }
    },
    [fetchSupervisors]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resSchedules, resTeachers] = await Promise.all([
        api.get('/exam-schedules'),
        api.get('/teachers'),
      ]);

      const sortedSchedules = (resSchedules.data || []).sort((a: any, b: any) => {
        return new Date(b.examDate || 0).getTime() - new Date(a.examDate || 0).getTime() || b.id - a.id;
      });

      setSchedules(sortedSchedules);
      setTeachers(resTeachers.data || []);

      if (sortedSchedules.length > 0) {
        await selectSchedule(sortedSchedules[0].id);
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu hệ thống', type: 'error' });
    } finally {
      setLoading(false);
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

  // Current Rooms
  const currentRooms = selectedSchedule?.examScheduleRooms || [];

  // Filtered & Sorted Supervisors
  const filteredSupervisors = useMemo(() => {
    const list = allScheduleSupervisors.filter((s) => {
      // Room filter
      if (selectedScheduleRoomId !== 'ALL' && String(s.examScheduleRoomId) !== String(selectedScheduleRoomId)) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && s.status !== statusFilter) {
        return false;
      }

      // Role filter
      if (roleFilter && s.role !== roleFilter) {
        return false;
      }

      // Degree filter
      if (degreeFilter && s.teacher?.degree !== degreeFilter) {
        return false;
      }

      // Search
      const term = search.toLowerCase();
      const teacherName = s.teacher?.fullName || '';
      const teacherCode = s.teacher?.teacherCode || '';
      const roomObj = s.examScheduleRoom?.room || s.examScheduleRoom?.examRoom;
      const roomName = roomObj?.roomName || roomObj?.name || roomObj?.roomCode || '';

      return (
        teacherName.toLowerCase().includes(term) ||
        teacherCode.toLowerCase().includes(term) ||
        roomName.toLowerCase().includes(term)
      );
    });

    return list.sort((a, b) => {
      switch (sortOrder) {
        case 'oldest':
          return (a.id || 0) - (b.id || 0);
        case 'name_asc':
          return (a.teacher?.fullName || '').localeCompare(b.teacher?.fullName || '');
        case 'name_desc':
          return (b.teacher?.fullName || '').localeCompare(a.teacher?.fullName || '');
        case 'room_asc': {
          const rA = a.examScheduleRoom?.room?.roomName || '';
          const rB = b.examScheduleRoom?.room?.roomName || '';
          return rA.localeCompare(rB);
        }
        case 'newest':
        default:
          return (b.id || 0) - (a.id || 0);
      }
    });
  }, [allScheduleSupervisors, selectedScheduleRoomId, statusFilter, roleFilter, degreeFilter, search, sortOrder]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredSupervisors.length / limit) || 1;
  const paginatedSupervisors = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredSupervisors.slice(start, start + limit);
  }, [filteredSupervisors, page, limit]);

  // Counts for KPI
  const totalAssignments = allScheduleSupervisors.length;
  const changeRequestedCount = allScheduleSupervisors.filter((s) => s.status === 'CHANGE_REQUESTED').length;
  const confirmedCount = allScheduleSupervisors.filter((s) => s.status === 'CONFIRMED').length;
  const completedCount = allScheduleSupervisors.filter((s) => s.status === 'COMPLETED').length;

  // Handle Add Single / Dual Assignment
  const handleCreateAssignment = async (data: {
    examScheduleRoomId: number;
    supervisor1Id?: number;
    supervisor2Id?: number;
    note?: string;
  }) => {
    try {
      const promises: Promise<any>[] = [];
      if (data.supervisor1Id) {
        promises.push(
          api.post('/exam-supervisors/assign', {
            examScheduleRoomId: data.examScheduleRoomId,
            teacherId: data.supervisor1Id,
            role: 'SUPERVISOR_1',
            note: data.note,
          })
        );
      }
      if (data.supervisor2Id) {
        promises.push(
          api.post('/exam-supervisors/assign', {
            examScheduleRoomId: data.examScheduleRoomId,
            teacherId: data.supervisor2Id,
            role: 'SUPERVISOR_2',
            note: data.note,
          })
        );
      }

      await Promise.all(promises);
      setToast({ message: 'Phân công giám thị cho phòng thi thành công!', type: 'success' });
      if (selectedSchedule?.id) {
        await fetchSupervisors(selectedSchedule.id);
      }
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || err.message || 'Lỗi phân công giám thị', type: 'error' });
      throw err;
    }
  };

  // Handle Delete Assignment
  const handleDelete = (id: number, teacherName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hủy Phân Công Giám Thị',
      message: `Bạn có chắc chắn muốn hủy phân công giám thị ${teacherName}? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        setConfirmModal((p) => ({ ...p, isOpen: false }));
        try {
          await api.delete(`/exam-supervisors/${id}`);
          setToast({ message: 'Đã hủy phân công giám thị thành công!', type: 'success' });
          if (selectedSchedule?.id) {
            await fetchSupervisors(selectedSchedule.id);
          }
        } catch (err: any) {
          setToast({ message: err.message || 'Lỗi khi hủy phân công', type: 'error' });
        }
      },
    });
  };

  // Handle Bulk Delete
  const handleBulkDelete = () => {
    if (selected.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Hủy phân công hàng loạt',
      message: `Bạn có chắc chắn muốn hủy ${selected.length} lượt phân công giám thị đã chọn?`,
      onConfirm: async () => {
        setConfirmModal((p) => ({ ...p, isOpen: false }));
        try {
          await Promise.all(selected.map((id) => api.delete(`/exam-supervisors/${id}`)));
          setToast({ message: `Đã hủy ${selected.length} lượt phân công thành công!`, type: 'success' });
          setSelected([]);
          if (selectedSchedule?.id) {
            await fetchSupervisors(selectedSchedule.id);
          }
        } catch (err: any) {
          setToast({ message: err.message || 'Lỗi khi hủy phân công hàng loạt', type: 'error' });
        }
      },
    });
  };

  // Auto Assign Preview
  const previewAutoAssign = async () => {
    if (!selectedSchedule?.id) return;
    setAutoLoading(true);
    try {
      const res = await api.post('/exam-supervisors/auto-preview', { examScheduleId: selectedSchedule.id });
      setAutoProposal(res.data);
      setShowAutoProposalModal(true);
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể tạo phương án tự động', type: 'error' });
    } finally {
      setAutoLoading(false);
    }
  };

  // Auto Assign Accept
  const acceptAutoAssign = async (customProposals: { examScheduleRoomId: number; teacherId: number; role: string }[]) => {
    if (!customProposals?.length) return;
    setAutoLoading(true);
    try {
      await api.post('/exam-supervisors/auto-assign', { proposals: customProposals });
      setShowAutoProposalModal(false);
      setAutoProposal(null);
      setToast({ message: `Đã lưu thành công ${customProposals.length} lượt phân công!`, type: 'success' });
      if (selectedSchedule?.id) {
        await fetchSupervisors(selectedSchedule.id);
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi khi lưu phương án phân công', type: 'error' });
    } finally {
      setAutoLoading(false);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    exportToFormattedExcel({
      filename: `Phan_Cong_Giam_Thi_${selectedSchedule?.subject?.subjectCode || 'CaThi'}`,
      title: 'BẢNG PHÂN CÔNG CÁN BỘ COI THI',
      subtitle: `Môn: ${selectedSchedule?.subject?.subjectName || ''} - Ngày thi: ${selectedSchedule?.examDate ? new Date(selectedSchedule.examDate).toLocaleDateString('vi-VN') : ''}`,
      columns: [
        { header: 'Mã GV', width: 15 },
        { header: 'Họ và tên', width: 30 },
        { header: 'Học vị', width: 15 },
        { header: 'Phòng thi', width: 20 },
        { header: 'Vai trò', width: 20 },
        { header: 'Trạng thái', width: 20 },
      ],
      rows: filteredSupervisors.map((s) => {
        const roomObj = s.examScheduleRoom?.room || s.examScheduleRoom?.examRoom;
        const rName = roomObj?.roomName || roomObj?.name || roomObj?.roomCode || `Phòng #${s.examScheduleRoomId}`;
        const statusLabel = ({ CONFIRMED: 'Đã xác nhận', CHANGE_REQUESTED: 'Xin đổi ca', COMPLETED: 'Hoàn thành', ABSENT: 'Vắng mặt', PENDING: 'Chờ phản hồi', REJECTED: 'Đã từ chối' } as Record<string, string>)[s.status || 'PENDING'] || 'Chờ phản hồi';
        return [
          s.teacher?.teacherCode || '',
          s.teacher?.fullName || '',
          s.teacher?.degree || 'TS',
          rName,
          s.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2',
          statusLabel,
        ];
      }),
    });
  };

  // Print Report
  const handlePrintReport = () => {
    printReport({
      title: 'BÁO CÁO PHÂN CÔNG GIÁM THỊ VÀ TRẠNG THÁI GÁC THI',
      subtitle: selectedSchedule
        ? `Môn thi: ${selectedSchedule.subject?.subjectName} (${selectedSchedule.subject?.subjectCode}) - Ngày thi: ${new Date(selectedSchedule.examDate).toLocaleDateString('vi-VN')}`
        : 'Tổng hợp phân công giám thị',
      metaInfo: [
        { label: 'Tổng số lượt phân công', value: String(filteredSupervisors.length) },
        { label: 'Đã xác nhận', value: String(confirmedCount) },
        { label: 'Yêu cầu đổi ca', value: String(changeRequestedCount) },
      ],
      columns: [
        { header: 'Mã GV', width: '80px', align: 'center' },
        { header: 'Họ và tên', width: '180px' },
        { header: 'Học vị', width: '80px', align: 'center' },
        { header: 'Phòng thi', width: '120px', align: 'center' },
        { header: 'Vai trò', width: '100px', align: 'center' },
        { header: 'Trạng thái', width: '110px', align: 'center' },
      ],
      rows: filteredSupervisors.map((s) => {
        const roomObj = s.examScheduleRoom?.room || s.examScheduleRoom?.examRoom;
        const rName = roomObj?.roomName || roomObj?.name || roomObj?.roomCode || `Phòng #${s.examScheduleRoomId}`;
        const statusLabel = ({ CONFIRMED: 'Đã xác nhận', CHANGE_REQUESTED: 'Xin đổi ca', COMPLETED: 'Hoàn thành', ABSENT: 'Vắng mặt', PENDING: 'Chờ phản hồi', REJECTED: 'Đã từ chối' } as Record<string, string>)[s.status || 'PENDING'] || 'Chờ phản hồi';
        return [
          s.teacher?.teacherCode || '',
          s.teacher?.fullName || '',
          s.teacher?.degree || 'TS',
          rName,
          s.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2',
          statusLabel,
        ];
      }),
    });
  };

  return (
    <>
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((p) => ({ ...p, isOpen: false }))}
      />

      {/* Create Assignment Modal */}
      <CreateAssignmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAssignment}
        rooms={currentRooms}
        teachers={teachers}
        defaultRoomId={selectedScheduleRoomId}
      />

      {/* Schedule Picker Modal */}
      <SchedulePickerModal
        isOpen={showSchedulePicker}
        onClose={() => setShowSchedulePicker(false)}
        schedules={schedules}
        selectedScheduleId={String(selectedSchedule?.id || '')}
        onSelectSchedule={selectSchedule}
      />

      {/* Auto Proposal Modal */}
      <AutoProposalModal
        isOpen={showAutoProposalModal}
        onClose={() => setShowAutoProposalModal(false)}
        autoProposal={autoProposal}
        teachers={teachers}
        rooms={currentRooms}
        onAccept={acceptAutoAssign}
        loading={autoLoading}
      />

      {/* Supervisor Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerSupervisor)}
        onClose={() => setDrawerSupervisor(null)}
        title={drawerSupervisor?.teacher?.fullName || ''}
        subtitle={`Mã cán bộ coi thi: ${drawerSupervisor?.teacher?.teacherCode}`}
        avatarText={drawerSupervisor?.teacher?.fullName ? drawerSupervisor.teacher.fullName.slice(-1) : 'GT'}
        badge={{
          label: drawerSupervisor?.role === 'SUPERVISOR_1' ? 'Giám thị 1 (Chính)' : 'Giám thị 2 (Phụ)',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        }}
        details={[
          { label: 'Họ và tên cán bộ', value: drawerSupervisor?.teacher?.fullName },
          { label: 'Mã số cán bộ', value: drawerSupervisor?.teacher?.teacherCode },
          { label: 'Học vị / Học hàm', value: drawerSupervisor?.teacher?.degree || 'TS', icon: GraduationCap },
          {
            label: 'Nhiệm vụ phân công',
            value:
              drawerSupervisor?.role === 'SUPERVISOR_1'
                ? 'Cán bộ coi thi chính (Giám thị 1)'
                : 'Cán bộ coi thi phụ (Giám thị 2)',
            icon: ShieldCheck,
          },
          {
            label: 'Trạng thái xác nhận',
            value:
              drawerSupervisor?.status === 'CONFIRMED'
                ? 'Đã xác nhận tham gia'
                : drawerSupervisor?.status === 'CHANGE_REQUESTED'
                ? 'Đang gửi yêu cầu đổi ca'
                : 'Đang chờ phản hồi',
          },
          { label: 'Ghi chú phân công', value: drawerSupervisor?.note || 'Không có ghi chú' },
        ]}
      />

      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950/50 min-h-screen">
        {/* ── 1. Page Header ── */}
        <ExamSupervisorHeader
          onAdd={() => setShowCreateModal(true)}
          onAutoAssign={previewAutoAssign}
          onExport={handleExportExcel}
          onPrint={handlePrintReport}
          isAdmin={currentUser?.role === 'ADMIN'}
          autoLoading={autoLoading}
        />

        {/* ── 2. Standard 4 KPI Cards ── */}
        <ExamSupervisorKPICards
          totalAssignments={totalAssignments}
          changeRequestedCount={changeRequestedCount}
          confirmedCount={confirmedCount}
          completedCount={completedCount}
          totalRooms={currentRooms.length}
        />

        {/* ── 3. Active Schedule Shift Banner & Room Selector ── */}
        <div className="rounded-2xl border border-blue-200/80 dark:border-blue-900/50 bg-gradient-to-r from-blue-50/90 via-slate-50/70 to-blue-50/40 dark:from-blue-950/40 dark:via-slate-900 dark:to-blue-950/20 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="h-6 w-6 stroke-[2]" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-600 text-white tracking-wide uppercase">
                  {selectedSchedule?.type || 'CHÍNH THỨC'}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  {selectedSchedule?.subject?.subjectName || selectedSchedule?.subjectName || 'Chưa chọn ca thi'}
                </h3>
                <span className="text-xs font-mono font-semibold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                  {selectedSchedule?.subject?.subjectCode || selectedSchedule?.subjectCode || 'MH'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {selectedSchedule?.startTime} - {selectedSchedule?.endTime}
                </span>
                {selectedSchedule?.examDate && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(selectedSchedule.examDate).toLocaleDateString('vi-VN')}
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                  <DoorOpen className="h-3.5 w-3.5 text-blue-600" />
                  {currentRooms.length} phòng thi
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-48 sm:w-56">
              <FilterSelect
                containerClassName="w-full"
                value={selectedScheduleRoomId}
                onChange={(e) => {
                  setSelectedScheduleRoomId(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: 'ALL', label: 'Tất cả phòng thi' },
                  ...currentRooms.map((r: any) => {
                    const roomObj = r.room || r.examRoom;
                    const rName = roomObj?.roomName || roomObj?.name || roomObj?.roomCode || `Phòng #${r.id}`;
                    return {
                      value: String(r.id),
                      label: `Phòng: ${rName}`,
                    };
                  }),
                ]}
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setShowSchedulePicker(true)}
            >
              Đổi Ca Thi
            </Button>
          </div>
        </div>

        {/* ── 4. Unified Search & Action Toolbar Row ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left: Search input + Filter Popover */}
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Tìm theo mã GV, họ tên, phòng thi..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-9 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
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

            {/* Filter Popover */}
            <ExamSupervisorFilterPopover
              statusFilter={statusFilter}
              onStatusChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              roleFilter={roleFilter}
              onRoleChange={(val) => {
                setRoleFilter(val);
                setPage(1);
              }}
              degreeFilter={degreeFilter}
              onDegreeChange={(val) => {
                setDegreeFilter(val);
                setPage(1);
              }}
              supervisors={allScheduleSupervisors}
              totalFilteredCount={filteredSupervisors.length}
              onResetAll={() => {
                setStatusFilter('ALL');
                setRoleFilter('');
                setDegreeFilter('');
                setPage(1);
              }}
            />
          </div>

          {/* Right: Table Action Controls */}
          <div className="shrink-0">
            <ExamSupervisorTableToolbar
              totalCount={filteredSupervisors.length}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              visibleColumns={visibleColumns}
              onColumnToggle={handleColumnToggle}
              onRefresh={() => {
                if (selectedSchedule?.id) {
                  void fetchSupervisors(selectedSchedule.id);
                }
              }}
              loading={loading}
            />
          </div>
        </div>

        {/* ── 5. Bulk Actions Bar ── */}
        {selected.length > 0 && currentUser?.role === 'ADMIN' && (
          <div className="flex items-center justify-between p-3 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/90 dark:bg-blue-950/60 shadow-md">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-200 pl-2">
              Đang chọn {selected.length} lượt phân công
            </span>
            <div className="flex items-center gap-2">
              <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Hủy {selected.length} phân công
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelected([])}>
                Bỏ chọn
              </Button>
            </div>
          </div>
        )}

        {/* ── 6. Main Data Table / Grid / Compact ── */}
        {loading ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : !paginatedSupervisors.length ? (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-500 font-semibold shadow-2xs">
            Không tìm thấy lượt phân công giám thị nào phù hợp.
          </div>
        ) : (
          <ExamSupervisorTable
            supervisors={paginatedSupervisors}
            selected={selected}
            viewMode={viewMode}
            visibleColumns={visibleColumns}
            onSelect={(id, checked) =>
              setSelected(checked ? [...selected, id] : selected.filter((x) => x !== id))
            }
            onSelectAll={(checked) =>
              setSelected(checked ? paginatedSupervisors.map((s) => s.id) : [])
            }
            onView={setDrawerSupervisor}
            onDelete={handleDelete}
            isAdmin={currentUser?.role === 'ADMIN'}
          />
        )}

        {/* ── 7. Pagination Bar ── */}
        <ExamSupervisorPaginationBar
          currentPage={page}
          totalPages={totalPages}
          totalItems={filteredSupervisors.length}
          itemsPerPage={limit}
          onPageChange={setPage}
          onItemsPerPageChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </main>
    </>
  );
}
