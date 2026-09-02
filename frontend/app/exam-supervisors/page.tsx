'use client';

import { MetaSeparator } from '@/components/ui/InlineMeta';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { exportToFormattedExcel } from '../../lib/export-excel';
import { printReport } from '../../lib/export-print';
import { printDocumentTemplate } from '../../lib/print-template';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ProfileDrawer } from '../../components/ProfileDrawer';
import { Button } from '../../components/ui/Button';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { IdentifierBadge } from '../../components/ui/IdentifierBadge';
import { Search, X, Calendar, Clock, DoorOpen, GraduationCap, ShieldCheck, Trash2, ChevronDown, ChevronUp, Plus, ArrowLeftRight } from 'lucide-react';

import { ExamSupervisorHeader } from '../../components/exam-supervisors/ExamSupervisorHeader';
import { ExamSupervisorKPICards } from '../../components/exam-supervisors/ExamSupervisorKPICards';
import { ExamSupervisorFilterPopover } from '../../components/exam-supervisors/ExamSupervisorFilterPopover';
import { ExamSupervisorTableToolbar } from '../../components/exam-supervisors/ExamSupervisorTableToolbar';
import { ExamSupervisorTable } from '../../components/exam-supervisors/ExamSupervisorTable';
import { ExamSupervisorPaginationBar } from '../../components/exam-supervisors/ExamSupervisorPaginationBar';
import { ExamSupervisorBulkAction } from '../../components/exam-supervisors/ExamSupervisorBulkAction';
import { InlineAutoProposalPanel } from '../../components/exam-supervisors/InlineAutoProposalPanel';
import { SchedulePickerModal } from '../../components/exam-supervisors/SchedulePickerModal';
import { ReviewSupervisorChangeModal } from '../../components/exam-supervisors/ReviewSupervisorChangeModal';
import { PageSkeleton } from '../../components/ui/Skeleton';
import { formatTimeRange } from '../../lib/format';

function getTeacherInitials(fullName?: string): string {
  if (!fullName) return 'GV';
  const clean = fullName.replace(/^(TS\.|ThS\.|PGS\.|GS\.|ThS|TS|PGS|GS|Thầy|Cô)\s+/i, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'GV';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  const firstChar = words[0][0];
  const lastChar = words[words.length - 1][0];
  return (firstChar + lastChar).toUpperCase();
}

// ── Module-level cache: survives tab switch, renders instantly on remount ──
let _cache: { schedules: any[]; teachers: any[]; selectedSchedule: any; supervisors: any[] } | null = null;

export default function ExamSupervisorsPage() {
  usePageTitle('Phân công coi thi');
  const router = useRouter();
  const searchParams = useSearchParams();
  const scheduleIdFromQuery = Number(searchParams.get('examScheduleId')) || null;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(!_cache); // no loading if cache exists
  const [schedules, setSchedules] = useState<any[]>(_cache?.schedules ?? []);
  const [teachers, setTeachers] = useState<any[]>(_cache?.teachers ?? []);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(_cache?.selectedSchedule ?? null);
  const [selectedScheduleRoomId, setSelectedScheduleRoomId] = useState<string>('ALL');

  const [allScheduleSupervisors, setAllScheduleSupervisors] = useState<any[]>(_cache?.supervisors ?? []);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [reviewModalRequest, setReviewModalRequest] = useState<any | null>(null);
  const [drawerSupervisor, setDrawerSupervisor] = useState<any | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [degreeFilter, setDegreeFilter] = useState<string>('');

  // Pagination, Sort & View Mode
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [sortOrder, setSortOrder] = useState<string>('newest');
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
    type?: 'danger' | 'warning' | 'info' | 'success';
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
    if (!background && !_cache && !schedules.length) setLoading(true);
    try {
      const [resSchedules, resTeachers, resChanges] = await Promise.all([
        api.get('/exam-schedules'),
        api.get('/teachers'),
        api.get('/teachers/supervisor-change-requests'),
      ]);

      const sortedSchedules = (resSchedules.data || []).sort((a: any, b: any) => {
        return new Date(b.examDate || 0).getTime() - new Date(a.examDate || 0).getTime() || b.id - a.id;
      });

      setSchedules(sortedSchedules);
      setTeachers(resTeachers.data || []);
      setChangeRequests(resChanges.data || []);

      if (sortedSchedules.length > 0) {
        const firstSched = sortedSchedules.find((schedule: any) => schedule.id === scheduleIdFromQuery) || sortedSchedules[0];
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
  // Schedule count is only an initial loading hint; the query selection drives this loader.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleIdFromQuery]);

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

  // Handle Delete Assignment
  const handleDelete = (id: number, teacherName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hủy phân công giám thị?',
      message: `Bạn có chắc chắn muốn hủy phân công giám thị ${teacherName}? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((p) => ({ ...p, isOpen: false }));
        try {
          await api.delete(`/exam-supervisors/${id}`);
          setToast({ message: 'Đã hủy phân công giám thị thành công!', type: 'success' });
          if (selectedSchedule?.id) {
            await fetchSupervisors(selectedSchedule.id);
          }
        } catch (err: any) {
          setToast({ message: err.message || 'Lỗi khi hủy phân công. Vui lòng thử lại.', type: 'error' });
        }
      },
    });
  };

  // Handle Bulk Delete
  const handleBulkDelete = () => {
    if (selected.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Hủy phân công hàng loạt?',
      message: `Bạn có chắc chắn muốn hủy ${selected.length} lượt phân công giám thị đã chọn?`,
      type: 'danger',
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
      templateCode: 'SUPERVISOR_ASSIGNMENT',
      title: 'DANH SÁCH PHÂN CÔNG CÁN BỘ COI THI',
      subtitle: `Ca thi: ${selectedSchedule?.subject?.subjectName || ''} (${selectedSchedule?.subject?.subjectCode || ''}), ngày thi: ${selectedSchedule?.examDate ? new Date(selectedSchedule.examDate).toLocaleDateString('vi-VN') : '—'}, khung giờ: ${formatTimeRange(selectedSchedule?.startTime, selectedSchedule?.endTime)}`,
      columns: [
        { header: 'STT', align: 'center', width: 6 },
        { header: 'Mã Cán Bộ', align: 'center', width: 14 },
        { header: 'Họ và Tên Giảng Viên', width: 24 },
        { header: 'Học Vị', align: 'center', width: 10 },
        { header: 'Phòng Thi', align: 'center', width: 16 },
        { header: 'Nhiệm Vụ', align: 'center', width: 18 },
        { header: 'Trạng Thái', align: 'center', width: 16 },
        { header: 'Ghi Chú', width: 20 },
      ],
      rows: filteredSupervisors.map((s, idx) => {
        const roomObj = s.examScheduleRoom?.room || s.examScheduleRoom?.examRoom;
        const rName = roomObj?.roomName || roomObj?.name || roomObj?.roomCode || `Phòng #${s.examScheduleRoomId}`;
        const statusLabel = ({ CONFIRMED: 'Đã xác nhận', CHANGE_REQUESTED: 'Xin đổi ca', COMPLETED: 'Hoàn thành', ABSENT: 'Vắng mặt', PENDING: 'Chờ phản hồi', REJECTED: 'Đã từ chối' } as Record<string, string>)[s.status || 'PENDING'] || 'Chờ phản hồi';
        return [
          idx + 1,
          s.teacher?.teacherCode || '',
          s.teacher?.fullName || '',
          s.teacher?.degree || 'ThS',
          rName,
          s.role === 'SUPERVISOR_1' ? 'Cán bộ coi thi 1' : 'Cán bộ coi thi 2',
          statusLabel,
          s.note || '',
        ];
      }),
    });
  };

  // Print Report
  const handlePrintReport = async () => {
    if (!filteredSupervisors.length) {
      setToast({ message: 'Không có dữ liệu phân công để in.', type: 'error' });
      return;
    }
    try {
      const opened = await printDocumentTemplate('SUPERVISOR_ASSIGNMENT', {
        ...(selectedSchedule?.id ? { examScheduleId: selectedSchedule.id } : {}),
      });
      if (!opened) setToast({ message: 'Trình duyệt đang chặn cửa sổ in. Hãy cho phép pop-up rồi thử lại.', type: 'error' });
    } catch {
      setToast({ message: 'Không thể tạo biểu mẫu in phân công. Vui lòng thử lại.', type: 'error' });
    }
  };

  if (loading && !schedules.length) {
    return <PageSkeleton hasKPIs={true} kpiCount={5} variant="table" />;
  }

  return (
    <>
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type || 'danger'}
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

      <main className="w-full px-6 py-6 space-y-5 min-h-screen text-slate-900 dark:text-slate-100">
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

        {changeRequests.filter((request) => request.status === 'PENDING').length > 0 && (
          <section className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-2xs dark:border-amber-900/60 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-type-body font-semibold text-slate-900 dark:text-slate-100">Yêu cầu đổi ca chờ duyệt</h2>
                <p className="text-type-helper text-slate-600 dark:text-slate-300">Chỉ duyệt khi hệ thống tìm được giảng viên thay thế không trùng lịch và không báo bận.</p>
              </div>
              <span className="ui-pill rounded-full border border-amber-200 px-2 py-0.5 text-type-helper font-medium text-amber-700">{changeRequests.filter((request) => request.status === 'PENDING').length} chờ duyệt</span>
            </div>
            <div className="space-y-2">
              {changeRequests.filter((request) => request.status === 'PENDING').map((request) => (
                <div key={request.id} className="flex flex-col gap-3 rounded-xl border border-slate-200/90 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                  <div className="min-w-0">
                    <p className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">{request.requesterTeacher?.fullName} <span className="font-normal text-slate-500">({request.examSupervisor?.examScheduleRoom?.examSchedule?.subject?.subjectName})</span></p>
                    <p className="text-type-helper text-slate-600 dark:text-slate-400">Phòng {request.examSupervisor?.examScheduleRoom?.room?.roomCode} – Lý do: {request.reason}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="primary" size="sm" onClick={() => setReviewModalRequest(request)} leftIcon={<ArrowLeftRight className="h-3.5 w-3.5" />}>
                      Xử lý yêu cầu
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 3. Active Schedule Shift Banner & Actions (Gộp chung 1 hàng phẳng) ── */}
        <div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Trái: Thông tin Ca thi chuẩn mẫu */}
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 ui-pill rounded-full text-type-helper font-medium ui-pill-solid bg-blue-600 text-white tracking-wide">
                  {selectedSchedule?.type || 'CHÍNH THỨC'}
                </span>
                <h3 className="text-type-body font-semibold text-slate-900 dark:text-white truncate">
                  {selectedSchedule?.subject?.subjectName || selectedSchedule?.subjectName || 'Chưa chọn ca thi'}
                </h3>
                <span className="text-type-helper font-medium text-slate-400 dark:text-slate-500">
                  #{selectedSchedule?.subject?.subjectCode || selectedSchedule?.subjectCode || 'MH'}
                </span>

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

              <div className="flex items-center gap-2.5 text-type-helper text-slate-500 dark:text-slate-400 flex-wrap font-normal">
                {selectedSchedule && (
                  <>
                    {selectedSchedule.examDate && (
                      <span>{new Date(selectedSchedule.examDate).toLocaleDateString('vi-VN')}</span>
                    )}
                    {selectedSchedule.startTime && (
                      <>
                        {selectedSchedule.examDate && <MetaSeparator />}
                        <span>{selectedSchedule.startTime} – {selectedSchedule.endTime}</span>
                      </>
                    )}
                    <MetaSeparator />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {currentRooms.length} phòng thi
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Phải: Cụm Thao Tác (Tìm kiếm + Tự động + Phân công) NẰM CHUNG 1 HÀNG */}
            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              {/* Ô Tìm Kiếm tích hợp Filter Popover */}
              <div className="relative w-52 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Tìm GV, phòng thi..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 w-full rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-14 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setPage(1);
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-0.5"
                      title="Xóa tìm kiếm"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}

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
              </div>

              {currentUser?.role === 'ADMIN' && (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={previewAutoAssign}
                  disabled={autoLoading}
                >
                  Sắp xếp
                </Button>
              )}
            </div>
          </div>

          {/* Inline Expandable Proposal Panel */}
          <div
            className={`grid transition-all duration-300 ease-out ${
              activeInlinePanel === 'auto'
                ? 'grid-rows-[1fr] opacity-100 mt-5'
                : 'grid-rows-[0fr] opacity-0 pointer-events-none mt-0'
            }`}
          >
            <div className="overflow-hidden">
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

        {/* ── 4. Main Data Table or Empty State ── */}
        {loading ? (
          <div className="space-y-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : !paginatedSupervisors.length ? (
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-2xs space-y-3 flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShieldCheck className="h-6 w-6 stroke-[1.5]" />
            </div>
            <p className="text-type-body font-medium text-slate-700 dark:text-slate-300">
              Chưa có lượt phân công cán bộ coi thi nào cho ca thi này
            </p>
            <p className="text-type-helper text-slate-400 dark:text-slate-500 max-w-md font-normal">
              Bấm &ldquo;Sắp xếp&rdquo; để hệ thống tự động phân bổ cán bộ coi thi cho các phòng thi.
            </p>
          </div>
        ) : (
          <ExamSupervisorTable
            supervisors={paginatedSupervisors}
            selected={selected}
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
          page={page}
          totalPages={totalPages}
          totalItems={filteredSupervisors.length}
          limit={limit}
          onPage={setPage}
          onLimit={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />

        {/* Floating Bulk Action Bar */}
        <ExamSupervisorBulkAction
          selectedCount={selected.length}
          totalCount={filteredSupervisors.length}
          allSelected={selected.length === filteredSupervisors.length && filteredSupervisors.length > 0}
          onToggleAll={() =>
            setSelected(selected.length === filteredSupervisors.length ? [] : filteredSupervisors.map((s) => s.id))
          }
          onNotify={() => {
            setToast({ message: `Đã gửi thông báo nhắc ca thi cho ${selected.length} giám thị`, type: 'success' });
          }}
          onExport={() => {
            const selectedItems = filteredSupervisors.filter((s) => selected.includes(s.id));
            const columns = [
              { header: 'STT', width: 8, align: 'center' as const },
              { header: 'Mã GV', width: 15 },
              { header: 'Họ và tên', width: 25 },
              { header: 'Phòng thi', width: 20 },
              { header: 'Vai trò', width: 15, align: 'center' as const },
              { header: 'Trạng thái', width: 15, align: 'center' as const },
            ];
            const rows = selectedItems.map((s, idx) => {
              const roomObj = s.examScheduleRoom?.room || s.examScheduleRoom?.examRoom;
              const rName = roomObj?.roomName || roomObj?.name || roomObj?.roomCode || `Phòng #${s.examScheduleRoomId}`;
              return [
                idx + 1,
                s.teacher?.teacherCode || '',
                s.teacher?.fullName || '',
                rName,
                s.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2',
                s.status || 'PENDING',
              ];
            });
            exportToFormattedExcel({
              filename: 'Danh_sach_phan_cong_da_chon.xls',
              title: 'DANH SÁCH PHÂN CÔNG GIÁM THỊ ĐÃ CHỌN',
              subtitle: `Đã trích xuất ${selectedItems.length} lượt phân công`,
              columns,
              rows,
            });
            setToast({ message: `Đã xuất ${selected.length} phân công ra Excel`, type: 'success' });
          }}
          onDelete={handleBulkDelete}
          onClear={() => setSelected([])}
        />
      </main>

      {/* ── Schedule Picker Modal ── */}
      <SchedulePickerModal
        isOpen={showSchedulePicker}
        onClose={() => setShowSchedulePicker(false)}
        schedules={schedules}
        selectedScheduleId={String(selectedSchedule?.id || '')}
        onSelectSchedule={(schedId) => {
          void selectSchedule(schedId);
          setShowSchedulePicker(false);
        }}
      />

      {/* ── Supervisor Assignment Profile Drawer ── */}
      <ProfileDrawer
        isOpen={Boolean(drawerSupervisor)}
        onClose={() => setDrawerSupervisor(null)}
        title={drawerSupervisor?.teacher?.fullName || 'Chi tiết phân công giám thị'}
        subtitle={drawerSupervisor?.teacher?.teacherCode || ''}
        avatarText={getTeacherInitials(drawerSupervisor?.teacher?.fullName)}
        badge={drawerSupervisor?.status ? {
          status: drawerSupervisor.status === 'CONFIRMED' ? 'CONFIRMED' : drawerSupervisor.status === 'CHANGE_REQUESTED' ? 'CHANGE_REQUESTED' : 'ASSIGNED',
          label: drawerSupervisor.status === 'CONFIRMED' ? 'Đã xác nhận' : drawerSupervisor.status === 'CHANGE_REQUESTED' ? 'Đề nghị thay đổi' : 'Đã phân công',
        } : undefined}
        details={[
          { label: 'Họ và tên cán bộ', value: drawerSupervisor?.teacher?.fullName, icon: GraduationCap },
          { label: 'Mã số cán bộ', value: <IdentifierBadge tone="neutral">{drawerSupervisor?.teacher?.teacherCode || 'GV'}</IdentifierBadge>, icon: GraduationCap },
          { label: 'Học vị / Học hàm', value: drawerSupervisor?.teacher?.degree || 'Thạc sĩ / Tiến sĩ', icon: GraduationCap },
          { label: 'Khoa / Bộ môn', value: drawerSupervisor?.teacher?.department?.name || '—', icon: GraduationCap },
          { label: 'Vai trò coi thi', value: drawerSupervisor?.role === 'CHINH' || drawerSupervisor?.role === 'SUPERVISOR_1' ? 'Giám thị chính' : 'Giám thị phụ', icon: ShieldCheck },
          { label: 'Phòng coi thi', value: `${drawerSupervisor?.examScheduleRoom?.room?.roomName || drawerSupervisor?.examScheduleRoom?.room?.roomCode || `Phòng #${drawerSupervisor?.examScheduleRoomId}`} ${drawerSupervisor?.examScheduleRoom?.room?.building ? `(${drawerSupervisor?.examScheduleRoom?.room?.building})` : ''}`, icon: DoorOpen },
          { label: 'Môn thi', value: drawerSupervisor?.examScheduleRoom?.examSchedule?.subject?.subjectName || selectedSchedule?.subject?.subjectName || '—', icon: Calendar },
          { label: 'Ngày thi', value: drawerSupervisor?.examScheduleRoom?.examSchedule?.examDate ? new Date(drawerSupervisor?.examScheduleRoom?.examSchedule?.examDate).toLocaleDateString('vi-VN') : selectedSchedule?.examDate ? new Date(selectedSchedule.examDate).toLocaleDateString('vi-VN') : '—', icon: Calendar },
          { label: 'Khung giờ thi', value: `${drawerSupervisor?.examScheduleRoom?.examSchedule?.startTime || selectedSchedule?.startTime || ''} – ${drawerSupervisor?.examScheduleRoom?.examSchedule?.endTime || selectedSchedule?.endTime || ''}`, icon: Clock },
          { label: 'Trạng thái', value: drawerSupervisor?.status === 'CONFIRMED' ? 'Đã xác nhận' : drawerSupervisor?.status === 'CHANGE_REQUESTED' ? 'Đề nghị thay đổi' : 'Đã phân công', icon: ShieldCheck },
        ]}
      />

      {/* ── Review Supervisor Change Request Modal ── */}
      <ReviewSupervisorChangeModal
        isOpen={Boolean(reviewModalRequest)}
        request={reviewModalRequest}
        onClose={() => setReviewModalRequest(null)}
        onSuccess={(msg) => {
          setToast({ message: msg, type: 'success' });
          void fetchData(true);
        }}
      />
    </>
  );
}
