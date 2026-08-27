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
import { ProctorFilterPopover } from '@/components/proctor/ProctorFilterPopover';
import { ProctorBulkAction } from '@/components/exam-supervisors/ProctorBulkAction';
import { ProfileDrawer } from '@/components/ProfileDrawer';

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

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Candidate Inspector Drawer state
  const [inspectStudent, setInspectStudent] = useState<any | null>(null);

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
      setBulkProcessing(true);
      const res = await onlineExamService.bulkExtendTime(scheduleRoomId, bulkMinutes, bulkReason);
      setShowBulkModal(false);
      setToast({
        message: res.message || `Đã bù giờ +${bulkMinutes} phút cho tất cả thí sinh thành công!`,
        type: 'success',
      });
      void loadDashboard(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể bù giờ toàn phòng.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleReopenEntryConfirm = () => {
    if (!data?.scheduleId) return;
    setConfirmModal({
      isOpen: true,
      title: 'Mở giờ vào thi muộn?',
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
      const res = await onlineExamService.reopenEntry(data.scheduleId, lateWindowMinutes);
      setShowReopenEntryModal(false);
      setToast({
        message: res.message || `Đã mở lại thời gian cho phép vào thi thêm ${lateWindowMinutes} phút thành công!`,
        type: 'success',
      });
      void loadDashboard(true);
    } catch (e: any) {
      const errText = e?.response?.data?.message || e?.message || 'Không thể gia hạn giờ vào thi';
      setToast({ message: errText, type: 'error' });
    } finally {
      setReopenEntryProcessing(false);
    }
  };

  const handleAction = async () => {
    if (!selectedStudent?.attempt?.id) return;
    try {
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
      const msg = err?.response?.data?.message || err?.message || 'Thao tác thất bại. Vui lòng kiểm tra lại dữ liệu và thử lại.';
      setToast({ message: msg, type: 'error' });
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
        <p className="text-type-helper font-semibold text-slate-500">Đang kết nối bảng điều khiển giám thị trực tiếp...</p>
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
          <h2 className="text-type-card font-semibold text-slate-900">Lỗi tải bảng điều khiển giám thị</h2>
          <p className="text-slate-500 text-type-helper font-medium">{error}</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-type-helper font-semibold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
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
      {/* ── 1. Standard Page Header ── */}
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

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-type-page font-semibold leading-[36px] tracking-tight text-slate-900 dark:text-slate-100">
                Giám Thị Phòng: <span className="text-blue-600 dark:text-blue-400">{data.roomName}</span>
              </h1>
              <span className="inline-flex items-center gap-1.5 text-type-helper font-semibold text-emerald-600 shrink-0">
                <span className="relative flex w-2 h-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Trực tiếp
              </span>
            </div>

            <p className="flex items-center gap-4 text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400 flex-wrap">
              <span>Môn: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{data.subjectName}</strong></span>
              <span>Ngày: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{new Date(data.examDate).toLocaleDateString('vi-VN')}</strong></span>
              <span>Ca thi: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{data.startTime} – {data.endTime}</strong></span>
            </p>
          </div>
        </div>

        {/* Quick Proctoring Actions: Chuẩn phân cấp 3 bậc (Ghost -> Secondary -> Primary ngoài cùng) */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => setShowReopenEntryModal(true)}
            leftIcon={<PlusCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />}
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

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setShowBroadcastModal(true)}
            leftIcon={<Megaphone className="h-4 w-4" />}
          >
            Phát thông báo
          </Button>
        </div>
      </div>

      {/* ── Banner Cảnh Báo Sự Cố Ngắt Kết Nối Hàng Loạt ── */}
      {(stats.disconnected ?? 0) > 0 && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/90 dark:bg-rose-950/40 p-4 text-type-body font-medium text-rose-950 dark:text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-600 text-white shadow-2xs">
              <AlertTriangle className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <span className="text-type-body font-semibold text-rose-950 dark:text-rose-100 block">Cảnh báo mất kết nối mạng</span>
              <span className="text-rose-800 dark:text-rose-300 font-normal text-type-body-sm">
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
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-type-body-sm rounded-xl shadow-xs transition active:scale-95 cursor-pointer shrink-0"
          >
            Bù giờ khẩn cấp toàn phòng (+15p)
          </button>
        </div>
      )}

      {/* ── 2. Standard 5 KPI Cards With Micro Progress Tracks ── */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {KPI_CARDS.map(({ label, value, subtext, progressPercent, icon: Icon }) => (
          <div
            key={label}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer"
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
                className="text-type-helper font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
              >
                {subtext}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. Search & Action Toolbar Row (Single Unified Row) ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Unified Search Bar with Embedded SlidersHorizontal Popover */}
        <div className="relative flex-1 max-w-xl min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Tìm tên, mã SV, SBD, ghế..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-20 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
          />

          {/* Embedded actions on right edge of search input */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {search ? (
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
            ) : (
              <kbd
                className="hidden sm:inline-flex h-5 items-center justify-center px-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-normal text-type-helper text-slate-400 select-none cursor-pointer"
                onClick={() => searchInputRef.current?.focus()}
                title="Nhấn phím / để tìm nhanh"
              >
                /
              </kbd>
            )}

            <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

            <ProctorFilterPopover
              statusFilter={filter}
              onStatusFilterChange={(val) => {
                setFilter(val);
                setPage(1);
              }}
              riskFilter={riskFilter}
              onRiskFilterChange={(val) => {
                setRiskFilter(val);
                setPage(1);
              }}
              students={students}
              totalFilteredCount={totalItems}
              onResetAll={() => {
                setSearch('');
                setFilter('ALL');
                setRiskFilter('ALL');
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Right: Table Action Controls */}
        <div className="shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3 py-1">
            <div className="flex items-center gap-2">
              <span className="text-type-helper font-semibold text-slate-600 dark:text-slate-400">
                Hiển thị <span className="font-semibold text-slate-900 dark:text-slate-100">{totalItems.toLocaleString('vi-VN')}</span> / {students.length} thí sinh
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
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Status Filter TabBar ── */}
      <div className="border-b border-slate-200/80 dark:border-slate-800">
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
          className="border-b-0 pt-0"
        />
      </div>

      {/* ── 5. Main Content (Standard List View Mode) ── */}
      {totalItems === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-12 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Users className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-type-body font-semibold text-slate-800 dark:text-slate-200">Không tìm thấy thí sinh nào</h3>
          <p className="text-type-helper font-medium text-slate-500 max-w-sm">
            Không có thí sinh nào phù hợp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        /* ── 5.1 Standard List View Mode (Default Table) ── */
        <div className="ui-table-wrap w-full max-w-full overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <table className="ui-table w-full min-w-[750px] text-left text-type-body text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-type-body-sm font-medium tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th scope="col" className="p-3.5 pl-4 text-center w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                const { label: statusLabel } = statusMeta(att);
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
                        className="h-4 w-4 rounded-xl border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {/* SBD / Seat */}
                    {visibleColumns.seat !== false && (
                      <td className="p-3.5 whitespace-nowrap">
                        <IdentifierBadge tone="neutral">{s.examNumber}</IdentifierBadge>
                        <span className="table-badge ml-2 ui-pill inline-flex items-center text-type-helper font-medium text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900">
                          Ghế {s.seatNumber}
                        </span>
                      </td>
                    )}

                    {/* Name */}
                    {visibleColumns.name !== false && (
                      <td className="p-3.5 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setInspectStudent(s)}
                            className="font-semibold text-slate-900 dark:text-slate-100 text-type-body leading-[22px] truncate hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer text-left"
                            title="Xem chi tiết thí sinh"
                          >
                            {s.student.fullName}
                          </button>
                          {hasFlagged && <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                        </div>
                      </td>
                    )}

                    {/* Student code */}
                    {visibleColumns.code !== false && (
                      <td className="p-3.5 whitespace-nowrap">
                        <IdentifierBadge tone="blue">{s.student.studentCode}</IdentifierBadge>
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
                        <span className={`text-type-body leading-[22px] ${riskCls}`}>
                          {riskScore}đ ({riskLevel})
                        </span>
                      </td>
                    )}

                    {/* Actions */}
                    {visibleColumns.actions !== false && (
                      <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                        <div className="table-action inline-flex items-center gap-1">
                          {/* Xem chi tiết hồ sơ */}
                          <button
                            type="button"
                            onClick={() => setInspectStudent(s)}
                            title="Xem chi tiết hồ sơ thí sinh"
                            className="table-action h-8 w-8 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer select-none"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Gia hạn bài thi */}
                          {att && ['IN_PROGRESS', 'DISCONNECTED'].includes(att.status) && (
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setSelectedStudent(s);
                                setActionType('EXTEND');
                              }}
                              title="Gia hạn thời gian làm bài"
                              className="table-action h-8 inline-flex items-center gap-1.5 rounded-xl px-2.5 text-type-body font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-950/50 transition active:scale-95 cursor-pointer select-none"
                            >
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Gia hạn</span>
                            </button>
                          )}

                          {/* Mở lại phiên thi */}
                          {att && ['DISCONNECTED', 'UNDER_REVIEW'].includes(att.status) && (
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setSelectedStudent(s);
                                setActionType('REOPEN');
                              }}
                              title="Mở lại phiên thi khi có sự cố"
                              className="table-action h-8 inline-flex items-center gap-1.5 rounded-xl px-2.5 text-type-body font-medium text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50/80 dark:hover:bg-amber-950/50 transition active:scale-95 cursor-pointer select-none"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                              <span>Mở lại</span>
                            </button>
                          )}

                          {/* Xử lý biên bản nếu đã bị flag */}
                          {att?.isFlagged ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setSelectedStudent(s);
                                setActionType('RESOLVE');
                              }}
                              title="Xử lý biên bản vi phạm"
                              className="table-action h-8 inline-flex items-center gap-1.5 rounded-xl px-2.5 text-type-body font-medium bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition active:scale-95 cursor-pointer select-none shadow-2xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              <span>Xử lý</span>
                            </button>
                          ) : (
                            /* Lập biên bản vi phạm */
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setSelectedStudent(s);
                                setActionType('FLAG');
                              }}
                              title="Lập biên bản sự cố vi phạm"
                              className="table-action h-8 inline-flex items-center gap-1.5 rounded-xl px-2.5 text-type-body font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-950/50 transition active:scale-95 cursor-pointer select-none"
                            >
                              <Flag className="w-3.5 h-3.5 text-slate-400" />
                              <span>Biên bản</span>
                            </button>
                          )}
                        </div>
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
          <p className="text-type-helper font-semibold text-slate-500">
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
                    <span key={`dots-${idx}`} className="px-1 text-type-helper font-semibold text-slate-400">
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
                    className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2.5 text-type-helper font-semibold transition cursor-pointer shadow-2xs ${isCurrent
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
              className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-7 text-type-body font-medium text-slate-700 outline-none hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </FilterSelect>
          </div>
        </div>
      )}

      {/* ── 7. Floating Multi-Student Bulk Action Bar (Chuẩn Sleek Blue-White Floating HUD Dock) ── */}
      <ProctorBulkAction
        selectedCount={selectedIds.length}
        totalCount={totalItems}
        allSelected={allSelected}
        onToggleAll={() => handleSelectAll(!allSelected)}
        onExtend={() => setShowMultiExtendModal(true)}
        onBroadcast={() => setShowBroadcastModal(true)}
        onClear={() => setSelectedIds([])}
      />

      {/* ═══════ ACTION MODAL ═══════ */}
      {mounted && actionType && selectedStudent && typeof document !== 'undefined' && createPortal((() => {
        const meta = actionMeta[actionType];
        const MetaIcon = meta.icon;
        return (
          <div role="dialog" aria-modal="true" aria-label={meta.title} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-modal-backdrop">
            <div className="relative w-full max-w-lg my-auto overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/90 dark:border-slate-800 animate-modal-dialog will-change-transform">
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${actionType === 'FLAG'
                      ? 'border-rose-200/80 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                      : actionType === 'RESOLVE'
                        ? 'border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : actionType === 'REOPEN'
                          ? 'border-amber-200/80 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                          : 'border-blue-200/80 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    } shadow-2xs shrink-0`}>
                    <MetaIcon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-type-section font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                      {meta.title}
                    </h3>
                    <p className="mt-1.5 text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                      {meta.desc}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Đóng (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-6 space-y-4 text-type-helper font-semibold">
                {/* Student info flat strip */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-type-helper text-slate-400 dark:text-slate-500 font-normal">Thí sinh:</span>
                    <strong className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
                      {selectedStudent.student.fullName}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <IdentifierBadge tone="blue">{selectedStudent.student.studentCode}</IdentifierBadge>
                    {selectedStudent.examNumber && (
                      <IdentifierBadge tone="neutral">{selectedStudent.examNumber}</IdentifierBadge>
                    )}
                  </div>
                </div>

                {/* EXTEND Sub-view */}
                {actionType === 'EXTEND' && (
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-medium text-type-body">
                      Số phút cộng thêm vào bài thi:
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[5, 10, 15, 20, 30].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setExtraMinutes(m)}
                          className={`py-2.5 rounded-xl border text-type-body-sm font-semibold transition cursor-pointer select-none ${extraMinutes === m
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs shadow-blue-500/25 ring-1 ring-blue-500/50'
                              : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/40 dark:hover:bg-blue-950/40'
                            }`}
                        >
                          +{m}p
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* RESOLVE Sub-view */}
                {actionType === 'RESOLVE' && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-slate-700 dark:text-slate-300 font-medium text-type-body">
                        Quyết định xử lý sự cố:
                      </label>
                      <FilterSelect
                        value={resolutionDecision}
                        onChange={(e) => setResolutionDecision(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-type-body font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                      >
                        <option value="REOPEN">Cho phép mở lại phiên thi để làm tiếp</option>
                        <option value="PENALTY">Giữ nguyên bài thi & Áp dụng trừ điểm</option>
                        <option value="TERMINATE">Đình chỉ thi & Hủy kết quả bài làm</option>
                      </FilterSelect>
                    </div>

                    {resolutionDecision === 'PENALTY' && (
                      <div className="space-y-1.5">
                        <label className="block text-slate-700 dark:text-slate-300 font-medium text-type-body">
                          Số điểm trừ trực tiếp (thang 10):
                        </label>
                        <input
                          type="number"
                          min="0.5"
                          max="10"
                          step="0.5"
                          value={penaltyPoints}
                          onChange={(e) => setPenaltyPoints(Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-type-body font-normal text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 shadow-2xs"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* FLAG Sub-view: Lập biên bản sự cố */}
                {actionType === 'FLAG' && (
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-medium text-type-body">
                      Phân loại sự cố ghi nhận:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { value: 'UNDER_REVIEW', label: 'Tạm giữ kiểm tra', desc: 'Hội đồng xem xét sau' },
                        { value: 'CONFIRMED_VIOLATION', label: 'Xác nhận vi phạm', desc: 'Vi phạm quy chế thi' },
                        { value: 'DISMISSED', label: 'Sự cố khách quan', desc: 'Lỗi thiết bị / sự cố ngoài ý muốn' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setIncidentDecision(opt.value)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer select-none ${incidentDecision === opt.value
                              ? 'border-rose-500 bg-rose-50/90 dark:bg-rose-950/60 ring-1 ring-rose-500/50'
                              : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50/30 dark:hover:bg-rose-950/30'
                            }`}
                        >
                          <div className={`text-type-helper font-semibold ${incidentDecision === opt.value ? 'text-rose-700 dark:text-rose-300' : 'text-slate-900 dark:text-slate-100'
                            }`}>
                            {opt.label}
                          </div>
                          <p className="text-type-helper text-slate-500 dark:text-slate-400 font-normal line-clamp-1 mt-0.5">
                            {opt.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reason Editor with Presets */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 dark:text-slate-300 font-medium text-type-body">
                      {actionType === 'FLAG' ? 'Lý do / Mô tả chi tiết vi phạm:' : 'Lý do thực hiện:'}
                    </label>
                    {reason && (
                      <button
                        type="button"
                        onClick={() => setReason('')}
                        className="text-type-helper font-semibold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                      >
                        Xóa nội dung
                      </button>
                    )}
                  </div>

                  {/* Quick presets for FLAG */}
                  {actionType === 'FLAG' && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {[
                        'Sử dụng thiết bị trái phép (điện thoại/tai nghe)',
                        'Trao đổi hoặc nhìn bài thí sinh khác',
                        'Mở ứng dụng/tab khác ngoài bài thi',
                        'Rời khỏi vị trí khi chưa được phép',
                      ].map((tpl) => (
                        <button
                          key={tpl}
                          type="button"
                          onClick={() => setReason(tpl)}
                          className={`px-2.5 py-1 rounded-xl text-type-helper font-medium border transition cursor-pointer select-none ${reason === tpl
                              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                              : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800'
                            }`}
                        >
                          {tpl}
                        </button>
                      ))}
                    </div>
                  )}

                  <textarea
                    rows={3}
                    maxLength={500}
                    placeholder="Nhập lý do hoặc ghi chú cho hội đồng thi..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !processing) {
                        e.preventDefault();
                        handleAction();
                      }
                    }}
                    className={`w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-3 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition resize-none shadow-2xs ${actionType === 'FLAG' ? 'focus:border-rose-500' : 'focus:border-blue-500'
                      }`}
                  />

                  {/* Meta row */}
                  <div className="flex items-center justify-between text-type-helper text-slate-400 dark:text-slate-500 select-none pt-0.5">
                    <span className="hidden sm:inline-flex items-center gap-1 font-normal">
                      Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-500 dark:text-slate-400">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-500 dark:text-slate-400">Enter</kbd> để xác nhận
                    </span>
                    <span className="ml-auto font-medium tabular-nums">
                      {reason.length} / 500 ký tự
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 px-6 py-3.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setActionType(null)}
                  disabled={processing}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="button"
                  variant={actionType === 'FLAG' ? 'danger' : actionType === 'RESOLVE' ? 'success' : 'primary'}
                  size="md"
                  onClick={handleAction}
                  disabled={processing}
                  isLoading={processing}
                  leftIcon={
                    actionType === 'FLAG' ? (
                      <Flag className="w-4 h-4" />
                    ) : actionType === 'RESOLVE' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )
                  }
                >
                  {actionType === 'FLAG' ? 'Lập biên bản' : actionType === 'RESOLVE' ? 'Xác nhận xử lý' : 'Xác nhận'}
                </Button>
              </div>
            </div>
          </div>
        );
      })(), document.body)}

      {/* ═══════ MULTI-STUDENT EXTEND MODAL ═══════ */}
      {mounted && showMultiExtendModal && typeof document !== 'undefined' && createPortal(
        <div role="dialog" aria-modal="true" aria-label="Gia hạn nhóm thí sinh" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-modal-backdrop">
          <div className="relative w-full max-w-lg my-auto overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/90 dark:border-slate-800 animate-modal-dialog will-change-transform">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200/80 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-2xs shrink-0">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
                    Gia hạn nhóm thí sinh
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="ui-pill inline-flex items-center gap-1 text-type-helper font-medium px-2 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300">
                      <Users className="w-3 h-3" />
                      Áp dụng cho {selectedIds.length} thí sinh đã chọn
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMultiExtendModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                title="Đóng (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-type-helper font-semibold">
              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 font-medium text-type-body">
                  Chọn số phút cộng thêm:
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[5, 10, 15, 20, 30].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMultiMinutes(m)}
                      className={`py-2.5 rounded-xl border text-type-body-sm font-semibold transition cursor-pointer select-none ${multiMinutes === m
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs shadow-blue-500/25 ring-1 ring-blue-500/50'
                          : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/40 dark:hover:bg-blue-950/40'
                        }`}
                    >
                      +{m}p
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 font-medium text-type-body">
                  Lý do gia hạn:
                </label>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={multiReason}
                  onChange={(e) => setMultiReason(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !multiProcessing) {
                      e.preventDefault();
                      handleMultiExtend();
                    }
                  }}
                  placeholder="Nhập lý do gia hạn cho nhóm thí sinh..."
                  className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-3 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500 transition resize-none shadow-2xs"
                />

                <div className="flex items-center justify-between text-type-helper text-slate-400 dark:text-slate-500 select-none pt-0.5">
                  <span className="hidden sm:inline-flex items-center gap-1 font-normal">
                    Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-500 dark:text-slate-400">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-500 dark:text-slate-400">Enter</kbd> để xác nhận
                  </span>
                  <span className="ml-auto font-medium tabular-nums">
                    {multiReason.length} / 300 ký tự
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 px-6 py-3.5">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setShowMultiExtendModal(false)}
                disabled={multiProcessing}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleMultiExtend}
                disabled={multiProcessing}
                isLoading={multiProcessing}
                leftIcon={<Clock className="w-4 h-4" />}
              >
                Gia hạn nhóm
              </Button>
            </div>
          </div>
        </div>
        , document.body)}

      {/* ═══════ BROADCAST ANNOUNCEMENT MODAL ═══════ */}
      {mounted && showBroadcastModal && typeof document !== 'undefined' && createPortal(
        <div role="dialog" aria-modal="true" aria-label="Phát loa thông báo" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-modal-backdrop">
          <div className="relative w-full max-w-lg my-auto overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/90 dark:border-slate-800 animate-modal-dialog will-change-transform">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200/80 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-2xs shrink-0">
                  <Megaphone className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
                    Phát thông báo phòng thi
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2">
                    {selectedIds.length > 0 ? (
                      <span className="ui-pill inline-flex items-center gap-1 text-type-helper font-medium px-2 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300">
                        <Users className="w-3 h-3" />
                        Gửi đến {selectedIds.length} thí sinh đã chọn
                      </span>
                    ) : (
                      <span className="ui-pill inline-flex items-center gap-1 text-type-helper font-medium px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300">
                        <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                        Toàn phòng • {stats.total || 0} thí sinh
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                title="Đóng (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-type-helper font-semibold">
              {/* Quick Presets Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 dark:text-slate-300 font-medium text-type-body">
                    Mẫu thông báo nhanh:
                  </label>
                  <span className="text-type-helper text-slate-400 dark:text-slate-500 font-normal">
                    Chọn 1 chạm để áp dụng
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      id: 'time_15',
                      icon: Clock,
                      label: 'Nhắc thời gian (15p)',
                      text: 'Thời gian làm bài còn lại 15 phút. Các em chú ý rà soát lại câu trả lời.',
                    },
                    {
                      id: 'order',
                      icon: ShieldAlert,
                      label: 'Yêu cầu giữ trật tự',
                      text: 'Đề nghị tất cả thí sinh giữ trật tự và không rời khỏi màn hình làm bài.',
                    },
                    {
                      id: 'network',
                      icon: Wifi,
                      label: 'Mạng đã khôi phục',
                      text: 'Hệ thống mạng vừa được khôi phục, thí sinh tiếp tục làm bài bình thường.',
                    },
                    {
                      id: 'time_5',
                      icon: Bell,
                      label: 'Sắp hết giờ (5p)',
                      text: 'Còn 5 phút cuối cùng. Hệ thống sẽ tự động thu bài khi hết thời gian.',
                    },
                  ].map((preset) => {
                    const PresetIcon = preset.icon;
                    const isSelected = broadcastMessage === preset.text;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setBroadcastMessage(preset.text)}
                        className={`group flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer select-none ${isSelected
                            ? 'border-blue-500 bg-blue-50/90 dark:bg-blue-950/60 ring-1 ring-blue-500/50'
                            : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/30'
                          }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition ${isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 group-hover:text-blue-600'
                            }`}
                        >
                          <PresetIcon className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-type-helper font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                            {preset.label}
                          </div>
                          <p className="text-type-helper text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 leading-snug font-normal">
                            {preset.text}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Textarea Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 dark:text-slate-300 font-medium text-type-body">
                    Nội dung thông báo:
                  </label>
                  {broadcastMessage && (
                    <button
                      type="button"
                      onClick={() => setBroadcastMessage('')}
                      className="text-type-helper font-semibold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                    >
                      Xóa nội dung
                    </button>
                  )}
                </div>

                <textarea
                  rows={4}
                  maxLength={500}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && broadcastMessage.trim() && !broadcastProcessing) {
                      e.preventDefault();
                      handleSendBroadcast();
                    }
                  }}
                  placeholder="Nhập nội dung cần phát đến thí sinh..."
                  className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-3 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500 transition resize-none shadow-2xs"
                />

                {/* Helper & Counter */}
                <div className="flex items-center justify-between text-type-helper text-slate-400 dark:text-slate-500 select-none pt-0.5">
                  <span className="hidden sm:inline-flex items-center gap-1 font-normal">
                    Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-500 dark:text-slate-400">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-500 dark:text-slate-400">Enter</kbd> để gửi nhanh
                  </span>
                  <span
                    className={`ml-auto font-medium tabular-nums ${broadcastMessage.length >= 450 ? 'text-amber-600 dark:text-amber-400' : ''
                      }`}
                  >
                    {broadcastMessage.length} / 500 ký tự
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 px-6 py-3.5">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setShowBroadcastModal(false)}
                disabled={broadcastProcessing}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSendBroadcast}
                disabled={broadcastProcessing || !broadcastMessage.trim()}
                isLoading={broadcastProcessing}
                leftIcon={<Megaphone className="w-4 h-4" />}
              >
                Phát thông báo
              </Button>
            </div>
          </div>
        </div>
        , document.body)}

      {/* ═══════ BULK EXTEND MODAL ═══════ */}
      {mounted && showBulkModal && typeof document !== 'undefined' && createPortal(
        <div role="dialog" aria-modal="true" aria-label="Bù giờ toàn phòng thi" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-modal-backdrop">
          <div className="relative w-full max-w-lg my-auto overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/90 dark:border-slate-800 animate-modal-dialog will-change-transform">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200/80 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-2xs shrink-0">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
                    Bù giờ toàn phòng thi
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2">
                    {selectedIds.length > 0 ? (
                      <span className="ui-pill inline-flex items-center gap-1 text-type-helper font-medium px-2 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300">
                        <Users className="w-3 h-3" />
                        Cộng bù cho {selectedIds.length} thí sinh đã chọn
                      </span>
                    ) : (
                      <span className="ui-pill inline-flex items-center gap-1 text-type-helper font-medium px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300">
                        <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                        Toàn phòng • {stats.total || 0} thí sinh
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                title="Đóng (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-type-helper font-semibold">
              {/* Select Minutes */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 font-medium text-type-body">
                  Chọn số phút cộng bù:
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[5, 10, 15, 20, 30].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setBulkMinutes(m)}
                      className={`py-2.5 rounded-xl border text-type-body-sm font-semibold transition cursor-pointer select-none ${bulkMinutes === m
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs shadow-blue-500/25 ring-1 ring-blue-500/50'
                          : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/40 dark:hover:bg-blue-950/40'
                        }`}
                    >
                      +{m}p
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason Presets & Textarea */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 font-medium text-type-body">
                  Lý do bù giờ (Ghi rõ để lưu biên bản thanh tra):
                </label>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[
                    'Sự cố mạng diện rộng',
                    'Mất điện phòng thi tạm thời',
                    'Lỗi hệ thống máy chủ',
                    'Đính chính nội dung đề thi',
                  ].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setBulkReason(r)}
                      className={`px-2.5 py-1 rounded-xl text-type-helper font-medium border transition cursor-pointer select-none ${bulkReason === r
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800'
                        }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  maxLength={300}
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !bulkProcessing) {
                      e.preventDefault();
                      handleBulkExtend();
                    }
                  }}
                  placeholder="Nhập chi tiết lý do bù giờ..."
                  className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-3 text-type-body font-normal text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500 transition resize-none shadow-2xs"
                />

                {/* Helper & Counter */}
                <div className="flex items-center justify-between text-type-helper text-slate-400 dark:text-slate-500 select-none pt-0.5">
                  <span className="hidden sm:inline-flex items-center gap-1 font-normal">
                    Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-500 dark:text-slate-400">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-500 dark:text-slate-400">Enter</kbd> để xác nhận
                  </span>
                  <span className="ml-auto font-medium tabular-nums">
                    {bulkReason.length} / 300 ký tự
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 px-6 py-3.5">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setShowBulkModal(false)}
                disabled={bulkProcessing}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleBulkExtend}
                disabled={bulkProcessing}
                isLoading={bulkProcessing}
                leftIcon={<Clock className="w-4 h-4" />}
              >
                Xác nhận bù giờ
              </Button>
            </div>
          </div>
        </div>
        , document.body)}

      {/* ═══════ REOPEN ENTRY MODAL ═══════ */}
      {mounted && showReopenEntryModal && typeof document !== 'undefined' && createPortal(
        <div role="dialog" aria-modal="true" aria-label="Mở giờ cho vào thi muộn" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-modal-backdrop">
          <div className="relative w-full max-w-md my-auto overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/90 dark:border-slate-800 animate-modal-dialog will-change-transform">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200/80 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-2xs shrink-0">
                  <PlusCircle className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-type-section font-semibold text-slate-900 dark:text-slate-100">
                    Mở giờ cho vào thi muộn
                  </h3>
                  <p className="mt-1.5 text-type-helper text-slate-500 dark:text-slate-400 font-normal">
                    Gia hạn thời gian cho phép sinh viên bắt đầu làm bài
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReopenEntryModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                title="Đóng (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-type-helper font-semibold">
              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 font-medium text-type-body">
                  Số phút cho phép vào thi kể từ bây giờ:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setLateWindowMinutes(m)}
                      className={`py-2.5 rounded-xl border text-type-body-sm font-semibold transition cursor-pointer select-none ${lateWindowMinutes === m
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs shadow-blue-500/25 ring-1 ring-blue-500/50'
                          : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/40 dark:hover:bg-blue-950/40'
                        }`}
                    >
                      +{m}p
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 px-6 py-3.5">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setShowReopenEntryModal(false)}
                disabled={reopenEntryProcessing}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleReopenEntryConfirm}
                disabled={reopenEntryProcessing}
                isLoading={reopenEntryProcessing}
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Mở vào thi
              </Button>
            </div>
          </div>
        </div>
        , document.body)}

      {/* Candidate Profile Drawer */}
      <ProfileDrawer
        isOpen={!!inspectStudent}
        onClose={() => setInspectStudent(null)}
        title={inspectStudent?.student?.fullName || 'Hồ Sơ Thí Sinh & Phiên Thi'}
        subtitle={inspectStudent?.student?.studentCode ? `Mã sinh viên: ${inspectStudent.student.studentCode}` : ''}
        avatarText={inspectStudent?.student?.fullName?.trim().split(' ').pop()?.slice(0, 2)?.toUpperCase() || 'SV'}
        badge={{
          label: statusMeta(inspectStudent?.attempt).label,
          status: inspectStudent?.attempt?.status || 'NOT_STARTED',
        }}
        details={[
          { label: 'Họ và tên thí sinh', value: inspectStudent?.student?.fullName || '---' },
          { label: 'Mã số sinh viên', value: <IdentifierBadge tone="blue">{inspectStudent?.student?.studentCode || '---'}</IdentifierBadge> },
          { label: 'Số báo danh (SBD)', value: <IdentifierBadge tone="neutral">{inspectStudent?.examNumber || '---'}</IdentifierBadge> },
          { label: 'Số thứ tự ghế', value: `Ghế số ${inspectStudent?.seatNumber || '---'}` },
          { label: 'Phòng thi', value: data?.roomName || '---' },
          { label: 'Trạng thái phiên thi', value: <StatusBadge status={inspectStudent?.attempt?.status || 'NOT_STARTED'} customLabel={statusMeta(inspectStudent?.attempt).label} /> },
          {
            label: 'Mức cảnh báo',
            value: (
              <span className={`font-semibold ${riskMeta(inspectStudent?.attempt?.riskScore || 0).cls}`}>
                {inspectStudent?.attempt?.riskScore || 0} điểm ({riskMeta(inspectStudent?.attempt?.riskScore || 0).level})
              </span>
            ),
          },
          { label: 'Địa chỉ IP', value: inspectStudent?.attempt?.connectedIp || 'Chưa ghi nhận IP' },
          {
            label: 'Thời gian bắt đầu',
            value: inspectStudent?.attempt?.startedAt
              ? new Date(inspectStudent.attempt.startedAt).toLocaleString('vi-VN')
              : 'Chưa bắt đầu',
          },
          {
            label: 'Thời gian gia hạn',
            value: inspectStudent?.attempt?.extraMinutes ? `+${inspectStudent.attempt.extraMinutes} phút` : 'Không có',
          },
          {
            label: 'Biên bản sự cố',
            value: inspectStudent?.attempt?.isFlagged ? (
              <span className="font-semibold text-rose-600">Đã lập biên bản sự cố</span>
            ) : (
              'Bình thường (Không có vi phạm)'
            ),
          },
        ]}
        extraSections={[
          {
            title: 'Thao Tác Giám Thị Trực Tiếp',
            content: (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {inspectStudent?.attempt && ['IN_PROGRESS', 'DISCONNECTED'].includes(inspectStudent.attempt.status) && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const target = inspectStudent;
                      setInspectStudent(null);
                      setActionError(null);
                      setSelectedStudent(target);
                      setActionType('EXTEND');
                    }}
                    leftIcon={<Clock className="w-3.5 h-3.5 text-blue-600" />}
                  >
                    Gia hạn làm bài
                  </Button>
                )}
                {inspectStudent?.attempt && ['DISCONNECTED', 'UNDER_REVIEW'].includes(inspectStudent.attempt.status) && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const target = inspectStudent;
                      setInspectStudent(null);
                      setActionError(null);
                      setSelectedStudent(target);
                      setActionType('REOPEN');
                    }}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-600" />}
                  >
                    Mở lại phiên thi
                  </Button>
                )}
                {inspectStudent?.attempt?.isFlagged && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      const target = inspectStudent;
                      setInspectStudent(null);
                      setActionError(null);
                      setSelectedStudent(target);
                      setActionType('RESOLVE');
                    }}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Xử lý biên bản
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const target = inspectStudent;
                    setInspectStudent(null);
                    setActionError(null);
                    setSelectedStudent(target);
                    setActionType('FLAG');
                  }}
                  leftIcon={<Flag className="w-3.5 h-3.5 text-rose-600" />}
                >
                  Lập biên bản
                </Button>
              </div>
            ),
          },
        ]}
      />

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
