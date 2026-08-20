'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  ChevronDown,
  Lock,
  Pencil,
  Save,
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
  const [openActionMenu, setOpenActionMenu] = useState<boolean>(false);

  // Admin direct grading state
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [teacherComments, setTeacherComments] = useState<Record<string, string>>({});
  const [savingGrades, setSavingGrades] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setOpenActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const searchParams = useSearchParams();
  const attemptIdParam = searchParams?.get('attemptId');

  const openAttempt = useCallback(async (id: string) => {
    try {
      const res = await api.get(`/essay/grading/attempts/${id}`, { params: { noCache: true } });
      const attemptData = res.data;
      setSelected(attemptData);

      const initScores: Record<string, number> = {};
      const initComments: Record<string, string> = {};
      const initTeacherComments: Record<string, string> = {};

      (attemptData.attemptAnswers || []).forEach((ans: any) => {
        if (ans.teacherComment) initTeacherComments[ans.questionId] = ans.teacherComment;
        (ans.essayGrades || []).forEach((grade: any) => {
          initScores[grade.criterionId] = grade.score;
          if (grade.comment) initComments[grade.criterionId] = grade.comment;
        });
      });

      const essayQuestions = (attemptData.questions || []).filter((item: any) => item.type === 'ESSAY');
      essayQuestions.forEach((q: any) => {
        (q.rubric || []).forEach((r: any) => {
          if (initScores[r.id] === undefined) {
            initScores[r.id] = 0;
          }
        });
      });

      setScores(initScores);
      setComments(initComments);
      setTeacherComments(initTeacherComments);
      setIsEditMode(false);
    } catch (e: any) {
      setToast({ message: e?.response?.data?.message || 'Không thể tải bài làm.', type: 'error' });
    }
  }, []);

  const handleScoreChange = (criterionId: string, value: string, maxScore: number = 10) => {
    if (value === '') {
      setScores((prev) => ({ ...prev, [criterionId]: 0 }));
      return;
    }
    const num = parseFloat(value);
    if (isNaN(num)) return;
    if (num < 0 || num > maxScore) {
      setToast({ message: `Điểm tiêu chí phải nằm trong khoảng từ 0 đến ${maxScore} điểm!`, type: 'error' });
      return;
    }
    setScores((prev) => ({ ...prev, [criterionId]: num }));
  };

  const requestAiSuggestion = async (answerId: string, questionId: string) => {
    if (!answerId) return;
    setAiLoading(answerId);
    try {
      const response = await api.post(`/essay-grading/answers/${answerId}/ai-suggest`);
      const data = response.data;
      if (!Array.isArray(data?.criteria)) throw new Error('AI không trả đủ tiêu chí chấm.');
      setScores((prev) => ({
        ...prev,
        ...Object.fromEntries(data.criteria.map((item: any) => [item.criterionId, item.score])),
      }));
      setComments((prev) => ({
        ...prev,
        ...Object.fromEntries(data.criteria.map((item: any) => [item.criterionId, item.comment || ''])),
      }));
      if (data.overallComment) {
        setTeacherComments((prev) => ({ ...prev, [questionId]: data.overallComment }));
      }
      setToast({
        message: data.isBlank === true || data.source === 'RULE'
          ? 'Câu hỏi bị bỏ trống — hệ thống áp dụng 0đ theo quy định, không cần AI phân tích.'
          : 'AI đã phân tích bài làm theo Rubric và tạo điểm đề xuất. Chưa phải điểm chính thức.',
        type: 'success',
      });
    } catch (error: any) {
      setToast({ message: error?.response?.data?.message || error?.message || 'Không thể tạo đề xuất AI. Bạn có thể tự chấm thủ công.', type: 'error' });
    } finally {
      setAiLoading(null);
    }
  };

  const handleSaveAdminGrades = async () => {
    if (!selected || !selected.id) return;
    const essayQuestions = (selected.questions || []).filter((q: any) => q.type === 'ESSAY');
    if (!essayQuestions.length) return;

    setSavingGrades(true);
    try {
      let savedCount = 0;
      for (const q of essayQuestions) {
        const ans = (selected.attemptAnswers || []).find((a: any) => a.questionId === q.questionId);
        if (!ans) continue;

        let rubric = q.rubric || [];
        if (!rubric.length) {
          const rubRes = await api.get(`/essay/questions/${q.questionId}/rubric`).catch(() => null);
          rubric = rubRes?.data || [];
        }
        if (!rubric.length) continue;

        const criteria = rubric.map((r: any) => {
          const rawScore = Number(scores[r.id]);
          const validScore = isNaN(rawScore) ? 0 : Math.min(Math.max(rawScore, 0), Number(r.maxScore || 10));
          return {
            criterionId: r.id,
            score: validScore,
            comment: comments[r.id] || '',
          };
        });

        if (selected.gradingStatus === 'PUBLISHED') {
          await api.post(`/essay-grading/attempts/${selected.id}/answers/${ans.id}/adjust`, {
            criteria,
            teacherComment: teacherComments[q.questionId] || '',
            reason: 'ADMIN điều chỉnh điểm bài thi trực tiếp',
          });
        } else {
          await api.patch(`/essay/grading/answers/${ans.id}`, {
            criteria,
            teacherComment: teacherComments[q.questionId] || '',
          });
        }
        savedCount++;
      }

      setIsEditMode(false);
      setToast({ message: 'ADMIN đã lưu và cập nhật điểm bài thi thành công!', type: 'success' });
      await loadAssignments();
      await openAttempt(selected.id);
    } catch (e: any) {
      setToast({ message: e?.response?.data?.message || 'Không thể lưu điểm bài thi.', type: 'error' });
    } finally {
      setSavingGrades(false);
    }
  };

  const currentTotalCalculatedScore = useMemo(() => {
    if (!selected) return 0;
    let total = 0;
    (selected.questions || []).forEach((q: any) => {
      if (q.type === 'ESSAY') {
        (q.rubric || []).forEach((r: any) => {
          total += Number(scores[r.id] || 0);
        });
      } else {
        const ans = (selected.attemptAnswers || []).find((a: any) => a.questionId === q.questionId);
        total += Number(ans?.finalScore || ans?.score || 0);
      }
    });
    return Math.max(0, Number(total.toFixed(2)));
  }, [selected, scores]);

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/essay/grading/assignments', { params: { noCache: true } });
      setRows(res.data || []);
      if (attemptIdParam) {
        await openAttempt(attemptIdParam);
      }
    } catch (e: any) {
      setToast({ message: e?.response?.data?.message || 'Không thể tải danh sách bài tự luận.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [attemptIdParam, openAttempt]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleApprove = (publish = false) => {
    if (!selected) return;
    setConfirmModal({
      isOpen: true,
      title: publish ? 'Duyệt & Công bố điểm thi?' : 'Duyệt điểm bài thi?',
      message: `Bạn có chắc chắn muốn DUYỆT & CÔNG BỐ điểm bài thi của thí sinh ${selected.student?.fullName}? Sau khi công bố, sinh viên sẽ nhìn thấy kết quả bài làm và điểm số chính thức.`,
      type: 'info',
      requireReason: false,
      confirmText: 'Duyệt & Công bố',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/essay/grading/attempts/${selected.id}/${publish ? 'publish' : 'approve'}`);
          const msg = publish ? 'Đã công bố điểm cho sinh viên thành công!' : 'Đã duyệt điểm bài thi thành công!';
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
      title: 'Trả lại bài thi để chấm lại?',
      message: `Bạn có chắc chắn muốn trả lại bài thi của thí sinh ${selected.student?.fullName} cho Giảng viên chấm lại?`,
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
          const msg = 'Đã yêu cầu Giảng viên chấm lại bài thi thành công!';
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
      title: 'Mở lại phiên bài thi?',
      message: `Xác nhận mở lại phiên thi cho sinh viên ${selected.student?.fullName}?`,
      type: 'info',
      requireReason: true,
      reasonPlaceholder: 'Nhập lý do mở lại bài thi (tối thiểu 3 ký tự)...',
      confirmText: 'Mở lại bài',
      cancelText: 'Hủy bỏ',
      onConfirm: async (reasonFromModal) => {
        const finalReason = reasonFromModal?.trim() || actionReason.trim();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/essay/grading/attempts/${selected.id}/reopen`, { reason: finalReason });
          const msg = 'Đã mở lại bài thi cho sinh viên tiếp tục thành công!';
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
      title: `Gia hạn ${extraMinutes} phút làm bài?`,
      message: `Gia hạn thêm ${extraMinutes} phút làm bài cho sinh viên ${selected.student?.fullName}?`,
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
          const msg = `Đã gia hạn thêm ${extraMinutes} phút làm bài thành công!`;
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
      title: `Trừ ${penaltyInput} điểm bài thi?`,
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
        <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
          Duyệt bài tự luận
        </h1>
        <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          Khu vực ADMIN duyệt điểm, công bố kết quả, xử lý phúc khảo, gia hạn bài thi hoặc chấm phạt.
        </p>
      </div>

      {/* ── 2. Main Workspace: Smooth Sidebar & Detail Panel ── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Sidebar: Unified Container with Flat Candidate Items */}
        <aside
          aria-label="Danh sách bài thi"
          className={`transition-all duration-300 ease-in-out shrink-0 lg:sticky lg:top-4 overflow-hidden ${
            collapseList
              ? 'max-h-0 lg:max-h-none lg:w-0 lg:opacity-0 lg:pointer-events-none lg:-mr-5 hidden lg:block'
              : 'w-full lg:w-[340px] lg:opacity-100'
          }`}
        >
          <div className="w-full lg:w-[340px]">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col">
              {/* Header: Title + Neutral Reload Button + Filter Reset */}
              <div className="p-3.5 space-y-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                    <h3 className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
                      Danh sách bài thi
                    </h3>
                    <span className="ui-pill inline-flex items-center text-type-helper font-medium text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/60 tabular-nums">
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

                {/* Search Bar */}
                <div className="relative w-full">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Tìm mã SV, tên SV, môn... (/)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-7 py-1.5 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none transition shadow-2xs"
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

                {/* Status Tabs with modern Segmented Pills */}
                <TabBar
                  variant="segmented"
                  tabs={[
                    { key: 'ALL', label: 'Tất cả', count: counts.all },
                    { key: 'WAITING_APPROVAL', label: 'Chờ duyệt', count: counts.waiting },
                    { key: 'GRADING', label: 'Đang chấm', count: counts.grading },
                    { key: 'PUBLISHED', label: 'Công bố', count: counts.published },
                  ]}
                  active={statusFilter}
                  onChange={setStatusFilter}
                />

                {/* Dropdown Filters: Subject & Date/Schedule */}
                <div className="space-y-1.5">
                  {availableSubjects.length > 0 && (
                    <FilterSelect
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      containerClassName="w-full"
                      className="w-full text-type-helper"
                    >
                      <option value="ALL">Tất cả môn học ({availableSubjects.length})</option>
                      {availableSubjects.map((s) => (
                        <option key={s.code} value={s.code}>
                          [{s.code}] {s.name}
                        </option>
                      ))}
                    </FilterSelect>
                  )}

                  <div className="grid grid-cols-2 gap-1.5">
                    {availableDates.length > 0 && (
                      <FilterSelect
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        containerClassName="w-full"
                        className="w-full text-type-helper"
                      >
                        <option value="ALL">Tất cả ngày</option>
                        {availableDates.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </FilterSelect>
                    )}

                    {availableSchedules.length > 1 && (
                      <FilterSelect
                        containerClassName="w-full"
                        value={scheduleFilter}
                        onChange={(e) => setScheduleFilter(e.target.value)}
                        className="w-full text-type-helper"
                      >
                        <option value="ALL">Tất cả ca thi</option>
                        {availableSchedules.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </FilterSelect>
                    )}
                  </div>
                </div>
              </div>

              {/* Flat List: Candidate items separated by divide-y */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[calc(100vh-380px)] min-h-[300px] overflow-y-auto">
                {loading ? (
                  <div className="py-12 flex flex-col items-center gap-2.5">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    <p className="text-type-helper font-medium text-slate-400">Đang tải danh sách bài thi...</p>
                  </div>
                ) : filteredRows.length === 0 ? (
                  <div className="text-center py-12 px-4 text-type-helper text-slate-400">
                    Không tìm thấy bài thi nào phù hợp bộ lọc.
                  </div>
                ) : (
                  filteredRows.map((r) => {
                    const isCur = selected?.id === r.id;
                    const notSub = r.status === 'NOT_STARTED' || r.status === 'IN_PROGRESS';
                    return (
                      <div
                        key={r.id}
                        onClick={() => openAttempt(r.id)}
                        className={`p-3 transition cursor-pointer select-none text-left ${
                          isCur
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-l-blue-600 pl-2.5'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {/* Row 1: Student Avatar + Name + Score */}
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-type-helper shrink-0 select-none ${
                                isCur
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {r.student?.fullName?.charAt(0) || 'S'}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProfileCandidate(r);
                              }}
                              className={`font-semibold text-type-body-sm truncate transition cursor-pointer text-left ${
                                isCur
                                  ? 'text-blue-700 dark:text-blue-300'
                                  : 'text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400'
                              }`}
                              title="Xem chi tiết hồ sơ thí sinh"
                            >
                              {r.student?.fullName || 'Chưa có tên'}
                            </button>
                          </div>

                          <span
                            className={`font-semibold tabular-nums text-type-body-sm shrink-0 ${
                              notSub
                                ? 'text-slate-400 text-type-helper'
                                : r.totalScore !== undefined && r.totalScore !== null
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-slate-400 text-type-helper'
                            }`}
                          >
                            {notSub ? 'Chưa nộp' : r.totalScore !== undefined && r.totalScore !== null ? `${r.totalScore}đ` : 'Chưa có điểm'}
                          </span>
                        </div>

                        {/* Row 2: MSSV identifier + Subject name + Status dot */}
                        <div className="flex items-center justify-between gap-2 mt-1.5 text-type-helper text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <IdentifierBadge tone={isCur ? 'blue' : 'neutral'}>
                              {r.student?.studentCode || '---'}
                            </IdentifierBadge>
                            <span
                              className="truncate max-w-[110px] font-normal"
                              title={r.onlineExamConfig?.examSchedule?.subject?.subjectName || r.subjectName}
                            >
                              {r.onlineExamConfig?.examSchedule?.subject?.subjectName || r.subjectName || 'Môn thi'}
                            </span>
                          </div>

                          <div className="shrink-0">
                            <StatusBadge status={r.gradingStatus} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Panel: Detail & Admin Controls (Single Unified Container) */}
        <div className="flex-1 min-w-0 space-y-4">
          {!selected ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-12 text-center text-slate-400 text-type-helper font-medium shadow-2xs space-y-3">
              <p>Vui lòng chọn bài thi từ danh sách bên trái để xem chi tiết và duyệt điểm.</p>
              {collapseList && (
                <div className="pt-1">
                  <Button variant="primary" size="sm" onClick={() => setCollapseList(false)}>
                    Mở danh sách bài thi
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-5 shadow-2xs">
              {/* Sticky Header: Candidate Meta + Navigation */}
              <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md -mx-5 -mt-5 p-5 border-b border-slate-100 dark:border-slate-800 rounded-t-2xl shadow-xs flex justify-between items-center flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCollapseList(!collapseList)}
                    className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                    title={collapseList ? 'Mở danh sách bài làm' : 'Thu gọn danh sách bài làm'}
                  >
                    <ChevronLeft
                      className={`h-4 w-4 transition-transform duration-300 ease-in-out ${collapseList ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <div
                    onClick={() => setProfileCandidate(selected)}
                    className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center font-semibold text-type-body-sm shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 transition"
                    title="Xem chi tiết hồ sơ thí sinh"
                  >
                    {selected.student?.fullName?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setProfileCandidate(selected)}
                        className="text-type-body font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer text-left"
                        title="Xem chi tiết hồ sơ thí sinh"
                      >
                        {selected.student?.fullName}
                      </button>
                      <StatusBadge status={selected.gradingStatus} />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-type-helper text-slate-500 mt-0.5">
                      <span>Mã SV:</span>
                      <IdentifierBadge tone="neutral">{selected.student?.studentCode}</IdentifierBadge>
                      <span>
                        · Môn:{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {selected.onlineExamConfig?.examSchedule?.subject?.subjectName || selected.subjectName || 'Môn thi'}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <div className="text-right w-[115px] min-w-[115px] max-w-[115px] shrink-0">
                    <span className="text-type-section tabular-nums font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {isEditMode
                        ? (Number(currentTotalCalculatedScore) || 0).toFixed(2)
                        : selected.totalScore !== null && selected.totalScore !== undefined
                          ? (Number(selected.totalScore) || 0).toFixed(2)
                          : '--'}{' '}
                      <span className="text-type-helper text-slate-500 font-normal">/ {(Number(selected.maxScore) || 10).toFixed(2)}đ</span>
                    </span>
                    {selected.penaltyPoints > 0 && (
                      <p className="text-type-helper font-semibold text-rose-600 mt-0.5 whitespace-nowrap">
                        Điểm phạt: -{(Number(selected.penaltyPoints) || 0).toFixed(2)}đ ({selected.penaltyReason})
                      </p>
                    )}
                  </div>

                  {/* Actions & Fast Student Navigation */}
                  <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
                    {isEditMode ? (
                      <>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={handleSaveAdminGrades}
                          isLoading={savingGrades}
                          leftIcon={<Save className="w-3.5 h-3.5" />}
                        >
                          Lưu điểm
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditMode(false);
                            if (selected?.id) openAttempt(selected.id);
                          }}
                        >
                          Hủy
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setIsEditMode(true)}
                          leftIcon={<Pencil className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                          title="Chấm điểm hoặc điều chỉnh điểm bài thi trực tiếp với quyền Quản trị viên"
                        >
                          Sửa / Chấm điểm
                        </Button>

                        {selected.gradingStatus === 'PUBLISHED' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-type-helper font-semibold select-none shadow-2xs">
                            <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Đã công bố (Khóa điểm)</span>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(true)}
                            leftIcon={<Send className="w-3.5 h-3.5" />}
                          >
                            Duyệt & Công bố
                          </Button>
                        )}
                      </>
                    )}

                    {/* Action Dropdown Menu for Admin Interventions */}
                    <div className="relative" ref={actionMenuRef}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setOpenActionMenu(!openActionMenu)}
                        rightIcon={<ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openActionMenu ? 'rotate-180' : ''}`} />}
                        title="Tùy chọn thao tác quản trị khác"
                      >
                        Thao tác
                      </Button>

                      {openActionMenu && (
                        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100 dark:divide-slate-800">
                          <div className="py-1">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionMenu(false);
                                handleReturn();
                              }}
                              className="w-full px-3.5 py-2 text-left text-type-helper font-medium text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-2.5 transition cursor-pointer"
                            >
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>Trả lại chấm lại</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionMenu(false);
                                handleReopen();
                              }}
                              className="w-full px-3.5 py-2 text-left text-type-helper font-medium text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-2.5 transition cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Mở lại bài thi</span>
                            </button>
                          </div>

                          <div className="py-1">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionMenu(false);
                                handleExtend();
                              }}
                              className="w-full px-3.5 py-2 text-left text-type-helper font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2.5 transition cursor-pointer"
                            >
                              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                              <span>Gia hạn thời gian</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionMenu(false);
                                handlePenalty();
                              }}
                              className="w-full px-3.5 py-2 text-left text-type-helper font-medium text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-2.5 transition cursor-pointer"
                            >
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>Trừ điểm vi phạm</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                      <button
                        type="button"
                        onClick={handlePrevStudent}
                        disabled={currentIndex <= 0}
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer select-none"
                        title="Sinh viên trước đó"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-type-helper font-semibold tabular-nums text-slate-500 px-1 select-none">
                        {currentIndex >= 0 ? `${currentIndex + 1}/${filteredRows.length}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextStudent}
                        disabled={currentIndex < 0 || currentIndex >= filteredRows.length - 1}
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer select-none"
                        title="Sinh viên tiếp theo"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Essay Questions List */}
              <div className="space-y-4">
                {(selected.questions || []).filter((q: any) => q.type === 'ESSAY').map((q: any, idx: number) => {
                  const ans = (selected.attemptAnswers || []).find((a: any) => a.questionId === q.questionId);
                  const currentQuestionCalculatedScore = (q.rubric || []).reduce((sum: number, r: any) => sum + Number(scores[r.id] || 0), 0);

                  return (
                    <div
                      key={q.questionId || idx}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-4 shadow-2xs"
                    >
                      {/* Question Header & Rubric Trigger */}
                      <div className="flex justify-between items-start gap-4 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                        <div className="flex items-start gap-2.5 flex-1">
                          <span className="ui-pill inline-flex items-center px-2.5 py-1 rounded-full text-blue-700 dark:text-blue-300 text-type-helper font-medium border border-blue-200 dark:border-blue-800/80 shrink-0 select-none">
                            Câu {idx + 1}
                          </span>
                          <div className="text-type-body font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                            {q.content}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {isEditMode && ans?.id && (
                            <Button
                              type="button"
                              variant="soft"
                              size="sm"
                              onClick={() => requestAiSuggestion(ans.id, q.questionId)}
                              isLoading={aiLoading === ans.id}
                              leftIcon={<Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                              title="Tự động phân tích câu trả lời và đề xuất điểm theo Rubric"
                            >
                              AI Chấm gợi ý
                            </Button>
                          )}

                          <button
                            type="button"
                            onClick={() => setViewingRubricQuestion({ ...q, id: q.questionId, code: `Câu ${idx + 1}` })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-type-helper font-semibold hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer shadow-2xs"
                            title="Xem đáp án mẫu và tiêu chuẩn chấm Rubric của câu này"
                          >
                            <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                            <span>Xem Rubric & Đáp án</span>
                          </button>
                          <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold tabular-nums text-type-body-sm text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shrink-0">
                                {isEditMode ? currentQuestionCalculatedScore : (ans?.finalScore ?? 'Chưa có điểm')}{' '}
                            <span className="text-type-helper font-normal text-slate-400">/ {q.score}đ</span>
                          </span>
                        </div>
                      </div>

                      {/* Student Answer Box */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-type-helper font-semibold text-slate-500">
                          <span className="tracking-wide">Bài làm của thí sinh:</span>
                          {ans?.textAnswer && !ans.textAnswer.includes('không nhập') ? (
                            <span className="text-type-helper font-normal text-slate-400">
                              {ans.textAnswer.trim().split(/\s+/).length} từ
                            </span>
                          ) : (
                            <span className="text-type-helper font-normal text-slate-400">0 từ (chưa nhập)</span>
                          )}
                        </div>
                        <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-800/80 border-l-4 border-l-blue-500 text-type-body text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-normal shadow-2xs">
                          {ans?.textAnswer && !ans.textAnswer.includes('không nhập') ? (
                            ans.textAnswer
                          ) : (
                            <span className="italic text-slate-400">Thí sinh chưa nhập nội dung bài làm cho câu hỏi này</span>
                          )}
                        </div>
                      </div>

                      {/* Files */}
                      {ans?.submissionFiles?.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-type-helper font-semibold text-slate-500">File đính kèm ({ans.submissionFiles.length}):</div>
                          <div className="flex gap-2 flex-wrap">
                            {ans.submissionFiles.map((f: any) => (
                              <a
                                key={f.id}
                                href={f.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-400 text-type-helper font-semibold hover:bg-blue-50 hover:border-blue-300 transition shadow-2xs"
                              >
                                <Download className="h-4 w-4 text-blue-500" />
                                <span>{f.fileName}</span>
                                <span className="text-type-helper text-slate-400 font-normal">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rubric Criteria Section */}
                      {q.rubric?.length > 0 && (
                        <div className="space-y-2.5 pt-1">
                          <div className="text-type-helper font-semibold text-slate-600 dark:text-slate-400 tracking-wide flex items-center justify-between">
                            <span>Tiêu chí chấm Rubric ({q.rubric.length}):</span>
                            {isEditMode && (
                              <span className="text-type-helper font-normal text-blue-600 dark:text-blue-400">
                                Đang ở chế độ chỉnh sửa điểm trực tiếp
                              </span>
                            )}
                          </div>
                          <div className="space-y-2.5">
                            {q.rubric.map((r: any) => {
                              const g = (ans?.essayGrades || []).find((item: any) => item.criterionId === r.id);
                              const currentScore = isEditMode ? (scores[r.id] ?? 0) : (g?.score ?? 0);
                              return (
                                <div
                                  key={r.id}
                                  className={`p-3.5 rounded-xl border space-y-2.5 shadow-2xs transition-colors ${
                                    isEditMode
                                      ? 'bg-blue-50/20 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/60'
                                      : 'bg-slate-50/40 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800'
                                  }`}
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <span className="font-semibold text-type-body-sm text-slate-900 dark:text-slate-100">{r.label}</span>
                                      {r.description && (
                                        <p className="text-type-helper text-slate-500 mt-0.5 font-normal leading-relaxed">{r.description}</p>
                                      )}
                                    </div>
                                    <span className="tabular-nums text-type-helper font-medium text-slate-500 shrink-0 px-2 py-0.5 ui-pill rounded-full border border-slate-200/60 dark:border-slate-700">
                                      Tối đa {r.maxScore}đ
                                    </span>
                                  </div>

                                  <div className="flex gap-2 items-center flex-wrap pt-1">
                                    {isEditMode ? (
                                      <input
                                        type="number"
                                        min={0}
                                        max={r.maxScore}
                                        step={0.25}
                                        value={scores[r.id] ?? 0}
                                        onChange={(e) => handleScoreChange(r.id, e.target.value, r.maxScore)}
                                        className="w-20 bg-white dark:bg-slate-900 border border-blue-500 dark:border-blue-400 rounded-xl px-2.5 py-1.5 text-center text-type-body font-semibold tabular-nums text-blue-600 dark:text-blue-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                      />
                                    ) : (
                                      <div className="w-20 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-center text-type-body font-semibold tabular-nums text-blue-600 dark:text-blue-400 shadow-2xs select-none">
                                        {currentScore}
                                      </div>
                                    )}

                                    {/* Quick Score Chips Indicator / Clickable in Edit Mode */}
                                    <div className="flex gap-1 items-center flex-wrap">
                                      {[0, Number((r.maxScore * 0.5).toFixed(2)), Number((r.maxScore * 0.75).toFixed(2)), r.maxScore].map((presetVal) => {
                                        const isSelected = currentScore === presetVal;
                                        return isEditMode ? (
                                          <button
                                            key={presetVal}
                                            type="button"
                                            onClick={() => setScores((prev) => ({ ...prev, [r.id]: presetVal }))}
                                            className={`px-2.5 py-1 rounded-xl text-type-helper font-semibold border transition cursor-pointer select-none ${
                                              isSelected
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:text-blue-600'
                                            }`}
                                          >
                                            {presetVal === r.maxScore ? `Max (${presetVal}đ)` : `${presetVal}đ`}
                                          </button>
                                        ) : (
                                          <div
                                            key={presetVal}
                                            className={`px-2.5 py-1 rounded-xl text-type-helper font-semibold border transition select-none ${
                                              isSelected
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                            }`}
                                          >
                                            {presetVal === r.maxScore ? `Max (${presetVal}đ)` : `${presetVal}đ`}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {isEditMode ? (
                                      <input
                                        type="text"
                                        placeholder="Nhập nhận xét tiêu chí (tùy chọn)..."
                                        value={comments[r.id] || ''}
                                        onChange={(e) => setComments((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                        className="flex-1 min-w-[200px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-type-body font-normal text-slate-800 dark:text-slate-200 shadow-2xs focus:border-blue-500 focus:outline-none"
                                      />
                                    ) : (
                                      <div className="flex-1 min-w-[200px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-type-body font-normal text-slate-800 dark:text-slate-200 shadow-2xs truncate">
                                        {g?.comment || <span className="italic text-slate-400">Không có nhận xét tiêu chí</span>}
                                      </div>
                                    )}
                                  </div>

                                  {ans?.aiEvidence && (
                                    <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-type-helper leading-relaxed text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100 mt-1">
                                      <span className="font-semibold text-blue-700 dark:text-blue-300">Minh chứng AI: </span>
                                      {ans.aiEvidence}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Overall Teacher / Admin Comment */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-type-body font-medium text-slate-600 dark:text-slate-400">Nhận xét tổng quát cho câu này:</label>
                        {isEditMode ? (
                          <textarea
                            rows={2}
                            placeholder="Nhập nhận xét tổng quát của Quản trị viên / Giảng viên..."
                            value={teacherComments[q.questionId] || ''}
                            onChange={(e) => setTeacherComments((prev) => ({ ...prev, [q.questionId]: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-type-body font-normal text-slate-800 dark:text-slate-200 shadow-2xs focus:border-blue-500 focus:outline-none resize-y"
                          />
                        ) : (
                          <div className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-type-body font-normal text-slate-800 dark:text-slate-200 shadow-2xs">
                            {ans?.teacherComment || <span className="italic text-slate-400">Chưa có nhận xét tổng quát</span>}
                          </div>
                        )}
                      </div>

                      {/* AI Suggestion */}
                      {ans?.aiSuggestedScore !== undefined && ans?.aiSuggestedScore !== null && (
                        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-type-helper text-blue-900 dark:text-blue-200 space-y-1 shadow-2xs">
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
                            <p className="text-type-helper text-blue-800 dark:text-blue-300 leading-relaxed">
                              {ans.aiSuggestedComment}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Score History */}
                      {ans?.gradeHistories?.length > 0 && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-type-helper space-y-1.5 shadow-2xs">
                          <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-slate-500" /> Lịch sử chỉnh điểm ({ans.gradeHistories.length})
                          </p>
                          <div className="space-y-1 pl-1">
                            {ans.gradeHistories.map((h: any) => (
                              <div key={h.id} className="text-type-helper text-slate-600 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {new Date(h.createdAt).toLocaleString('vi-VN')}:
                                </span>{' '}
                                Điểm cũ {h.oldScore ?? 'Chưa có điểm'} → Điểm mới{' '}
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
        title={profileCandidate?.student?.fullName || 'Hồ Sơ & Bài Thi Sinh Viên'}
        subtitle={profileCandidate?.student?.studentCode ? `Mã sinh viên: ${profileCandidate.student.studentCode}` : ''}
        avatarText={profileCandidate?.student?.fullName?.trim().split(' ').pop()?.slice(0, 2)?.toUpperCase() || 'SV'}
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
              <span className="text-type-body font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
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
                <span className="text-type-body font-semibold text-rose-600">
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
              <div className="space-y-2 text-type-helper font-normal text-slate-600 dark:text-slate-400">
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
        <div className="flex items-center justify-center min-h-[400px] text-type-helper font-semibold text-slate-500">
          Đang tải trang duyệt bài tự luận...
        </div>
      }
    >
      <AdminEssayReviewContent />
    </Suspense>
  );
}
