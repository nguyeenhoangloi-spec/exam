'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onlineExamService } from '@/lib/services/online-exam.service';
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
  ChevronDown,
  Activity,
  Flag,
  RotateCcw,
  PlusCircle,
  FileText,
  Search,
} from 'lucide-react';

import { usePageTitle } from '@/components/PageTitleContext';

/* ─── helpers ─── */
function statusMeta(att: any) {
  if (!att) return { label: 'Chưa bắt đầu', cls: 'text-slate-500 font-semibold' };
  if (att.status === 'IN_PROGRESS')
    return { label: 'Đang làm bài', cls: 'text-blue-700 font-bold' };
  if (att.status === 'DISCONNECTED')
    return { label: 'Mất kết nối', cls: 'text-amber-700 font-bold' };
  if (['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(att.status))
    return { label: att.status === 'AUTO_SUBMITTED' ? 'Nộp tự động' : 'Đã nộp bài', cls: 'text-emerald-700 font-bold' };
  if (att.status === 'ABSENT') return { label: 'Vắng mặt', cls: 'text-rose-700 font-bold' };
  return { label: att.status, cls: 'text-slate-700 font-bold' };
}

function riskMeta(score: number) {
  if (score >= 40) return { cls: 'text-rose-700 bg-rose-50 border-rose-200', level: 'Cao' };
  if (score >= 15) return { cls: 'text-amber-700 bg-amber-50 border-amber-200', level: 'Trung bình' };
  return { cls: 'text-slate-600 bg-slate-50 border-slate-200', level: 'Thấp' };
}

const FILTER_LABELS: Record<string, string> = {
  ALL: 'Tất cả',
  IN_PROGRESS: 'Đang làm bài',
  FLAGGED: 'Có cảnh báo',
  SUBMITTED: 'Đã nộp bài',
};

export default function ProctorDashboardPage() {
  usePageTitle('Giám thị ca thi trực tiếp');
  const router = useRouter();
  const params = useParams();
  const scheduleRoomId = Number(params?.scheduleRoomId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'FLAGGED' | 'SUBMITTED'>('ALL');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('seat_asc');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [actionType, setActionType] = useState<'EXTEND' | 'REOPEN' | 'FLAG' | 'RESOLVE' | null>(null);
  const [extraMinutes, setExtraMinutes] = useState(10);
  const [reason, setReason] = useState('');
  const [incidentDecision, setIncidentDecision] = useState('UNDER_REVIEW');
  const [resolutionDecision, setResolutionDecision] = useState<'REOPEN' | 'PENALTY' | 'TERMINATE'>('REOPEN');
  const [penaltyPoints, setPenaltyPoints] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // States cho Bù giờ toàn phòng thi khẩn cấp
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkMinutes, setBulkMinutes] = useState(15);
  const [bulkReason, setBulkReason] = useState('Sự cố kỹ thuật mạng / hệ thống diện rộng');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // States cho Mở thời gian vào thi cho sinh viên vào trễ
  const [showReopenEntryModal, setShowReopenEntryModal] = useState(false);
  const [lateWindowMinutes, setLateWindowMinutes] = useState(30);
  const [reopenEntryProcessing, setReopenEntryProcessing] = useState(false);
  const [reopenEntrySuccessMsg, setReopenEntrySuccessMsg] = useState<string | null>(null);
  const [reopenEntryError, setReopenEntryError] = useState<string | null>(null);

  const loadDashboardRef = useRef<((isBackground?: boolean) => Promise<void>) | null>(null);

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

  const handleReopenEntry = async () => {
    if (!data?.scheduleId) return;
    try {
      setReopenEntryProcessing(true);
      setReopenEntryError(null);
      setReopenEntrySuccessMsg(null);
      const res = await onlineExamService.reopenEntry(data.scheduleId, lateWindowMinutes);
      setReopenEntrySuccessMsg(res.message || `Đã gia hạn thời gian cho phép vào thi thêm ${lateWindowMinutes} phút.`);
      setTimeout(() => {
        setShowReopenEntryModal(false);
        setReopenEntrySuccessMsg(null);
        void loadDashboard(true);
      }, 1500);
    } catch (e: any) {
      setReopenEntryError(e?.response?.data?.message || e?.message || 'Không thể gia hạn giờ vào thi');
    } finally {
      setReopenEntryProcessing(false);
    }
  };

  useEffect(() => {
    if (!scheduleRoomId) return;
    void loadDashboardRef.current?.();
    const interval = setInterval(() => { void loadDashboardRef.current?.(true); }, 3000);
    return () => clearInterval(interval);
  }, [scheduleRoomId]);

  const loadDashboard = useCallback(async (isBackground = false) => {
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
  }, [scheduleRoomId]);
  loadDashboardRef.current = loadDashboard;

  const handleAction = async () => {
    if (!selectedStudent?.attempt?.id) return;
    try {
      setActionError(null);
      setProcessing(true);
      if (actionType === 'EXTEND') await onlineExamService.extendTime(selectedStudent.attempt.id, extraMinutes, reason);
      else if (actionType === 'REOPEN') await onlineExamService.reopenAttempt(selectedStudent.attempt.id, reason);
      else if (actionType === 'FLAG') await onlineExamService.flagIncident(selectedStudent.attempt.id, reason, incidentDecision);
      else if (actionType === 'RESOLVE') await onlineExamService.resolveIncident(selectedStudent.attempt.id, resolutionDecision, penaltyPoints, reason);
      setActionType(null);
      setSelectedStudent(null);
      setReason('');
      loadDashboard(true);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || 'Thao tác thất bại. Vui lòng kiểm tra lại dữ liệu và thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  const students = data?.students || [];
  const filteredStudents = useMemo(() => {
    let result = students.filter((s: any) => {
      const matchSearch =
        !search ||
        (s.student?.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.student?.studentCode || '').toLowerCase().includes(search.toLowerCase()) ||
        String(s.examNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        String(s.seatNumber || '').toLowerCase().includes(search.toLowerCase());

      const matchFilter =
        filter === 'ALL' ||
        (filter === 'IN_PROGRESS' && s.attempt?.status === 'IN_PROGRESS') ||
        (filter === 'FLAGGED' && s.attempt?.isFlagged) ||
        (filter === 'SUBMITTED' && ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(s.attempt?.status));

      return matchSearch && matchFilter;
    });

    result = [...result].sort((a: any, b: any) => {
      if (sortOrder === 'seat_asc') return (a.seatNumber || 0) - (b.seatNumber || 0);
      if (sortOrder === 'seat_desc') return (b.seatNumber || 0) - (a.seatNumber || 0);
      if (sortOrder === 'name_asc') return (a.student?.fullName || '').localeCompare(b.student?.fullName || '', 'vi');
      if (sortOrder === 'risk_desc') return (b.attempt?.riskScore || 0) - (a.attempt?.riskScore || 0);
      if (sortOrder === 'code_asc') return (a.student?.studentCode || '').localeCompare(b.student?.studentCode || '');
      return 0;
    });

    return result;
  }, [students, search, filter, sortOrder]);

  const stats = data?.stats || {};

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
          <h2 className="text-lg font-black text-slate-900">Lỗi tải bảng điều khiển giám thị</h2>
          <p className="text-slate-500 text-xs font-medium">{error}</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang trước</span>
          </button>
        </div>
      </main>
    );
  }

  const KPI_CARDS = [
    { label: 'Tổng thí sinh', value: stats.total ?? 0, subtext: 'Trong danh sách phòng', icon: Users, iconBg: 'bg-blue-50 text-blue-600 border-blue-100' },
    { label: 'Đang làm bài', value: stats.inProgress ?? 0, subtext: 'Đang thao tác trực tuyến', icon: Activity, iconBg: 'bg-blue-50 text-blue-600 border-blue-100' },
    { label: 'Mất kết nối', value: stats.disconnected ?? 0, subtext: 'Cần hỗ trợ mạng / thiết bị', icon: WifiOff, iconBg: 'bg-amber-50 text-amber-600 border-amber-100' },
    { label: 'Đã nộp bài', value: stats.submitted ?? 0, subtext: 'Hoàn tất gửi bài thi', icon: CheckCircle2, iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { label: 'Có cảnh báo', value: stats.flagged ?? 0, subtext: 'Vi phạm quy chế thi', icon: ShieldAlert, iconBg: 'bg-rose-50 text-rose-600 border-rose-100' },
  ];

  const actionMeta: Record<string, { title: string; desc: string; icon: React.ElementType; color: string; iconBg: string }> = {
    EXTEND: { title: 'Gia hạn thời gian làm bài', desc: 'Cộng thêm thời gian cho phiên đang thi hoặc vừa mất kết nối.', icon: Clock, color: 'text-blue-600', iconBg: 'bg-blue-50 border-blue-200' },
    REOPEN: { title: 'Mở lại phiên thi', desc: 'Cho phép sinh viên tiếp tục phiên thi đã kết thúc hoặc bị gián đoạn.', icon: RotateCcw, color: 'text-amber-600', iconBg: 'bg-amber-50 border-amber-200' },
    FLAG: { title: 'Lập biên bản sự cố vi phạm', desc: 'Ghi nhận sự cố; giám thị có thể xử lý và quyết định kết quả sau.', icon: Flag, color: 'text-rose-600', iconBg: 'bg-rose-50 border-rose-200' },
    RESOLVE: { title: 'Xử lý biên bản vi phạm', desc: 'Chọn mở lại, giữ điểm và trừ điểm, hoặc đình chỉ bài thi.', icon: ShieldAlert, color: 'text-blue-600', iconBg: 'bg-blue-50 border-blue-200' },
  };

  return (
    <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">

      {/* ── Standard Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Quay lại
            </button>
            <span className="w-px h-3.5 bg-slate-300" />
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-extrabold tracking-wide">
              <Activity className="w-3.5 h-3.5" />
              Bảng Giám Thị Trực Tiếp
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Đang cập nhật • 3s
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Phòng: <span className="text-blue-600">{data.roomName}</span> &nbsp;•&nbsp; Môn: {data.subjectName}
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Ngày thi: <strong className="text-slate-800 font-bold">{new Date(data.examDate).toLocaleDateString('vi-VN')}</strong> &nbsp;•&nbsp; Ca thi: <strong className="text-slate-800 font-bold">{data.startTime} – {data.endTime}</strong>
            {lastUpdated && (
              <span className="ml-2 text-slate-400">
                (Cập nhật lúc {lastUpdated.toLocaleTimeString('vi-VN')})
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowReopenEntryModal(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
            title="Mở thêm thời gian cho sinh viên tới thi muộn"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Cho vào trễ (+30p)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
            title="Cộng bù giờ hàng loạt cho tất cả sinh viên đang làm bài trong phòng"
          >
            <Clock className="h-4 w-4 text-slate-500" />
            <span>Bù giờ toàn phòng (+15p)</span>
          </button>

          <button
            type="button"
            onClick={() => loadDashboard(false)}
            className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 text-slate-500" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ── Banner Cảnh Báo Sự Cố Ngắt Kết Nối Hàng Loạt ── */}
      {(stats.disconnected ?? 0) > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-bold text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-600 text-white shadow-2xs">
              <AlertTriangle className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <span className="text-sm font-black text-rose-950 block">CẢNH BÁO MẤT KẾT NỐI MẠNG</span>
              <span className="text-rose-800 font-semibold text-xs">
                Hiện có <strong className="font-extrabold">{stats.disconnected}</strong> sinh viên bị ngắt kết nối trong phòng thi. Vui lòng kiểm tra lại đường truyền mạng.
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
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer shrink-0"
          >
            Bù giờ khẩn cấp toàn phòng (+15p)
          </button>
        </div>
      )}

      {/* ── Standard KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {KPI_CARDS.map(({ label, value, subtext, icon: Icon, iconBg }) => (
          <div
            key={label}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {label}
                </span>
                <p className="text-2xl font-black text-slate-900 leading-tight">
                  {value}
                </p>
              </div>

              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconBg} transition-transform group-hover:scale-110`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-500">{subtext}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter / Search Toolbar ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo tên thí sinh, mã sinh viên, SBD, số ghế..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-9 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 outline-none hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              <option value="seat_asc">Sắp xếp: Số ghế tăng dần</option>
              <option value="seat_desc">Sắp xếp: Số ghế giảm dần</option>
              <option value="name_asc">Tên thí sinh: A - Z</option>
              <option value="risk_desc">Mức cảnh báo rủi ro cao nhất</option>
              <option value="code_asc">Mã sinh viên: Tăng dần</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 mr-1">Trạng thái:</span>
            {(['ALL', 'IN_PROGRESS', 'FLAGGED', 'SUBMITTED'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={[
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs',
                  filter === f
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
                ].join(' ')}
              >
                {FILTER_LABELS[f]}
                <span className={['ml-1.5 text-[10.5px] font-black', filter === f ? 'text-blue-100' : 'text-slate-400'].join(' ')}>
                  {f === 'ALL' && students.length}
                  {f === 'IN_PROGRESS' && students.filter((s: any) => s.attempt?.status === 'IN_PROGRESS').length}
                  {f === 'FLAGGED' && students.filter((s: any) => s.attempt?.isFlagged).length}
                  {f === 'SUBMITTED' && students.filter((s: any) => ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(s.attempt?.status)).length}
                </span>
              </button>
            ))}
          </div>

          <span className="text-xs font-bold text-slate-600">
            Hiển thị <strong className="text-slate-900 font-extrabold">{filteredStudents.length}</strong> / {students.length} thí sinh
          </span>
        </div>
      </div>

      {/* ── Main Table ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-blue-50 text-[11px] font-extrabold uppercase tracking-wider text-blue-700 border-b border-blue-100">
              <tr>
                <th className="p-3.5 pl-4 whitespace-nowrap">SBD / Ghế</th>
                <th className="p-3.5 min-w-[200px]">Họ và tên thí sinh</th>
                <th className="p-3.5 whitespace-nowrap">Mã SV</th>
                <th className="p-3.5 whitespace-nowrap">Trạng thái thi</th>
                <th className="p-3.5 text-center whitespace-nowrap">Mức cảnh báo</th>
                <th className="p-3.5 pr-4 text-right whitespace-nowrap">Thao tác giám thị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-xs font-semibold text-slate-400">
                    Không có thí sinh nào trong bộ lọc này
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s: any) => {
                  const att = s.attempt;
                  const riskScore = att?.riskScore || 0;
                  const { label: statusLabel, cls: statusCls } = statusMeta(att);
                  const { cls: riskCls, level: riskLevel } = riskMeta(riskScore);
                  const hasFlagged = att?.isFlagged;

                  return (
                    <tr key={s.student.id} className="hover:bg-blue-50/40 transition">
                      {/* SBD / Seat */}
                      <td className="p-3.5 pl-4 whitespace-nowrap">
                        <span className="font-mono font-black text-slate-900 text-xs">{s.examNumber}</span>
                        <span className="ml-1.5 text-slate-500 font-bold text-xs">G:{s.seatNumber}</span>
                      </td>

                      {/* Name */}
                      <td className="p-3.5 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-slate-900 text-xs truncate">{s.student.fullName}</p>
                          {hasFlagged && <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                        </div>
                      </td>

                      {/* Student code */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                          {s.student.studentCode}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-xs select-none ${statusCls}`}>
                          {att?.status === 'IN_PROGRESS' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          )}
                          {statusLabel}
                          {att?.extraMinutes > 0 && (
                            <span className="ml-1 text-[10px] font-black text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-md">+{att.extraMinutes}p</span>
                          )}
                        </span>
                      </td>

                      {/* Risk */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-mono font-bold ${riskCls}`}>
                          {riskScore}đ ({riskLevel})
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                        {att && (
                          <div className="inline-flex items-center gap-1.5">
                            {['IN_PROGRESS', 'DISCONNECTED'].includes(att.status) && (
                              <button
                                type="button"
                                onClick={() => { setActionError(null); setSelectedStudent(s); setActionType('EXTEND'); }}
                                title="Gia hạn thời gian làm bài"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
                              >
                                <Clock className="w-3 h-3" />
                                Gia hạn
                              </button>
                            )}
                            {['DISCONNECTED', 'UNDER_REVIEW'].includes(att.status) && (
                              <button
                                type="button"
                                onClick={() => { setActionError(null); setSelectedStudent(s); setActionType('REOPEN'); }}
                                title="Mở lại phiên thi khi có sự cố"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Mở lại
                              </button>
                            )}
                            {att.isFlagged && (
                              <button
                                type="button"
                                onClick={() => { setActionError(null); setSelectedStudent(s); setActionType('RESOLVE'); }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Xử lý
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => { setActionError(null); setSelectedStudent(s); setActionType('FLAG'); }}
                              title="Lập biên bản sự cố"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                              Biên bản
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════ ACTION MODAL ═══════ */}
      {actionType && selectedStudent && (() => {
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
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">{meta.title}</h3>
                    <p className="mt-1 text-[11px] text-slate-500 font-medium leading-none">{meta.desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Student info */}
              <div className="mx-6 mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Thí sinh: <strong className="text-slate-900 font-extrabold">{selectedStudent.student.fullName}</strong></span>
                <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                  {selectedStudent.student.studentCode}
                </span>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Extra minutes (EXTEND) */}
                {actionType === 'EXTEND' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Số phút cộng thêm
                    </label>
                    <input
                      type="number"
                      value={extraMinutes}
                      onChange={(e) => setExtraMinutes(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition"
                      min={1}
                      max={60}
                    />
                  </div>
                )}

                {/* Reopen Penalty (REOPEN) */}
                {actionType === 'REOPEN' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Điểm trừ vi phạm quy chế (Penalty Points)
                    </label>
                    <input
                      type="number"
                      step={0.25}
                      min={0}
                      max={10}
                      value={penaltyPoints}
                      onChange={(e) => setPenaltyPoints(Number(e.target.value))}
                      placeholder="Số điểm trừ (Ví dụ: 0.5, 1.0...)"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500 transition"
                    />
                    <p className="mt-1 text-[11px] text-amber-700 font-semibold">
                      * Điểm phạt sẽ tự động trừ trực tiếp vào tổng điểm thi cuối cùng.
                    </p>
                  </div>
                )}

                {/* Incident decision (FLAG) */}
                {actionType === 'FLAG' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Quyết định xử lý
                    </label>
                    <div className="relative">
                      <select
                        value={incidentDecision}
                        onChange={(e) => setIncidentDecision(e.target.value)}
                        className="w-full appearance-none border border-slate-200 rounded-xl px-3.5 py-2 pr-9 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                      >
                        <option value="UNDER_REVIEW">Yêu cầu xem xét (UNDER_REVIEW)</option>
                        <option value="TERMINATED">Đình chỉ ngay lập tức (TERMINATED)</option>
                        <option value="WARNING">Cảnh báo (WARNING)</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                )}

                {/* Resolution (RESOLVE) */}
                {actionType === 'RESOLVE' && (
                  <div className="space-y-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50">
                    <p className="text-xs font-bold text-amber-700">Sinh viên đã gửi giải trình. Chọn cách xử lý:</p>
                    <div className="relative">
                      <select
                        value={resolutionDecision}
                        onChange={(e) => setResolutionDecision(e.target.value as 'REOPEN' | 'PENALTY' | 'TERMINATE')}
                        className="w-full appearance-none border border-amber-200 bg-white rounded-xl px-3.5 py-2 pr-9 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400 transition cursor-pointer"
                      >
                        <option value="REOPEN">Chấp nhận giải trình, mở lại bài</option>
                        <option value="PENALTY">Giữ kết quả và trừ điểm</option>
                        <option value="TERMINATE">Đình chỉ bài thi</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                    {resolutionDecision === 'PENALTY' && (
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={penaltyPoints}
                        onChange={(e) => setPenaltyPoints(Number(e.target.value))}
                        placeholder="Số điểm trừ"
                        className="w-full border border-amber-200 bg-white rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400 transition"
                      />
                    )}
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Lý do thao tác <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Nhập nguyên nhân cụ thể..."
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                {actionError && (
                  <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700">
                    {actionError}
                  </div>
                )}

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActionType(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleAction}
                    className={[
                      'px-5 py-2 rounded-xl text-white text-xs font-black transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs',
                      actionType === 'EXTEND' ? 'bg-blue-600 hover:bg-blue-700' :
                        actionType === 'REOPEN' ? 'bg-amber-600 hover:bg-amber-700' :
                          actionType === 'FLAG' ? 'bg-rose-600 hover:bg-rose-700' :
                            'bg-blue-600 hover:bg-blue-700',
                    ].join(' ')}
                  >
                    {processing ? 'Đang xử lý...' : 'Xác nhận'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Bù giờ toàn phòng thi khẩn cấp */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg my-auto overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-amber-200 dark:border-slate-700">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/80 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border bg-amber-50 border-amber-200 shadow-2xs shrink-0">
                  <Clock className="h-4.5 w-4.5 text-amber-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
                  Cộng Bù Giờ Toàn Phòng Thi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-amber-900 leading-relaxed font-semibold">
                Thao tác này sẽ tự động <strong>cộng thêm thời gian làm bài</strong> cho tất cả sinh viên đang làm bài (`IN_PROGRESS`) hoặc vừa bị ngắt kết nối (`DISCONNECTED`) trong phòng thi này.
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Số phút bù giờ <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[5, 10, 15, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setBulkMinutes(mins)}
                      className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${bulkMinutes === mins
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      +{mins} phút
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={bulkMinutes}
                  onChange={(e) => setBulkMinutes(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-amber-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Lý do bù giờ khẩn cấp <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder="Nhập nguyên nhân gián đoạn..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none transition resize-none"
                />
              </div>

              {bulkSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-center">
                  {bulkSuccessMsg}
                </div>
              )}

              {bulkError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-bold">
                  {bulkError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={bulkProcessing}
                  onClick={() => void handleBulkExtend()}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-xs transition cursor-pointer text-xs disabled:opacity-50"
                >
                  {bulkProcessing ? 'Đang áp dụng...' : `Xác nhận bù giờ +${bulkMinutes} phút`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mở thời gian vào thi cho thí sinh đến trễ */}
      {showReopenEntryModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg my-auto overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-blue-200 dark:border-slate-700">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50/80 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border bg-blue-50 border-blue-200 shadow-2xs shrink-0">
                  <PlusCircle className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
                  Gia Hạn Giờ Vào Thi (Thí Sinh Đến Trễ)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReopenEntryModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-blue-900 leading-relaxed font-semibold">
                Khi sinh viên tới trễ quá thời gian cho phép ban đầu, Giám thị có thể gia hạn khung giờ vào thi để hệ thống cho phép sinh viên xác thực và bắt đầu làm bài.
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Mở rộng khung giờ vào thi thêm <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setLateWindowMinutes(mins)}
                      className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${lateWindowMinutes === mins
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      +{mins} phút
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={lateWindowMinutes}
                  onChange={(e) => setLateWindowMinutes(Math.max(5, Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none transition"
                />
              </div>

              {reopenEntrySuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-center">
                  {reopenEntrySuccessMsg}
                </div>
              )}

              {reopenEntryError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-bold">
                  {reopenEntryError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReopenEntryModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={reopenEntryProcessing}
                  onClick={() => void handleReopenEntry()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xs transition cursor-pointer text-xs disabled:opacity-50"
                >
                  {reopenEntryProcessing ? 'Đang mở...' : `Xác nhận gia hạn +${lateWindowMinutes} phút`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
