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
import { Search, X, Calendar, Clock, DoorOpen, GraduationCap, ShieldCheck, Trash2, ChevronDown, ChevronUp, Plus, ArrowLeftRight } from 'lucide-react';

import { ExamSupervisorHeader } from '../../components/exam-supervisors/ExamSupervisorHeader';
import { ExamSupervisorKPICards } from '../../components/exam-supervisors/ExamSupervisorKPICards';
import { ExamSupervisorFilterPopover } from '../../components/exam-supervisors/ExamSupervisorFilterPopover';
import { ExamSupervisorTableToolbar } from '../../components/exam-supervisors/ExamSupervisorTableToolbar';
import { ExamSupervisorTable } from '../../components/exam-supervisors/ExamSupervisorTable';
import { ExamSupervisorPaginationBar } from '../../components/exam-supervisors/ExamSupervisorPaginationBar';
import { InlineCreateAssignmentPanel } from '../../components/exam-supervisors/InlineCreateAssignmentPanel';
import { InlineAutoProposalPanel } from '../../components/exam-supervisors/InlineAutoProposalPanel';
import { SchedulePickerModal } from '../../components/exam-supervisors/SchedulePickerModal';

// ── Module-level cache: survives tab switch, renders instantly on remount ──
let _cache: { schedules: any[]; teachers: any[]; selectedSchedule: any; supervisors: any[] } | null = null;

export default function ExamSupervisorsPage() {
  usePageTitle('Quản lý & Phân công Giám thị');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(!_cache); // no loading if cache exists
  const [schedules, setSchedules] = useState<any[]>(_cache?.schedules ?? []);
  const [teachers, setTeachers] = useState<any[]>(_cache?.teachers ?? []);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(_cache?.selectedSchedule ?? null);
  const [selectedScheduleRoomId, setSelectedScheduleRoomId] = useState<string>('ALL');

  const [allScheduleSupervisors, setAllScheduleSupervisors] = useState<any[]>(_cache?.supervisors ?? []);
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

  // Inline Panels (In-Place Expandable Panels instead of heavy Popups)
  const [activeInlinePanel, setActiveInlinePanel] = useState<'create' | 'auto' | null>(null);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
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
        setActiveInlinePanel(null);
        await fetchSupervisors(scheduleId);
      } catch (err: any) {
        setToast({ message: err.message || 'Lỗi tải chi tiết ca thi', type: 'error' });
      }
    },
    [fetchSupervisors]
  );

  const fetchData = useCallback(async (background = false) => {
    if (!background) setLoading(true);
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
        const firstSched = sortedSchedules[0];
        setSelectedSchedule(firstSched);
        setSelectedScheduleRoomId('ALL');
        const resSupv = await api.get(`/exam-supervisors?examScheduleId=${firstSched.id}`);
        const supervisors = resSupv.data || [];
        setAllScheduleSupervisors(supervisors);
        // update cache
        _cache = { schedules: sortedSchedules, teachers: resTeachers.data || [], selectedSchedule: firstSched, supervisors };
      } else {
        _cache = { schedules: sortedSchedules, teachers: resTeachers.data || [], selectedSchedule: null, supervisors: [] };
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu hệ thống', type: 'error' });
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
    if (_cache) {
      // data already in cache → render instantly, refetch silently in background
      void fetchData(true);
    } else {
      void fetchData(false);
    }
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
      setActiveInlinePanel(null);
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
    if (activeInlinePanel === 'auto') {
      setActiveInlinePanel(null);
      return;
    }

    setActiveInlinePanel('auto');
    setAutoLoading(true);
    try {
      const res = await api.post('/exam-supervisors/auto-preview', { examScheduleId: selectedSchedule.id });
      setAutoProposal(res.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể tạo phương án tự động', type: 'error' });
      setActiveInlinePanel(null);
    } finally {
      setAutoLoading(false);
    }
  };

  // Auto Assign Accept
  const acceptAutoAssign = async (customProposals: { examScheduleRoomId: number; teacherId: number; role: string }[]) => {
    if (!customProposals?.length) {
      setToast({ message: 'Không có phân công nào để lưu.', type: 'error' });
      return;
    }
    setAutoLoading(true);
    try {
      await api.post('/exam-supervisors/auto-assign', { proposals: customProposals });
      setToast({ message: 'Đã lưu phương án phân công tự động thành công!', type: 'success' });
      setActiveInlinePanel(null);
      if (selectedSchedule?.id) {
        await fetchSupervisors(selectedSchedule.id);
      }
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || err.message || 'Lỗi khi lưu phân công tự động', type: 'error' });
    } finally {
      setAutoLoading(false);
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    if (!filteredSupervisors.length) {
      setToast({ message: 'Không có dữ liệu phân công để xuất.', type: 'error' });
      return;
    }

    await exportToFormattedExcel({
      filename: `Phan_Cong_Giam_Thi_${selectedSchedule?.subject?.subjectCode || 'CaThi'}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      title: 'DANH SÁCH PHÂN CÔNG CÁN BỘ COI THI',
      subtitle: `Ca thi: ${selectedSchedule?.subject?.subjectName || ''} (${selectedSchedule?.subject?.subjectCode || ''}) - Ngày thi: ${selectedSchedule?.examDate ? new Date(selectedSchedule.examDate).toLocaleDateString('vi-VN') : '---'} - Khung giờ: ${selectedSchedule?.startTime || ''} - ${selectedSchedule?.endTime || ''}`,
      columns: [
        { header: 'Mã Cán Bộ', width: 14 },
        { header: 'Họ và Tên Giảng Viên', width: 26 },
        { header: 'Học Vị', width: 12 },
        { header: 'Phòng Thi', width: 18 },
        { header: 'Nhiệm Vụ', width: 18 },
        { header: 'Trạng Thái Xác Nhận', width: 20 },
        { header: 'Ghi Chú', width: 24 },
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
          s.role === 'SUPERVISOR_1' ? 'Giám thị 1 (Chính)' : 'Giám thị 2 (Phụ)',
          statusLabel,
          s.note || '',
        ];
      }),
    });
  };

  // Print Report
  const handlePrintReport = () => {
    if (!filteredSupervisors.length) {
      setToast({ message: 'Không có dữ liệu phân công để in.', type: 'error' });
      return;
    }

    printReport({
      title: 'BÁO CÁO PHÂN CÔNG CÁN BỘ COI THI',
      subtitle: `Môn: ${selectedSchedule?.subject?.subjectName || ''} (${selectedSchedule?.subject?.subjectCode || ''}) | Ngày: ${selectedSchedule?.examDate ? new Date(selectedSchedule.examDate).toLocaleDateString('vi-VN') : '---'} | Giờ: ${selectedSchedule?.startTime} - ${selectedSchedule?.endTime}`,
      columns: [
        { header: 'Mã Cán Bộ', width: '15%' },
        { header: 'Họ và Tên', width: '25%' },
        { header: 'Học Vị', width: '15%' },
        { header: 'Phòng Thi', width: '20%' },
        { header: 'Vai Trò', width: '15%' },
        { header: 'Trạng Thái', width: '10%' },
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

      {/* Schedule Picker Modal */}
      <SchedulePickerModal
        isOpen={showSchedulePicker}
        onClose={() => setShowSchedulePicker(false)}
        schedules={schedules}
        selectedScheduleId={String(selectedSchedule?.id || '')}
        onSelectSchedule={selectSchedule}
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
          onExport={handleExportExcel}
          onPrint={handlePrintReport}
        />

        {/* ── 2. Standard 4 KPI Cards ── */}
        <ExamSupervisorKPICards
          totalAssignments={totalAssignments}
          changeRequestedCount={changeRequestedCount}
          confirmedCount={confirmedCount}
          completedCount={completedCount}
          totalRooms={currentRooms.length}
        />

        {/* ── 3. Active Schedule Shift Banner & Inline Action Panels ── */}
        <div>
          {/* Shift Controls Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-0.5">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                <GraduationCap className="h-5 w-5 stroke-[2]" />
              </div>

              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-600 text-white tracking-wide">
                    {selectedSchedule?.type || 'CHÍNH THỨC'}
                  </span>
                  <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {selectedSchedule?.subject?.subjectName || selectedSchedule?.subjectName || 'Chưa chọn ca thi'}
                  </h3>
                  <span className="text-xs font-medium text-slate-400">
                    #{selectedSchedule?.subject?.subjectCode || selectedSchedule?.subjectCode || 'MH'}
                  </span>

                  {/* Nút Đổi Ca thuần icon, không chữ, không khung, không nền */}
                  <button
                    type="button"
                    onClick={() => setShowSchedulePicker(true)}
                    className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer inline-flex items-center justify-center"
                    title="Đổi ca thi"
                    aria-label="Đổi ca thi"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap min-h-[20px]">
                  {selectedSchedule && (
                    <>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {selectedSchedule.startTime} - {selectedSchedule.endTime}
                      </span>
                      {selectedSchedule.examDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(selectedSchedule.examDate).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <DoorOpen className="h-3.5 w-3.5 text-blue-600" />
                        {currentRooms.length} phòng thi
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <div className="w-40 sm:w-48">
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

              {currentUser?.role === 'ADMIN' && (
                <>
                  {/* Nút 2: Tự Động (Soft Tint Pill) */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={previewAutoAssign}
                    className={
                      activeInlinePanel === 'auto'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80'
                    }
                  >
                    Tự Động
                  </Button>

                  {/* Nút 3: Phân Công (Primary Solid Blue - Nút đậm duy nhất) */}
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() => setActiveInlinePanel((p) => (p === 'create' ? null : 'create'))}
                  >
                    Phân Công
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Inline Expandable Panels Container */}
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${activeInlinePanel === 'create'
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="pt-2.5">
                <InlineCreateAssignmentPanel
                  isOpen={activeInlinePanel === 'create'}
                  onClose={() => setActiveInlinePanel(null)}
                  onSubmit={handleCreateAssignment}
                  rooms={currentRooms}
                  teachers={teachers}
                  defaultRoomId={selectedScheduleRoomId}
                />
              </div>
            </div>
          </div>

          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${activeInlinePanel === 'auto'
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="pt-2.5">
                <InlineAutoProposalPanel
                  isOpen={activeInlinePanel === 'auto'}
                  onClose={() => setActiveInlinePanel(null)}
                  autoProposal={autoProposal}
                  teachers={teachers}
                  rooms={currentRooms}
                  onAccept={acceptAutoAssign}
                  loading={autoLoading}
                />
              </div>
            </div>
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
                className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-9 text-[15px] font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
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
                  className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-5 items-center justify-center px-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-normal text-[12px] text-slate-400 select-none cursor-pointer"
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
              onResetAll={() => {
                setStatusFilter('ALL');
                setRoleFilter('');
                setDegreeFilter('');
                setPage(1);
              }}
            />
          </div>

          {/* Right: Table Toolbar Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <ExamSupervisorTableToolbar
              totalCount={filteredSupervisors.length}
              sortOrder={sortOrder}
              onSortChange={(val) => setSortOrder(val)}
              viewMode={viewMode}
              onViewModeChange={(m) => setViewMode(m)}
              visibleColumns={visibleColumns}
              onColumnToggle={handleColumnToggle}
              onRefresh={async () => {
                if (selectedSchedule?.id) {
                  await fetchSupervisors(selectedSchedule.id);
                }
              }}
              loading={loading}
            />
          </div>
        </div>

        {/* ── 5. Bulk Actions Bar ── */}
        {selected.length > 0 && currentUser?.role === 'ADMIN' && (
          <div className="flex items-center justify-between p-3 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/90 dark:bg-blue-950/60 shadow-md">
            <span className="text-xs font-semibold text-blue-900 dark:text-blue-200 pl-2">
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
