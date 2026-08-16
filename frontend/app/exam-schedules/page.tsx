'use client';
import { FilterSelect } from '../../components/ui/FilterSelect';

import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { exportToFormattedExcel } from '../../lib/export-excel';
import { printReport } from '../../lib/export-print';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ExcelImportModal } from '../../components/ExcelImportModal';
import { ProfileDrawer } from '../../components/ProfileDrawer';
import { Button } from '../../components/ui/Button';
import { ExamSchedule, ExamPeriod, ExamRoom } from '../../types';

import { ExamScheduleHeader } from '../../components/exam-schedules/ExamScheduleHeader';
import { ExamScheduleKPICards } from '../../components/exam-schedules/ExamScheduleKPICards';
import { ExamScheduleFilterPopover, ExamScheduleFilterValues } from '../../components/exam-schedules/ExamScheduleFilterPopover';
import { ExamScheduleTableToolbar } from '../../components/exam-schedules/ExamScheduleTableToolbar';
import { ExamScheduleBulkAction } from '../../components/exam-schedules/ExamScheduleBulkAction';
import { ExamScheduleTable, ExamScheduleItemExtended, computeShiftName, computeScheduleStatus } from '../../components/exam-schedules/ExamScheduleTable';
import { ExamSchedulePaginationBar } from '../../components/exam-schedules/ExamSchedulePaginationBar';
import { Calendar, Clock, Building, Users, AlertTriangle, FileSpreadsheet, Search, X } from 'lucide-react';

function calculateEndTime(startTime: string, durationMinutes: number): string {
  if (!startTime) return '08:30';
  const parts = startTime.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return '08:30';

  const [h, m] = parts;
  const totalM = h * 60 + m + durationMinutes;
  const endH = Math.floor(totalM / 60) % 24;
  const endM = totalM % 60;

  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export default function ExamSchedulesPage() {
  usePageTitle('Quản lý lịch thi');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [schedules, setSchedules] = useState<ExamScheduleItemExtended[]>([]);
  const [periods, setPeriods] = useState<ExamPeriod[]>([]);
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterValues, setFilterValues] = useState<ExamScheduleFilterValues>({
    search: '',
    examPeriodId: '',
    shift: '',
    roomId: '',
    examDate: '',
    status: '',
    semester: '',
    schoolYear: '',
    supervisorId: '',
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [sortOrder, setSortOrder] = useState('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    code: true,
    period: true,
    shift: true,
    room: true,
    date: true,
    time: true,
    students: true,
    supervisors: true,
    status: true,
  });

  const handleColumnToggle = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [selected, setSelected] = useState<number[]>([]);
  const [drawerSchedule, setDrawerSchedule] = useState<ExamScheduleItemExtended | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExamScheduleItemExtended | null>(null);

  const [formData, setFormData] = useState({
    examPeriodId: '',
    subjectId: '',
    shiftName: 'Ca 1 - Sáng',
    examDate: new Date().toISOString().split('T')[0],
    startTime: '07:30',
    endTime: '08:30',
    examType: 'TRAC_NGHIEM',
    mode: 'OFFICIAL' as 'OFFICIAL' | 'MOCK',
  });
  const [selectedDuration, setSelectedDuration] = useState<number>(60);

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

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [resPeriods, resRooms, resSubjects, resSchedules] = await Promise.all([
        api.get('/exam-periods').catch(() => ({ data: [] })),
        api.get('/exam-rooms').catch(() => ({ data: [] })),
        api.get('/subjects').catch(() => ({ data: [] })),
        api.get('/exam-schedules').catch(() => ({ data: [] })),
      ]);

      const realPeriods = resPeriods.data || [];
      const realRooms = resRooms.data || [];
      const realSubjects = resSubjects.data || [];
      const rawSchedules = resSchedules.data || [];

      setPeriods(realPeriods);
      setRooms(realRooms);
      setSubjects(realSubjects);

      if (Array.isArray(rawSchedules)) {
        const mappedRealSchedules: ExamScheduleItemExtended[] = rawSchedules.map((s: any) => ({
          ...s,
          code: s.code || `LCT${String(s.id).padStart(6, '0')}`,
          periodName: s.examPeriod?.name || s.periodName || (realPeriods.find((p: any) => p.id === s.examPeriodId)?.name) || 'Chưa gán kỳ thi',
          shiftName: computeShiftName(s.startTime, s.shiftName),
          roomName: s.roomName || (s.examScheduleRooms?.[0]?.examRoom?.roomCode || s.examScheduleRooms?.[0]?.examRoom?.name) || 'Chưa xếp phòng',
          studentCount: s.studentCount ?? 0,
          supervisorCount: s.supervisorCount ?? '0/0',
          statusBadge: computeScheduleStatus(s),
        }));
        setSchedules(mappedRealSchedules);
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải dữ liệu lịch thi', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
    void fetchInitialData();
  }, [fetchInitialData, router]);

  const handleRefresh = async () => {
    await fetchInitialData();
    setToast({ message: 'Đã cập nhật và làm mới dữ liệu mới nhất!', type: 'success' });
  };

  // Compute DYNAMIC KPI Counts from REAL API DATA using Real-time status
  const counts = useMemo(() => {
    const total = schedules.length;
    const upcoming = schedules.filter((s) => computeScheduleStatus(s) === 'UPCOMING').length;
    const ongoing = schedules.filter((s) => computeScheduleStatus(s) === 'ONGOING').length;
    const completed = schedules.filter((s) => computeScheduleStatus(s) === 'COMPLETED').length;
    const cancelled = schedules.filter((s) => computeScheduleStatus(s) === 'CANCELLED').length;
    return { total, upcoming, ongoing, completed, cancelled };
  }, [schedules]);

  // Filtered & Sorted Schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (filterValues.search) {
        const q = filterValues.search.toLowerCase();
        const codeMatch = (s.code || '').toLowerCase().includes(q);
        const periodMatch = (s.periodName || s.examPeriod?.name || '').toLowerCase().includes(q);
        const roomMatch = (s.roomName || '').toLowerCase().includes(q);
        if (!codeMatch && !periodMatch && !roomMatch) return false;
      }

      if (filterValues.status) {
        const currentStatus = computeScheduleStatus(s);
        if (currentStatus !== filterValues.status) return false;
      }

      if (filterValues.examPeriodId) {
        if (String(s.examPeriodId) !== filterValues.examPeriodId) return false;
      }

      if (filterValues.roomId) {
        const targetRoom = rooms.find((r) => String(r.id) === filterValues.roomId);
        const rName = targetRoom?.roomCode || targetRoom?.code || targetRoom?.name || '';
        const matchesRoom =
          s.examScheduleRooms?.some((r: any) => String(r.examRoomId || r.roomId || r.id) === filterValues.roomId) ||
          Boolean(s.roomName && (s.roomName.includes(rName) || (targetRoom?.name && s.roomName.includes(targetRoom.name))));
        if (!matchesRoom) return false;
      }

      if (filterValues.shift) {
        const targetShift =
          filterValues.shift === 'CA_1'
            ? 'Ca 1'
            : filterValues.shift === 'CA_2'
            ? 'Ca 2'
            : filterValues.shift === 'CA_3'
            ? 'Ca 3'
            : filterValues.shift === 'CA_4'
            ? 'Ca 4'
            : filterValues.shift;
        if (!s.shiftName?.toLowerCase().includes(targetShift.toLowerCase())) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'newest') return b.id - a.id;
      if (sortOrder === 'oldest') return a.id - b.id;
      return 0;
    });
  }, [schedules, rooms, filterValues, sortOrder]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredSchedules.length / limit));
  const paginatedSchedules = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredSchedules.slice(start, start + limit);
  }, [filteredSchedules, page, limit]);

  // Action Handlers
  const getCurrentTimeFormatted = () => {
    const now = new Date();
    const minutes = Math.ceil(now.getMinutes() / 5) * 5;
    now.setMinutes(minutes);
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes() % 60).padStart(2, '0');
    return `${h}:${m}`;
  };

  const openAddModal = () => {
    setEditingSchedule(null);
    const defaultStart = getCurrentTimeFormatted();
    const duration = 60;
    setSelectedDuration(duration);

    // Tự động chọn Kỳ thi đang lọc trên trang, hoặc kỳ thi đang diễn ra/sắp tới làm mặc định
    const defaultPeriodId =
      (filterValues.examPeriodId && String(filterValues.examPeriodId) !== '' ? String(filterValues.examPeriodId) : null) ||
      (periods.find((p: any) => p.status === 'ACTIVE' || p.status === 'UPCOMING')?.id ? String(periods.find((p: any) => p.status === 'ACTIVE' || p.status === 'UPCOMING').id) : null) ||
      (periods[0]?.id ? String(periods[0].id) : '');

    setFormData({
      examPeriodId: defaultPeriodId,
      subjectId: subjects[0]?.id ? String(subjects[0].id) : '',
      shiftName: computeShiftName(defaultStart),
      examDate: new Date().toISOString().split('T')[0],
      startTime: defaultStart,
      endTime: calculateEndTime(defaultStart, duration),
      examType: 'TRAC_NGHIEM',
      mode: 'OFFICIAL',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (s: ExamScheduleItemExtended) => {
    setEditingSchedule(s);
    const startT = s.startTime || '07:30';
    let duration = 60;

    if (s.startTime && s.endTime) {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff > 0) duration = diff;
      }
    }
    setSelectedDuration(duration);

    setFormData({
      examPeriodId: s?.examPeriodId ? String(s.examPeriodId) : (periods[0]?.id ? String(periods[0].id) : ''),
      subjectId: s?.subjectId ? String(s.subjectId) : (subjects[0]?.id ? String(subjects[0].id) : ''),
      shiftName: computeShiftName(startT, s?.shiftName),
      examDate: s?.examDate ? new Date(s.examDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      startTime: startT,
      endTime: s?.endTime || calculateEndTime(startT, duration),
      examType: s?.examType || 'TRAC_NGHIEM',
      mode: (s as any)?.mode === 'MOCK' ? 'MOCK' : 'OFFICIAL',
    });
    setIsModalOpen(true);
  };

  const isPastTime = useMemo(() => {
    if (!formData.examDate || !formData.startTime) return false;
    const selectedDateTime = new Date(`${formData.examDate}T${formData.startTime}:00`);
    return selectedDateTime < new Date();
  }, [formData.examDate, formData.startTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.examPeriodId || !formData.subjectId) {
      setToast({ message: 'Vui lòng chọn Kỳ thi và Môn học hợp lệ!', type: 'error' });
      return;
    }

    if (isPastTime) {
      setToast({ message: 'Không thể tạo hoặc lưu lịch thi trong quá khứ! Vui lòng chọn ngày giờ trong tương lai.', type: 'error' });
      return;
    }

    const payload = {
      examPeriodId: Number(formData.examPeriodId),
      subjectId: Number(formData.subjectId),
      examDate: formData.examDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      examType: formData.examType || 'TRAC_NGHIEM',
      mode: formData.mode || 'OFFICIAL',
    };

    try {
      if (editingSchedule) {
        await api.patch(`/exam-schedules/${editingSchedule.id}`, payload);
        setToast({ message: 'Cập nhật lịch thi thành công!', type: 'success' });
      } else {
        await api.post('/exam-schedules', payload);
        setToast({ message: 'Tạo lịch thi mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      await fetchInitialData();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Lưu lịch thi thất bại';
      setToast({ message: Array.isArray(errMsg) ? errMsg.join(', ') : errMsg, type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    const item = schedules.find((s) => s.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Xóa lịch thi',
      message: `Bạn có chắc chắn muốn xóa lịch thi ${item?.code || ''} (${item?.periodName || ''})?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/exam-schedules/${id}`);
          setSchedules((prev) => prev.filter((x) => x.id !== id));
          setToast({ message: 'Đã xóa lịch thi thành công!', type: 'success' });
        } catch (error: any) {
          setToast({ message: error?.response?.data?.message || error?.message || 'Không thể xóa lịch thi. Vui lòng kiểm tra các dữ liệu liên quan.', type: 'error' });
        }
      },
    });
  };

  const exportExcel = () => {
    const columns = [
      { header: 'STT', width: 8, align: 'center' as const },
      { header: 'Mã lịch thi', width: 15 },
      { header: 'Kỳ thi', width: 30 },
      { header: 'Ca thi', width: 15 },
      { header: 'Phòng thi', width: 15 },
      { header: 'Ngày thi', width: 15, align: 'center' as const },
      { header: 'Giờ bắt đầu', width: 15, align: 'center' as const },
      { header: 'Giờ kết thúc', width: 15, align: 'center' as const },
      { header: 'Số TS', width: 10, align: 'center' as const },
      { header: 'Giám thị', width: 12, align: 'center' as const },
      { header: 'Trạng thái', width: 15, align: 'center' as const },
    ];

    const rows = filteredSchedules.map((s, idx) => [
      idx + 1,
      s.code || `LCT${String(s.id).padStart(6, '0')}`,
      s.periodName || s.examPeriod?.name || '',
      s.shiftName || '—',
      s.roomName || 'Chưa xếp phòng',
      s.examDate ? new Date(s.examDate).toLocaleDateString('vi-VN') : '',
      s.startTime || '',
      s.endTime || '',
      s.studentCount ?? 0,
      s.supervisorCount ?? '0/0',
      s.statusBadge === 'UPCOMING' ? 'Sắp diễn ra' : s.statusBadge === 'ONGOING' ? 'Đang diễn ra' : 'Đã diễn ra',
    ]);

    exportToFormattedExcel({
      filename: 'Xep_lich_thi.xls',
      title: 'DANH SÁCH XẾP LỊCH THI HỆ THỐNG',
      subtitle: 'Trích xuất dữ liệu điều phối ca thi',
      columns,
      rows,
    });
  };

  const handlePrintReport = () => {
    printReport({
      title: 'BÁO CÁO KẾ HOẠCH XẾP LỊCH THI',
      subtitle: 'Danh sách chi tiết ca thi và bố trí phòng thi',
      metaInfo: [
        { label: 'Tổng số lịch thi', value: String(counts.total) },
        { label: 'Sắp diễn ra', value: String(counts.upcoming) },
      ],
      columns: [
        { header: 'STT', width: '40px' },
        { header: 'Mã lịch', width: '90px' },
        { header: 'Kỳ thi', width: '180px' },
        { header: 'Phòng', width: '70px', align: 'center' },
        { header: 'Ngày thi', width: '100px', align: 'center' },
        { header: 'Thời gian', width: '110px', align: 'center' },
        { header: 'Trạng thái', width: '100px', align: 'center' },
      ],
      rows: filteredSchedules.map((s, idx) => [
        idx + 1,
        s.code || `LCT${String(s.id).padStart(6, '0')}`,
        s.periodName || '',
        s.roomName || '',
        s.examDate ? new Date(s.examDate).toLocaleDateString('vi-VN') : '',
        `${s.startTime || '—'} - ${s.endTime || '—'}`,
        s.statusBadge === 'UPCOMING' ? 'Sắp diễn ra' : 'Đã diễn ra',
      ]),
    });
  };

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
        {/* Header */}
        <ExamScheduleHeader
          onAdd={openAddModal}
          onExport={exportExcel}
          onPrint={handlePrintReport}
          isAdmin={currentUser?.role === 'ADMIN'}
        />

        {/* Dynamic KPI Cards Row calculated from REAL API data */}
        <ExamScheduleKPICards
          total={counts.total}
          upcoming={counts.upcoming}
          completed={counts.completed}
          ongoing={counts.ongoing}
          cancelled={counts.cancelled}
        />

        {/* Search & Unified Smart Filter Popover Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left: Search input + 1 Unified Filter Button */}
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            {/* Search Input Field */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Tìm theo mã lịch thi, môn học, phòng thi, kỳ thi..."
                value={filterValues.search}
                onChange={(e) => {
                  setFilterValues({ ...filterValues, search: e.target.value });
                  setPage(1);
                }}
                className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-9 text-[15px] font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
              />
              {filterValues.search ? (
                <button
                  type="button"
                  onClick={() => {
                    setFilterValues({ ...filterValues, search: '' });
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

            {/* 1 Nút Bộ Lọc Duy Nhất Đa Chiều */}
            <ExamScheduleFilterPopover
              filters={filterValues}
              onChange={(next) => {
                setFilterValues(next);
                setPage(1);
              }}
              periods={periods}
              rooms={rooms}
              schedules={schedules}
              totalFilteredCount={filteredSchedules.length}
              onResetAll={() => {
                setFilterValues({
                  search: '',
                  examPeriodId: '',
                  shift: '',
                  roomId: '',
                  examDate: '',
                  status: '',
                  semester: '',
                  schoolYear: '',
                  supervisorId: '',
                });
                setPage(1);
              }}
            />
          </div>

          {/* Right: Table Action Controls (Sort, Column Toggle, View Mode Switch, Refresh) */}
          <div className="shrink-0">
            <ExamScheduleTableToolbar
              totalCount={filteredSchedules.length}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              visibleColumns={visibleColumns}
              onColumnToggle={handleColumnToggle}
              onRefresh={handleRefresh}
              loading={loading}
            />
          </div>
        </div>

        {/* DataGrid Table */}
        {loading ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : !paginatedSchedules.length ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-semibold shadow-2xs">
            Không tìm thấy lịch thi phù hợp.
          </div>
        ) : (
          <ExamScheduleTable
            schedules={paginatedSchedules}
            selected={selected}
            viewMode={viewMode}
            visibleColumns={visibleColumns}
            onSelect={(id, checked) =>
              setSelected(checked ? [...selected, id] : selected.filter((x) => x !== id))
            }
            onSelectAll={(checked) =>
              setSelected(checked ? paginatedSchedules.map((s) => s.id) : [])
            }
            onDetail={setDrawerSchedule}
            onEdit={openEditModal}
            onDelete={handleDelete}
            isAdmin={currentUser?.role === 'ADMIN'}
          />
        )}

        {/* Dynamic Pagination Footer */}
        <ExamSchedulePaginationBar
          page={page}
          totalPages={totalPages}
          limit={limit}
          totalItems={filteredSchedules.length}
          onPage={setPage}
          onLimit={(v) => {
            setLimit(v);
            setPage(1);
          }}
        />

        {/* Floating Bulk Action Bar */}
        <ExamScheduleBulkAction
          selectedCount={selected.length}
          totalCount={filteredSchedules.length}
          allSelected={selected.length === filteredSchedules.length && filteredSchedules.length > 0}
          onToggleAll={() =>
            setSelected(selected.length === filteredSchedules.length ? [] : filteredSchedules.map((s) => s.id))
          }
          onAssignSupervisors={() => setToast({ message: `Đã mở phân công cho ${selected.length} ca thi`, type: 'success' })}
          onChangeRoom={() => setToast({ message: `Đã chọn đổi phòng cho ${selected.length} ca thi`, type: 'success' })}
          onChangeShift={() => setToast({ message: `Đã chọn đổi ca cho ${selected.length} ca thi`, type: 'success' })}
          onDelete={() => {
            const count = selected.length;
            setConfirmModal({
              isOpen: true,
      title: 'Xóa hàng loạt lịch thi',
              message: `Bạn có chắc chắn muốn xóa ${count} ca thi đã chọn? Hành động này không thể hoàn tác.`,
              type: 'danger',
              onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                  const results = await Promise.allSettled(selected.map((id) => api.delete(`/exam-schedules/${id}`)));
                  const deletedIds = selected.filter((_, index) => results[index].status === 'fulfilled');
                  const failedCount = count - deletedIds.length;
                  if (deletedIds.length) setSchedules((prev) => prev.filter((item) => !deletedIds.includes(item.id)));
                  setToast({
                    message: failedCount
                      ? `Đã xóa ${deletedIds.length}/${count} ca thi. ${failedCount} ca không thể xóa do còn dữ liệu liên quan hoặc không hợp lệ.`
                      : `Đã xóa ${count} ca thi đã chọn!`,
                    type: failedCount ? 'error' : 'success',
                  });
                } finally {
                  setSelected([]);
                }
              },
            });
          }}
          onExport={exportExcel}
          onClear={() => setSelected([])}
        />
      </main>

      {/* Edit/Add Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchedule ? 'Chỉnh sửa lịch thi' : 'Tạo lịch thi mới'}
        size="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[15px] font-medium text-slate-500 mb-1">
                Kỳ thi <span className="text-red-500">*</span>
              </label>
              <FilterSelect containerClassName="w-full"
                required
                value={formData.examPeriodId}
                onChange={(e) => setFormData({ ...formData, examPeriodId: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-[15px] focus:border-blue-500 focus:outline-none bg-white font-medium"
              >
                {periods.length === 0 ? (
                  <option value="">-- Chưa có kỳ thi nào --</option>
                ) : (
                  periods.map((p) => {
                    const hasSemester = p.semester && p.name.includes(p.semester);
                    const hasYear = p.schoolYear && p.name.includes(p.schoolYear);
                    const isRedundant = hasSemester && hasYear;
                    const label = isRedundant
                      ? p.name
                      : `${p.name} (${[p.semester, p.schoolYear].filter(Boolean).join(' - ')})`;
                    return (
                      <option key={p.id} value={p.id}>
                        {label}
                      </option>
                    );
                  })
                )}
              </FilterSelect>
            </div>

            <div>
              <label className="block text-[15px] font-medium text-slate-500 mb-1">
                Môn học / Môn thi <span className="text-red-500">*</span>
              </label>
              <FilterSelect 
                required
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-[15px] focus:border-blue-500 focus:outline-none bg-white font-medium"
              >
                {subjects.length === 0 ? (
                  <option value="">-- Chưa có môn học nào --</option>
                ) : (
                  subjects.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.subjectCode ? `[${sub.subjectCode}] ` : ''}{sub.subjectName || sub.name}
                    </option>
                  ))
                )}
              </FilterSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[15px] font-medium text-slate-500 mb-1">
                Loại ca thi (Chế độ dự thi) <span className="text-red-500">*</span>
              </label>
              <FilterSelect containerClassName="w-full"
                required
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value as 'OFFICIAL' | 'MOCK' })}
                className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-[15px] focus:border-blue-500 focus:outline-none bg-white font-semibold text-blue-700 shadow-2xs"
              >
                <option value="OFFICIAL">Thi chính thức (Xếp SBD & Phòng thi)</option>
                <option value="MOCK">Thi thử (Dự thi tự do online)</option>
              </FilterSelect>
            </div>

            <div>
              <label className="block text-[15px] font-medium text-slate-500 mb-1">
                Hình thức thi <span className="text-red-500">*</span>
              </label>
              <FilterSelect 
                required
                value={formData.examType}
                onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-[15px] focus:border-blue-500 focus:outline-none bg-white font-semibold text-slate-900"
              >
                <option value="TRAC_NGHIEM">Trắc nghiệm</option>
                <option value="DIEN_LO">Điền khuyết (Điền vào chỗ trống)</option>
                <option value="TU_LUAN">Tự luận</option>
              </FilterSelect>
            </div>
          </div>

          {/* Quick Duration Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[15px] font-medium text-slate-500">Thời lượng thi (Tự động tính Giờ kết thúc)</label>
              <span className="text-xs font-semibold text-slate-500">
                Đang chọn: <span className="font-semibold text-blue-600">{selectedDuration} phút</span>
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[45, 60, 90, 120].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setSelectedDuration(d);
                    setFormData((prev) => ({
                      ...prev,
                      endTime: calculateEndTime(prev.startTime, d),
                    }));
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                    selectedDuration === d
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {d} phút
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[15px] font-medium text-slate-500 mb-1">Ngày thi</label>
              <input
                type="date"
                required
                value={formData.examDate}
                onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-[15px] focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[15px] font-medium text-slate-500 mb-1">Giờ bắt đầu</label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => {
                  const newStart = e.target.value;
                  const newShift = computeShiftName(newStart);
                  const newEnd = calculateEndTime(newStart, selectedDuration);
                  setFormData({
                    ...formData,
                    startTime: newStart,
                    shiftName: newShift,
                    endTime: newEnd,
                  });
                }}
                className="w-full h-10 rounded-xl border border-slate-200 px-3.5 text-[15px] focus:border-blue-500 focus:outline-none font-semibold text-blue-700"
              />
            </div>
            <div>
              <label className="block text-[15px] font-medium text-slate-500 mb-1">Giờ kết thúc (Tự động)</label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full h-10 rounded-xl border border-blue-200 bg-blue-50/40 px-3.5 text-[15px] focus:border-blue-500 focus:outline-none font-semibold text-blue-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {!editingSchedule ? (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {
                  setIsModalOpen(false);
                  setIsImportModalOpen(true);
                }}
                leftIcon={<FileSpreadsheet className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
              >
                Import Excel
              </Button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setIsModalOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isPastTime}
              >
                {editingSchedule ? 'Cập nhật lịch thi' : 'Lưu lịch thi'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import danh sách lịch thi từ Excel"
        templateFileName="danh_sach_lich_thi_mau.csv"
        onImportSuccess={async () => {
          await fetchInitialData();
          setToast({ message: 'Nhập danh sách lịch thi từ file thành công!', type: 'success' });
        }}
      />

      {/* Quick View Profile Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerSchedule)}
        onClose={() => setDrawerSchedule(null)}
        title={drawerSchedule?.subjectName || drawerSchedule?.periodName || 'Chi tiết ca thi'}
        subtitle={`Mã ca thi: ${drawerSchedule?.code || ''}`}
        avatarText={drawerSchedule?.subjectCode?.slice(0, 3) || 'LCT'}
        badge={{
          label: drawerSchedule?.statusBadge === 'UPCOMING' ? 'Sắp diễn ra' : drawerSchedule?.statusBadge === 'ONGOING' ? 'Đang diễn ra' : 'Đã hoàn thành',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        }}
        details={[
          { label: 'Kỳ thi', value: drawerSchedule?.periodName, icon: Calendar },
          { label: 'Môn thi', value: drawerSchedule?.subjectName ? `${drawerSchedule.subjectName} (${drawerSchedule.subjectCode || ''})` : '---', icon: Calendar },
          { label: 'Hình thức thi', value: drawerSchedule?.examType === 'TRAC_NGHIEM' ? 'Trắc nghiệm' : drawerSchedule?.examType === 'TU_LUAN' ? 'Tự luận' : drawerSchedule?.examType || 'Trắc nghiệm', icon: Clock },
          { label: 'Ca thi', value: drawerSchedule?.shiftName, icon: Clock },
          { label: 'Phòng thi', value: drawerSchedule?.roomName || '---', icon: Building },
          {
            label: 'Ngày thi',
            value: drawerSchedule?.examDate ? new Date(drawerSchedule.examDate).toLocaleDateString('vi-VN') : '---',
            icon: Calendar,
          },
          { label: 'Khung giờ thi', value: `${drawerSchedule?.startTime} - ${drawerSchedule?.endTime}`, icon: Clock },
          { label: 'Số lượng thí sinh', value: `${(drawerSchedule as any)?._count?.examRoomStudents ?? drawerSchedule?.studentCount ?? 0} thí sinh`, icon: Users },
          { label: 'Cán bộ giám thị', value: `${drawerSchedule?.supervisorCount || '2/2'} cán bộ`, icon: Users },
        ]}
      />

      {/* Confirm Popup */}
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
