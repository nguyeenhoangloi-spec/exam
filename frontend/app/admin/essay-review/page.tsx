'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef, Suspense } from 'react';
import api from '../../../lib/api';
import { usePageTitle } from '../../../components/PageTitleContext';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { Toast } from '../../../components/Toast';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { TabBar } from '../../../components/ui/TabBar';
import { Button } from '../../../components/ui/Button';
import { FilterSelect } from '../../../components/ui/FilterSelect';
import { IdentifierBadge } from '../../../components/ui/IdentifierBadge';
import { RubricViewerModal } from '../../../components/question-bank/RubricViewerModal';
import { ProfileDrawer } from '../../../components/ProfileDrawer';
import {
  FileCheck,
  ShieldCheck,
  RotateCcw,
  Send,
  Clock,
  AlertTriangle,
  FileText,
  User,
  BookOpen,
  CheckCircle2,
  XCircle,
  History,
  Download,
  Loader2,
  Search,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';

function AdminEssayReviewContent() {
  usePageTitle('Duyệt bài tự luận');
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [scheduleFilter, setScheduleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapseList, setCollapseList] = useState<boolean>(false);
  const [viewingRubricQuestion, setViewingRubricQuestion] = useState<any>(null);
  const [profileCandidate, setProfileCandidate] = useState<any | null>(null);

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

  // Action inputs
  const [actionReason, setActionReason] = useState<string>('');
  const [extraMinutes, setExtraMinutes] = useState<number>(15);
  const [penaltyInput, setPenaltyInput] = useState<number>(0);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'success' | 'warning' | 'info';
    requireReason?: boolean;
    reasonPlaceholder?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: (reason?: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy bỏ',
    onConfirm: () => {},
  });

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/essay/grading/assignments', { params: { noCache: true } });
      setRows(res.data || []);
    } catch (e: any) {
      setToast({ message: e?.response?.data?.message || 'Không thể tải danh sách bài tự luận.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const openAttempt = useCallback(async (id: string) => {
    try {
      const res = await api.get(`/essay/grading/attempts/${id}`, { params: { noCache: true } });
      setSelected(res.data);
    } catch (e: any) {
      setToast({ message: e?.response?.data?.message || 'Không thể tải bài làm.', type: 'error' });
    }
  }, []);

  const handleApprove = (publish = false) => {
    if (!selected) return;
    setConfirmModal({
      isOpen: true,
      title: publish ? 'Công bố điểm chính thức' : 'Duyệt điểm bài thi',
      message: publish
        ? `Bạn có chắc chắn muốn CÔNG BỐ điểm bài thi của thí sinh ${selected.student?.fullName}? Sau khi công bố, sinh viên sẽ nhìn thấy điểm số và kết quả bài làm.`
        : `Xác nhận duyệt điểm bài thi của thí sinh ${selected.student?.fullName}?`,
      type: 'info',
      requireReason: false,
      confirmText: publish ? 'Công bố' : 'Duyệt điểm',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/essay/grading/attempts/${selected.id}/${publish ? 'publish' : 'approve'}`);
          const msg = publish ? 'Đã công bố điểm cho Sinh viên thành công.' : 'Đã duyệt điểm bài thi thành công.';
          setToast({ message: msg, type: 'success' });
          await loadAssignments();
          await openAttempt(selected.id);
        } catch (e: any) {
          const errMsg = e?.response?.data?.message || 'Thao tác không thành công.';
          setToast({ message: errMsg, type: 'error' });
        }
      },
    });
  };

  const handleReturn = () => {
    if (!selected) return;
    setConfirmModal({
      isOpen: true,
      title: 'Trả lại bài thi để chấm lại',
      message: `Bạn có chắc chắn muốn trả lại bài thi của ${selected.student?.fullName} cho Giảng viên chấm lại?`,
      type: 'danger',
      requireReason: true,
      reasonPlaceholder: 'Nhập lý do trả lại bài thi (tối thiểu 3 ký tự)...',
      confirmText: 'Yêu cầu chấm lại',
      cancelText: 'Hủy bỏ',
      onConfirm: async (reasonFromModal) => {
        const finalReason = reasonFromModal?.trim() || actionReason.trim();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/essay/grading/attempts/${selected.id}/return`, { reason: finalReason });
          const msg = 'Đã yêu cầu Giảng viên chấm lại bài thi thành công.';
          setToast({ message: msg, type: 'success' });
          await loadAssignments();
          await openAttempt(selected.id);
        } catch (e: any) {
          const errMsg = e?.response?.data?.message || 'Không thể trả lại bài thi.';
          setToast({ message: errMsg, type: 'error' });
        }
      },
    });
  };

  const handleReopen = () => {
    if (!selected) return;
    setConfirmModal({
      isOpen: true,
      title: 'Mở lại phiên bài thi',
      message: `Xác nhận mở lại phiên thi cho sinh viên ${selected.student?.fullName}?`,
      type: 'warning',
      requireReason: true,
      reasonPlaceholder: 'Nhập lý do mở lại bài thi (tối thiểu 3 ký tự)...',
      confirmText: 'Mở lại bài',
      cancelText: 'Hủy bỏ',
      onConfirm: async (reasonFromModal) => {
        const finalReason = reasonFromModal?.trim() || actionReason.trim();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/essay/grading/attempts/${selected.id}/reopen`, { reason: finalReason });
          const msg = 'Đã mở lại bài thi cho sinh viên tiếp tục.';
          setToast({ message: msg, type: 'success' });
          await loadAssignments();
          await openAttempt(selected.id);
        } catch (e: any) {
          const errMsg = e?.response?.data?.message || 'Không thể mở lại bài thi.';
          setToast({ message: errMsg, type: 'error' });
        }
      },
    });
  };

  const handleExtend = () => {
    if (!selected) return;
    if (extraMinutes <= 0) {
      setToast({ message: 'Số phút gia hạn phải lớn hơn 0.', type: 'error' });
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: `Gia hạn ${extraMinutes} phút`,
      message: `Gia hạn thêm ${extraMinutes} phút làm bài cho ${selected.student?.fullName}?`,
      type: 'info',
      requireReason: true,
      reasonPlaceholder: 'Nhập lý do gia hạn thời gian làm bài...',
      confirmText: 'Gia hạn',
      cancelText: 'Hủy bỏ',
      onConfirm: async (reasonFromModal) => {
        const finalReason = reasonFromModal?.trim() || actionReason.trim() || 'Gia hạn thời gian làm bài';
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/essay/grading/attempts/${selected.id}/extend-time`, {
            reason: finalReason,
            extraMinutes: Number(extraMinutes),
          });
          const msg = `Đã gia hạn thêm ${extraMinutes} phút làm bài thành công.`;
          setToast({ message: msg, type: 'success' });
          await loadAssignments();
          await openAttempt(selected.id);
        } catch (e: any) {
          const errMsg = e?.response?.data?.message || 'Không thể gia hạn.';
          setToast({ message: errMsg, type: 'error' });
        }
      },
    });
  };

  const handlePenalty = () => {
    if (!selected) return;
    if (penaltyInput < 0) {
      setToast({ message: 'Điểm phạt không được âm.', type: 'error' });
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: `Trừ ${penaltyInput} điểm`,
      message: `Xác nhận trừ ${penaltyInput} điểm của bài thi ${selected.student?.fullName}?`,
      type: 'danger',
      requireReason: true,
      reasonPlaceholder: 'Nhập lý do áp dụng điểm phạt...',
      confirmText: 'Trừ điểm',
      cancelText: 'Hủy bỏ',
      onConfirm: async (reasonFromModal) => {
        const finalReason = reasonFromModal?.trim() || actionReason.trim() || 'Điểm phạt vi phạm quy chế';
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/essay/grading/attempts/${selected.id}/penalty`, {
            reason: finalReason,
            penaltyPoints: Number(penaltyInput),
          });
          const msg = `Đã áp dụng điểm phạt trừ ${penaltyInput} điểm thành công.`;
          setToast({ message: msg, type: 'success' });
          await loadAssignments();
          await openAttempt(selected.id);
        } catch (e: any) {
          const errMsg = e?.response?.data?.message || 'Không thể trừ điểm.';
          setToast({ message: errMsg, type: 'error' });
        }
      },
    });
  };

  const availableSubjects = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      if (dateFilter !== 'ALL') {
        const rawDate = r.onlineExamConfig?.examSchedule?.examDate || r.submittedAt || r.createdAt;
        const dStr = rawDate ? new Date(rawDate).toLocaleDateString('vi-VN') : '';
        if (dStr !== dateFilter) return;
      }
      const s = r.onlineExamConfig?.examSchedule?.subject;
      const code = s?.subjectCode || r.subjectCode;
      const name = s?.subjectName || r.subjectName;
      if (code && name && !map.has(code)) {
        map.set(code, name);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [rows, dateFilter]);

  const availableDates = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (subjectFilter !== 'ALL') {
        const code = r.onlineExamConfig?.examSchedule?.subject?.subjectCode || r.subjectCode;
        if (code !== subjectFilter) return;
      }
      const rawDate = r.onlineExamConfig?.examSchedule?.examDate || r.submittedAt || r.createdAt;
      if (rawDate) {
        const dStr = new Date(rawDate).toLocaleDateString('vi-VN');
        set.add(dStr);
      }
    });
    return Array.from(set);
  }, [rows, subjectFilter]);

  const availableSchedules = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      if (dateFilter !== 'ALL') {
        const rawDate = r.onlineExamConfig?.examSchedule?.examDate || r.submittedAt || r.createdAt;
        const dStr = rawDate ? new Date(rawDate).toLocaleDateString('vi-VN') : '';
        if (dStr !== dateFilter) return;
      }
      if (subjectFilter !== 'ALL') {
        const code = r.onlineExamConfig?.examSchedule?.subject?.subjectCode || r.subjectCode;
        if (code !== subjectFilter) return;
      }
      const sched = r.onlineExamConfig?.examSchedule;
      if (sched?.id) {
        const code = sched.code || `Ca #${sched.id}`;
        const timeStr = sched.startTime && sched.endTime ? `${sched.startTime}–${sched.endTime}` : '';
        const subjName = sched.subject?.subjectName || r.subjectName || '';
        const label = `${code}${timeStr ? ` (${timeStr})` : ''} · ${subjName}`;
        map.set(sched.id.toString(), label);
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [rows, dateFilter, subjectFilter]);

  const counts = useMemo(() => {
    let all = 0,
      waiting = 0,
      grading = 0,
      published = 0;
    rows.forEach((r) => {
      all++;
      if (r.gradingStatus === 'PUBLISHED') published++;
      else if (r.gradingStatus === 'WAITING_APPROVAL') waiting++;
      else grading++;
    });
    return { all, waiting, grading, published };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'WAITING_APPROVAL' && r.gradingStatus !== 'WAITING_APPROVAL') return false;
        if (statusFilter === 'PUBLISHED' && r.gradingStatus !== 'PUBLISHED') return false;
        if (statusFilter === 'GRADING' && (r.gradingStatus === 'PUBLISHED' || r.gradingStatus === 'WAITING_APPROVAL'))
          return false;
      }
      // 2. Subject Filter
      if (subjectFilter !== 'ALL') {
        const code = r.onlineExamConfig?.examSchedule?.subject?.subjectCode || r.subjectCode;
        if (code !== subjectFilter) return false;
      }
      // 3. Date Filter
      if (dateFilter !== 'ALL') {
        const rawDate = r.onlineExamConfig?.examSchedule?.examDate || r.submittedAt || r.createdAt;
        const dStr = rawDate ? new Date(rawDate).toLocaleDateString('vi-VN') : '';
        if (dStr !== dateFilter) return false;
      }
      // 4. Schedule Filter
      if (scheduleFilter !== 'ALL') {
        const schedId = r.onlineExamConfig?.examSchedule?.id?.toString();
        if (schedId !== scheduleFilter) return false;
      }
      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const code = (r.student?.studentCode || '').toLowerCase();
        const name = (r.student?.fullName || '').toLowerCase();
        const subj = (r.onlineExamConfig?.examSchedule?.subject?.subjectName || r.subjectName || '').toLowerCase();
        const schedCode = (r.onlineExamConfig?.examSchedule?.code || '').toLowerCase();
        return code.includes(q) || name.includes(q) || subj.includes(q) || schedCode.includes(q);
      }
      return true;
    });
  }, [rows, statusFilter, subjectFilter, dateFilter, scheduleFilter, searchQuery]);

  const currentIndex = useMemo(() => {
    if (!selected) return -1;
    return filteredRows.findIndex((r) => r.id === selected.id);
  }, [filteredRows, selected]);

  const handlePrevStudent = () => {
    if (currentIndex > 0) {
      openAttempt(filteredRows[currentIndex - 1].id);
    }
  };

  const handleNextStudent = () => {
    if (currentIndex < filteredRows.length - 1) {
      openAttempt(filteredRows[currentIndex + 1].id);
    }
  };

  return (
    <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      {/* ── 1. Standard Page Header ── */}
      <div className="pb-1 space-y-0.5">
        <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
          Duyệt bài tự luận
        </h1>
        <p className="text-[14.5px] font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          Khu vực ADMIN duyệt điểm, công bố kết quả, xử lý phúc khảo, gia hạn bài thi hoặc chấm phạt.
        </p>
      </div>

      {/* ── 2. Main Workspace: Smooth Sidebar & Detail Panel ── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Sidebar: Single Unified Container with Flat List */}
        <aside
          className={`transition-all duration-300 ease-in-out shrink-0 ${
            collapseList
              ? 'max-h-0 lg:w-0 lg:opacity-0 lg:pointer-events-none lg:-mr-5 hidden lg:block'
              : 'w-full lg:w-[320px]'
          }`}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col">
            {/* Header: Title + Neutral Reload Button + Filter Reset */}
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-blue-600" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
                  Danh sách bài thi
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                  {filteredRows.length}/{rows.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={loadAssignments}
                  disabled={loading}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer select-none disabled:opacity-50"
                  title="Làm mới danh sách"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                </button>
                {(statusFilter !== 'ALL' || subjectFilter !== 'ALL' || dateFilter !== 'ALL' || scheduleFilter !== 'ALL' || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('ALL');
                      setSubjectFilter('ALL');
                      setDateFilter('ALL');
                      setScheduleFilter('ALL');
                      setSearchQuery('');
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer select-none"
                    title="Đặt lại tất cả bộ lọc"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Section */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5 bg-slate-50/40 dark:bg-slate-800/20">
              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Tìm mã SV, tên SV, môn... (/)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-7 py-1.5 text-[15px] font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Status Tabs */}
              <TabBar
                tabs={[
                  { key: 'ALL', label: 'Tất cả', count: counts.all },
                  { key: 'WAITING_APPROVAL', label: 'Chờ duyệt', count: counts.waiting },
                  { key: 'GRADING', label: 'Đang chấm', count: counts.grading },
                  { key: 'PUBLISHED', label: 'Công bố', count: counts.published },
                ]}
                active={statusFilter}
                onChange={setStatusFilter}
              />

              {/* Dropdown Filters Row: Subject & Date */}
              <div className="grid grid-cols-2 gap-2">
                {availableSubjects.length > 0 && (
                  <FilterSelect
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    containerClassName="w-full"
                    className="w-full text-xs"
                  >
                    <option value="ALL">Tất cả môn ({availableSubjects.length})</option>
                    {availableSubjects.map((s) => (
                      <option key={s.code} value={s.code}>
                        [{s.code}] {s.name}
                      </option>
                    ))}
                  </FilterSelect>
                )}

                {availableDates.length > 0 && (
                  <FilterSelect
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    containerClassName="w-full"
                    className="w-full text-xs"
                  >
                    <option value="ALL">Tất cả ngày</option>
                    {availableDates.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </FilterSelect>
                )}
              </div>

              {availableSchedules.length > 1 && (
                <FilterSelect
                  containerClassName="w-full"
                  value={scheduleFilter}
                  onChange={(e) => setScheduleFilter(e.target.value)}
                  className="w-full text-xs"
                >
                  <option value="ALL">Tất cả ca thi / lịch thi</option>
                  {availableSchedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </FilterSelect>
              )}
            </div>

            {/* Flat List: Candidate items separated by divide-y */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[calc(100vh-380px)] min-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="py-12 flex flex-col items-center gap-2.5">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <p className="text-xs font-medium text-slate-400">Đang tải danh sách bài thi...</p>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="text-center py-12 px-4 text-xs text-slate-400">
                  Không tìm thấy bài thi nào phù hợp bộ lọc.
                </div>
              ) : (
                filteredRows.map((row) => {
                  const isSel = selected?.id === row.id;
                  const dateStr = row.onlineExamConfig?.examSchedule?.examDate
                    ? new Date(row.onlineExamConfig.examSchedule.examDate).toLocaleDateString('vi-VN')
                    : row.submittedAt
                      ? new Date(row.submittedAt).toLocaleDateString('vi-VN')
                      : null;
                  const schedCode = row.onlineExamConfig?.examSchedule?.code;
                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => openAttempt(row.id)}
                      className={`w-full text-left p-3 transition cursor-pointer flex flex-col gap-1 select-none ${
                        isSel
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-l-blue-600 pl-2.5'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50 pl-3.5'
                      }`}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-semibold text-[14px] text-slate-900 dark:text-slate-100 truncate">
                          {row.student?.fullName}
                        </span>
                        <StatusBadge status={row.gradingStatus} />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>Mã SV:</span>
                        <IdentifierBadge tone="neutral">{row.student?.studentCode}</IdentifierBadge>
                        <span>
                          · Điểm:{' '}
                          <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                            {row.totalScore ?? 'Chưa chấm'}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 text-[12px] text-slate-500 dark:text-slate-400 pt-0.5">
                        <span className="truncate flex-1 font-medium text-slate-600 dark:text-slate-300">
                          {row.onlineExamConfig?.examSchedule?.subject?.subjectName || row.subjectName || 'Môn thi'}
                          {schedCode ? ` (${schedCode})` : ''}
                        </span>
                        {dateStr && (
                          <span className="shrink-0 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {dateStr}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Right Panel: Detail & Admin Controls */}
        <div className="flex-1 min-w-0 space-y-4">
          {!selected ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-16 text-center shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Chưa chọn bài thi
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Chọn một bài thi ở danh sách bên trái để xem chi tiết và thực hiện các thao tác quản trị.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sticky Header: Candidate Meta + Navigation */}
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm backdrop-blur-md">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  {/* Left: Sidebar Toggle + Student Info (Clickable for Profile Drawer) */}
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setCollapseList(!collapseList)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer select-none shrink-0"
                      title={collapseList ? 'Mở rộng danh sách' : 'Thu gọn danh sách'}
                    >
                      <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${collapseList ? 'rotate-180' : ''}`} />
                    </button>

                    <div
                      onClick={() => setProfileCandidate(selected)}
                      className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold text-sm flex items-center justify-center shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 transition select-none"
                      title="Xem chi tiết hồ sơ thí sinh"
                    >
                      {selected.student?.fullName ? selected.student.fullName.charAt(0).toUpperCase() : 'S'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setProfileCandidate(selected)}
                          className="text-base font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer text-left truncate"
                          title="Xem chi tiết hồ sơ thí sinh"
                        >
                          {selected.student?.fullName}
                        </button>
                        <StatusBadge status={selected.gradingStatus} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>Mã SV:</span>
                        <IdentifierBadge tone="neutral">{selected.student?.studentCode}</IdentifierBadge>
                        <span>· Lớp: {selected.student?.className || 'N/A'}</span>
                        <span>· Môn: {selected.onlineExamConfig?.examSchedule?.subject?.subjectName || selected.subjectName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score KPI + Quick Student Navigation */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="tabular-nums font-semibold text-lg text-slate-900 dark:text-slate-100">
                        {selected.totalScore ?? '--'} <span className="text-xs text-slate-400 font-normal">/ {selected.maxScore || 10}đ</span>
                      </div>
                      {selected.penaltyPoints > 0 && (
                        <p className="text-xs font-semibold text-rose-600 mt-0.5">
                          Phạt: -{selected.penaltyPoints}đ ({selected.penaltyReason})
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-3">
                      <button
                        type="button"
                        onClick={handlePrevStudent}
                        disabled={currentIndex <= 0}
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer select-none shadow-2xs"
                        title="Sinh viên trước đó"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-[12px] font-semibold tabular-nums text-slate-500 px-1 select-none">
                        {currentIndex >= 0 ? `${currentIndex + 1}/${filteredRows.length}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextStudent}
                        disabled={currentIndex < 0 || currentIndex >= filteredRows.length - 1}
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer select-none shadow-2xs"
                        title="Sinh viên tiếp theo"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions & Rubrics List */}
              <div className="space-y-4">
                {(selected.questions || []).filter((q: any) => q.type === 'ESSAY').map((q: any, idx: number) => {
                  const ans = (selected.attemptAnswers || []).find((a: any) => a.questionId === q.questionId);
                  return (
                    <div
                      key={q.questionId || idx}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-4 shadow-2xs"
                    >
                      {/* Question Title, Rubric Viewer Trigger & Score */}
                      <div className="flex justify-between items-start gap-4 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                        <div className="flex items-start gap-2.5 flex-1">
                          <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800/80 shrink-0 select-none">
                            Câu {idx + 1}
                          </span>
                          <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                            {q.content}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setViewingRubricQuestion({ ...q, id: q.questionId, code: `Câu ${idx + 1}` })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer shadow-2xs"
                            title="Xem đáp án mẫu và tiêu chuẩn chấm Rubric của câu này"
                          >
                            <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                            <span>Xem Rubric & Đáp án</span>
                          </button>
                          <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold tabular-nums text-sm text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shrink-0">
                            {ans?.finalScore ?? '--'} <span className="text-xs font-normal text-slate-400">/ {q.score}đ</span>
                          </span>
                        </div>
                      </div>

                      {/* Student Answer Box */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                          <span className="tracking-wide">Bài làm của thí sinh:</span>
                          {ans?.textAnswer && (
                            <span className="text-xs font-normal text-slate-400">
                              {ans.textAnswer.trim().split(/\s+/).length} từ
                            </span>
                          )}
                        </div>
                        <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-800/80 border-l-4 border-l-blue-500 text-[15px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-normal shadow-2xs">
                          {ans?.textAnswer || <span className="italic text-slate-400">Sinh viên không nhập nội dung văn bản</span>}
                        </div>
                      </div>

                      {/* Files */}
                      {ans?.submissionFiles?.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-xs font-semibold text-slate-500">File đính kèm ({ans.submissionFiles.length}):</div>
                          <div className="flex gap-2 flex-wrap">
                            {ans.submissionFiles.map((f: any) => (
                              <a
                                key={f.id}
                                href={f.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-400 text-xs font-semibold hover:bg-blue-50 hover:border-blue-300 transition shadow-2xs"
                              >
                                <Download className="h-4 w-4 text-blue-500" />
                                <span>{f.fileName}</span>
                                <span className="text-xs text-slate-400 font-normal">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rubric Grades */}
                      {q.rubric?.length > 0 && (
                        <div className="space-y-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 tracking-wide">
                            Điểm theo Rubric ({q.rubric.length}):
                          </div>
                          <div className="space-y-2">
                            {q.rubric.map((r: any) => {
                              const g = (ans?.essayGrades || []).find((item: any) => item.criterionId === r.id);
                              return (
                                <div
                                  key={r.id}
                                  className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs shadow-2xs"
                                >
                                  <div>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{r.label}: </span>
                                    <span className="text-slate-600 dark:text-slate-400 font-normal">{g?.comment || 'Không có nhận xét'}</span>
                                  </div>
                                  <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                                    {g?.score ?? 0} / {r.maxScore}đ
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* AI Suggestion */}
                      {ans?.aiSuggestedScore !== undefined && ans?.aiSuggestedScore !== null && (
                        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 space-y-1 shadow-2xs">
                          <div className="flex justify-between font-semibold">
                            <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              AI Đề xuất: {ans.aiSuggestedScore}đ
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-normal">
                              Độ tin cậy: {Math.round((ans.aiConfidence || 0) * 100)}%
                            </span>
                          </div>
                          {ans.aiSuggestedComment && (
                            <p className="text-[13px] text-blue-800 dark:text-blue-300 leading-relaxed">
                              {ans.aiSuggestedComment}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Score History */}
                      {ans?.gradeHistories?.length > 0 && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5 shadow-2xs">
                          <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-slate-500" /> Lịch sử chỉnh điểm ({ans.gradeHistories.length})
                          </p>
                          <div className="space-y-1 pl-1">
                            {ans.gradeHistories.map((h: any) => (
                              <div key={h.id} className="text-[12px] text-slate-600 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {new Date(h.createdAt).toLocaleString('vi-VN')}:
                                </span>{' '}
                                Điểm cũ {h.oldScore ?? '--'} → Điểm mới{' '}
                                <strong className="text-blue-600 dark:text-blue-400">{h.newScore}đ</strong> ({h.reason || 'Sửa điểm'}) bởi{' '}
                                <span className="font-medium text-slate-700 dark:text-slate-300">{h.actor?.username || 'Admin'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── 4. Admin Actions Panel ── */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
                {/* Header & Status Indicator */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 rounded-full bg-blue-600" />
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                      Thao tác Quản trị Admin
                    </h3>
                  </div>

                  {selected.gradingStatus === 'PUBLISHED' ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold select-none shadow-2xs">
                      <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Điểm số đã công bố chính thức (Khóa điểm)</span>
                    </div>
                  ) : selected.gradingStatus === 'WAITING_APPROVAL' ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs font-semibold select-none shadow-2xs">
                      <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Bài thi đang chờ Admin duyệt</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 text-blue-800 dark:text-blue-300 text-xs font-semibold select-none shadow-2xs">
                      <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Giảng viên đang chấm thi</span>
                    </div>
                  )}
                </div>

                {/* Input Reason */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-[15px] font-medium text-slate-700 dark:text-slate-300">
                      Lý do thao tác / Ghi chú quản trị:
                    </label>
                    <span className="text-slate-400 font-normal">
                      (Bắt buộc khi Trả lại, Mở lại, Gia hạn, Trừ điểm)
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Nhập ghi chú hoặc lý do chi tiết..."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-[15px] font-normal text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-2xs"
                  />
                </div>

                {/* Main Action Buttons (Single Primary Rule) */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {selected.gradingStatus !== 'PUBLISHED' && (
                    <>
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={() => handleApprove(true)}
                        leftIcon={<Send className="w-4 h-4" />}
                      >
                        Công bố điểm
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={() => handleApprove(false)}
                        leftIcon={<ShieldCheck className="w-4 h-4" />}
                      >
                        Duyệt điểm
                      </Button>
                    </>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={handleReturn}
                    leftIcon={<XCircle className="w-4 h-4 text-rose-600" />}
                  >
                    Trả lại chấm lại
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={handleReopen}
                    leftIcon={<RotateCcw className="w-4 h-4 text-amber-600" />}
                  >
                    Mở lại bài thi
                  </Button>
                </div>

                {/* Adjustment Controls Grid: Gia hạn & Trừ điểm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* Gia hạn làm bài */}
                  <div className="bg-slate-50/60 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium text-slate-800 dark:text-slate-200">Gia hạn:</span>
                      <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 shadow-2xs">
                        <input
                          type="number"
                          min={1}
                          max={240}
                          value={extraMinutes}
                          onChange={(e) => setExtraMinutes(Number(e.target.value))}
                          className="w-12 text-[15px] font-medium text-center text-slate-900 dark:text-slate-100 focus:outline-none"
                        />
                        <span className="text-xs font-semibold text-slate-400 ml-1">phút</span>
                      </div>
                    </div>
                    <Button type="button" variant="secondary" size="sm" onClick={handleExtend}>
                      Gia hạn
                    </Button>
                  </div>

                  {/* Trừ điểm phạt */}
                  <div className="bg-slate-50/60 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium text-slate-800 dark:text-slate-200">Điểm phạt:</span>
                      <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 shadow-2xs">
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={penaltyInput}
                          onChange={(e) => setPenaltyInput(Number(e.target.value))}
                          className="w-12 text-[15px] font-medium text-center text-slate-900 dark:text-slate-100 focus:outline-none"
                        />
                        <span className="text-xs font-semibold text-slate-400 ml-1">điểm</span>
                      </div>
                    </div>
                    <Button type="button" variant="secondary" size="sm" onClick={handlePenalty}>
                      Trừ điểm
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        requireReason={confirmModal.requireReason}
        reasonPlaceholder={confirmModal.reasonPlaceholder}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <RubricViewerModal
        isOpen={Boolean(viewingRubricQuestion)}
        question={viewingRubricQuestion}
        onClose={() => setViewingRubricQuestion(null)}
      />

      {/* Candidate Profile Drawer */}
      <ProfileDrawer
        isOpen={!!profileCandidate}
        onClose={() => setProfileCandidate(null)}
        title="Hồ Sơ & Bài Thi Sinh Viên"
        subtitle={profileCandidate?.student?.fullName}
        avatarText={profileCandidate?.student?.fullName?.slice(0, 2)?.toUpperCase()}
        badge={{
          label:
            profileCandidate?.gradingStatus === 'PUBLISHED'
              ? 'Đã công bố'
              : profileCandidate?.gradingStatus === 'WAITING_APPROVAL'
              ? 'Chờ duyệt'
              : profileCandidate?.gradingStatus === 'GRADING' || profileCandidate?.gradingStatus === 'UNDER_GRADING'
              ? 'Đang chấm'
              : 'Chưa nộp',
          status: profileCandidate?.gradingStatus || 'NOT_SUBMITTED',
        }}
        details={[
          { label: 'Họ và tên thí sinh', value: profileCandidate?.student?.fullName || '---' },
          {
            label: 'Mã số sinh viên',
            value: <IdentifierBadge tone="blue">{profileCandidate?.student?.studentCode || '---'}</IdentifierBadge>,
          },
          { label: 'Email sinh viên', value: profileCandidate?.student?.email || 'Chưa cập nhật' },
          {
            label: 'Môn thi',
            value:
              profileCandidate?.onlineExamConfig?.examSchedule?.subject?.subjectName ||
              profileCandidate?.subjectName ||
              '---',
          },
          {
            label: 'Mã học phần',
            value: (
              <IdentifierBadge tone="neutral">
                {profileCandidate?.onlineExamConfig?.examSchedule?.subject?.subjectCode ||
                  profileCandidate?.subjectCode ||
                  '---'}
              </IdentifierBadge>
            ),
          },
          {
            label: 'Trạng thái chấm bài',
            value: <StatusBadge status={profileCandidate?.gradingStatus || 'NOT_SUBMITTED'} />,
          },
          {
            label: 'Tổng điểm bài thi',
            value: (
              <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {profileCandidate?.totalScore !== undefined && profileCandidate?.totalScore !== null
                  ? `${profileCandidate.totalScore} / ${profileCandidate.maxScore || 10} điểm`
                  : 'Chưa có điểm'}
              </span>
            ),
          },
          {
            label: 'Điểm phạt vi phạm',
            value:
              profileCandidate?.penaltyPoints > 0 ? (
                <span className="text-[15px] font-semibold text-rose-600">
                  -{profileCandidate.penaltyPoints} điểm ({profileCandidate.penaltyReason || 'Vi phạm quy chế'})
                </span>
              ) : (
                'Không có điểm phạt'
              ),
          },
          {
            label: 'Thời gian bắt đầu làm',
            value: profileCandidate?.startedAt ? new Date(profileCandidate.startedAt).toLocaleString('vi-VN') : '---',
          },
          {
            label: 'Thời gian nộp bài',
            value: profileCandidate?.submittedAt
              ? new Date(profileCandidate.submittedAt).toLocaleString('vi-VN')
              : 'Chưa nộp bài',
          },
        ]}
        extraSections={[
          {
            title: 'Tóm Tắt Bài Thi Tự Luận',
            content: (
              <div className="space-y-2 text-xs font-normal text-slate-600 dark:text-slate-400">
                <p>
                  Bài thi được cấu hình trong hệ thống khảo thí trực tuyến. Quản trị viên có toàn quyền thẩm định điểm,
                  xử lý phúc khảo, gia hạn thời gian hoặc công bố kết quả chính thức cho sinh viên.
                </p>
                <div className="flex items-center justify-end pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const id = profileCandidate?.id;
                      setProfileCandidate(null);
                      if (id) openAttempt(id);
                    }}
                    leftIcon={<FileText className="w-3.5 h-3.5" />}
                  >
                    Mở không gian duyệt bài
                  </Button>
                </div>
              </div>
            ),
          },
        ]}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </main>
  );
}

export default function AdminEssayReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-xs font-semibold text-slate-500">
          Đang tải trang duyệt bài tự luận...
        </div>
      }
    >
      <AdminEssayReviewContent />
    </Suspense>
  );
}
