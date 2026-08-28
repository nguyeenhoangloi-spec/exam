'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { usePageTitle } from '../../../components/PageTitleContext';
import { downloadCsv } from '../../../lib/export-csv';
import { exportToFormattedExcel } from '../../../lib/export-excel';
import { printReport } from '../../../lib/export-print';
import { Toast } from '../../../components/Toast';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { ProfileDrawer } from '../../../components/ProfileDrawer';
import {
  Button,
  DataActionsDropdown,
  IdentifierBadge,
  TabBar,
  PaginationBar,
  SortDropdown,
  ColumnToggleDropdown,
  StatusBadge,
} from '../../../components/ui';
import { TeacherAssignmentBulkAction } from '../../../components/exam-supervisors/TeacherAssignmentBulkAction';
import { DutyAvailabilityModal } from '../../../components/exam-supervisors/DutyAvailabilityModal';
import { SupervisorChangeRequestModal } from '../../../components/exam-supervisors/SupervisorChangeRequestModal';
import { ViewModeSegmentedControl } from '../../../components/ui/ViewModeSegmentedControl';
import { TeacherAssignmentCalendarView } from '../../../components/teacher/TeacherAssignmentCalendarView';
import {
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Download,
  Printer,
  Award,
  BookOpen,
  DoorOpen,
  UserCheck,
  Eye,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Lock,
  SlidersHorizontal,
  ChevronDown,
  List,
  LayoutGrid,
  Layers,
  Check,
  Search,
  X,
  ArrowLeftRight,
} from 'lucide-react';

export default function TeacherAssignmentsPage() {
  usePageTitle('Lịch coi thi');
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [drawerDuty, setDrawerDuty] = useState<any | null>(null);

  // Modal States
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [changeRequestAssignment, setChangeRequestAssignment] = useState<any | null>(null);

  // Filters, Search, Selection & Pagination State
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
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

  // Toolbar Controls State
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    subject: true,
    time: true,
    room: true,
    role: true,
    status: true,
    actions: true,
  });

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
    type: 'warning',
    onConfirm: () => { },
  });

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setCurrentUser(u);
    fetchMyAssignments();
  }, [router]);

  const fetchMyAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teachers/my-assignments');
      setAssignments(res.data || []);
    } catch (err: any) {
      setToast({ message: err.message || 'Lỗi tải lịch coi thi', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (id: number, status: string) => {
    const item = assignments.find((a) => a.id === id);
    const isConfirm = status === 'CONFIRMED';
    setConfirmModal({
      isOpen: true,
      title: isConfirm ? 'Xác nhận tham gia ca coi thi?' : 'Gửi yêu cầu đổi ca coi thi?',
      message: isConfirm
        ? `Bạn có chắc chắn xác nhận tham gia ca coi thi môn ${item?.subjectName || ''} (${item?.startTime || ''} - ${item?.endTime || ''}, phòng ${item?.roomName || item?.roomCode || ''})?`
        : `Bạn có chắc chắn gửi yêu cầu xin đổi ca coi thi môn ${item?.subjectName || ''} (${item?.startTime || ''} - ${item?.endTime || ''}, phòng ${item?.roomName || item?.roomCode || ''})?`,
      type: isConfirm ? 'success' : 'warning',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setBusyId(id);
        try {
          await api.post(`/teachers/my-assignments/${id}/confirm`);
          setToast({
            message: status === 'CONFIRMED' ? 'Đã xác nhận tham gia ca coi thi!' : 'Đã gửi yêu cầu xin đổi ca coi thi.',
            type: 'success',
          });
          await fetchMyAssignments();
        } catch (err: any) {
          setToast({ message: err.message || 'Cập nhật trạng thái thất bại.', type: 'error' });
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  const handleRequestChange = (item: any) => {
    setChangeRequestAssignment(item);
  };

  const handleRegisterAvailability = () => {
    setIsAvailabilityModalOpen(true);
  };

  const handlePrintAttendance = async (item: any) => {
    try {
      const res = await api.get(`/teachers/my-assignments/${item.id}/attendance-sheet`);
      const data = res.data;
      printReport({
        title: 'DANH SÁCH ĐIỂM DANH & KÝ TÊN THÍ SINH',
        subtitle: `Học kỳ: ${data.schedule.periodName || 'HỌC KỲ I'} - Môn thi: ${data.schedule.subjectCode} - ${data.schedule.subjectName}`,
        facultyName: 'HỘI ĐỒNG KHẢO THÍ & ĐẢM BẢO CHẤT LƯỢNG',
        metaInfo: [
          { label: 'Môn thi', value: `${data.schedule.subjectCode} - ${data.schedule.subjectName}` },
          { label: 'Ngày thi', value: new Date(data.schedule.examDate).toLocaleDateString('vi-VN') },
          { label: 'Ca thi / Khung giờ', value: `${data.schedule.startTime} - ${data.schedule.endTime}` },
          { label: 'Phòng thi', value: `${data.room.roomCode} (${data.room.building || 'Nhà A'})` },
          { label: 'Cán bộ coi thi', value: data.role === 'SUPERVISOR_1' ? 'Giám thị 1 (Chính)' : 'Giám thị 2' },
          { label: 'Tổng số thí sinh', value: `${data.students?.length || 0} thí sinh` },
        ],
        columns: [
          { header: 'STT', width: '40px' },
          { header: 'SBD', width: '50px', align: 'center' },
          { header: 'Số ghế', width: '55px', align: 'center' },
          { header: 'Mã SV', width: '100px', align: 'center' },
          { header: 'Họ và Tên thí sinh', width: '180px' },
          { header: 'Lớp', width: '100px', align: 'center' },
          { header: 'Số tờ', width: '50px', align: 'center' },
          { header: 'Chữ ký thí sinh', width: '120px', align: 'center' },
        ],
        rows: (data.students || []).map((st: any, idx: number) => [
          idx + 1,
          st.examNumber || idx + 1,
          st.seatNumber || idx + 1,
          st.studentCode,
          st.fullName,
          st.className || '---',
          '',
          '',
        ]),
        signers: [
          { title: 'CÁN BỘ COI THI 1', subtitle: '(Ký, ghi rõ họ tên)' },
          { title: 'CÁN BỘ COI THI 2', subtitle: '(Ký, ghi rõ họ tên)' },
        ],
        footerNotes: 'Cán bộ coi thi chịu trách nhiệm kiểm tra thẻ dự thi và đối chiếu chữ ký thí sinh khi thu bài.',
        templateCode: 'ROOM_ATTENDANCE_SHEET',
      });
    } catch (err: any) {
      setToast({ message: err.message || 'Không thể tải danh sách điểm danh.', type: 'error' });
    }
  };

  const exportExcel = async () => {
    await exportToFormattedExcel({
      filename: `Lich_coi_thi_${currentUser?.teacher?.teacherCode || currentUser?.username || 'giang_vien'}`,
      templateCode: 'SUPERVISOR_ASSIGNMENT',
      title: 'LỊCH PHÂN CÔNG COI THI',
      subtitle: `Giảng viên: ${currentUser?.fullName || currentUser?.teacher?.fullName || currentUser?.username || ''} · Mã GV: ${currentUser?.teacher?.teacherCode || currentUser?.teacherCode || currentUser?.username || ''}`,
      columns: [
        { header: 'STT', width: 6, align: 'center' },
        { header: 'Mã môn', width: 14, align: 'center' },
        { header: 'Tên môn thi', width: 30, align: 'left' },
        { header: 'Vai trò', width: 16, align: 'center' },
        { header: 'Trạng thái', width: 16, align: 'center' },
        { header: 'Ngày thi', width: 14, align: 'center' },
        { header: 'Thời gian', width: 18, align: 'center' },
        { header: 'Phòng thi', width: 14, align: 'center' },
        { header: 'Địa điểm', width: 16, align: 'left' },
      ],
      rows: filteredAssignments.map((a, idx) => [
        idx + 1,
        a.subjectCode,
        a.subjectName,
        a.role === 'SUPERVISOR_1' ? 'Cán bộ coi thi 1' : a.role === 'SUPERVISOR_2' ? 'Cán bộ coi thi 2' : 'Giám sát',
        a.status === 'CONFIRMED' ? 'Đã xác nhận' : a.status === 'CHANGE_REQUESTED' ? 'Xin đổi ca' : 'Chờ xác nhận',
        new Date(a.examDate).toLocaleDateString('vi-VN'),
        `${a.startTime} - ${a.endTime}`,
        a.roomName || a.roomCode,
        a.building || '',
      ]),
    });
  };

  const handlePrintReport = () => {
    printReport({
      title: 'LỊCH PHÂN CÔNG COI THI GIẢNG VIÊN',
      subtitle: `Giảng viên: ${currentUser?.fullName || currentUser?.teacher?.fullName || currentUser?.username || ''} - Mã CB: ${currentUser?.teacher?.teacherCode || currentUser?.teacherCode || currentUser?.username || ''}`,
      templateCode: 'SUPERVISOR_ASSIGNMENT',
      facultyName: 'HỘI ĐỒNG KHẢO THÍ & ĐẢM BẢO CHẤT LƯỢNG',
      metaInfo: [
        { label: 'Tổng ca coi thi', value: `${assignments.length} ca` },
        { label: 'Giám thị chính', value: `${supervisor1Count} ca` },
        { label: 'Đã xác nhận', value: `${confirmedCount}/${assignments.length} ca` },
        { label: 'Thời gian tập trung', value: 'Trước 15 phút' },
      ],
      columns: [
        { header: 'STT', width: '40px' },
        { header: 'Mã môn', width: '90px', align: 'center' },
        { header: 'Tên môn thi', width: '200px' },
        { header: 'Ngày thi', width: '100px', align: 'center' },
        { header: 'Khung giờ', width: '110px', align: 'center' },
        { header: 'Phòng thi', width: '100px', align: 'center' },
        { header: 'Vai trò', width: '100px', align: 'center' },
        { header: 'Trạng thái', width: '110px', align: 'center' },
      ],
      rows: filteredAssignments.map((a, idx) => [
        idx + 1,
        a.subjectCode,
        a.subjectName,
        new Date(a.examDate).toLocaleDateString('vi-VN'),
        `${a.startTime} - ${a.endTime}`,
        a.roomName || a.roomCode,
        a.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2',
        a.status === 'CONFIRMED' ? 'Đã xác nhận' : a.status === 'CHANGE_REQUESTED' ? 'Xin đổi ca' : 'Chờ xác nhận',
      ]),
      signers: [
        { title: 'GIẢNG VIÊN COI THI', subtitle: '(Ký, ghi rõ họ tên)' },
        { title: 'TRƯỞNG PHÒNG KHẢO THÍ', subtitle: '(Ký tên, đóng dấu)' },
      ],
    });
  };

  const supervisor1Count = useMemo(() => assignments.filter((a) => a.role === 'SUPERVISOR_1').length, [assignments]);
  const confirmedCount = useMemo(() => assignments.filter((a) => a.status === 'CONFIRMED').length, [assignments]);

  const KPI = [
    {
      label: 'Tổng ca coi thi',
      value: `${assignments.length} ca`,
      subtext: 'Học kỳ hiện tại',
      progressPercent: assignments.length > 0 ? 100 : 0,
      icon: Calendar,
    },
    {
      label: 'Giám thị 1 (Chính)',
      value: `${supervisor1Count} ca`,
      subtext: 'Chịu trách nhiệm phòng',
      progressPercent: assignments.length > 0 ? Math.round((supervisor1Count / assignments.length) * 100) : 0,
      icon: ShieldCheck,
    },
    {
      label: 'Đã xác nhận ca',
      value: `${confirmedCount}/${assignments.length} ca`,
      subtext: 'Sẵn sàng gác thi',
      progressPercent: assignments.length > 0 ? Math.round((confirmedCount / assignments.length) * 100) : 100,
      icon: CheckCircle2,
    },
    {
      label: 'Thời gian tập trung',
      value: 'Trước 15p',
      subtext: 'Chuẩn bị & điểm danh',
      progressPercent: 100,
      icon: Clock,
    },
  ];

  // Filtering & Sorting
  const filteredAssignments = useMemo(() => {
    const todayTime = new Date().setHours(0, 0, 0, 0);

    let result = assignments.filter((item) => {
      const matchSearch =
        item.subjectName?.toLowerCase().includes(search.toLowerCase()) ||
        item.subjectCode?.toLowerCase().includes(search.toLowerCase()) ||
        item.roomName?.toLowerCase().includes(search.toLowerCase()) ||
        item.roomCode?.toLowerCase().includes(search.toLowerCase()) ||
        item.building?.toLowerCase().includes(search.toLowerCase());

      const examTime = new Date(item.examDate).getTime();
      const isExpired = examTime < todayTime;

      let matchStatus = true;
      if (filterStatus === 'CONFIRMED') matchStatus = item.status === 'CONFIRMED' && !isExpired;
      else if (filterStatus === 'PENDING') matchStatus = item.status === 'PENDING' && !isExpired;
      else if (filterStatus === 'CHANGE_REQUESTED') matchStatus = item.status === 'CHANGE_REQUESTED' && !isExpired;
      else if (filterStatus === 'EXPIRED') matchStatus = isExpired;

      return matchSearch && matchStatus;
    });

    result = [...result].sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.examDate).getTime() - new Date(a.examDate).getTime();
      if (sortOrder === 'oldest') return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
      if (sortOrder === 'name_asc') return (a.subjectName || '').localeCompare(b.subjectName || '', 'vi');
      return 0;
    });

    return result;
  }, [assignments, search, filterStatus, sortOrder]);

  const statusCounts = useMemo(() => {
    const todayTime = new Date().setHours(0, 0, 0, 0);
    return {
      all: assignments.length,
      confirmed: assignments.filter((a) => a.status === 'CONFIRMED' && new Date(a.examDate).getTime() >= todayTime).length,
      pending: assignments.filter((a) => a.status === 'PENDING' && new Date(a.examDate).getTime() >= todayTime).length,
      changeRequested: assignments.filter((a) => a.status === 'CHANGE_REQUESTED' && new Date(a.examDate).getTime() >= todayTime).length,
      expired: assignments.filter((a) => new Date(a.examDate).getTime() < todayTime).length,
    };
  }, [assignments]);

  const totalItems = filteredAssignments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const currentItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredAssignments.slice(start, start + limit);
  }, [filteredAssignments, page, limit]);

  const allSelected = currentItems.length > 0 && currentItems.every((i) => selected.includes(i.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = currentItems.map((i) => i.id);
      setSelected((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = new Set(currentItems.map((i) => i.id));
      setSelected((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelected((prev) => [...prev, id]);
    } else {
      setSelected((prev) => prev.filter((item) => item !== id));
    }
  };

  const drawerIsExpired = Boolean(
    drawerDuty?.examDate && new Date(drawerDuty.examDate).getTime() < new Date().setHours(0, 0, 0, 0),
  );

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen">
        {/* ── 1. Standard Page Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
          <div className="space-y-0.5">
            <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
              Lịch coi thi
            </h1>
            <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
              Theo dõi danh sách ca coi thi cá nhân, xác nhận lịch trực và quản lý yêu cầu đổi ca
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <DataActionsDropdown
              onExportExcel={exportExcel}
              onPrint={handlePrintReport}
              printLabel="In lịch coi thi"
            />

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleRegisterAvailability}
              leftIcon={<Calendar className="h-4 w-4" />}
            >
              Đăng ký lịch coi thi
            </Button>
          </div>
        </div>

        {/* ── 2. Standard KPI Cards Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {KPI.map(({ label, value, subtext, progressPercent, icon: Icon }) => (
            <div
              key={label}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400 block truncate">
                    {label}
                  </span>
                  <div className="text-type-kpi font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
                    {value}
                  </div>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                  <Icon className="h-5 w-5 stroke-[2.2]" />
                </div>
              </div>

              {/* Micro Progress Track */}
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(progressPercent, 5), 100)}%` }}
                />
              </div>

              <div className="mt-2.5">
                <span
                  title={subtext}
                  className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
                >
                  {subtext}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Status TabBar ── */}
        <TabBar
          tabs={[
            { key: 'ALL', label: 'Tất cả ca thi', count: statusCounts.all },
            { key: 'CONFIRMED', label: 'Đã xác nhận', count: statusCounts.confirmed },
            { key: 'PENDING', label: 'Chờ xác nhận', count: statusCounts.pending },
            ...(statusCounts.changeRequested > 0 ? [{ key: 'CHANGE_REQUESTED', label: 'Xin đổi ca', count: statusCounts.changeRequested }] : []),
            ...(statusCounts.expired > 0 ? [{ key: 'EXPIRED', label: 'Quá hạn', count: statusCounts.expired }] : []),
          ]}
          active={filterStatus}
          onChange={(key) => {
            setFilterStatus(key);
            setPage(1);
          }}
        />

        {/* ── Search & Action Toolbar ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Left: Search input */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Tìm theo môn thi, mã môn, phòng thi..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-9 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
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
                  className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-5 items-center justify-center px-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-normal text-type-helper text-slate-400 select-none cursor-pointer"
                  onClick={() => searchInputRef.current?.focus()}
                  title="Nhấn phím / để tìm nhanh"
                >
                  /
                </kbd>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <SortDropdown
              value={sortOrder}
              onChange={(val) => setSortOrder(val)}
              options={[
                { value: 'newest', label: 'Ngày thi: Mới nhất' },
                { value: 'oldest', label: 'Ngày thi: Cũ nhất' },
                { value: 'name_asc', label: 'Môn thi: A - Z' },
              ]}
            />

            {/* Column Selector - Chỉ hiển thị khi ở chế độ Bảng */}
            {viewMode === 'list' && (
              <ColumnToggleDropdown
                columns={[
                  { key: 'subject', label: 'Môn thi & Mã HP' },
                  { key: 'time', label: 'Thời gian & Ca thi' },
                  { key: 'room', label: 'Phòng thi / Tòa nhà' },
                  { key: 'role', label: 'Vai trò' },
                  { key: 'status', label: 'Trạng thái ca' },
                  { key: 'actions', label: 'Thao tác' },
                ]}
                visibleColumns={visibleColumns}
                onToggle={(key) => setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))}
              />
            )}

            {/* View Mode Switcher: Lịch [ 📅 ] & Bảng [ ☰ ] (Ưu tiên Lịch trước) */}
            <ViewModeSegmentedControl
              viewMode={viewMode}
              onChange={(m) => setViewMode(m as 'calendar' | 'list')}
              supportedModes={['calendar', 'list']}
            />
          </div>
        </div>

        {/* ── 5. Assignments Content (Calendar View hoặc List Table View) ── */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-type-body-sm font-semibold text-slate-500 dark:text-slate-400">Đang tra cứu lịch coi thi...</p>
          </div>
        ) : totalItems === 0 ? (
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-12 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-type-body font-semibold text-slate-800 dark:text-slate-200">Không tìm thấy ca coi thi nào</h3>
            <p className="text-type-helper font-medium text-slate-500 dark:text-slate-400 max-w-sm">
              Không có ca phân công coi thi nào phù hợp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
            </p>
          </div>
        ) : viewMode === 'calendar' ? (
          /* ── 5.1 Calendar View Mode (Mặc định mở sẵn Lịch tuần) ── */
          <TeacherAssignmentCalendarView
            assignments={filteredAssignments}
            onDetail={setDrawerDuty}
            onConfirmDuty={(item) => handleUpdateStatus(item.id, 'CONFIRMED')}
            onRequestChange={setChangeRequestAssignment}
          />
        ) : (
          /* ── 5.2 List View Mode (Dạng bảng danh sách chi tiết) ── */
          <div className="ui-table-wrap rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="ui-table w-full text-left text-type-body text-slate-700 dark:text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-type-body-sm font-medium text-slate-600 dark:text-slate-400 select-none">
                    <th className="py-3 px-4 w-12 text-center">
                      <input type="checkbox" checked={allSelected} onChange={(e) => handleSelectAll(e.target.checked)} className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    </th>
                    {visibleColumns.subject !== false && <th className="py-3.5 px-4 font-medium min-w-[200px] whitespace-nowrap">Môn thi & Mã HP</th>}
                    {visibleColumns.time !== false && <th className="py-3.5 px-4 font-medium whitespace-nowrap">Thời gian & Ca thi</th>}
                    {visibleColumns.room !== false && <th className="py-3.5 px-4 font-medium whitespace-nowrap">Phòng thi / Tòa nhà</th>}
                    {visibleColumns.role !== false && <th className="py-3.5 px-4 font-medium whitespace-nowrap">Vai trò</th>}
                    {visibleColumns.status !== false && <th className="py-3.5 px-4 font-medium whitespace-nowrap">Trạng thái ca</th>}
                    {visibleColumns.actions !== false && <th className="py-3.5 pr-4 font-medium text-right whitespace-nowrap">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                  {currentItems.map((item) => {
                    const isChecked = selected.includes(item.id);
                    const examTime = new Date(item.examDate).getTime();
                    const todayTime = new Date().setHours(0, 0, 0, 0);
                    const isExpired = examTime < todayTime;
                    const canAction = item.status !== 'CONFIRMED' && item.status !== 'CHANGE_REQUESTED' && !isExpired;

                    return (
                      <tr key={item.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${isChecked ? 'bg-blue-50/20' : ''}`}>
                        <td className="py-3.5 px-4 text-center">
                          <input type="checkbox" checked={isChecked} onChange={(e) => handleSelectOne(item.id, e.target.checked)} className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                        </td>
                        {visibleColumns.subject !== false && (
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <IdentifierBadge tone="blue">{item.subjectCode}</IdentifierBadge>
                              <div onClick={() => setDrawerDuty(item)} className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 cursor-pointer transition text-type-body leading-snug truncate" title={item.subjectName}>
                                {item.subjectName}
                              </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.time !== false && (
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 text-type-body">
                              {new Date(item.examDate).toLocaleDateString('vi-VN')}
                            </div>
                            <div className="table-meta text-type-helper font-medium text-blue-600 dark:text-blue-400">
                              {item.startTime} - {item.endTime}
                            </div>
                          </td>
                        )}
                        {visibleColumns.room !== false && (
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 text-type-body">
                              {item.roomName || item.roomCode}
                            </div>
                            <div className="table-meta text-type-helper text-slate-400 font-normal">
                              {item.building || 'Nhà A1'}
                            </div>
                          </td>
                        )}
                        {visibleColumns.role !== false && (
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {item.role === 'SUPERVISOR_1' ? (
                              <span className="table-badge ui-pill inline-flex items-center text-type-helper font-medium text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/50">
                                Giám thị 1
                              </span>
                            ) : (
                              <span className="table-badge inline-flex items-center text-type-helper font-medium text-slate-600 dark:text-slate-400 px-2 py-0.5 ui-pill rounded-full">
                                Giám thị 2
                              </span>
                            )}
                          </td>
                        )}
                        {visibleColumns.status !== false && (
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge
                              status={isExpired ? 'CANCELLED' : item.status === 'CONFIRMED' ? 'CONFIRMED' : item.status === 'CHANGE_REQUESTED' ? 'CHANGE_REQUESTED' : 'PENDING'}
                              customLabel={isExpired ? 'Quá hạn ca thi' : item.status === 'CONFIRMED' ? 'Đã xác nhận' : item.status === 'CHANGE_REQUESTED' ? 'Xin đổi ca' : 'Chờ xác nhận'}
                            />
                          </td>
                        )}
                        {visibleColumns.actions !== false && (
                          <td className="py-3.5 pr-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {canAction && (
                                <>
                                  <Button variant="primary" size="xs" disabled={busyId === item.id} isLoading={busyId === item.id} onClick={() => handleUpdateStatus(item.id, 'CONFIRMED')}>
                                    Xác nhận
                                  </Button>
                                  <button type="button" onClick={() => handleRequestChange(item)} className="p-1.5 text-slate-500 hover:text-amber-600 transition cursor-pointer select-none" title="Xin đổi ca">
                                    <ArrowLeftRight className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button type="button" onClick={() => handlePrintAttendance(item)} className="p-1.5 text-slate-500 hover:text-blue-600 transition cursor-pointer select-none" title="Điểm danh A4">
                                <Printer className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 6. Pagination Bar ── */}
        {totalItems > 0 && (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            limit={limit}
            onPage={(p) => setPage(p)}
            onLimit={(l) => {
              setLimit(l);
              setPage(1);
            }}
            unit="ca coi thi"
          />
        )}

        {/* Floating Bulk Action Bar */}
        <TeacherAssignmentBulkAction
          selectedCount={selected.length}
          totalCount={totalItems}
          allSelected={allSelected}
          onToggleAll={() => handleSelectAll(!allSelected)}
          onConfirmAll={async () => {
            const unconfirmedIds = currentItems
              .filter((item) => selected.includes(item.id) && item.status !== 'CONFIRMED')
              .map((item) => item.id);
            if (!unconfirmedIds.length) {
              setToast({ message: 'Tất cả các ca được chọn đã được xác nhận trước đó.', type: 'success' });
              return;
            }
            try {
              await Promise.all(unconfirmedIds.map((id) => api.post(`/teachers/my-assignments/${id}/confirm`)));
              setToast({ message: `Đã xác nhận thành công ${unconfirmedIds.length} ca coi thi!`, type: 'success' });
              setSelected([]);
              fetchMyAssignments();
            } catch (err: any) {
              setToast({ message: err.message || 'Lỗi khi cập nhật trạng thái', type: 'error' });
            }
          }}
          onExportExcel={() => {
            const selectedItems = currentItems.filter((item) => selected.includes(item.id));
            const columns = [
              { header: 'STT', width: 8, align: 'center' as const },
              { header: 'Mã HP', width: 15 },
              { header: 'Tên môn học', width: 30 },
              { header: 'Ngày thi', width: 15, align: 'center' as const },
              { header: 'Giờ thi', width: 15, align: 'center' as const },
              { header: 'Phòng thi', width: 15, align: 'center' as const },
              { header: 'Vai trò', width: 18 },
              { header: 'Trạng thái', width: 15, align: 'center' as const },
            ];
            const rows = selectedItems.map((item, idx) => [
              idx + 1,
              item.subjectCode,
              item.subjectName,
              item.examDate ? new Date(item.examDate).toLocaleDateString('vi-VN') : '---',
              `${item.startTime} - ${item.endTime}`,
              item.roomName || '---',
              item.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2',
              item.status === 'CONFIRMED' ? 'Đã xác nhận' : 'Chờ xác nhận',
            ]);
            exportToFormattedExcel({
              filename: 'Lich_coi_thi_giang_vien_da_chon.xls',
              title: 'LỊCH COI THI CỦA GIẢNG VIÊN ĐÃ CHỌN',
              subtitle: `Đã trích xuất ${selectedItems.length} ca coi thi`,
              columns,
              rows,
            });
            setToast({ message: `Đã xuất ${selected.length} ca coi thi ra Excel`, type: 'success' });
          }}
          onPrint={() => {
            const selectedItems = currentItems.filter((item) => selected.includes(item.id));
            printReport({
              title: 'LỊCH PHÂN CÔNG COI THI CÁ NHÂN',
              subtitle: `Tổng số ca thi được chọn: ${selectedItems.length}`,
              metaInfo: [
                { label: 'Số lượng ca thi', value: String(selectedItems.length) },
              ],
              columns: [
                { header: 'STT', width: '40px' },
                { header: 'Mã HP', width: '90px', align: 'center' },
                { header: 'Tên Môn Học', width: '200px' },
                { header: 'Thời Gian', width: '130px', align: 'center' },
                { header: 'Phòng', width: '90px', align: 'center' },
                { header: 'Vai Trò', width: '100px', align: 'center' },
              ],
              rows: selectedItems.map((item, idx) => [
                idx + 1,
                item.subjectCode,
                item.subjectName,
                `${item.startTime}-${item.endTime} (${item.examDate ? new Date(item.examDate).toLocaleDateString('vi-VN') : ''})`,
                item.roomName || '---',
                item.role === 'SUPERVISOR_1' ? 'Giám thị 1' : 'Giám thị 2',
              ]),
            });
          }}
          onClear={() => setSelected([])}
        />
      </main>

      {/* Duty Detail Drawer */}
      <ProfileDrawer
        isOpen={Boolean(drawerDuty)}
        onClose={() => setDrawerDuty(null)}
        title={drawerDuty?.subjectName || ''}
        subtitle={drawerDuty?.subjectCode || ''}
        avatarText="GT"
        badge={drawerDuty ? {
          status: drawerIsExpired ? 'CANCELLED' : drawerDuty.status,
          label: drawerIsExpired ? 'Quá hạn' : drawerDuty.status === 'CONFIRMED' ? 'Đã xác nhận' : drawerDuty.status === 'CHANGE_REQUESTED' ? 'Đề nghị đổi' : 'Chờ xác nhận',
        } : undefined}
        details={[
          { label: 'Môn thi', value: drawerDuty?.subjectName, icon: BookOpen },
          { label: 'Mã môn', value: drawerDuty?.subjectCode },
          { label: 'Vai trò giám thị', value: drawerDuty?.role === 'SUPERVISOR_1' ? 'Giám thị 1 (Cán bộ chính)' : 'Giám thị 2 (Cán bộ hỗ trợ)', icon: ShieldCheck },
          {
            label: 'Trạng thái ca coi thi',
            value: drawerIsExpired
              ? 'Quá hạn ca thi'
              : drawerDuty?.status === 'CONFIRMED'
                ? 'Đã xác nhận ca thi'
                : drawerDuty?.status === 'CHANGE_REQUESTED'
                  ? 'Đã gửi yêu cầu đổi ca'
                  : 'Chờ xác nhận',
            icon: CheckCircle2,
          },
          { label: 'Ngày thi', value: drawerDuty?.examDate ? new Date(drawerDuty.examDate).toLocaleDateString('vi-VN') : '', icon: Calendar },
          { label: 'Thời gian làm bài', value: `${drawerDuty?.startTime} - ${drawerDuty?.endTime}`, icon: Clock },
          { label: 'Phòng thi phân công', value: drawerDuty?.roomName || drawerDuty?.roomCode, icon: DoorOpen },
          { label: 'Tòa nhà / Địa điểm', value: drawerDuty?.building || 'Nhà A1', icon: MapPin },
        ]}
        extraSections={[
          {
            title: 'Hành động ca coi thi',
            content: (
              <div className="space-y-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => drawerDuty?.examScheduleRoomId && router.push(`/teacher/proctor/${drawerDuty.examScheduleRoomId}`)}
                  disabled={!drawerDuty?.examScheduleRoomId}
                  leftIcon={<ExternalLink className="w-4 h-4" />}
                  className="w-full"
                >
                  Mở bảng giám thị Realtime phòng thi này
                </Button>

                {drawerDuty && !drawerIsExpired && drawerDuty.status !== 'CONFIRMED' && drawerDuty.status !== 'CHANGE_REQUESTED' && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      const item = drawerDuty;
                      setDrawerDuty(null);
                      handleRequestChange(item);
                    }}
                    leftIcon={<ArrowLeftRight className="w-4 h-4" />}
                    className="w-full"
                  >
                    Gửi yêu cầu xin đổi ca coi thi này
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Duty Availability Modal (Đăng ký lịch rảnh / bận) */}
      <DutyAvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        onSuccess={(msg) => setToast({ message: msg, type: 'success' })}
      />

      {/* Supervisor Change Request Modal (Xin đổi ca coi thi) */}
      <SupervisorChangeRequestModal
        isOpen={Boolean(changeRequestAssignment)}
        assignment={changeRequestAssignment}
        onClose={() => setChangeRequestAssignment(null)}
        onSuccess={async (msg) => {
          setToast({ message: msg, type: 'success' });
          await fetchMyAssignments();
        }}
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
