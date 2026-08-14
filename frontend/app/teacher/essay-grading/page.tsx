'use client';

import React, { Suspense, useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { RubricDialog } from '../../../components/question-bank/RubricDialog';
import { Button } from '../../../components/ui/Button';
import { usePageTitle } from '../../../components/PageTitleContext';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { TabBar } from '../../../components/ui/TabBar';
import {
  Search,
  X,
  RotateCcw,
  Sparkles,
  Sliders,
  Save,
  CheckCircle2,
  FileText,
  User,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  List,
  LayoutGrid,
  Layers,
  Check,
} from 'lucide-react';
import { SortDropdown } from '../../../components/ui/SortDropdown';
import { IdentifierBadge } from '../../../components/ui/IdentifierBadge';

function TeacherEssayGradingContent() {
  usePageTitle('Chấm Bài Thi Tự Luận');
  const searchParams = useSearchParams();
  const attemptIdParam = searchParams.get('attemptId');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const rowsRef = useRef<any[]>([]);
  rowsRef.current = rows;

  const [selected, setSelected] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [teacherComments, setTeacherComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NOT_SUBMITTED' | 'GRADING' | 'WAITING_APPROVAL' | 'PUBLISHED'>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [scheduleFilter, setScheduleFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [openColumnMenu, setOpenColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    student: true,
    subject: true,
    date: true,
    score: true,
    status: true,
    actions: true,
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'success' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'info', confirmText: 'Xác nhận', cancelText: 'Hủy bỏ', onConfirm: () => {} });

  const [rubricQuestion, setRubricQuestion] = useState<any>(null);

  const openAttempt = useCallback(async (id: string) => {
    if (!id || id.startsWith('virtual-')) {
      const vRow = rowsRef.current.find((r) => r.id === id);
      if (vRow) {
        setSelected(vRow);
        setScores({});
        setComments({});
        setTeacherComments({});
        setMessage('');
        return;
      }
    }

    try {
      const res = await api.get(`/essay/grading/attempts/${id}`, { params: { noCache: true } });
      const attemptData = res.data;
      setSelected(attemptData);
      setMessage('');

      const initScores: Record<string, number> = {};
      const initComments: Record<string, string> = {};
      const initTeacherComments: Record<string, string> = {};
      const answersToAiSuggest: any[] = [];

      (attemptData.attemptAnswers || []).forEach((ans: any) => {
        if (ans.teacherComment) initTeacherComments[ans.questionId] = ans.teacherComment;
        (ans.essayGrades || []).forEach((grade: any) => {
          initScores[grade.criterionId] = grade.score;
          if (grade.comment) initComments[grade.criterionId] = grade.comment;
        });

        // Nếu chưa có điểm Rubric -> Xếp hàng để tự động gọi AI suggest
        if (!ans.essayGrades || ans.essayGrades.length === 0) {
          const q = (attemptData.questions || []).find((item: any) => item.questionId === ans.questionId);
          if (q && q.type === 'ESSAY') {
            answersToAiSuggest.push({ answer: ans, question: q });
          }
        }
      });

      // Mặc định tự động gán 0 điểm cho bất kỳ câu hỏi tự luận nào chưa có điểm hoặc sinh viên không làm
      const essayQuestions = (attemptData.questions || []).filter((item: any) => item.type === 'ESSAY');
      essayQuestions.forEach((q: any) => {
        const ans = (attemptData.attemptAnswers || []).find((a: any) => a.questionId === q.questionId);
        const isBlank = !ans || !ans.textAnswer || !ans.textAnswer.trim() || ans.textAnswer.includes('không nhập');

        (q.rubric || []).forEach((r: any) => {
          if (initScores[r.id] === undefined) {
            initScores[r.id] = 0;
            if (isBlank && !initComments[r.id]) {
              initComments[r.id] = 'Sinh viên bỏ trống câu hỏi (0đ)';
            }
          }
        });

        if (isBlank && !initTeacherComments[q.questionId]) {
          initTeacherComments[q.questionId] = 'Sinh viên bỏ trống câu hỏi (0đ)';
        }
      });

      setScores(initScores);
      setComments(initComments);
      setTeacherComments(initTeacherComments);

      // Tự động gọi AI gợi ý chấm cho các câu tự luận chưa có điểm và cập nhật lên UI
      if (answersToAiSuggest.length > 0) {
        for (const item of answersToAiSuggest) {
          try {
            const aiRes = await api.post(`/essay-grading/answers/${item.answer.id}/ai-suggest`);
            const aiData = aiRes.data;
            if (aiData && Array.isArray(aiData.criteria)) {
              aiData.criteria.forEach((c: any) => {
                initScores[c.criterionId] = c.score;
                if (c.comment) initComments[c.criterionId] = c.comment;
              });
            }
            if (aiData.overallComment && !initTeacherComments[item.question.questionId]) {
              initTeacherComments[item.question.questionId] = aiData.overallComment;
            }
          } catch (aiErr) {
            // Background AI fallback
          }
        }
        setScores({ ...initScores });
        setComments({ ...initComments });
        setTeacherComments({ ...initTeacherComments });
      }
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Không thể tải chi tiết bài làm.');
    }
  }, []);

  const isNotSubmitted = useCallback((r: any) => {
    return r.status === 'NOT_STARTED' || r.status === 'IN_PROGRESS' || r.gradingStatus === 'NOT_STARTED' || r.gradingStatus === 'IN_PROGRESS' || !r.submittedAt;
  }, []);

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const user = getAuthUser();
      setCurrentUser(user || null);
      const res = await api.get('/essay/grading/assignments', { params: { noCache: true } });
      setRows(res.data || []);
      if (attemptIdParam) {
        await openAttempt(attemptIdParam);
      }
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Không thể tải danh sách bài tự luận');
    } finally {
      setLoading(false);
    }
  }, [attemptIdParam, openAttempt]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleScoreChange = (criterionId: string, val: string, maxScore: number) => {
    const num = Number(val);
    if (isNaN(num)) return;
    if (num < 0) {
      setMessage('Điểm số không được nhỏ hơn 0.');
      return;
    }
    if (num > maxScore) {
      setMessage(`Điểm số không được vượt quá điểm tối đa của tiêu chí (${maxScore}đ).`);
      return;
    }
    setScores((prev) => ({ ...prev, [criterionId]: num }));
  };

  const [batchAiLoading, setBatchAiLoading] = useState(false);

  const saveAllQuestionGrades = async (options: { showPopup?: boolean } = { showPopup: true }) => {
    if (!selected || !selected.id || String(selected.id).startsWith('virtual-')) {
      setMessage('Bài thi chưa được nộp hoặc là dữ liệu vắng thi.');
      return false;
    }
    const essayQuestions = (selected.questions || []).filter((q: any) => q.type === 'ESSAY');
    if (!essayQuestions.length) return true;

    setSaving(true);
    try {
      let savedCount = 0;
      for (const q of essayQuestions) {
        let ans = (selected.attemptAnswers || []).find((a: any) => a.questionId === q.questionId);
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

        await api.patch(`/essay/grading/answers/${ans.id}`, {
          criteria,
          teacherComment: teacherComments[q.questionId] || '',
        });
        savedCount++;
      }

      if (savedCount > 0 && options.showPopup) {
        showResultPopup('Lưu điểm thành công', `Đã lưu thành công toàn bộ điểm cho ${savedCount} câu hỏi tự luận!`, 'success');
      }
      return true;
    } catch (e: any) {
      const errText = e?.response?.data?.message || 'Không thể lưu điểm bài thi.';
      setMessage(errText);
      showResultPopup('Lỗi lưu điểm', errText, 'danger');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAllClick = async () => {
    const ok = await saveAllQuestionGrades({ showPopup: true });
    if (ok && selected?.id) {
      await openAttempt(selected.id);
    }
  };

  const handleBatchAiGradeAll = async () => {
    if (!paginatedRows.length) return;
    setBatchAiLoading(true);
    setMessage(`Đang tiến hành AI chấm bài tự luận cho các bài thi trên Trang ${page}...`);
    try {
      let count = 0;
      for (const row of paginatedRows) {
        if (row.id && !row.id.startsWith('virtual-') && !isNotSubmitted(row) && row.submittedAt) {
          try {
            await api.get(`/essay/grading/attempts/${row.id}`, { params: { noCache: true } });
            count++;
          } catch (e) {
            // Ignore single attempt AI errors
          }
        }
      }
      const msg = count > 0
        ? `Hoàn tất AI chấm tự động cho ${count} bài thi trên Trang ${page}!`
        : `Không có bài thi mới nào đã nộp cần AI chấm trên Trang ${page}.`;
      setMessage(msg);
      showResultPopup(`AI Chấm Trang ${page}`, msg, count > 0 ? 'success' : 'info');
      await loadAssignments();
      if (selected?.id) {
        await openAttempt(selected.id);
      }
    } catch (e: any) {
      setMessage('Không thể chấm bài trên trang này.');
    } finally {
      setBatchAiLoading(false);
    }
  };

  const showResultPopup = (title: string, message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      type,
      confirmText: 'Đã hiểu',
      cancelText: '',
      onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const handleCompleteGrading = () => {
    if (!selected) return;

    const isAdmin = currentUser?.role === 'ADMIN';

    setConfirmModal({
      isOpen: true,
      title: isAdmin ? 'Duyệt bài thi tự luận' : 'Gửi duyệt',
      message: isAdmin
        ? `Hệ thống sẽ lưu điểm và thực hiện duyệt bài thi cho thí sinh ${selected.student?.fullName}. Bạn có chắc chắn?`
        : `Hệ thống sẽ lưu toàn bộ điểm và gửi bài thi của thí sinh ${selected.student?.fullName} tới ADMIN duyệt. Bạn có chắc chắn?`,
      type: 'success',
      confirmText: isAdmin ? 'Duyệt bài' : 'Gửi duyệt',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          const ok = await saveAllQuestionGrades({ showPopup: false });
          if (!ok) return;

          await api.post(`/essay/grading/attempts/${selected.id}/submit`);
          if (isAdmin) {
            await api.post(`/essay/grading/attempts/${selected.id}/approve`);
            const msg = `Đã lưu toàn bộ điểm và duyệt bài thi thành công cho thí sinh ${selected.student?.fullName}!`;
            setMessage(msg);
            showResultPopup('Duyệt Bài Thành Công', msg, 'success');
          } else {
            const msg = `Đã lưu toàn bộ điểm và gửi bài thi của thí sinh ${selected.student?.fullName} tới ADMIN duyệt thành công!`;
            setMessage(msg);
            showResultPopup('Gửi Duyệt Thành Công', msg, 'success');
          }
          await loadAssignments();
          if (selected?.id) {
            await openAttempt(selected.id);
          }
        } catch (e: any) {
          const errMsg = e?.response?.data?.message || 'Không thể hoàn tất chấm bài.';
          setMessage(errMsg);
          showResultPopup('Không Thể Hoàn Tất', errMsg, 'danger');
        }
      },
    });
  };

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
    let all = 0, notSubmitted = 0, grading = 0, waiting = 0, published = 0;
    rows.forEach((r) => {
      all++;
      if (r.gradingStatus === 'PUBLISHED') published++;
      else if (r.gradingStatus === 'WAITING_APPROVAL') waiting++;
      else if (isNotSubmitted(r)) notSubmitted++;
      else grading++;
    });
    return { all, notSubmitted, grading, waiting, published };
  }, [rows, isNotSubmitted]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'NOT_SUBMITTED' && !isNotSubmitted(r)) return false;
        if (statusFilter === 'GRADING' && (isNotSubmitted(r) || r.gradingStatus === 'PUBLISHED' || r.gradingStatus === 'WAITING_APPROVAL')) return false;
        if (statusFilter === 'WAITING_APPROVAL' && r.gradingStatus !== 'WAITING_APPROVAL') return false;
        if (statusFilter === 'PUBLISHED' && r.gradingStatus !== 'PUBLISHED') return false;
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
        const sCode = (r.student?.studentCode || '').toLowerCase();
        const name = (r.student?.fullName || '').toLowerCase();
        const subj = (r.onlineExamConfig?.examSchedule?.subject?.subjectName || r.subjectName || '').toLowerCase();
        const schedCode = (r.onlineExamConfig?.examSchedule?.code || '').toLowerCase();
        return sCode.includes(q) || name.includes(q) || subj.includes(q) || schedCode.includes(q);
      }
      return true;
    });
  }, [rows, statusFilter, subjectFilter, dateFilter, scheduleFilter, searchQuery, isNotSubmitted]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, subjectFilter, dateFilter, scheduleFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const currentIndex = useMemo(() => {
    if (!selected) return -1;
    return filteredRows.findIndex((r) => r.id === selected.id);
  }, [filteredRows, selected]);

  const handlePrevStudent = () => {
    if (currentIndex > 0) openAttempt(filteredRows[currentIndex - 1].id);
  };

  const handleNextStudent = () => {
    if (currentIndex < filteredRows.length - 1) openAttempt(filteredRows[currentIndex + 1].id);
  };

  const KPI_CARDS = [
    {
      title: 'Tổng bài thi',
      value: counts.all,
      subtext: 'Tất cả bài làm được phân công',
      progressPercent: counts.all > 0 ? 100 : 0,
      icon: FileText,
      unit: ' bài',
    },
    {
      title: 'Đang chấm',
      value: counts.grading,
      subtext: 'Đang chấm điểm & nhận xét',
      progressPercent: counts.all > 0 ? Math.round((counts.grading / counts.all) * 100) : 0,
      icon: Sparkles,
      unit: ' bài',
    },
    {
      title: 'Chờ duyệt điểm',
      value: counts.waiting,
      subtext: 'Đã hoàn tất chấm, chờ Admin duyệt',
      progressPercent: counts.all > 0 ? Math.round((counts.waiting / counts.all) * 100) : 0,
      icon: AlertCircle,
      unit: ' bài',
    },
    {
      title: 'Đã công bố',
      value: counts.published,
      subtext: 'Điểm số chính thức đã công bố',
      progressPercent: counts.all > 0 ? Math.round((counts.published / counts.all) * 100) : 0,
      icon: CheckCircle2,
      unit: ' bài',
    },
  ];

  return (
    <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      {/* ── 1. Standard Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div className="space-y-0.5">
          <h1 className="text-[28px] font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
            Chấm Bài Thi Tự Luận
          </h1>
          <p className="text-[14.5px] font-normal leading-[22px] text-slate-500 dark:text-slate-400">
            Chấm điểm và đánh giá bài làm tự luận của sinh viên theo chuẩn Rubric.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button
            variant="primary"
            size="md"
            onClick={handleBatchAiGradeAll}
            disabled={batchAiLoading || loading || !paginatedRows.length}
            isLoading={batchAiLoading}
            title="Chỉ thực hiện AI chấm cho các bài thi trên trang hiện tại"
          >
            {batchAiLoading ? 'Đang chấm...' : 'Mẫu chấm AI'}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={loadAssignments}
            disabled={loading}
            title="Làm mới danh sách"
          >
            <RotateCcw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── 2. Standard 4 KPI Cards Row With Micro Progress Tracks ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {KPI_CARDS.map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.title}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                    {item.title}
                  </span>
                  <div className="text-[32px] font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
                    {item.value.toLocaleString('vi-VN')}
                    {item.unit ? <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">{item.unit}</span> : ''}
                  </div>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                  <IconComponent className="h-5 w-5 stroke-[2.2]" />
                </div>
              </div>

              {/* Thanh đo tiến độ tỷ lệ động nhỏ mảnh, tinh tế (Micro Progress Track) */}
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(item.progressPercent, 5), 100)}%` }}
                />
              </div>

              <div className="mt-2.5">
                <span
                  title={item.subtext}
                  className="text-[13px] font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
                >
                  {item.subtext}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {message && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center justify-between shadow-2xs">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-slate-600 font-semibold ml-4 cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Panel: Attempt List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wider">
                Danh sách bài làm ({filteredRows.length}/{rows.length})
              </span>
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
                  className="p-1 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer select-none"
                  title="Đặt lại bộ lọc"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status Tabs */}
            <TabBar
              tabs={[
                { key: 'ALL', label: 'Tất cả', count: counts.all },
                { key: 'NOT_SUBMITTED', label: 'Chưa làm', count: counts.notSubmitted },
                { key: 'GRADING', label: 'Đang chấm', count: counts.grading },
                { key: 'WAITING_APPROVAL', label: 'Chờ duyệt', count: counts.waiting },
                { key: 'PUBLISHED', label: 'Công bố', count: counts.published },
              ]}
              active={statusFilter}
              onChange={(k) => setStatusFilter(k as any)}
            />

            {/* Search Bar */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã SV, tên SV, môn, ca thi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-[15px] font-normal text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Filters Row */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[15px] font-normal text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer truncate"
              >
                <option value="ALL">Tất cả môn ({availableSubjects.length})</option>
                {availableSubjects.map((s) => (
                  <option key={s.code} value={s.code}>
                    [{s.code}] {s.name}
                  </option>
                ))}
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[15px] font-normal text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer truncate"
              >
                <option value="ALL">Tất cả ngày thi ({availableDates.length})</option>
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {availableSchedules.length > 0 && (
              <div>
                <select
                  value={scheduleFilter}
                  onChange={(e) => setScheduleFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[15px] font-normal text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer truncate"
                >
                  <option value="ALL">Tất cả ca thi ({availableSchedules.length})</option>
                  {availableSchedules.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Attempts List */}
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {loading ? (
                <div className="p-8 text-center text-xs font-medium text-slate-400">Đang tải danh sách bài thi...</div>
              ) : paginatedRows.length === 0 ? (
                <div className="p-8 text-center text-xs font-medium text-slate-400">Không tìm thấy bài thi phù hợp</div>
              ) : (
                paginatedRows.map((r) => {
                  const isCur = selected?.id === r.id;
                  const notSub = isNotSubmitted(r);
                  return (
                    <div
                      key={r.id}
                      onClick={() => openAttempt(r.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer text-left ${
                        isCur
                          ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                          : 'border-slate-200/90 bg-white hover:border-blue-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-semibold text-xs text-slate-900 truncate max-w-[170px]">
                          {r.student?.fullName}
                        </div>
                        <StatusBadge status={r.gradingStatus} />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <span>MSSV:</span>
                        <IdentifierBadge tone="neutral">{r.student?.studentCode}</IdentifierBadge>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-400 mt-2 pt-1.5 border-t border-slate-100">
                        <span className="truncate max-w-[140px]">
                          {r.onlineExamConfig?.examSchedule?.subject?.subjectName || r.subjectName || 'Môn thi'}
                        </span>
                        <span className="font-semibold text-slate-700 tabular-nums">
                          {notSub ? 'Chưa nộp' : r.totalScore !== undefined && r.totalScore !== null ? `${r.totalScore}đ` : '--'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  Trang {page} / {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Grading Question Content */}
        <div className="lg:col-span-8 space-y-4">
          {!selected ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-12 text-center text-slate-400 text-xs font-medium shadow-2xs">
              Vui lòng chọn bài thi từ danh sách bên trái để chấm điểm.
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-5 shadow-2xs">
              {/* Header Information & Fast Student Navigation */}
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-semibold text-sm shrink-0">
                    {selected.student?.fullName?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{selected.student?.fullName}</h2>
                      <StatusBadge status={selected.gradingStatus} />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <span>Mã SV:</span><IdentifierBadge tone="neutral">{selected.student?.studentCode}</IdentifierBadge>
                      <span>· Môn: <strong className="text-slate-800 dark:text-slate-200">{selected.onlineExamConfig?.examSchedule?.subject?.subjectName || selected.subjectName || 'Môn thi'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xl tabular-nums font-medium text-slate-900 dark:text-slate-100">
                      {selected.totalScore ?? '--'} <span className="text-xs text-slate-500 font-normal">/ {selected.maxScore || 10}đ</span>
                    </span>
                    {selected.penaltyPoints > 0 && (
                      <p className="text-xs font-semibold text-rose-600 mt-0.5">
                        Điểm phạt: -{selected.penaltyPoints}đ ({selected.penaltyReason})
                      </p>
                    )}
                  </div>

                  {/* Quick Prev / Next Student */}
                  <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-3">
                    <button
                      type="button"
                      onClick={handlePrevStudent}
                      disabled={currentIndex <= 0}
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer select-none"
                      title="Sinh viên trước đó"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-[12px] font-semibold tabular-nums text-slate-500 px-1">
                      {currentIndex >= 0 ? `${currentIndex + 1}/${filteredRows.length}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextStudent}
                      disabled={currentIndex < 0 || currentIndex >= filteredRows.length - 1}
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer select-none"
                      title="Sinh viên tiếp theo"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Essay Questions List or Unsubmitted Banner */}
              {isNotSubmitted(selected) || selected.isVirtual || !(selected.questions || []).filter((q: any) => q.type === 'ESSAY').length ? (
                <div className="py-12 px-6 rounded-2xl border border-amber-200/80 bg-amber-50/50 text-center space-y-3 shadow-2xs my-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    {!(selected.questions || []).filter((q: any) => q.type === 'ESSAY').length && !isNotSubmitted(selected)
                      ? 'Đề thi chỉ gồm Trắc nghiệm / Điền khuyết (Đã tự động chấm)'
                      : 'Thí sinh chưa nộp bài hoặc chưa làm bài thi tự luận'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    {!(selected.questions || []).filter((q: any) => q.type === 'ESSAY').length && !isNotSubmitted(selected)
                      ? 'Các câu hỏi Trắc nghiệm và Điền khuyết đã có đáp án mặc định sẵn. Hệ thống tự động chấm điểm chính xác và tự động công bố khi hết hạn ca thi.'
                      : `Sinh viên ${selected.student?.fullName || ''} (mã SV: ${selected.student?.studentCode || ''}) chưa gửi bài thi tự luận hoặc không có câu tự luận nào cần giảng viên chấm thủ công.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-5 max-h-[62vh] overflow-y-auto pr-1">
                  {(selected.questions || []).filter((q: any) => q.type === 'ESSAY').map((q: any, idx: number) => {
                    const ans = (selected.attemptAnswers || []).find((a: any) => a.questionId === q.questionId);

                    return (
                      <div key={q.questionId || idx} className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                        {/* Question Title & Actions */}
                        <div className="flex justify-between items-start font-semibold text-xs text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                          <div className="pr-4">
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">Câu {idx + 1} (Tự luận):</span> {q.content}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setRubricQuestion({ id: q.questionId, code: `Câu ${idx + 1}`, score: q.score, rubric: q.rubric || [] })}
                              className="inline-flex items-center gap-1 text-[15px] font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer shadow-2xs"
                            >
                              <Sliders className="h-4 w-4 text-slate-500" />
                              <span>Sửa Rubric</span>
                            </button>
                            <span className="text-slate-900 dark:text-slate-100 tabular-nums text-[18px] font-semibold">
                              {ans?.finalScore !== undefined && ans?.finalScore !== null
                                ? ans.finalScore
                                : (q.rubric || []).reduce((acc: number, r: any) => acc + Number(scores[r.id] || 0), 0)} / {q.score}đ
                            </span>
                          </div>
                        </div>

                        {/* Student Answer */}
                        <div className="space-y-1">
                          <div className="text-[13px] font-semibold text-slate-500 tracking-wider">Bài làm của sinh viên:</div>
                          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[15px] text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed shadow-2xs font-normal">
                            {ans?.textAnswer || <span className="italic text-slate-500">Sinh viên không nhập nội dung văn bản</span>}
                          </div>
                        </div>

                        {/* Files */}
                        {ans?.submissionFiles?.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-[13px] font-semibold text-slate-500 tracking-wider">File đính kèm ({ans.submissionFiles.length}):</div>
                            <div className="flex gap-2 flex-wrap">
                              {ans.submissionFiles.map((f: any) => (
                                <a
                                  key={f.id}
                                  href={f.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-400 text-[15px] font-medium hover:bg-blue-50 transition shadow-2xs"
                                >
                                  <Download className="h-4 w-4 text-blue-500" />
                                  <span>Tải file: {f.fileName} ({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rubric Criteria Table */}
                        {q.rubric?.length > 0 ? (
                          <div className="space-y-2 pt-1">
                            <div className="text-[13px] font-semibold text-slate-500 tracking-wider">Tiêu chí chấm Rubric:</div>
                            <div className="space-y-2">
                              {q.rubric.map((r: any) => (
                                <div key={r.id} className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 space-y-2.5 shadow-2xs">
                                  <div className="flex justify-between items-start text-[15px]">
                                    <div>
                                      <span className="font-semibold text-slate-900 dark:text-slate-100">{r.label}</span>
                                      {r.description && <p className="text-[13px] text-slate-500 mt-0.5 font-normal">{r.description}</p>}
                                    </div>
                                    <span className="tabular-nums text-[15px] font-semibold text-slate-500 shrink-0 ml-2">Tối đa {r.maxScore}đ</span>
                                  </div>

                                  <div className="flex gap-2 items-center flex-wrap">
                                    <input
                                      type="number"
                                      step={0.25}
                                      min={0}
                                      max={r.maxScore}
                                      placeholder="Điểm"
                                      value={scores[r.id] ?? 0}
                                      onChange={(e) => handleScoreChange(r.id, e.target.value, r.maxScore)}
                                      className="w-24 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-[15px] font-medium tabular-nums text-slate-900 dark:text-slate-100 focus:bg-white focus:border-blue-500 focus:outline-none"
                                    />

                                    {/* Quick Score Chips */}
                                    <div className="flex gap-1 items-center">
                                      {[0, Number((r.maxScore * 0.5).toFixed(2)), Number((r.maxScore * 0.75).toFixed(2)), r.maxScore].map((presetVal) => (
                                        <button
                                          key={presetVal}
                                          type="button"
                                          onClick={() => handleScoreChange(r.id, String(presetVal), r.maxScore)}
                                          className={`px-2.5 py-1 rounded-xl text-[13px] font-semibold border transition cursor-pointer ${
                                            scores[r.id] === presetVal
                                              ? 'bg-blue-600 text-white border-blue-600'
                                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                          }`}
                                        >
                                          {presetVal === r.maxScore ? `Max (${presetVal}đ)` : `${presetVal}đ`}
                                        </button>
                                      ))}
                                    </div>

                                    <input
                                      type="text"
                                      placeholder="Nhận xét tiêu chí..."
                                      value={comments[r.id] || ''}
                                      onChange={(e) => setComments((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                      className="flex-1 min-w-[200px] bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-[15px] font-medium text-slate-900 dark:text-slate-100 focus:bg-white focus:border-blue-500 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs font-medium text-amber-900 flex justify-between items-center">
                            <span>Câu hỏi này chưa được cài đặt tiêu chí Rubric.</span>
                            <button
                              type="button"
                              onClick={() => setRubricQuestion({ id: q.questionId, code: `Câu ${idx + 1}`, score: q.score, rubric: [] })}
                              className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition cursor-pointer shadow-2xs"
                            >
                              Cấu hình Rubric ngay
                            </button>
                          </div>
                        )}

                        {/* Overall Teacher Comment */}
                        <div className="space-y-1 pt-1">
                          <label className="text-[15px] font-medium text-slate-500">Nhận xét tổng quát câu hỏi:</label>
                          <input
                            type="text"
                            placeholder="Nhập nhận xét tổng quát cho câu tự luận này..."
                            value={teacherComments[q.questionId] || ''}
                            onChange={(e) => setTeacherComments((prev) => ({ ...prev, [q.questionId]: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-[15px] font-normal text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none shadow-2xs"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Action Footer */}
              <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 p-4 -mx-5 -mb-5 rounded-b-2xl z-20 flex justify-between items-center flex-wrap gap-3 shadow-xs">
                <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    {isNotSubmitted(selected) || selected.isVirtual
                      ? 'Sinh viên chưa nộp bài thi. Nút duyệt bài sẽ tự động mở khi sinh viên nộp bài.'
                      : currentUser?.role === 'ADMIN'
                      ? 'Bấm nút "Duyệt bài" để hoàn tất và duyệt điểm tự luận.'
                      : 'Bấm "Gửi duyệt" sau khi kiểm tra xong các câu tự luận.'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleSaveAllClick}
                    disabled={saving || isNotSubmitted(selected) || selected.isVirtual}
                    isLoading={saving}
                    leftIcon={<Save className="h-4 w-4 text-slate-500" />}
                  >
                    {saving ? 'Đang lưu...' : 'Lưu tất cả điểm'}
                  </Button>
                  {currentIndex >= 0 && currentIndex < filteredRows.length - 1 && (
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={handleNextStudent}
                      rightIcon={<ChevronRight className="h-4 w-4 text-slate-500" />}
                    >
                      Bài tiếp theo
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleCompleteGrading}
                    disabled={isNotSubmitted(selected) || selected.isVirtual}
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    {currentUser?.role === 'ADMIN' ? 'Duyệt bài' : 'Gửi duyệt'}
                  </Button>
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
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {rubricQuestion && (
        <RubricDialog
          isOpen={Boolean(rubricQuestion)}
          question={rubricQuestion}
          onClose={() => setRubricQuestion(null)}
          onSuccess={() => {
            setRubricQuestion(null);
            if (selected) openAttempt(selected.id);
          }}
        />
      )}
    </main>
  );
}

export default function TeacherEssayGradingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px] text-xs font-semibold text-slate-500">Đang tải trang chấm bài tự luận...</div>}>
      <TeacherEssayGradingContent />
    </Suspense>
  );
}
