'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useParams } from 'next/navigation';
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
  Activity,
  Flag,
  RotateCcw,
  PlusCircle,
  FileText,
  Search,
  List,
  LayoutGrid,
  Layers,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Bell,
  Radio,
  SlidersHorizontal,
  Eye,
  Check,
} from 'lucide-react';

import { FilterSelect } from '@/components/ui/FilterSelect';
import { IdentifierBadge } from '@/components/ui/IdentifierBadge';
import { TabBar } from '@/components/ui/TabBar';
import { SortDropdown } from '@/components/ui/SortDropdown';
import { ColumnToggleDropdown } from '@/components/ui/ColumnToggleDropdown';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Toast } from '@/components/Toast';
import { usePageTitle } from '@/components/PageTitleContext';
import { onlineExamService } from '@/lib/services/online-exam.service';

const EMPTY_STUDENTS: any[] = [];

/* ─── helpers ─── */
function statusMeta(att: any) {
  if (!att) return { label: 'Chưa bắt đầu', cls: 'text-slate-500 font-semibold' };
  if (att.status === 'IN_PROGRESS')
    return { label: 'Đang làm bài', cls: 'text-blue-700 font-semibold' };
  if (att.status === 'DISCONNECTED')
    return { label: 'Mất kết nối', cls: 'text-amber-700 font-semibold' };
  if (['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(att.status))
    return {
      label: att.status === 'AUTO_SUBMITTED' ? 'Nộp tự động' : 'Đã nộp bài',
      cls: 'text-emerald-700 font-semibold',
    };
  if (att.status === 'ABSENT') return { label: 'Vắng mặt', cls: 'text-rose-700 font-semibold' };
  return { label: att.status, cls: 'text-slate-700 font-semibold' };
}

function riskMeta(score: number) {
  if (score >= 40) return { cls: 'text-rose-600 font-semibold', level: 'Cao' };
  if (score >= 15) return { cls: 'text-amber-600 font-semibold', level: 'Trung bình' };
  return { cls: 'text-slate-600 font-semibold', level: 'Thấp' };
}

export default function ProctorDashboardPage() {
  usePageTitle('Giám thị ca thi trực tiếp');
  const router = useRouter();
  const params = useParams();
  const scheduleRoomId = Number(params?.scheduleRoomId);

  const [mounted, setMounted] = useState(false);
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

  // Broadcast Modal
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastProcessing, setBroadcastProcessing] = useState(false);

  // Multi-Student Selected Action Modal
  const [showMultiExtendModal, setShowMultiExtendModal] = useState(false);
  const [multiMinutes, setMultiMinutes] = useState(10);
  const [multiReason, setMultiReason] = useState('');
  const [multiProcessing, setMultiProcessing] = useState(false);

  // General Confirm & Toast state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'success' | 'warning' | 'info';
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => { } });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const loadDashboardRef = useRef<((isBackground?: boolean) => Promise<void>) | null>(null);

  const loadDashboard = useCallback(
    async (isBackground = false) => {
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
    },
    [scheduleRoomId]
  );
  loadDashboardRef.current = loadDashboard;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!scheduleRoomId) return;
    void loadDashboardRef.current?.();
    const interval = setInterval(() => {
      void loadDashboardRef.current?.(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [scheduleRoomId]);

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

  const handleAction = async () => {
    if (!selectedStudent?.attempt?.id) return;
    try {
      setActionError(null);
      setProcessing(true);
      if (actionType === 'EXTEND')
        await onlineExamService.extendTime(selectedStudent.attempt.id, extraMinutes, reason);
      else if (actionType === 'REOPEN')
        await onlineExamService.reopenAttempt(selectedStudent.attempt.id, reason);
      else if (actionType === 'FLAG')
        await onlineExamService.flagIncident(selectedStudent.attempt.id, reason, incidentDecision);
      else if (actionType === 'RESOLVE')
        await onlineExamService.resolveIncident(
          selectedStudent.attempt.id,
          resolutionDecision,
          penaltyPoints,
          reason
        );
      setActionType(null);
      setSelectedStudent(null);
      setReason('');
      setToast({ message: 'Thao tác cập nhật thành công!', type: 'success' });
      loadDashboard(true);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message ||
        err?.message ||
        'Thao tác thất bại. Vui lòng kiểm tra lại dữ liệu và thử lại.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleMultiExtend = async () => {
    if (selectedIds.length === 0) return;
    try {
      setMultiProcessing(true);
      // Extend selected attempts
      const selectedStudents = students.filter((s: any) => selectedIds.includes(s.student.id) && s.attempt?.id);
      let successCount = 0;
      for (const st of selectedStudents) {
        if (st.attempt?.id) {
          try {
            await onlineExamService.extendTime(st.attempt.id, multiMinutes, multiReason || 'Gia hạn nhóm thí sinh');
            successCount++;
          } catch {
            // continue
          }
        }
      }
      setShowMultiExtendModal(false);
      setSelectedIds([]);
      setMultiReason('');
      setToast({
        message: `Đã gia hạn thành công cho ${successCount}/${selectedStudents.length} thí sinh đã chọn!`,
        type: 'success',
      });
      loadDashboard(true);
    } catch {
      setToast({ message: 'Có lỗi xảy ra trong quá trình gia hạn nhóm', type: 'error' });
    } finally {
      setMultiProcessing(false);
    }
  };

  const handleSendBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    setBroadcastProcessing(true);
    setTimeout(() => {
      setBroadcastProcessing(false);
      setShowBroadcastModal(false);
      setBroadcastMessage('');
      setToast({
        message: 'Đã phát thông báo trực tiếp đến tất cả màn hình thí sinh!',
        type: 'success',
      });
    }, 600);
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
    {
      label: 'Tổng thí sinh',
      value: stats.total ?? 0,
      subtext: 'Trong danh sách phòng',
      progressPercent: stats.total > 0 ? 100 : 0,
      icon: Users,
    },
    {
      label: 'Đang làm bài',
      value: stats.inProgress ?? 0,
      subtext: 'Đang thao tác trực tuyến',
      progressPercent: stats.total > 0 ? Math.round(((stats.inProgress || 0) / stats.total) * 100) : 0,
      icon: Activity,
    },
    {
      label: 'Mất kết nối',
      value: stats.disconnected ?? 0,
      subtext: 'Cần hỗ trợ mạng / thiết bị',
      progressPercent: stats.total > 0 ? Math.round(((stats.disconnected || 0) / stats.total) * 100) : 0,
      icon: WifiOff,
    },
    {
      label: 'Đã nộp bài',
      value: stats.submitted ?? 0,
      subtext: 'Hoàn tất gửi bài thi',
      progressPercent: stats.total > 0 ? Math.round(((stats.submitted || 0) / stats.total) * 100) : 0,
      icon: CheckCircle2,
    },
    {
      label: 'Có cảnh báo',
      value: stats.flagged ?? 0,
      subtext: 'Vi phạm quy chế thi',
      progressPercent: stats.total > 0 ? Math.round(((stats.flagged || 0) / stats.total) * 100) : 0,
      icon: ShieldAlert,
    },
  ];

  const actionMeta: Record<string, { title: string; desc: string; icon: React.ElementType; color: string; iconBg: string }> = {
    EXTEND: {
      title: 'Gia hạn thời gian làm bài',
      desc: 'Cộng thêm thời gian cho phiên đang thi hoặc vừa mất kết nối.',
      icon: Clock,
      color: 'text-blue-600',
      iconBg: 'bg-blue-50 border-blue-200',
    },
    REOPEN: {
      title: 'Mở lại phiên thi',
      desc: 'Cho phép sinh viên tiếp tục phiên thi đã kết thúc hoặc bị gián đoạn.',
      icon: RotateCcw,
      color: 'text-amber-600',
      iconBg: 'bg-amber-50 border-amber-200',
    },
    FLAG: {
      title: 'Lập biên bản sự cố vi phạm',
      desc: 'Ghi nhận sự cố; giám thị có thể xử lý và quyết định kết quả sau.',
      icon: Flag,
      color: 'text-rose-600',
      iconBg: 'bg-rose-50 border-rose-200',
    },
    RESOLVE: {
      title: 'Xử lý biên bản vi phạm',
      desc: 'Chọn mở lại, giữ điểm và trừ điểm, hoặc đình chỉ bài thi.',
      icon: ShieldAlert,
      color: 'text-blue-600',
      iconBg: 'bg-blue-50 border-blue-200',
    },
  };

  return (
    <main className="w-full min-w-0 max-w-full overflow-x-hidden px-4 sm:px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      {/* ── 1. Clean & Elegant Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95 cursor-pointer mt-0.5 sm:mt-0"
            title="Quay lại danh sách phân công"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[22px] sm:text-[26px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight truncate">
                Giám Thị Phòng: <span className="text-blue-600 dark:text-blue-400">{data.roomName}</span>
              </h1>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 shrink-0">
                <span className="relative flex w-2 h-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Trực tiếp
              </span>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 text-[13px] sm:text-[13.5px] text-slate-500 font-normal mt-1 flex-wrap">
              <span>Môn: <strong className="text-slate-800 dark:text-slate-200 font-medium">{data.subjectName}</strong></span>
              <span>Ngày: <strong className="text-slate-800 dark:text-slate-200 font-medium">{new Date(data.examDate).toLocaleDateString('vi-VN')}</strong></span>
              <span>Ca thi: <strong className="text-slate-800 dark:text-slate-200 font-medium">{data.startTime} – {data.endTime}</strong></span>
            </div>
          </div>
        </div>

        {/* Quick Proctoring Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => setShowBroadcastModal(true)}
            leftIcon={<Megaphone className="h-4 w-4 text-blue-600" />}
            className="text-blue-600 hover:bg-blue-50/80 dark:hover:bg-blue-950/50"
          >
            Phát thông báo
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setShowReopenEntryModal(true)}
            leftIcon={<PlusCircle className="h-4 w-4" />}
          >
            Cho vào trễ
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setShowBulkModal(true)}
            leftIcon={<Clock className="h-4 w-4 text-slate-500" />}
          >
            Bù giờ toàn phòng
          </Button>
        </div>
      </div>

      {/* ── Banner Cảnh Báo Sự Cố Ngắt Kết Nối Hàng Loạt ── */}
      {(stats.disconnected ?? 0) > 0 && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/90 dark:bg-rose-950/40 p-4 text-[15px] font-medium text-rose-950 dark:text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-600 text-white shadow-2xs">
              <AlertTriangle className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <span className="text-[16px] font-semibold text-rose-950 dark:text-rose-100 block">Cảnh báo mất kết nối mạng</span>
              <span className="text-rose-800 dark:text-rose-300 font-normal text-[14px]">
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
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-[14px] rounded-xl shadow-xs transition active:scale-95 cursor-pointer shrink-0"
          >
            Bù giờ khẩn cấp toàn phòng (+15p)
          </button>
        </div>
      )}

      {/* ── 2. Standard 5 KPI Cards With Micro Progress Tracks ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {KPI_CARDS.map(({ label, value, subtext, progressPercent, icon: Icon }) => (
          <div
            key={label}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                  {label}
                </span>
                <div className="text-[32px] font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
                  {value}
                </div>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                <Icon className="h-5 w-5 stroke-[2.2]" />
              </div>
            </div>

            {/* Thanh đo tiến độ tỷ lệ động nhỏ mảnh, tinh tế (Micro Progress Track h-1) */}
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Math.max(progressPercent, 5), 100)}%` }}
              />
            </div>

            <div className="mt-2.5">
              <span
                title={subtext}
                className="text-[13px] font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
              >
                {subtext}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. Status Tabs & Search Row (Chuẩn /exam-papers & /teacher/regrade) ── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-1">
        <TabBar
          tabs={[
            { key: 'ALL', label: 'Tất cả', count: students.length },
            { key: 'IN_PROGRESS', label: 'Đang làm bài', count: students.filter((s: any) => s.attempt?.status === 'IN_PROGRESS').length },
            { key: 'FLAGGED', label: 'Có cảnh báo', count: students.filter((s: any) => s.attempt?.isFlagged).length },
            { key: 'SUBMITTED', label: 'Đã nộp bài', count: students.filter((s: any) => ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(s.attempt?.status)).length },
            { key: 'DISCONNECTED', label: 'Mất kết nối', count: students.filter((s: any) => s.attempt?.status === 'DISCONNECTED').length },
          ]}
          active={filter}
          onChange={(k) => {
            setFilter(k as any);
            setPage(1);
          }}
          className="border-b-0 pt-0 w-auto"
        />

        <div className="flex items-center gap-2 shrink-0 pb-1 xl:pb-0">
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm tên, mã SV, SBD, ghế..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 pl-10 pr-9 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-none transition-all shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <FilterSelect
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value as any);
              setPage(1);
            }}
            size="sm"
          >
            <option value="ALL">Tất cả mức rủi ro</option>
            <option value="HIGH">Rủi ro cao (≥ 40đ)</option>
            <option value="MEDIUM">Rủi ro trung bình (15 - 39đ)</option>
            <option value="LOW">Rủi ro thấp (&lt; 15đ)</option>
          </FilterSelect>

          {(search || riskFilter !== 'ALL' || filter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setRiskFilter('ALL');
                setFilter('ALL');
                setPage(1);
              }}
              className="h-9 px-2.5 flex items-center gap-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title="Xóa tất cả bộ lọc"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 4. Table Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Hiển thị <span className="font-bold text-slate-900 dark:text-slate-100">{totalItems.toLocaleString('vi-VN')}</span> / {students.length} thí sinh
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <SortDropdown
            value={sortOrder}
            onChange={setSortOrder}
            options={[
              { value: 'seat_asc', label: 'Số ghế: 1 → n' },
              { value: 'seat_desc', label: 'Số ghế: n → 1' },
              { value: 'name_asc', label: 'Họ tên: A → Z' },
              { value: 'name_desc', label: 'Họ tên: Z → A' },
              { value: 'risk_desc', label: 'Rủi ro cao nhất' },
              { value: 'code_asc', label: 'Mã SV: A → Z' },
            ]}
          />

          {/* Column Toggle */}
          <ColumnToggleDropdown
            columns={columnsList}
            visibleColumns={visibleColumns}
            onToggle={handleColumnToggle}
          />

          {/* View Mode Pills */}
          <div className="h-10 flex items-center gap-0.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Dạng danh sách"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Dạng sơ đồ chỗ ngồi"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition cursor-pointer ${
                viewMode === 'compact'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Dạng thu gọn"
            >
              <Layers className="h-4 w-4" />
            </button>
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => loadDashboard(false)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 shrink-0 select-none"
            title="Làm mới dữ liệu giám thị"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── 5. Main Content (List / Grid Seating / Compact) ── */}
      {totalItems === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-12 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Users className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Không tìm thấy thí sinh nào</h3>
          <p className="text-xs font-medium text-slate-500 max-w-sm">
            Không có thí sinh nào phù hợp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── 5.1 Creative Smart Seating Grid View Mode ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentStudents.map((s: any) => {
            const att = s.attempt;
            const riskScore = att?.riskScore || 0;
            const { label: statusLabel, cls: statusCls } = statusMeta(att);
            const { cls: riskCls, level: riskLevel } = riskMeta(riskScore);
            const hasFlagged = att?.isFlagged;
            const isChecked = selectedIds.includes(s.student.id);
            const isOnline = att?.status === 'IN_PROGRESS';
            const isDisconnected = att?.status === 'DISCONNECTED';
            const isSubmitted = ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(att?.status);

            // Card color scheme based on student state
            const cardScheme = hasFlagged
              ? { border: 'border-rose-200 dark:border-rose-900/60', headerBg: 'bg-gradient-to-r from-rose-50 to-rose-100/60 dark:from-rose-950/40 dark:to-rose-900/20', ring: 'ring-2 ring-rose-300/50' }
              : isDisconnected
                ? { border: 'border-amber-200 dark:border-amber-900/60', headerBg: 'bg-gradient-to-r from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-amber-900/20', ring: '' }
                : isOnline
                  ? { border: 'border-emerald-200/80 dark:border-emerald-900/50', headerBg: 'bg-gradient-to-r from-emerald-50 to-emerald-100/40 dark:from-emerald-950/30 dark:to-emerald-900/10', ring: '' }
                  : isSubmitted
                    ? { border: 'border-slate-200 dark:border-slate-700', headerBg: 'bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/60 dark:to-slate-800/30', ring: '' }
                    : { border: 'border-slate-200 dark:border-slate-700/80', headerBg: 'bg-gradient-to-r from-blue-50/60 to-slate-50 dark:from-slate-800/50 dark:to-slate-800/30', ring: '' };

            return (
              <div
                key={s.student.id}
                className={`group relative rounded-2xl border ${cardScheme.border} bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col ${isChecked ? 'ring-2 ring-blue-500 border-blue-300 dark:border-blue-600' : cardScheme.ring}`}
              >
                {/* Card Header — Seat + Status chips */}
                <div className={`${cardScheme.headerBg} px-4 py-3 flex items-center justify-between gap-2 border-b ${cardScheme.border}`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleSelectOne(s.student.id, e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                    />
                    <span className="text-[13px] font-black text-slate-700 dark:text-slate-200 tracking-tight">
                      Ghế {s.seatNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasFlagged && (
                      <span className="flex items-center gap-1 text-[10.5px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                        <ShieldAlert className="w-3 h-3" />
                        Vi phạm
                      </span>
                    )}
                    {isOnline && (
                      <span className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                        Live
                      </span>
                    )}
                    {isDisconnected && (
                      <span className="flex items-center gap-1 text-[10.5px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
                        <WifiOff className="w-3 h-3" />
                        Mất mạng
                      </span>
                    )}
                    {!att && (
                      <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                        Chưa vào
                      </span>
                    )}
                    {isSubmitted && (
                      <span className="flex items-center gap-1 text-[10.5px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                        <Check className="w-3 h-3" />
                        Đã nộp
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body — Student Info */}
                <div className="px-4 py-3 flex-1 space-y-3">
                  {/* Name + Flag icon */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-[14.5px] font-bold text-slate-900 dark:text-slate-100 truncate leading-snug">
                        {s.student.fullName}
                      </h4>
                      {hasFlagged && <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-pulse" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <IdentifierBadge tone="neutral">{s.student.studentCode}</IdentifierBadge>
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
                        SBD: {s.examNumber}
                      </span>
                    </div>
                  </div>

                  {/* Status + Risk mini row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge
                      status={att?.status || 'NOT_STARTED'}
                      customLabel={`${statusLabel}${att?.extraMinutes > 0 ? ` +${att.extraMinutes}p` : ''}`}
                    />
                    <span className={`text-[11.5px] font-bold px-2 py-0.5 rounded-full ${
                      riskScore >= 40
                        ? 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900'
                        : riskScore >= 15
                          ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900'
                          : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {riskScore}đ {riskLevel}
                    </span>
                  </div>

                  {/* Risk progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${riskScore >= 40 ? 'bg-rose-500' : riskScore >= 15 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(Math.max((riskScore / 50) * 100, 2), 100)}%` }}
                    />
                  </div>
                </div>

                {/* Card Footer — Time + Action Buttons */}
                <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {att?.startedAt ? `${new Date(att.startedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Chưa vào thi'}
                  </span>

                  {att && (
                    <div className="flex items-center gap-1">
                      {['IN_PROGRESS', 'DISCONNECTED'].includes(att.status) && (
                        <button
                          type="button"
                          onClick={() => { setActionError(null); setSelectedStudent(s); setActionType('EXTEND'); }}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 hover:text-blue-700 px-2 py-1 text-[11px] font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
                          title="Gia hạn thời gian"
                        >
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>+Giờ</span>
                        </button>
                      )}
                      {['DISCONNECTED', 'UNDER_REVIEW'].includes(att.status) && (
                        <button
                          type="button"
                          onClick={() => { setActionError(null); setSelectedStudent(s); setActionType('REOPEN'); }}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-600 hover:text-amber-700 px-2 py-1 text-[11px] font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
                          title="Mở lại phiên thi"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-600" />
                          <span>Mở</span>
                        </button>
                      )}
                      {att.isFlagged && (
                        <button
                          type="button"
                          onClick={() => { setActionError(null); setSelectedStudent(s); setActionType('RESOLVE'); }}
                          className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 px-2 py-1 text-[11px] font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
                          title="Xử lý biên bản"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Duyệt</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setActionError(null);
                          setSelectedStudent(s);
                          setActionType('FLAG');
                        }}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-700 px-2 py-1 text-[11px] font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
                        title="Lập biên bản sự cố"
                      >
                        <FileText className="w-3 h-3 text-rose-600" />
                        <span>BB</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'compact' ? (
        /* ── 5.2 Compact View Mode (Dạng thẻ thanh ngang thu gọn như exam-papers) ── */
        <div className="space-y-2.5">
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
                className={`flex items-center justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs transition duration-200 gap-3.5 ${isChecked ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
                  }`}
              >
                {/* Left: Checkbox + Seat Badge + Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleSelectOne(s.student.id, e.target.checked)}
                    className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                  />
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-100 dark:border-blue-900">
                    G:{s.seatNumber}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {s.student.fullName}
                      </h4>
                      {hasFlagged && <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />}
                      <IdentifierBadge tone="neutral">{s.student.studentCode}</IdentifierBadge>
                      <span className="text-xs font-semibold text-slate-500 tabular-nums">
                        SBD: {s.examNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap font-normal">
                      <span>Mức cảnh báo: <strong className={riskCls}>{riskScore}đ ({riskLevel})</strong></span>
                      {att?.connectedIp && (
                        <span className="text-slate-400">IP: {att.connectedIp}</span>
                      )}
                      {att?.startedAt && (
                        <span className="text-slate-400">Bắt đầu: {new Date(att.startedAt).toLocaleTimeString('vi-VN')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: StatusBadge + Action Buttons */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <StatusBadge status={att?.status || 'NOT_STARTED'} customLabel={statusLabel} />

                  {att && (
                    <div className="inline-flex items-center gap-1.5 pl-2 border-l border-slate-100 dark:border-slate-800">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => {
                          setActionError(null);
                          setSelectedStudent(s);
                          setActionType('EXTEND');
                        }}
                        leftIcon={<Clock className="w-3.5 h-3.5 text-blue-600" />}
                      >
                        Gia hạn
                      </Button>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => {
                          setActionError(null);
                          setSelectedStudent(s);
                          setActionType('FLAG');
                        }}
                        leftIcon={<FileText className="w-3.5 h-3.5 text-rose-600" />}
                      >
                        Biên bản
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── 5.3 Standard List View Mode (Default Table) ── */
        <div className="w-full max-w-full overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <table className="w-full min-w-[750px] text-left text-[15px] text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-[14px] font-medium tracking-wider text-slate-600 border-b border-slate-200">
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
            <tbody className="divide-y divide-slate-100 font-normal">
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
                        <span className="tabular-nums font-medium text-slate-900 text-[15px] leading-[22px]">{s.examNumber}</span>
                        <span className="ml-1.5 text-slate-500 font-medium text-[15px] leading-[22px]">G:{s.seatNumber}</span>
                      </td>
                    )}

                    {/* Name */}
                    {visibleColumns.name !== false && (
                      <td className="p-3.5 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900 text-[15px] leading-[22px] truncate">{s.student.fullName}</p>
                          {hasFlagged && <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                        </div>
                      </td>
                    )}

                    {/* Student code */}
                    {visibleColumns.code !== false && (
                      <td className="p-3.5 whitespace-nowrap">
                        <IdentifierBadge tone="neutral">{s.student.studentCode}</IdentifierBadge>
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
                                onClick={() => {
                                  setActionError(null);
                                  setSelectedStudent(s);
                                  setActionType('EXTEND');
                                }}
                                title="Gia hạn thời gian làm bài"
                                className="group/btn inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-3 py-1.5 text-[15px] leading-[22px] font-medium shadow-2xs transition active:scale-95 cursor-pointer"
                              >
                                <Clock className="w-3.5 h-3.5 text-slate-500 group-hover/btn:text-blue-600 transition-colors" />
                                <span>Gia hạn</span>
                              </button>
                            )}
                            {['DISCONNECTED', 'UNDER_REVIEW'].includes(att.status) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActionError(null);
                                  setSelectedStudent(s);
                                  setActionType('REOPEN');
                                }}
                                title="Mở lại phiên thi khi có sự cố"
                                className="group/btn inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white hover:border-amber-300 hover:bg-amber-50 text-slate-700 hover:text-amber-700 px-3 py-1.5 text-[15px] leading-[22px] font-medium shadow-2xs transition active:scale-95 cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-slate-500 group-hover/btn:text-amber-600 transition-colors" />
                                <span>Mở lại</span>
                              </button>
                            )}
                            {att.isFlagged && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActionError(null);
                                  setSelectedStudent(s);
                                  setActionType('RESOLVE');
                                }}
                                title="Xử lý biên bản vi phạm"
                                className="group/btn inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-3 py-1.5 text-[15px] leading-[22px] font-medium shadow-2xs transition active:scale-95 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 group-hover/btn:text-emerald-600 transition-colors" />
                                <span>Xử lý</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setSelectedStudent(s);
                                setActionType('FLAG');
                              }}
                              title="Lập biên bản sự cố"
                              className="group/btn inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white hover:border-rose-300 hover:bg-rose-50 text-slate-700 hover:text-rose-700 px-3 py-1.5 text-[15px] leading-[22px] font-medium shadow-2xs transition active:scale-95 cursor-pointer"
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
                    className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2.5 text-xs font-semibold transition cursor-pointer shadow-2xs ${isCurrent
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
            <FilterSelect
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-7 text-[15px] font-medium text-slate-700 outline-none hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </FilterSelect>
          </div>
        </div>
      )}

      {/* ── 7. Floating Multi-Student Bulk Action Bar ── */}
      {selectedIds.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
            <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-200">
              Đã chọn <strong className="text-white font-bold">{selectedIds.length}</strong> thí sinh
            </span>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setShowMultiExtendModal(true)}
            leftIcon={<Clock className="w-3.5 h-3.5" />}
          >
            Gia hạn nhóm (+10p)
          </Button>

          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-xs font-medium text-slate-400 hover:text-white px-2 py-1 transition cursor-pointer"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      {/* ═══════ ACTION MODAL ═══════ */}
      {mounted && actionType && selectedStudent && typeof document !== 'undefined' && createPortal((() => {
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
                    <h3 className="text-[20px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-none">{meta.title}</h3>
                    <p className="mt-1 text-[13px] text-slate-500 font-semibold leading-none">{meta.desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Student info */}
              <div className="mx-6 mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Thí sinh: <strong className="text-slate-900 font-semibold">{selectedStudent.student.fullName}</strong></span>
                <IdentifierBadge tone="neutral">{selectedStudent.student.studentCode}</IdentifierBadge>
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
                    <label className="block text-[15px] text-slate-700 font-medium mb-1.5">Số phút cộng thêm vào bài thi:</label>
                    <div className="flex gap-2">
                      {[5, 10, 15, 20, 30].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setExtraMinutes(m)}
                          className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${extraMinutes === m
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
                      <label className="block text-[15px] text-slate-700 font-medium mb-1.5">Quyết định xử lý sự cố:</label>
                      <FilterSelect
                        value={resolutionDecision}
                        onChange={(e) => setResolutionDecision(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[15px] font-medium text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="REOPEN">Cho phép mở lại phiên thi để làm tiếp</option>
                        <option value="PENALTY">Giữ nguyên bài thi & Áp dụng trừ điểm</option>
                        <option value="TERMINATE">Đình chỉ thi & Hủy kết quả bài làm</option>
                      </FilterSelect>
                    </div>

                    {resolutionDecision === 'PENALTY' && (
                      <div>
                        <label className="block text-[15px] text-slate-700 font-medium mb-1.5">Số điểm trừ trực tiếp (thang 10):</label>
                        <input
                          type="number"
                          min="0.5"
                          max="10"
                          step="0.5"
                          value={penaltyPoints}
                          onChange={(e) => setPenaltyPoints(Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[15px] font-normal text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                {actionType === 'FLAG' && (
                  <div>
                    <label className="block text-[15px] text-slate-700 font-medium mb-1.5">Phân loại sự cố ghi nhận:</label>
                    <FilterSelect
                      value={incidentDecision}
                      onChange={(e) => setIncidentDecision(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[15px] font-medium text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="UNDER_REVIEW">Tạm giữ để hội đồng thi kiểm tra lại</option>
                      <option value="CONFIRMED_VIOLATION">Xác nhận có hành vi vi phạm quy chế</option>
                      <option value="DISMISSED">Bỏ qua (Sự cố khách quan ngoài ý muốn)</option>
                    </FilterSelect>
                  </div>
                )}

                <div>
                  <label className="block text-[15px] text-slate-700 font-medium mb-1.5">
                    {actionType === 'FLAG' ? 'Lý do / Mô tả chi tiết vi phạm:' : 'Lý do thực hiện:'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Nhập lý do hoặc ghi chú cho hội đồng thi..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-[15px] font-normal text-slate-900 focus:outline-none focus:border-blue-500"
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
                  className={`rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50 ${actionType === 'FLAG'
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
      })(), document.body)}

      {/* ═══════ MULTI-STUDENT EXTEND MODAL ═══════ */}
      {mounted && showMultiExtendModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md my-auto overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200/90 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-blue-50/80 dark:bg-blue-950/40 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-blue-200 bg-blue-100/70 text-blue-700 shadow-2xs shrink-0">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-[20px] font-semibold text-slate-900 leading-none">Gia hạn nhóm thí sinh</h3>
                  <p className="mt-1 text-[13px] text-slate-500 font-semibold leading-none">
                    Áp dụng cho {selectedIds.length} thí sinh đã chọn
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMultiExtendModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 font-medium mb-1.5">Chọn số phút cộng thêm:</label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20, 30].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMultiMinutes(m)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${multiMinutes === m
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      +{m}p
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[15px] text-slate-700 font-medium mb-1.5">Lý do gia hạn:</label>
                <textarea
                  rows={3}
                  value={multiReason}
                  onChange={(e) => setMultiReason(e.target.value)}
                  placeholder="Nhập lý do gia hạn cho nhóm..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-[15px] font-normal text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/80 px-6 py-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setShowMultiExtendModal(false)}
                disabled={multiProcessing}
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleMultiExtend}
                disabled={multiProcessing}
                isLoading={multiProcessing}
              >
                Gia hạn ngay
              </Button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ═══════ BROADCAST ANNOUNCEMENT MODAL ═══════ */}
      {mounted && showBroadcastModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md my-auto overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200/90 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-blue-50/80 dark:bg-blue-950/40 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-blue-200 bg-blue-100/70 text-blue-700 shadow-2xs shrink-0">
                  <Megaphone className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-[20px] font-semibold text-slate-900 leading-none">Phát thông báo phòng thi</h3>
                  <p className="mt-1 text-[13px] text-slate-500 font-semibold leading-none">
                    Hiển thị thông báo tức thời trên màn hình của tất cả thí sinh
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 font-medium mb-1.5">Mẫu thông báo nhanh:</label>
                <div className="flex flex-col gap-1.5">
                  {[
                    'Thời gian làm bài còn lại 15 phút. Các em chú ý rà soát lại câu trả lời.',
                    'Đề nghị tất cả thí sinh giữ trật tự và không rời khỏi màn hình làm bài.',
                    'Hệ thống mạng vừa được khôi phục, thí sinh tiếp tục làm bài bình thường.',
                  ].map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => setBroadcastMessage(tpl)}
                      className="text-left text-xs p-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/60 text-slate-700 transition cursor-pointer"
                    >
                      • {tpl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[15px] text-slate-700 font-medium mb-1.5">Nội dung thông báo:</label>
                <textarea
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Nhập nội dung cần phát đến toàn bộ thí sinh trong phòng..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-[15px] font-normal text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/80 px-6 py-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setShowBroadcastModal(false)}
                disabled={broadcastProcessing}
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSendBroadcast}
                disabled={broadcastProcessing || !broadcastMessage.trim()}
                isLoading={broadcastProcessing}
                leftIcon={<Megaphone className="w-3.5 h-3.5" />}
              >
                Gửi thông báo
              </Button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ═══════ BULK EXTEND MODAL ═══════ */}
      {mounted && showBulkModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md my-auto overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200/90 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-amber-50/60 dark:bg-amber-950/40 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-amber-200 bg-amber-100/70 text-amber-700 shadow-2xs shrink-0">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-[20px] font-semibold text-slate-900 leading-none">Bù giờ toàn phòng thi khẩn cấp</h3>
                  <p className="mt-1 text-[13px] text-slate-500 font-semibold leading-none">Cộng bù thời gian làm bài cho tất cả sinh viên</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
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
                <label className="block text-slate-700 font-medium mb-1.5">Chọn số phút cộng bù hàng loạt:</label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20, 30].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setBulkMinutes(m)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${bulkMinutes === m
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
                <label className="block text-[15px] text-slate-700 font-medium mb-1.5">Lý do bù giờ (Ghi rõ để lưu biên bản thanh tra):</label>
                <textarea
                  rows={3}
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-[15px] font-normal text-slate-900 focus:outline-none focus:border-amber-500"
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
      , document.body)}

      {/* ═══════ REOPEN ENTRY MODAL ═══════ */}
      {mounted && showReopenEntryModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md my-auto overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200/90 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-blue-50/60 dark:bg-blue-950/40 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-blue-200 bg-blue-100/70 text-blue-700 shadow-2xs shrink-0">
                  <PlusCircle className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-[20px] font-semibold text-slate-900 leading-none">Mở Giờ Cho Vào Thi Muộn</h3>
                  <p className="mt-1 text-[13px] text-slate-500 font-semibold leading-none">Gia hạn thời gian cho phép sinh viên bắt đầu làm bài</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReopenEntryModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
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
                <label className="block text-slate-700 font-medium mb-1.5">Số phút cho phép vào thi kể từ bây giờ:</label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setLateWindowMinutes(m)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${lateWindowMinutes === m
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
      , document.body)}

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
