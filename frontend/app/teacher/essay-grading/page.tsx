'use client';

import React, { Suspense, useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { Toast } from '../../../components/Toast';
import { Button } from '../../../components/ui/Button';
import { RubricViewerModal } from '../../../components/question-bank/RubricViewerModal';
import { usePageTitle } from '../../../components/PageTitleContext';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { TabBar } from '../../../components/ui/TabBar';
import { FilterSelect } from '../../../components/ui/FilterSelect';
import { IdentifierBadge } from '../../../components/ui/IdentifierBadge';
import { ProfileDrawer } from '../../../components/ProfileDrawer';
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
  BookOpen,
  SlidersHorizontal,
  ChevronDown,
  List,
  LayoutGrid,
  Layers,
  Check,
  Send,
  Lock,
  Clock,
  Maximize2,
} from 'lucide-react';
import { SortDropdown } from '../../../components/ui/SortDropdown';
import { QuestionMediaPlayer } from '../../../components/exam/QuestionMediaPlayer';
import { DynamicImage } from '../../../components/ui/DynamicImage';
import { ImageLightboxModal } from '../../../components/ImageLightboxModal';
import { getImageUrl } from '../../../lib/media-utils';

function TeacherEssayGradingContent() {
  usePageTitle('Chấm bài tự luận');
  const searchParams = useSearchParams();
  const attemptIdParam = searchParams.get('attemptId');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const rowsRef = useRef<any[]>([]);
  rowsRef.current = rows;

  const [selected, setSelected] = useState<any>(null);
  const [collapseList, setCollapseList] = useState(false);
  const [viewingRubricQuestion, setViewingRubricQuestion] = useState<any>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [teacherComments, setTeacherComments] = useState<Record<string, string>>({});
  const [aiEvidence, setAiEvidence] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NOT_SUBMITTED' | 'GRADING' | 'WAITING_APPROVAL' | 'APPROVED' | 'PUBLISHED'>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [scheduleFilter, setScheduleFilter] = useState<string>('ALL');

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
  const [sortOrder, setSortOrder] = useState<string>('newest');
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
  const [profileCandidate, setProfileCandidate] = useState<any | null>(null);

  const openAttempt = useCallback(async (id: string) => {
    if (!id || id.startsWith('virtual-')) {
      const vRow = rowsRef.current.find((r) => r.id === id);
      if (vRow) {
        setSelected(vRow);
        setScores({});
        setComments({});
        setTeacherComments({});
        return;
      }
    }

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
      setHasUnsavedChanges(false);

    } catch (e: any) {
      setToast({ message: e?.response?.data?.message || 'Không thể tải chi tiết bài làm.', type: 'error' });
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
      setToast({ message: 'Không thể tải danh sách bài tự luận', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [attemptIdParam, openAttempt]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleScoreChange = (criterionId: string, value: string, maxScore: number = 10) => {
    setHasUnsavedChanges(true);
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
      const totalAiScore = data.criteria.reduce((s: number, item: any) => s + (Number(item.score) || 0), 0);
      setScores((previous) => ({
        ...previous,
        ...Object.fromEntries(data.criteria.map((item: any) => [item.criterionId, item.score])),
        [`q_${questionId}`]: totalAiScore,
      }));
      setComments((previous) => ({ ...previous, ...Object.fromEntries(data.criteria.map((item: any) => [item.criterionId, item.comment || ''])) }));
      setAiEvidence((previous) => ({ ...previous, ...Object.fromEntries(data.criteria.map((item: any) => [item.criterionId, item.evidenceQuote || 'Không có minh chứng rõ ràng'])) }));
      if (data.overallComment) setTeacherComments((previous) => ({ ...previous, [questionId]: data.overallComment }));
      setHasUnsavedChanges(true);
      setToast({
        message: data.isBlank === true || data.source === 'RULE'
          ? 'Câu hỏi bị bỏ trống — hệ thống áp dụng 0đ theo quy định, không cần AI phân tích.'
          : 'AI đã phân tích bài làm theo Rubric và tạo điểm đề xuất. Chưa phải điểm chính thức.',
        type: 'success',
      });
    } catch (error: any) {
      setToast({ message: error?.response?.data?.message || error?.message || 'Không thể tạo đề xuất AI. Bạn vẫn có thể chấm thủ công.', type: 'error' });
    } finally {
      setAiLoading(null);
    }
  };

  const [batchAiLoading, setBatchAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState<{ current: number; total: number; percent: number; phase: string } | null>(null);

  const saveAllQuestionGrades = async (options: { showPopup?: boolean } = { showPopup: true }) => {
    if (!selected || !selected.id || String(selected.id).startsWith('virtual-')) {
      setToast({ message: 'Bài thi chưa được nộp hoặc là dữ liệu vắng thi.', type: 'error' });
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

      setHasUnsavedChanges(false);

      if (savedCount > 0) {
        await loadAssignments();
        if (selected?.id) {
          await openAttempt(selected.id);
        }
        if (options.showPopup) {
          setToast({ message: 'Đã lưu điểm bài thi thành công!', type: 'success' });
        }
      }
      return true;
    } catch (e: any) {
      const errText = e?.response?.data?.message || 'Không thể lưu điểm bài thi.';
      setToast({ message: errText, type: 'error' });
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

  const handleAiGradeCurrentStudent = async () => {
    if (!selected || !selected.id || String(selected.id).startsWith('virtual-') || isNotSubmitted(selected)) {
      setToast({ message: 'Vui lòng chọn một bài thi hợp lệ đã nộp để thực hiện chấm AI.', type: 'error' });
      return;
    }

    const essayQuestions = (selected.questions || []).filter((q: any) => q.type === 'ESSAY');
    if (!essayQuestions.length) {
      setToast({ message: 'Bài thi này không có câu hỏi tự luận nào để AI chấm.', type: 'error' });
      return;
    }

    setBatchAiLoading(true);
    setAiProgress({ current: 0, total: essayQuestions.length, percent: 0, phase: 'Chuẩn bị đọc Rubric...' });
    let actualAiGradedCount = 0;
    let emptyAnswerCount = 0;
    let failedCount = 0;
    const failedMessages: string[] = [];

    try {
      for (let i = 0; i < essayQuestions.length; i++) {
        const q = essayQuestions[i];
        const qId = q.questionId || q.id;
        const ans = (selected.attemptAnswers || []).find((a: any) => a.questionId === qId || a.questionId === q.questionId || a.questionId === q.id);
        if (!ans?.id) {
          // Không có bản ghi đáp án nghĩa là sinh viên bỏ trống câu này.
          // Đây không phải lỗi AI và không cần gọi endpoint AI.
          emptyAnswerCount++;
          setAiProgress({ current: i + 1, total: essayQuestions.length, percent: Math.round(((i + 1) / essayQuestions.length) * 100), phase: `Câu ${i + 1} bỏ trống — áp dụng 0đ theo quy định` });
          continue;
        }

        try {
          setAiProgress({ current: i, total: essayQuestions.length, percent: Math.round((i / essayQuestions.length) * 100), phase: `Đang đọc Rubric và phân tích câu ${i + 1}...` });

          const res = await api.post(`/essay-grading/answers/${ans.id}/ai-suggest`);
          const data = res.data;
          if (Array.isArray(data?.criteria) && data.criteria.length > 0) {
            const totalAiScore = data.criteria.reduce((s: number, item: any) => s + (Number(item.score) || 0), 0);
            setScores((prev) => ({
              ...prev,
              ...Object.fromEntries(data.criteria.map((item: any) => [item.criterionId, item.score])),
              [`q_${qId}`]: totalAiScore,
            }));
            setComments((prev) => ({
              ...prev,
              ...Object.fromEntries(data.criteria.map((item: any) => [item.criterionId, item.comment || ''])),
            }));
            setAiEvidence((prev) => ({
              ...prev,
              ...Object.fromEntries(data.criteria.map((item: any) => [item.criterionId, item.evidenceQuote || ''])),
            }));
            if (data?.overallComment) {
              setTeacherComments((prev) => ({ ...prev, [qId]: data.overallComment }));
            }
            setHasUnsavedChanges(true);

            if (data.isBlank === true || data.source === 'RULE') {
              emptyAnswerCount++;
            } else {
              actualAiGradedCount++;
            }
          } else {
            failedCount++;
          }
        } catch (err) {
          console.error(`AI suggest error for answer ${ans.id}:`, err);
          failedCount++;
          const message = (err as any)?.response?.data?.message || (err as any)?.message;
          if (message && !failedMessages.includes(String(message))) failedMessages.push(String(message));
        } finally {
          setAiProgress({ current: i + 1, total: essayQuestions.length, percent: Math.round(((i + 1) / essayQuestions.length) * 100), phase: `Đã xử lý câu ${i + 1}/${essayQuestions.length}` });
        }
      }

      const totalProcessed = actualAiGradedCount + emptyAnswerCount;
      if (totalProcessed === 0) {
        setToast({
          message: 'AI chưa tạo được đề xuất theo Rubric. Vui lòng thử lại hoặc chấm thủ công.',
          type: 'error',
        });
      } else if (failedCount > 0) {
        const resultParts = [
          actualAiGradedCount > 0 ? `${actualAiGradedCount} câu AI đã phân tích` : '',
          emptyAnswerCount > 0 ? `${emptyAnswerCount} câu bỏ trống được áp dụng 0đ` : '',
          `${failedCount} câu AI chưa trả kết quả`,
        ].filter(Boolean);
        setToast({
          message: `${resultParts.join('; ')}. Vui lòng thử lại các câu lỗi hoặc chấm thủ công.`,
          type: 'error',
        });
        if (failedMessages.length > 0) {
          setToast({
            message: `${resultParts.join('; ')}. Chi tiết: ${failedMessages[0]}`,
            type: 'error',
          });
        }
      } else if (actualAiGradedCount > 0 && emptyAnswerCount > 0) {
        setToast({
          message: `AI đã phân tích ${actualAiGradedCount} câu theo Rubric; ${emptyAnswerCount} câu bỏ trống được áp dụng 0đ theo quy định.`,
          type: 'success',
        });
      } else if (actualAiGradedCount > 0) {
        setToast({
          message: `AI đã phân tích ${actualAiGradedCount} câu theo Rubric. Đây là điểm đề xuất, chưa phải điểm chính thức.`,
          type: 'success',
        });
      } else {
        setToast({
          message: `${emptyAnswerCount} câu bỏ trống được áp dụng 0đ theo quy định; AI không cần phân tích các câu này.`,
          type: 'success',
        });
      }
    } catch (e: any) {
      setToast({ message: e?.message || 'Có lỗi xảy ra khi thực hiện chấm AI.', type: 'error' });
    } finally {
      setBatchAiLoading(false);
      setAiProgress(null);
    }
  };

  const showResultPopup = (title: string, message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'info') => {
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

    if (hasUnsavedChanges || selected.totalScore === null || selected.totalScore === undefined) {
      setToast({
        message: 'Vui lòng bấm "Lưu điểm" trước khi thực hiện gửi duyệt!',
        type: 'error',
      });
      return;
    }

    const isAdmin = currentUser?.role === 'ADMIN';

    setConfirmModal({
      isOpen: true,
      title: isAdmin ? 'Duyệt bài thi tự luận?' : 'Gửi duyệt bài thi tự luận?',
      message: isAdmin
        ? `Hệ thống sẽ lưu điểm và thực hiện duyệt bài thi cho thí sinh ${selected.student?.fullName}. Bạn có chắc chắn muốn thực hiện?`
        : `Hệ thống sẽ lưu toàn bộ điểm và gửi bài thi của thí sinh ${selected.student?.fullName} tới Ban quản trị để duyệt. Bạn có chắc chắn muốn thực hiện?`,
      type: 'info',
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
            setToast({ message: msg, type: 'success' });
          } else {
            const msg = `Đã lưu toàn bộ điểm và gửi bài thi của thí sinh ${selected.student?.fullName} tới ADMIN duyệt thành công!`;
            setToast({ message: msg, type: 'success' });
          }
          await loadAssignments();
          if (selected?.id) {
            await openAttempt(selected.id);
          }
        } catch (e: any) {
          const errMsg = e?.response?.data?.message || 'Không thể hoàn tất chấm bài.';
          setToast({ message: errMsg, type: 'error' });
        }
      },
    });
  };

  const handlePublishApproved = () => {
    if (!selected || currentUser?.role !== 'ADMIN') return;
    setConfirmModal({
      isOpen: true,
      title: 'Công bố điểm bài thi?',
      message: `Công bố điểm bài thi của ${selected.student?.fullName}. Sinh viên chỉ xem được điểm sau khi ca thi chính thức kết thúc.`,
      type: 'info',
      confirmText: 'Công bố điểm',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/essay/grading/attempts/${selected.id}/publish`);
          setToast({ message: 'Đã công bố điểm. Kết quả sẽ mở cho sinh viên sau giờ kết thúc ca thi.', type: 'success' });
          await loadAssignments();
          await openAttempt(selected.id);
        } catch (e: any) {
          setToast({ message: e?.response?.data?.message || 'Không thể công bố điểm bài thi.', type: 'error' });
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
        const label = `${code}${timeStr ? ` (${timeStr})` : ''} – ${subjName}`;
        map.set(sched.id.toString(), label);
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [rows, dateFilter, subjectFilter]);

  const counts = useMemo(() => {
    let all = 0, notSubmitted = 0, grading = 0, waiting = 0, approved = 0, published = 0;
    rows.forEach((r) => {
      all++;
      if (r.gradingStatus === 'PUBLISHED') published++;
      else if (r.gradingStatus === 'APPROVED') approved++;
      else if (r.gradingStatus === 'WAITING_APPROVAL') waiting++;
      else if (isNotSubmitted(r)) notSubmitted++;
      else grading++;
    });
    return { all, notSubmitted, grading, waiting, approved, published };
  }, [rows, isNotSubmitted]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'NOT_SUBMITTED' && !isNotSubmitted(r)) return false;
        if (statusFilter === 'GRADING' && (isNotSubmitted(r) || r.gradingStatus === 'PUBLISHED' || r.gradingStatus === 'APPROVED' || r.gradingStatus === 'WAITING_APPROVAL')) return false;
        if (statusFilter === 'WAITING_APPROVAL' && r.gradingStatus !== 'WAITING_APPROVAL') return false;
        if (statusFilter === 'APPROVED' && r.gradingStatus !== 'APPROVED') return false;
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

  const liveTotalScore = useMemo(() => {
    if (!selected) return null;
    let sum = 0;
    let hasGradedAny = false;

    (selected.questions || []).forEach((q: any) => {
      if (q.type === 'ESSAY') {
        const qScore = scores[`q_${q.questionId}`];
        if (qScore !== undefined && qScore !== null && !isNaN(Number(qScore))) {
          sum += Number(qScore);
          hasGradedAny = true;
        } else if (Array.isArray(q.rubric) && q.rubric.length > 0) {
          let rubricSum = 0;
          let hasRubric = false;
          q.rubric.forEach((r: any) => {
            const rScore = scores[r.id];
            if (rScore !== undefined && rScore !== null && !isNaN(Number(rScore))) {
              rubricSum += Number(rScore);
              hasRubric = true;
            }
          });
          if (hasRubric) {
            sum += rubricSum;
            hasGradedAny = true;
          }
        }
      } else {
        const objScore = Number(q.earnedScore ?? q.score ?? 0);
        sum += objScore;
      }
    });

    if (hasGradedAny || (selected.totalScore !== null && selected.totalScore !== undefined)) {
      const penalty = Number(selected.penaltyPoints || 0);
      return Math.max(0, Number((sum - penalty).toFixed(2)));
    }
    return selected.totalScore ?? null;
  }, [selected, scores]);

  const isReadOnly = useMemo(() => {
    if (!selected) return false;
    return selected.gradingStatus === 'PUBLISHED'
      || selected.gradingStatus === 'APPROVED'
      || selected.gradingStatus === 'WAITING_APPROVAL';
  }, [selected]);

  return (
    <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      {/* ── 1. Standard Page Header ── */}
      <div className="pb-1 space-y-0.5">
        <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
          Chấm bài tự luận
        </h1>
        <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          Chấm điểm và đánh giá bài làm tự luận của sinh viên theo chuẩn Rubric.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Panel: Attempt List (Collapsible with smooth transition) */}
        <aside
          aria-label="Danh sách bài thi"
          className={`transition-all duration-300 ease-in-out shrink-0 lg:sticky lg:top-4 overflow-hidden ${
            collapseList
              ? 'max-h-0 lg:max-h-none lg:w-0 lg:opacity-0 lg:pointer-events-none lg:-mr-5 hidden lg:block'
              : 'w-full lg:w-[340px] lg:opacity-100'
          }`}
        >
          <div className="w-full lg:w-[340px]">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col">
              {/* Header & Controls Section */}
              <div className="p-3.5 space-y-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
                {/* Header Title */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
                    <h3 className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
                      Danh sách bài thi
                    </h3>
                    <span className="text-type-helper font-medium text-blue-700 dark:text-blue-300 px-2 py-0.5 ui-pill rounded-full border border-blue-200/60 dark:border-blue-800/60 tabular-nums">
                      {filteredRows.length}/{rows.length}
                    </span>
                  </div>

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
                        disabled={loading}
                        className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Đặt lại bộ lọc"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                {/* Search Bar */}
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Tìm mã SV, tên SV, môn..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800/60 rounded-xl pl-9 pr-8 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="Xóa tìm kiếm"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <kbd
                      className="hidden sm:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 h-4 items-center justify-center px-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-normal text-type-helper text-slate-400 select-none cursor-pointer"
                      onClick={() => searchInputRef.current?.focus()}
                      title="Nhấn phím / để tìm nhanh"
                    >
                      /
                    </kbd>
                  )}
                </div>

                {/* Status Tabs with modern Segmented Pills */}
                <TabBar
                  variant="segmented"
                  tabs={[
                    { key: 'ALL', label: 'Tất cả', count: counts.all },
                    { key: 'GRADING', label: 'Đang chấm', count: counts.grading },
                    { key: 'WAITING_APPROVAL', label: 'Chờ duyệt', count: counts.waiting },
                    { key: 'APPROVED', label: 'Đã duyệt', count: counts.approved },
                    { key: 'PUBLISHED', label: 'Công bố', count: counts.published },
                  ]}
                  active={statusFilter}
                  onChange={(key) => setStatusFilter(key as any)}
                />

                {/* Dropdown Filters: Subject & Date/Schedule */}
                <div className="space-y-1.5 pt-0.5">
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

                    {availableSchedules.length > 0 && (
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

              {/* Attempts Flat List (Divider-First & No Nested Card Borders) */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[calc(100vh-380px)] min-h-[380px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-type-helper font-medium text-slate-400 flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Đang tải danh sách bài thi...</span>
                  </div>
                ) : paginatedRows.length === 0 ? (
                  <div className="p-8 text-center text-type-helper font-medium text-slate-400">
                    Không tìm thấy bài thi phù hợp
                  </div>
                ) : (
                  paginatedRows.map((r) => {
                    const isCur = selected?.id === r.id;
                    const notSub = isNotSubmitted(r);
                    const initialChar = r.student?.fullName ? r.student.fullName.trim().charAt(0).toUpperCase() : 'S';

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
                        {/* Row 1: Avatar + Name + Score */}
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-type-helper shrink-0 select-none ${
                                isCur
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {initialChar}
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

              {/* Pagination Controls in Footer */}
              {totalPages > 1 && (
                <div className="p-3 bg-slate-50/40 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-type-helper font-medium text-slate-500 dark:text-slate-400">
                  <span>
                    Trang {page} / {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition"
                      title="Trang trước"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition"
                      title="Trang tiếp theo"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Right Panel: Grading Question Content (Smooth flex-1 auto fill) */}
        <div className="flex-1 min-w-0 space-y-4">
          {!selected ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-12 text-center text-slate-400 text-type-helper font-medium shadow-2xs space-y-3">
              <p>Vui lòng chọn bài thi từ danh sách bên trái để chấm điểm.</p>
              {collapseList && (
                <div className="pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setCollapseList(false)}
                  >
                    Mở danh sách bài thi
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5 space-y-5 shadow-2xs">
              {/* Header Information & Fast Student Navigation */}
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
                      <span>Mã SV:</span><IdentifierBadge tone="neutral">{selected.student?.studentCode}</IdentifierBadge>
                      <span>(<strong className="text-slate-800 dark:text-slate-200">{selected.onlineExamConfig?.examSchedule?.subject?.subjectName || selected.subjectName || 'Môn thi'}</strong>)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <div className="text-right w-[115px] min-w-[115px] max-w-[115px] shrink-0">
                    <span className="text-type-section tabular-nums font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {liveTotalScore !== null && liveTotalScore !== undefined
                        ? (Number(liveTotalScore) || 0).toFixed(2)
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

                  {/* Actions & Quick Student Navigation */}
                  <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
                    {!isNotSubmitted(selected) && !selected.isVirtual && (
                      isReadOnly ? (
                        selected.gradingStatus === 'PUBLISHED' ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-700/80 text-emerald-800 dark:text-emerald-300 text-type-helper font-medium select-none shadow-2xs">
                            <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Đã công bố (Khóa điểm)</span>
                          </div>
                        ) : selected.gradingStatus === 'APPROVED' ? (
                          <div className="flex items-center gap-2">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50/70 dark:bg-blue-950/40 border border-blue-300/80 dark:border-blue-700/80 text-blue-800 dark:text-blue-300 text-type-helper font-medium select-none shadow-2xs">
                              <Lock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span>Đã duyệt nội bộ</span>
                            </div>
                            {currentUser?.role === 'ADMIN' && (
                              <Button type="button" variant="primary" size="sm" onClick={handlePublishApproved} leftIcon={<Send className="w-3.5 h-3.5" />}>
                                Công bố điểm
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50/70 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/80 text-amber-800 dark:text-amber-300 text-type-helper font-medium select-none shadow-2xs">
                            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>Đang chờ Admin duyệt</span>
                          </div>
                        )
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={batchAiLoading || saving}
                            onClick={handleAiGradeCurrentStudent}
                            className={`relative overflow-hidden inline-flex items-center justify-center h-9 w-[124px] min-w-[124px] rounded-xl font-semibold text-type-body transition-colors duration-300 select-none disabled:cursor-not-allowed shadow-2xs cursor-pointer ${
                              batchAiLoading
                                ? 'bg-blue-100/90 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700/80 text-blue-800 dark:text-blue-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200/90 active:bg-blue-300/80 dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-800/60'
                            }`}
                            title="AI phân tích bài làm của sinh viên và tự động điền điểm gợi ý theo từng tiêu chí Rubric"
                          >
                            {/* Thanh tiến trình load chạy trực tiếp bên trong nền nút */}
                            {batchAiLoading && aiProgress && (
                              <span
                                className="absolute inset-y-0 left-0 bg-blue-500/25 dark:bg-blue-500/35 transition-all duration-300 ease-out pointer-events-none"
                                style={{ width: `${Math.max(6, aiProgress.percent)}%` }}
                              />
                            )}

                            <span className="relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap tabular-nums">
                              {batchAiLoading && aiProgress ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin text-blue-700 dark:text-blue-200" />
                                  <span>{aiProgress.percent}%</span>
                                </>
                              ) : (
                                <span>Chấm mẫu AI</span>
                              )}
                            </span>
                          </button>
                          <Button
                            variant={hasUnsavedChanges ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={handleSaveAllClick}
                            disabled={batchAiLoading || saving}
                            isLoading={saving}
                            className="transition-colors duration-300"
                            title="Lưu tất cả điểm vừa nhập"
                          >
                            {saving ? 'Đang lưu...' : hasUnsavedChanges ? 'Lưu điểm *' : 'Lưu điểm'}
                          </Button>
                          <Button
                            variant={hasUnsavedChanges ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={handleCompleteGrading}
                            disabled={
                              batchAiLoading ||
                              saving ||
                              hasUnsavedChanges ||
                              selected.totalScore === null ||
                              selected.totalScore === undefined
                            }
                            title={
                              hasUnsavedChanges
                                ? 'Vui lòng bấm Lưu điểm trước khi gửi duyệt'
                                : selected.totalScore === null || selected.totalScore === undefined
                                  ? 'Bài thi chưa được lưu điểm. Vui lòng bấm Lưu điểm trước.'
                                  : currentUser?.role === 'ADMIN'
                                    ? 'Duyệt bài thi tự luận'
                                    : 'Gửi bài thi tới Admin duyệt'
                            }
                          >
                            {currentUser?.role === 'ADMIN' ? 'Duyệt bài' : 'Gửi duyệt'}
                          </Button>
                        </>
                      )
                    )}

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

              {/* Essay Questions List or Unsubmitted Empty State */}
              {isNotSubmitted(selected) || selected.isVirtual || !(selected.questions || []).filter((q: any) => q.type === 'ESSAY').length ? (
                <div className="py-14 px-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-center space-y-4 my-2">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto shadow-2xs">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-type-body font-semibold text-slate-800 dark:text-slate-200">
                      {!(selected.questions || []).filter((q: any) => q.type === 'ESSAY').length && !isNotSubmitted(selected)
                        ? 'Đề thi trắc nghiệm / tự động chấm'
                        : 'Thí sinh chưa nộp bài hoặc chưa làm bài tự luận'}
                    </h3>
                    <p className="text-type-body-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed font-normal">
                      {!(selected.questions || []).filter((q: any) => q.type === 'ESSAY').length && !isNotSubmitted(selected)
                        ? 'Đề thi này không có câu hỏi tự luận nào cần chấm thủ công. Điểm số trắc nghiệm đã được hệ thống tự động tính toán.'
                        : `Sinh viên ${selected.student?.fullName || ''} (mã SV: ${selected.student?.studentCode || ''}) chưa gửi bài làm tự luận để thực hiện chấm điểm.`}
                    </p>
                  </div>

                  {currentIndex >= 0 && currentIndex < filteredRows.length - 1 && (
                    <div className="pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleNextStudent}
                      >
                        <span>Chuyển sang bài tiếp theo</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6 pt-2">
                  {(selected.questions || []).filter((q: any) => q.type === 'ESSAY').map((q: any, idx: number) => {
                    const ans = (selected.attemptAnswers || []).find((a: any) => a.questionId === q.questionId);
                    const currentScore = (q.rubric || []).length > 0
                      ? (q.rubric || []).reduce((acc: number, r: any) => acc + Number(scores[r.id] ?? 0), 0)
                      : (scores[`q_${q.questionId}`] ?? (ans?.finalScore ?? 0));
                    const isBeingGradedByAi = batchAiLoading && aiProgress && (aiProgress.current === idx);

                    return (
                      <div
                        key={q.questionId || idx}
                        className={`rounded-2xl border p-5 bg-white dark:bg-slate-900/90 shadow-2xs space-y-4 transition duration-200 ${
                          isBeingGradedByAi
                            ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/30 shadow-md'
                            : 'border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {/* Question Header & Action */}
                        <div className="flex justify-between items-start gap-4 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                          <div className="flex items-start gap-2.5 flex-1 flex-wrap">
                            <span className="px-2.5 py-1 ui-pill rounded-full text-blue-700 dark:text-blue-300 text-type-helper font-medium border border-blue-200 dark:border-blue-800/80 shrink-0 select-none">
                              Câu {idx + 1}
                            </span>
                            {isBeingGradedByAi && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ui-pill text-type-helper font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 animate-pulse">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>AI đang phân tích câu này...</span>
                              </span>
                            )}
                            <div className="text-type-body font-semibold text-slate-900 dark:text-slate-100 leading-snug w-full pt-0.5">
                              {q.content}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setViewingRubricQuestion({ ...q, id: q.questionId, code: `Câu ${idx + 1}` })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-type-helper font-semibold hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer shadow-2xs"
                              title="Xem đáp án mẫu và tiêu chuẩn chấm Rubric của câu này"
                            >
                              <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                              <span>Xem Rubric & Đáp án</span>
                            </button>
                            <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold tabular-nums text-type-body-sm text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700">
                              {currentScore} <span className="text-type-helper font-normal text-slate-400">/ {q.score}đ</span>
                            </span>
                          </div>
                        </div>

                        {/* Media đính kèm câu hỏi (Ảnh / Video / Audio) */}
                        {Array.isArray(q.media) && q.media.length > 0 && (
                          <div className="flex flex-wrap gap-3 pt-1">
                            {q.media.map((mediaItem: any, mIdx: number) => {
                              const fullUrl = getImageUrl(mediaItem.url);
                              const mime: string = mediaItem.mimeType || '';
                              const isVid = mime.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(mediaItem.url);
                              const isAud = mime.startsWith('audio/') || /\.(mp3|wav|ogg)$/i.test(mediaItem.url);

                              if (isVid) {
                                return (
                                  <div key={mediaItem.id || mIdx} className="w-full max-w-lg">
                                    <QuestionMediaPlayer
                                      src={fullUrl}
                                      type="video"
                                      fileName={mediaItem.fileName}
                                      maxPlays={0}
                                      mode="REFERENCE"
                                    />
                                  </div>
                                );
                              }

                              if (isAud) {
                                return (
                                  <div key={mediaItem.id || mIdx} className="w-full max-w-lg">
                                    <QuestionMediaPlayer
                                      src={fullUrl}
                                      type="audio"
                                      fileName={mediaItem.fileName}
                                      maxPlays={0}
                                      mode="REFERENCE"
                                    />
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={mediaItem.id || mIdx}
                                  onClick={() => setLightboxUrl(mediaItem.url)}
                                  className="group relative inline-block cursor-pointer overflow-hidden rounded-xl bg-transparent transition hover:opacity-95"
                                  title="Bấm để xem ảnh phóng to"
                                >
                                  <DynamicImage
                                    src={fullUrl}
                                    alt={mediaItem.altText || mediaItem.fileName || 'Hình minh họa'}
                                    className="max-h-52 rounded-xl object-contain bg-white transition duration-200 group-hover:scale-105"
                                  />
                                  <div className="absolute top-2 right-2 flex items-center justify-center p-1.5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-0 transition-all duration-150 group-hover:opacity-100 hover:scale-125 active:scale-95 pointer-events-none" title="Bấm để xem ảnh phóng to">
                                    <Maximize2 className="h-4.5 w-4.5 text-white" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

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

                        {/* Attachment Files */}
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
                        {q.rubric?.length > 0 ? (
                          <div className="space-y-2.5 pt-1">
                            <div className="text-type-helper font-semibold text-slate-600 dark:text-slate-400 tracking-wide flex items-center justify-between">
                              <span>Tiêu chí chấm Rubric ({q.rubric.length}):</span>
                            </div>
                            <div className="space-y-2.5">
                              {q.rubric.map((r: any) => (
                                <div
                                  key={r.id}
                                  className="bg-slate-50/40 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5 shadow-2xs"
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
                                    <input
                                      type="number"
                                      step={0.25}
                                      min={0}
                                      max={r.maxScore}
                                      placeholder="Điểm"
                                      value={scores[r.id] ?? 0}
                                      disabled={isReadOnly}
                                      readOnly={isReadOnly}
                                      onChange={(e) => handleScoreChange(r.id, e.target.value, r.maxScore)}
                                      className="w-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-center text-type-body font-semibold tabular-nums text-blue-600 dark:text-blue-400 focus:border-blue-500 focus:outline-none shadow-2xs disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed"
                                    />

                                    {/* Quick Score Chips */}
                                    <div className="flex gap-1 items-center flex-wrap">
                                      {[0, Number((r.maxScore * 0.5).toFixed(2)), Number((r.maxScore * 0.75).toFixed(2)), r.maxScore].map((presetVal) => (
                                        <button
                                          key={presetVal}
                                          type="button"
                                          disabled={isReadOnly}
                                          onClick={() => handleScoreChange(r.id, String(presetVal), r.maxScore)}
                                          className={`px-2.5 py-1 rounded-xl text-type-helper font-semibold border transition select-none ${
                                            scores[r.id] === presetVal
                                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                          } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                        >
                                          {presetVal === r.maxScore ? `Max (${presetVal}đ)` : `${presetVal}đ`}
                                        </button>
                                      ))}
                                    </div>

                                    <input
                                      type="text"
                                      placeholder="Nhận xét tiêu chí..."
                                      value={comments[r.id] || ''}
                                      disabled={isReadOnly}
                                      readOnly={isReadOnly}
                                      onChange={(e) => {
                                        setComments((prev) => ({ ...prev, [r.id]: e.target.value }));
                                        setHasUnsavedChanges(true);
                                      }}
                                      className="flex-1 min-w-[200px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-type-body font-normal text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none shadow-2xs disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed"
                                    />
                                  </div>

                                  {aiEvidence[r.id] && (
                                    <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-type-helper leading-relaxed text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100 mt-1">
                                      <span className="font-semibold text-blue-700 dark:text-blue-300">Minh chứng AI: </span>
                                      {aiEvidence[r.id]}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-50/40 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5 shadow-2xs">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="font-semibold text-type-body-sm text-slate-900 dark:text-slate-100">Chấm điểm câu hỏi</span>
                                <p className="text-type-helper text-slate-500 mt-0.5 font-normal leading-relaxed">Nhập điểm cho câu tự luận này</p>
                              </div>
                              <span className="tabular-nums text-type-helper font-medium text-slate-500 shrink-0 px-2 py-0.5 ui-pill rounded-full border border-slate-200/60 dark:border-slate-700">
                                Tối đa {q.score}đ
                              </span>
                            </div>

                            <div className="flex gap-2 items-center flex-wrap pt-1">
                              <input
                                type="number"
                                step={0.25}
                                min={0}
                                max={q.score}
                                placeholder="Điểm"
                                value={scores[`q_${q.questionId}`] ?? (ans?.finalScore ?? 0)}
                                disabled={isReadOnly}
                                readOnly={isReadOnly}
                                onChange={(e) => handleScoreChange(`q_${q.questionId}`, e.target.value, q.score)}
                                className="w-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-center text-type-body font-semibold tabular-nums text-blue-600 dark:text-blue-400 focus:border-blue-500 focus:outline-none shadow-2xs disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed"
                              />

                              {/* Quick Score Chips */}
                              <div className="flex gap-1 items-center flex-wrap">
                                {[0, Number((q.score * 0.5).toFixed(2)), Number((q.score * 0.75).toFixed(2)), q.score].map((presetVal) => (
                                  <button
                                    key={presetVal}
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => handleScoreChange(`q_${q.questionId}`, String(presetVal), q.score)}
                                    className={`px-2.5 py-1 rounded-xl text-type-helper font-semibold border transition select-none ${
                                      (scores[`q_${q.questionId}`] ?? ans?.finalScore) === presetVal
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                    } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                  >
                                    {presetVal === q.score ? `Max (${presetVal}đ)` : `${presetVal}đ`}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Overall Teacher Comment */}
                        <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <label className="text-type-body font-medium text-slate-600 dark:text-slate-400">Nhận xét tổng quát cho câu này:</label>
                          <input
                            type="text"
                            placeholder="Nhập nhận xét tổng quát cho câu tự luận này..."
                            value={teacherComments[q.questionId] || ''}
                            disabled={isReadOnly}
                            readOnly={isReadOnly}
                            onChange={(e) => {
                              setTeacherComments((prev) => ({ ...prev, [q.questionId]: e.target.value }));
                              setHasUnsavedChanges(true);
                            }}
                            className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-type-body font-normal text-slate-800 dark:text-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none shadow-2xs"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
        subtitle={profileCandidate?.student?.studentCode || ''}
        avatarText={profileCandidate?.student?.fullName?.trim().split(' ').pop()?.slice(0, 2)?.toUpperCase() || 'SV'}
        badge={{
          label: profileCandidate?.gradingStatus === 'PUBLISHED'
            ? 'Đã công bố'
            : profileCandidate?.gradingStatus === 'WAITING_APPROVAL'
            ? 'Chờ duyệt'
            : profileCandidate?.gradingStatus === 'GRADING'
            ? 'Đang chấm'
            : 'Chưa làm',
          status: profileCandidate?.gradingStatus || 'NOT_SUBMITTED',
        }}
        details={[
          { label: 'Họ và tên thí sinh', value: profileCandidate?.student?.fullName || '---' },
          { label: 'Mã số sinh viên', value: <IdentifierBadge tone="blue">{profileCandidate?.student?.studentCode || '---'}</IdentifierBadge> },
          { label: 'Email sinh viên', value: profileCandidate?.student?.email || 'Chưa cập nhật' },
          { label: 'Môn thi', value: profileCandidate?.onlineExamConfig?.examSchedule?.subject?.subjectName || profileCandidate?.subjectName || '---' },
          { label: 'Mã học phần', value: <IdentifierBadge tone="neutral">{profileCandidate?.onlineExamConfig?.examSchedule?.subject?.subjectCode || profileCandidate?.subjectCode || '---'}</IdentifierBadge> },
          { label: 'Trạng thái chấm bài', value: <StatusBadge status={profileCandidate?.gradingStatus || 'NOT_SUBMITTED'} /> },
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
            value: profileCandidate?.penaltyPoints > 0 ? (
              <span className="text-type-body font-semibold text-rose-600">
                -{profileCandidate.penaltyPoints} điểm ({profileCandidate.penaltyReason || 'Vi phạm quy chế'})
              </span>
            ) : (
              'Không có điểm phạt'
            ),
          },
          {
            label: 'Thời gian bắt đầu làm',
            value: profileCandidate?.startedAt
              ? new Date(profileCandidate.startedAt).toLocaleString('vi-VN')
              : '---',
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
                  Bài thi được cấu hình trong hệ thống khảo thí trực tuyến. Giảng viên phụ trách chấm các câu hỏi tự luận theo biểu điểm Rubric chuẩn xác.
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
                    Mở không gian chấm bài
                  </Button>
                </div>
              </div>
            ),
          },
        ]}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {lightboxUrl && (
        <ImageLightboxModal
          imageUrl={lightboxUrl}
          onClose={() => setLightboxUrl(null)}
        />
      )}
    </main>
  );
}

export default function TeacherEssayGradingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px] text-type-helper font-semibold text-slate-500">Đang tải trang chấm bài tự luận...</div>}>
      <TeacherEssayGradingContent />
    </Suspense>
  );
}
