'use client';

import React, { FormEvent, useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { exportToFormattedExcel } from '../../lib/export-excel';
import { exportExamPaperToWord } from '../../lib/export-docx';
import { printReport, getPublishedTemplatesMap } from '../../lib/export-print';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Button } from '../../components/ui/Button';
import { IdentifierBadge } from '../../components/ui/IdentifierBadge';
import { CriticalConfirmModal, CriticalConfirmPayload } from '../../components/CriticalConfirmModal';
import { ExamPaper, ExamSchedule, User } from '../../types';
import { Search, X, ChevronDown, Download, KeyRound, Printer, Eye, HelpCircle, CheckCircle2, Award, RotateCcw, RefreshCw, Trash2, Send, Archive, FileText } from 'lucide-react';

import { ExamPaperHeader } from '../../components/exam-papers/ExamPaperHeader';
import { ExamPaperKPICards } from '../../components/exam-papers/ExamPaperKPICards';
import { ExamPaperMatrixForm, ExamPaperMatrixFormData } from '../../components/exam-papers/ExamPaperMatrixForm';
import { ExamPaperFilterPopover } from '../../components/exam-papers/ExamPaperFilterPopover';
import { ExamPaperTableToolbar } from '../../components/exam-papers/ExamPaperTableToolbar';
import { ExamPaperTable, getPaperCodeRange } from '../../components/exam-papers/ExamPaperTable';
import { ChangeExamPasswordModal } from '../../components/exam-papers/ChangeExamPasswordModal';
import { RubricDialog } from '../../components/question-bank/RubricDialog';
import { TabBar } from '../../components/ui/TabBar';
import { ExamPaperPaginationBar } from '../../components/exam-papers/ExamPaperPaginationBar';
import { ExamPaperBulkAction } from '../../components/exam-papers/ExamPaperBulkAction';
import { ExamPaperDetailDrawer } from '../../components/exam-papers/ExamPaperDetailDrawer';
import { ExamPaperExportModal } from '../../components/exam-papers/ExamPaperExportModal';
import { ExamPaperExportData } from '../../lib/export-docx';
import { PageSkeleton } from '../../components/ui/Skeleton';

function formatPaperForExport(paper: any) {
  const details = paper.details || paper.questions || paper.paperDetails || [];
  const subjectName = paper.subjectName || paper.examSchedule?.subjectName || paper.examSchedule?.subject?.subjectName || 'Môn thi';
  const subjectCode = paper.subjectCode || paper.examSchedule?.subjectCode || paper.examSchedule?.subject?.subjectCode || 'MH';

  // Trích xuất số mã đảo từ tiêu đề (VD: Bộ 3 mã đảo) hoặc thuộc tính variantCount
  const match = (paper.title || '').match(/Bộ\s*(\d+)\s*mã/i);
  const variantCount = match ? parseInt(match[1], 10) : ((paper as any).variantCount || 3);

  return {
    paperCode: paper.paperCode,
    title: `ĐỀ THI MÔN ${subjectName.toUpperCase()}`,
    subjectName,
    subjectCode,
    durationMinutes: paper.durationMinutes,
    variantCount,
    examType: paper.examSchedule?.examType || (paper as any).examType || 'TRAC_NGHIEM',
    totalScore: paper.totalScore,
    questions: details.map((d: any, idx: number) => {
      const q = d.question || d;
      const choices = Array.isArray(q.options) && q.options.length ? q.options.map((option: any, optionIndex: number) => ({ label: option.label || String.fromCharCode(65 + optionIndex), content: option.content || '', isCorrect: Boolean(option.isCorrect) })) : [
        { label: 'A', content: q.optionA, isCorrect: q.correctAnswer === 'A' },
        { label: 'B', content: q.optionB, isCorrect: q.correctAnswer === 'B' },
        { label: 'C', content: q.optionC, isCorrect: q.correctAnswer === 'C' },
        { label: 'D', content: q.optionD, isCorrect: q.correctAnswer === 'D' },
      ].filter((c) => c.content);

      return {
        order: idx + 1,
        code: q.code || `Q${idx + 1}`,
        content: q.content || '',
        score: d.score || 0.25,
        type: q.type || 'SINGLE_CHOICE',
        fillBlankAnswers: q.fillBlankAnswers || (q as any).answers || [],
        correctAnswer: q.correctAnswer || q.sampleAnswer || q.answer || '',
        options: choices,
        explanation: q.explanation || '',
      };
    }),
  };
}

function questionChoices(q: any) {
  let opts = q.options;
  if (typeof opts === 'string') {
    try {
      opts = JSON.parse(opts);
    } catch {
      opts = [];
    }
  }
  if (Array.isArray(opts) && opts.length > 0) {
    return opts
      .map((option: any, index: number) => ({
        label: option.label || String.fromCharCode(65 + index),
        text: option.content || option.text || option.answer || '',
        isCorrect: Boolean(option.isCorrect),
      }))
      .filter((option: any) => option.text);
  }
  return [
    { label: 'A', text: q.optionA, isCorrect: q.correctAnswer === 'A' },
    { label: 'B', text: q.optionB, isCorrect: q.correctAnswer === 'B' },
    { label: 'C', text: q.optionC, isCorrect: q.correctAnswer === 'C' },
    { label: 'D', text: q.optionD, isCorrect: q.correctAnswer === 'D' },
  ].filter((option) => option.text);
}

const initialForm: ExamPaperMatrixFormData = {
  examScheduleId: '',
  paperCode: '101',
  durationMinutes: '60',
  easyCount: '16',
  mediumCount: '16',
  hardCount: '8',
  variantCount: '1',
  examType: 'TRAC_NGHIEM',
  selectionMode: 'BY_COUNT',
  easyScore: '3',
  mediumScore: '4',
  hardScore: '3',
};

let _papersCache: {
  schedules: ExamSchedule[];
  papers: ExamPaper[];
  defaultScheduleId: string;
} | null = null;

export default function ExamPapersPage() {
  usePageTitle('Quản lý đề thi');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>(_papersCache?.schedules ?? []);
  const [papers, setPapers] = useState<ExamPaper[]>(_papersCache?.papers ?? []);
  const [formData, setFormData] = useState<ExamPaperMatrixFormData>(() => ({
    ...initialForm,
    examScheduleId: _papersCache?.defaultScheduleId || '',
  }));
  const [selectedPaper, setSelectedPaper] = useState<ExamPaper | null>(null);
  const [drawerOpenPaper, setDrawerOpenPaper] = useState<ExamPaper | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    if (selectedPaper) {
      setDrawerOpenPaper(selectedPaper);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDrawerVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setDrawerVisible(false);
      const timer = setTimeout(() => {
        setDrawerOpenPaper(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedPaper]);

  const [showAnswers, setShowAnswers] = useState(false);
  const [loading, setLoading] = useState(!_papersCache);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [exportModalPaper, setExportModalPaper] = useState<ExamPaperExportData | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');

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

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortOrder, setSortOrder] = useState('newest');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    paperCode: true,
    subjectName: true,
    status: true,
    questionCount: true,
    durationMinutes: true,
    totalScore: true,
  });

  const handleColumnToggle = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [selected, setSelected] = useState<number[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Change Exam Password Modal State
  const [changePasswordModal, setChangePasswordModal] = useState<{
    isOpen: boolean;
    paper: ExamPaper | null;
  }>({ isOpen: false, paper: null });

  const handleChangePasswordSubmit = async (paperId: number, newPassword: string, reason?: string) => {
    await api.patch(`/exam-papers/${paperId}/password`, { newPassword, reason });
    setToast({ message: 'Đã cập nhật mật khẩu ca thi thành công!', type: 'success' });
    fetchData();
  };

  // Rubric Modal State
  const [rubricQuestion, setRubricQuestion] = useState<{ id: number; code?: string; content?: string; score?: number } | null>(null);
  const [swapModal, setSwapModal] = useState<{
    isOpen: boolean;
    questionIndex: number | null;
    targetQuestion: any;
    alternatives: any[];
    loading: boolean;
  }>({
    isOpen: false,
    questionIndex: null,
    targetQuestion: null,
    alternatives: [],
    loading: false,
  });

  const openSwapModal = async (questionIndex: number, targetQuestion: any) => {
    setSwapModal({
      isOpen: true,
      questionIndex,
      targetQuestion,
      alternatives: [],
      loading: true,
    });

    try {
      const subjectId =
        (drawerOpenPaper as any)?.subjectId ||
        (drawerOpenPaper?.examSchedule as any)?.subjectId ||
        (drawerOpenPaper?.examSchedule?.subject as any)?.id;

      const params: any = {
        limit: 20,
        status: 'APPROVED',
      };
      if (subjectId) params.subjectId = Number(subjectId);
      if (targetQuestion.type) params.type = targetQuestion.type;
      if (targetQuestion.difficulty) params.difficulty = targetQuestion.difficulty;

      const response = await api.get('/questions', { params });

      const rawList = Array.isArray(response.data) ? response.data : response.data?.data || [];
      const list = rawList.filter(
        (q: any) => q.id !== targetQuestion.id && q.id !== targetQuestion.questionId
      );

      setSwapModal((prev) => ({
        ...prev,
        alternatives: list,
        loading: false,
      }));
    } catch (error: any) {
      setToast({ message: 'Không thể tải danh sách câu hỏi thay thế từ Ngân hàng đề.', type: 'error' });
      setSwapModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleSelectSwapQuestion = (newQ: any) => {
    if (swapModal.questionIndex === null || !selectedPaper) return;
    const qIndex = swapModal.questionIndex;

    setConfirmModal({
      isOpen: true,
      title: 'Đổi câu hỏi trong đề?',
      message: (
        <div className="space-y-1">
          <p className="text-type-body-sm font-medium text-slate-800 dark:text-slate-200">
            Thay thế: <span className="font-semibold text-slate-950 dark:text-white">Câu #{qIndex + 1}</span> bằng câu hỏi mới từ ngân hàng.
          </p>
          <p className="text-type-helper text-slate-500 dark:text-slate-400">
            Câu hỏi hiện tại trong đề sẽ được cập nhật sang nội dung mới.
          </p>
        </div>
      ),
      type: 'info',
      confirmText: 'Đổi câu hỏi',
      cancelText: 'Hủy bỏ',
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        const updatedPaper = { ...selectedPaper };
        const details = [...((updatedPaper as any).details || updatedPaper.questions || [])];

        if (details[qIndex]) {
          if (details[qIndex].question) {
            details[qIndex] = {
              ...details[qIndex],
              question: newQ,
              questionId: newQ.id,
            };
          } else {
            details[qIndex] = newQ;
          }
        }

        (updatedPaper as any).details = details;
        setSelectedPaper(updatedPaper);
        setSwapModal({ isOpen: false, questionIndex: null, targetQuestion: null, alternatives: [], loading: false });
        setToast({ message: `Đã thay câu #${qIndex + 1} bằng câu hỏi mới.`, type: 'success' });
      },
    });
  };
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    type: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => { },
  });

  const [criticalModal, setCriticalModal] = useState<{
    isOpen: boolean;
    paper: ExamPaper | null;
  }>({
    isOpen: false,
    paper: null,
  });

  const fetchData = useCallback(async (silent = false) => {
    if (!silent && !papers.length && !_papersCache) setLoading(true);
    try {
      const [scheduleResponse, paperResponse] = await Promise.all([
        api.get<ExamSchedule[]>('/exam-schedules'),
        api.get<ExamPaper[]>('/exam-papers'),
      ]);
      const allSchedules = scheduleResponse.data || [];
      const allPapers = paperResponse.data || [];
      setSchedules(allSchedules);
      setPapers(allPapers);

      // Phân loại ca thi chưa có đề và chưa quá hạn
      const isScheduleExpired = (s: any) => {
        if (['COMPLETED', 'CANCELLED', 'LOCKED'].includes(s?.status)) return true;
        if (!s?.examDate) return false;
        try {
          const scheduleEnd = new Date(s.examDate);
          if (s.endTime) {
            const [h, m] = s.endTime.split(':').map(Number);
            scheduleEnd.setHours(h || 23, m || 59, 0, 0);
          } else {
            scheduleEnd.setHours(23, 59, 59, 999);
          }
          return scheduleEnd.getTime() < Date.now();
        } catch {
          return false;
        }
      };

      const hasPaper = (s: any) => {
        if (s?.hasPublishedPaper) return true;
        if (typeof s?.paperCount === 'number' && s.paperCount > 0) return true;
        if (Array.isArray(s?.examPapers) && s.examPapers.length > 0) return true;
        return false;
      };

      // Sắp xếp giảm dần theo ID để lấy ca thi mới tạo nhất lên đầu
      const sortedSchedules = [...allSchedules].sort((a: any, b: any) => (Number(b.id) || 0) - (Number(a.id) || 0));
      const newestPending = sortedSchedules.find((s: any) => !hasPaper(s) && !isScheduleExpired(s));
      const defaultSchedule = newestPending || sortedSchedules[0];
      const defaultScheduleId = String(defaultSchedule?.id || '');

      _papersCache = {
        schedules: allSchedules,
        papers: allPapers,
        defaultScheduleId,
      };

      setFormData((previous) => ({
        ...previous,
        examScheduleId: previous.examScheduleId || defaultScheduleId,
      }));
      return true;
    } catch (error: any) {
      if (!silent) {
        setToast({ message: error.message || 'Không tải được dữ liệu đề thi.', type: 'error' });
      }
      return false;
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = getAuthUser();
    if (!user) return void router.replace('/login');
    if (!['ADMIN', 'TEACHER'].includes(user.role)) {
      return void router.replace('/student/exam-schedule');
    }
    setCurrentUser(user);
    if (_papersCache) {
      void fetchData(true);
    } else {
      void fetchData(false);
    }
  }, [fetchData, router]);

  const handleRefresh = async () => {
    if (await fetchData()) setToast({ message: 'Đã cập nhật và làm mới dữ liệu mới nhất!', type: 'success' });
  };

  const kpiData = useMemo(() => {
    const total = papers.length;
    const publishedCount = papers.filter((p) => p.status === 'PUBLISHED').length;
    const draftCount = papers.filter((p) => p.status === 'DRAFT').length;
    const archivedCount = papers.filter((p) => p.status === 'ARCHIVED').length;
    const totalQuestionsInPapers = papers.reduce(
      (acc, curr) => acc + ((curr as any)._count?.questions ?? (curr as any).questionCount ?? (curr as any).questions?.length ?? (curr as any).details?.length ?? 0),
      0,
    );

    return {
      total,
      publishedCount,
      draftCount,
      archivedCount,
      totalQuestionsInPapers,
    };
  }, [papers]);

  const selectedSchedule = schedules.find((schedule) => String(schedule.id) === formData.examScheduleId);
  // isEssay is now driven by formData.examType (user-selected toggle)
  const isEssay = formData.examType === 'TU_LUAN';

  useEffect(() => {
    const scheduleType = selectedSchedule?.examType;
    if (!selectedSchedule?.id) return;

    // Tự động tìm mã đề khả dụng tiếp theo (101, 102, 103...) cho lịch thi được chọn
    const existingCodes = papers
      .filter((p) => String(p.examScheduleId || (p.examSchedule as any)?.id) === String(selectedSchedule.id))
      .map((p) => p.paperCode);

    let nextCodeNum = 101;
    while (existingCodes.includes(String(nextCodeNum))) {
      nextCodeNum += 1;
    }

    setFormData((previous) => {
      const nextType = scheduleType || previous.examType;
      return nextType === 'TU_LUAN'
        ? { ...previous, paperCode: String(nextCodeNum), examType: nextType, easyCount: '3', mediumCount: '2', hardCount: '0' }
        : { ...previous, paperCode: String(nextCodeNum), examType: nextType, easyCount: '16', mediumCount: '16', hardCount: '8' };
    });
  }, [selectedSchedule?.examType, selectedSchedule?.id, papers]);

  const scheduleDuration = selectedSchedule
    ? (() => {
      const [startHour, startMinute] = selectedSchedule.startTime.split(':').map(Number);
      const [endHour, endMinute] = selectedSchedule.endTime.split(':').map(Number);
      return endHour * 60 + endMinute - (startHour * 60 + startMinute);
    })()
    : 0;

  useEffect(() => {
    if (scheduleDuration > 0 && Number(formData.durationMinutes) > scheduleDuration) {
      setFormData((previous: any) => ({ ...previous, durationMinutes: String(scheduleDuration) }));
    }
  }, [scheduleDuration, formData.durationMinutes]);

  const handleDurationChange = (duration: string) => {
    if (duration === '60') {
      setFormData((previous) => ({
        ...previous,
        durationMinutes: '60',
        easyCount: '16',
        mediumCount: '16',
        hardCount: '8',
      }));
    } else if (duration === '90') {
      setFormData((previous) => ({
        ...previous,
        durationMinutes: '90',
        easyCount: '24',
        mediumCount: '24',
        hardCount: '12',
      }));
    } else {
      setFormData((previous) => ({ ...previous, durationMinutes: duration }));
    }
  };

  const currentTotal =
    Number(formData.easyCount) + Number(formData.mediumCount) + Number(formData.hardCount);
  // requiredTotal is now a HINT only — not enforced
  const requiredTotal = isEssay ? 0 : Number(formData.durationMinutes) === 60 ? 40 : Number(formData.durationMinutes) === 90 ? 60 : 0;
  const isValidTotal = currentTotal >= 1;

  const isByScoreMode = formData.selectionMode === 'BY_SCORE';
  const currentTotalScore = (Number(formData.easyScore) || 0) + (Number(formData.mediumScore) || 0) + (Number(formData.hardScore) || 0);

  const createPaper = async (event: FormEvent) => {
    event.preventDefault();
    if (!formData.examScheduleId || (!isByScoreMode && currentTotal < 1) || (isByScoreMode && currentTotalScore <= 0)) {
      setToast({ message: 'Hãy chọn lịch thi và nhập ma trận phân bổ phù hợp.', type: 'error' });
      return;
    }

    const variantCount = Number(formData.variantCount) || 1;
    setCreating(true);

    try {
      const payload = {
        examScheduleId: Number(formData.examScheduleId),
        paperCode: formData.paperCode.trim(),
        durationMinutes: Number(formData.durationMinutes),
        easyCount: Number(formData.easyCount) || 0,
        mediumCount: Number(formData.mediumCount) || 0,
        hardCount: Number(formData.hardCount) || 0,
        variantCount,
        examType: formData.examType || 'TRAC_NGHIEM',
        selectionMode: formData.selectionMode || 'BY_COUNT',
        easyScore: Number(formData.easyScore) || 0,
        mediumScore: Number(formData.mediumScore) || 0,
        hardScore: Number(formData.hardScore) || 0,
        mediaMode: formData.mediaMode || (formData.mediaMaxPlays === '0' ? 'REFERENCE' : 'STRICT_EXAM'),
        mediaMaxPlays: Number(formData.mediaMaxPlays ?? 2),
      };

      const preview = await api.post<any>('/exam-papers/preview-random', payload);
      if (preview.data.isValid === false) {
        setToast({ message: preview.data.message || 'Không đủ câu hỏi theo ma trận.', type: 'error' });
        return;
      }

      const paperCode = preview.data.paper?.paperCode || payload.paperCode;
      const questionCount = preview.data.paper?.questionCount || (payload.easyCount + payload.mediumCount + payload.hardCount);
      const totalScore = preview.data.paper?.totalScore ?? (questionCount * 0.25);

      setConfirmModal({
        isOpen: true,
        title: 'Tạo đề thi mới?',
        message: (
          <div className="space-y-1">
            <p className="text-type-body-sm font-medium text-slate-800 dark:text-slate-200">
              Sinh đề thi: <span className="font-semibold text-slate-950 dark:text-white">#{paperCode}</span> ({questionCount} câu hỏi, {totalScore} điểm)
            </p>
            <p className="text-type-helper text-slate-500 dark:text-slate-400">
              Đề thi sẽ được lưu ở trạng thái bản nháp để bạn có thể xem lại trước khi phát hành.
            </p>
          </div>
        ),
        type: 'info',
        confirmText: 'Tạo đề thi',
        cancelText: 'Hủy bỏ',
        onConfirm: async () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setCreating(true);
          try {
            const response = await api.post<any>('/exam-papers/create-random', {
              ...payload,
              confirm: true,
            });

            const createdPaper = Array.isArray(response.data) ? response.data[0] : response.data;
            setSelectedPaper(createdPaper);
            setShowAnswers(false);
            setToast({
              message: `Đã tạo đề ${createdPaper.paperCode} (bản nháp).`,
              type: 'success',
            });

            setFormData((previous) => ({
              ...previous,
              paperCode: String(Number(previous.paperCode) + 1).padStart(3, '0'),
            }));
            await fetchData();
          } catch (error: any) {
            const apiMsg = error?.response?.data?.message || error?.message || 'Không thể tạo đề thi.';
            setToast({ message: Array.isArray(apiMsg) ? apiMsg.join(', ') : apiMsg, type: 'error' });
          } finally {
            setCreating(false);
          }
        },
      });
    } catch (error: any) {
      const apiMsg = error?.response?.data?.message || error?.message || 'Không thể xem trước tạo đề thi.';
      setToast({ message: Array.isArray(apiMsg) ? apiMsg.join(', ') : apiMsg, type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const openDetail = async (id: number) => {
    const existing = paginatedPapers.find((p) => p.id === id) || filteredPapers.find((p) => p.id === id);
    if (existing) {
      setSelectedPaper(existing);
      setShowAnswers(false);
    }
    setBusyId(id);
    try {
      const response = await api.get<ExamPaper>(`/exam-papers/${id}`);
      setSelectedPaper(response.data);
      setShowAnswers(false);
    } catch (error: any) {
      setToast({ message: error.message || 'Không thể tải chi tiết đề thi.', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const exportPaper = async (paper: ExamPaper) => {
    try {
      const response = await api.get<ExamPaper>(`/exam-papers/${paper.id}`);
      await api.post(`/exam-papers/${paper.id}/export-audit`, {
        format: 'WORD',
        includeAnswerKey: true,
      });
      const formatted = formatPaperForExport(response.data);
      setExportModalPaper(formatted);
    } catch (error: any) {
      setToast({ message: error.message || 'Không thể tải đầy đủ nội dung đề thi.', type: 'error' });
    }
  };

  const runAction = async (
    paper: ExamPaper,
    action: 'publish' | 'archive' | 'restore' | 'delete',
  ) => {
    if (action === 'publish') {
      setCriticalModal({
        isOpen: true,
        paper,
      });
      return;
    }

    const titles = {
      archive: 'Lưu trữ đề thi?',
      restore: 'Khôi phục đề thi?',
      delete: 'Chuyển đề thi vào thùng rác?',
    };

    const messages = {
      archive: (
        <div className="space-y-1">
          <p className="text-type-body-sm font-medium text-slate-800 dark:text-slate-200">
            Lưu trữ đề thi: <span className="font-semibold text-slate-950 dark:text-white">#{paper.paperCode}</span>
          </p>
          <p className="text-type-helper text-slate-500 dark:text-slate-400">
            Đề thi sẽ được chuyển vào kho lưu trữ và ẩn khỏi danh sách đang hoạt động.
          </p>
        </div>
      ),
      restore: (
        <div className="space-y-1">
          <p className="text-type-body-sm font-medium text-slate-800 dark:text-slate-200">
            Khôi phục đề thi: <span className="font-semibold text-slate-950 dark:text-white">#{paper.paperCode}</span>
          </p>
          <p className="text-type-helper text-slate-500 dark:text-slate-400">
            Đề thi sẽ được chuyển về trạng thái bản nháp để bạn tiếp tục chỉnh sửa.
          </p>
        </div>
      ),
      delete: (
        <div className="space-y-1">
          <p className="text-type-body-sm font-medium text-slate-800 dark:text-slate-200">
            Xóa đề thi: <span className="font-semibold text-slate-950 dark:text-white">#{paper.paperCode}</span>
          </p>
          <p className="text-type-helper text-slate-500 dark:text-slate-400">
            Đề thi sẽ được chuyển vào thùng rác và có thể khôi phục lại khi cần.
          </p>
        </div>
      ),
    };

    setConfirmModal({
      isOpen: true,
      title: titles[action] || 'Xác nhận thao tác?',
      message: messages[action] || 'Xác nhận thực hiện thao tác?',
      type: action === 'delete' ? 'danger' : 'warning',
      confirmText: action === 'delete' ? 'Xóa đề' : action === 'archive' ? 'Lưu trữ' : 'Khôi phục',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmModal((previous) => ({ ...previous, isOpen: false }));
        try {
          if (action === 'delete') {
            await api.delete(`/exam-papers/${paper.id}`);
            setToast({ message: `Đã chuyển đề thi ${paper.paperCode} vào thùng rác thành công.`, type: 'success' });
          } else {
            await api.post(`/exam-papers/${paper.id}/${action}`);
            setToast({ message: `Cập nhật trạng thái đề ${paper.paperCode} thành công.`, type: 'success' });
          }
          if (selectedPaper?.id === paper.id) setSelectedPaper(null);
          await fetchData();
        } catch (error: any) {
          const apiMsg = error?.response?.data?.message || error?.message || 'Thao tác thất bại.';
          setToast({ message: Array.isArray(apiMsg) ? apiMsg.join(', ') : apiMsg, type: 'error' });
        }
      },
    });
  };

  const handleCriticalConfirm = async (payload: CriticalConfirmPayload) => {
    if (!criticalModal.paper) return;
    const paper = criticalModal.paper;
    setCriticalModal((previous) => ({ ...previous, isOpen: false }));

    try {
      await api.post(`/exam-papers/${paper.id}/publish`, payload);
      setConfirmModal({
        isOpen: true,
        title: 'Phát hành đề thi thành công',
        message: `Đã phát hành đề thi #${paper.paperCode} thành công. Lịch thi tương ứng đã được khóa chỉnh sửa chính thức và thí sinh đã có thể tham gia thi.`,
        type: 'success',
        confirmText: 'Đóng',
        cancelText: '',
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
      });
      setToast({
        message: `Đã phát hành đề ${paper.paperCode}. Lịch thi đã khóa chỉnh sửa.`,
        type: 'success',
      });
      if (selectedPaper?.id === paper.id) setSelectedPaper(null);
      await fetchData();
    } catch (error: any) {
      const apiMsg = error?.response?.data?.message || error?.message || 'Lỗi khi phát hành đề thi.';
      setToast({ message: Array.isArray(apiMsg) ? apiMsg.join(', ') : apiMsg, type: 'error' });
    }
  };
  const filteredPapers = useMemo(() => {
    return papers
      .filter((p) => {
        const subjectName = (p as any).subjectName || (p.examSchedule as any)?.subjectName || (p.examSchedule?.subject as any)?.subjectName || '';
        const matchesSearch =
          p.paperCode.toLowerCase().includes(search.toLowerCase()) ||
          subjectName.toLowerCase().includes(search.toLowerCase());
        
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        
        const matchesSchedule = selectedScheduleId
          ? String(p.examScheduleId || (p.examSchedule as any)?.id) === selectedScheduleId
          : true;

        let matchesExamType = true;
        if (selectedExamType === 'TRAC_NGHIEM') {
          matchesExamType = (p as any).examType !== 'TU_LUAN' && (p.examSchedule as any)?.examType !== 'TU_LUAN';
        } else if (selectedExamType === 'TU_LUAN') {
          matchesExamType = (p as any).examType === 'TU_LUAN' || (p.examSchedule as any)?.examType === 'TU_LUAN';
        }

        return matchesSearch && matchesStatus && matchesSchedule && matchesExamType;
      })
      .sort((a: any, b: any) => {
        if (sortOrder === 'oldest') return a.id - b.id;
        if (sortOrder === 'code_asc') return a.paperCode.localeCompare(b.paperCode);
        if (sortOrder === 'questions_desc') {
          const qA = (a as any).questionCount ?? a.questions?.length ?? 0;
          const qB = (b as any).questionCount ?? b.questions?.length ?? 0;
          return qB - qA;
        }
        return b.id - a.id;
      });
  }, [papers, search, statusFilter, selectedScheduleId, selectedExamType, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredPapers.length / limit));
  const paginatedPapers = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredPapers.slice(start, start + limit);
  }, [filteredPapers, page, limit]);

  const prepareExamPaperExportData = () => {
    const columns = [
      { header: 'STT', width: 6, align: 'center' as const },
      { header: 'Mã Đề', width: 14, align: 'center' as const },
      { header: 'Môn học', width: 32, align: 'left' as const },
      { header: 'Trạng thái', width: 16, align: 'center' as const },
      { header: 'Số câu', width: 10, align: 'center' as const },
      { header: 'Thời gian', width: 14, align: 'center' as const },
      { header: 'Tổng điểm', width: 12, align: 'center' as const },
    ];

    const rows = filteredPapers.map((p: any, idx) => [
      idx + 1,
      getPaperCodeRange(p).rangeText,
      p.subjectName || (p.examSchedule as any)?.subjectName || (p.examSchedule?.subject as any)?.subjectName || '---',
      p.status === 'PUBLISHED' ? 'Đã phát hành' : p.status === 'DRAFT' ? 'Bản nháp' : p.status === 'ARCHIVED' ? 'Đã lưu trữ' : p.status === 'CANCELLED' ? 'Đã hủy' : 'Chưa xác định',
      p.questionCount ?? p.questions?.length ?? 0,
      `${p.durationMinutes} phút`,
      `${p.totalScore || 10} đ`,
    ]);

    const metaInfo = [
      { label: 'Tổng số đề thi', value: String(papers.length) },
      { label: 'Đề thi đang lọc', value: String(filteredPapers.length) },
    ];

    return { columns, rows, metaInfo };
  };

  const exportExcel = async () => {
    const { columns, rows, metaInfo } = prepareExamPaperExportData();

    await exportToFormattedExcel({
      filename: 'Danh_sach_de_thi.xls',
      templateCode: 'EXAM_PAPER_OFFICIAL',
      title: 'DANH SÁCH ĐỀ THI HỌC PHẦN',
      subtitle: 'Học kỳ 1 - Năm học 2025 - 2026',
      columns,
      rows,
      metaInfo,
    });
  };

  const handlePrintReport = async () => {
    let tplConfig: any = {};
    try {
      const map = await getPublishedTemplatesMap();
      tplConfig = map['EXAM_PAPER_OFFICIAL'] || map['GENERIC_REPORT'] || {};
    } catch {
      // Fallback
    }

    const header = tplConfig.header || {};
    const footer = tplConfig.footer || {};
    const { columns, rows, metaInfo } = prepareExamPaperExportData();

    printReport({
      title: header.title || 'DANH SÁCH ĐỀ THI HỌC PHẦN',
      subtitle: header.subtitle || 'Học kỳ 1 - Năm học 2025 - 2026',
      institutionName: header.institutionName,
      facultyName: header.facultyName,
      signers: footer.signers,
      footerNotes: footer.note,
      metaInfo,
      columns: columns.map((c) => ({
        header: c.header,
        width: typeof c.width === 'number' ? `${c.width * 10}px` : c.width,
        align: c.align,
      })),
      rows,
    });
  };

  if (loading && !papers.length) {
    return <PageSkeleton hasKPIs={true} kpiCount={5} variant="table" />;
  }

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen ">
        <ExamPaperHeader
          onExportAll={exportExcel}
          onPrintAll={handlePrintReport}
          isAdmin={currentUser?.role === 'ADMIN'}
        />

        <ExamPaperKPICards
          total={kpiData.total}
          publishedCount={kpiData.publishedCount}
          draftCount={kpiData.draftCount}
          archivedCount={kpiData.archivedCount}
          totalQuestionsInPapers={kpiData.totalQuestionsInPapers}
        />

        {['ADMIN', 'TEACHER'].includes(currentUser?.role || '') && (
          <ExamPaperMatrixForm
            schedules={schedules}
            formData={formData}
            setFormData={setFormData}
            handleDurationChange={handleDurationChange}
            onSubmit={createPaper}
            creating={creating}
            selectedSchedule={selectedSchedule}
            scheduleDuration={scheduleDuration}
            currentTotal={currentTotal}
            requiredTotal={requiredTotal}
            isValidTotal={isValidTotal}
            isEssay={isEssay}
          />
        )}

        {/* Search & Unified Smart Filter Popover Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left: Unified Search Bar with Embedded SlidersHorizontal Popover */}
          <div className="relative flex-1 max-w-xl min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm theo mã đề, tên môn học..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-20 text-type-body font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-2xs"
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

              <ExamPaperFilterPopover
                statusFilter={statusFilter}
                onStatusChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
                selectedScheduleId={selectedScheduleId}
                onScheduleChange={(val) => {
                  setSelectedScheduleId(val);
                  setPage(1);
                }}
                selectedExamType={selectedExamType}
                onExamTypeChange={(val) => {
                  setSelectedExamType(val);
                  setPage(1);
                }}
                papers={papers}
                schedules={schedules}
                totalFilteredCount={filteredPapers.length}
                onResetAll={() => {
                  setStatusFilter('ALL');
                  setSelectedScheduleId('');
                  setSelectedExamType('');
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Right: Table Action Controls */}
          <div className="shrink-0">
            <ExamPaperTableToolbar
              totalCount={filteredPapers.length}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
              visibleColumns={visibleColumns}
              onColumnToggle={handleColumnToggle}
              onRefresh={handleRefresh}
              loading={loading}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : !paginatedPapers.length ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-semibold shadow-2xs">
            Không tìm thấy Đề thi phù hợp.
          </div>
        ) : (
          <ExamPaperTable
            papers={paginatedPapers}
            selected={selected}
            visibleColumns={visibleColumns}
            onSelect={(id, checked) =>
              setSelected(checked ? [...selected, id] : selected.filter((x) => x !== id))
            }
            onSelectAll={(checked) =>
              setSelected(checked ? paginatedPapers.map((p) => p.id) : [])
            }
            onDetail={openDetail}
            onExportWord={exportPaper}
            onAction={runAction}
          onChangePassword={(paper) => setChangePasswordModal({ isOpen: true, paper })}
          busyId={busyId}
          isAdmin={currentUser?.role === 'ADMIN'}
          canPublishMock={currentUser?.role === 'TEACHER'}
          />
        )}

        <ExamPaperPaginationBar
          page={page}
          totalPages={totalPages}
          limit={limit}
          totalItems={filteredPapers.length}
          onPage={setPage}
          onLimit={(v) => {
            setLimit(v);
            setPage(1);
          }}
        />

        {/* Floating Bulk Action Bar */}
        <ExamPaperBulkAction
          selectedCount={selected.length}
          totalCount={filteredPapers.length}
          allSelected={selected.length === filteredPapers.length && filteredPapers.length > 0}
          onToggleAll={() =>
            setSelected(selected.length === filteredPapers.length ? [] : filteredPapers.map((p) => p.id))
          }
          onPublish={() => {
            const count = selected.length;
            setConfirmModal({
              isOpen: true,
              title: 'Phát hành hàng loạt đề thi',
              message: `Bạn có chắc chắn muốn phát hành ${count} đề thi đã chọn?`,
              type: 'info',
              onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                  await Promise.allSettled(selected.map((id) => api.patch(`/exam-papers/${id}/publish`)));
                  setToast({ message: `Đã phát hành thành công ${count} đề thi`, type: 'success' });
                  setSelected([]);
                  fetchData();
                } catch (err: any) {
                  setToast({ message: err.message || 'Lỗi khi phát hành đề thi', type: 'error' });
                }
              },
            });
          }}
          onArchive={() => {
            const count = selected.length;
            setConfirmModal({
              isOpen: true,
              title: 'Lưu trữ hàng loạt đề thi',
              message: `Bạn có chắc chắn muốn lưu trữ ${count} đề thi đã chọn?`,
              type: 'warning',
              onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                  await Promise.allSettled(selected.map((id) => api.patch(`/exam-papers/${id}/archive`)));
                  setToast({ message: `Đã lưu trữ thành công ${count} đề thi`, type: 'success' });
                  setSelected([]);
                  fetchData();
                } catch (err: any) {
                  setToast({ message: err.message || 'Lỗi khi lưu trữ đề thi', type: 'error' });
                }
              },
            });
          }}
          onExportExcel={() => {
            const selectedItems = papers.filter((p) => selected.includes(p.id));
            const columns = [
              { header: 'STT', width: 8, align: 'center' as const },
              { header: 'Mã Đề', width: 15 },
              { header: 'Môn học', width: 35 },
              { header: 'Trạng thái', width: 18 },
              { header: 'Số câu', width: 12, align: 'center' as const },
              { header: 'Thời gian', width: 15, align: 'center' as const },
              { header: 'Tổng điểm', width: 12, align: 'center' as const },
            ];
            const rows = selectedItems.map((p: any, idx) => [
              idx + 1,
              p.paperCode,
              p.subjectName || (p.examSchedule as any)?.subjectName || (p.examSchedule?.subject as any)?.subjectName || '',
              p.status,
              p.questionCount ?? p.questions?.length ?? 0,
              `${p.durationMinutes} phút`,
              `${p.totalScore} đ`,
            ]);
            exportToFormattedExcel({
              filename: 'Danh_sach_de_thi_da_chon.xls',
              title: 'DANH SÁCH ĐỀ THI ĐÃ CHỌN',
              subtitle: `Đã trích xuất ${selectedItems.length} đề thi`,
              columns,
              rows,
            });
            setToast({ message: `Đã xuất ${selected.length} đề thi ra Excel`, type: 'success' });
          }}
          onDelete={() => {
            const count = selected.length;
            setConfirmModal({
              isOpen: true,
              title: 'Xóa hàng loạt đề thi?',
              message: `Bạn có chắc chắn muốn xóa ${count} đề thi đã chọn? Hành động này không thể hoàn tác.`,
              type: 'danger',
              onConfirm: async () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                try {
                  const results = await Promise.allSettled(selected.map((id) => api.delete(`/exam-papers/${id}`)));
                  const deletedIds = selected.filter((_, index) => results[index].status === 'fulfilled');
                  if (deletedIds.length) {
                    setPapers((prev) => prev.filter((item) => !deletedIds.includes(item.id)));
                    setSelected([]);
                    setToast({ message: `Đã xóa thành công ${deletedIds.length} đề thi`, type: 'success' });
                  }
                } catch (err: any) {
                  setToast({ message: err.message || 'Lỗi khi xóa đề thi', type: 'error' });
                }
              },
            });
          }}
          onClear={() => setSelected([])}
        />
      </main>

      {/* ── EXAM PAPER DETAIL DRAWER: Chuẩn Design System & Sáng Tạo Hiện Đại ── */}
      <ExamPaperDetailDrawer
        paper={drawerOpenPaper}
        isOpen={drawerVisible}
        onClose={() => setSelectedPaper(null)}
        showAnswers={showAnswers}
        onToggleShowAnswers={() => setShowAnswers(!showAnswers)}
        onExportWord={(p) => void exportPaper(p)}
        onSwapQuestion={(index, q) => openSwapModal(index, q)}
        onRubric={(rubricData) => setRubricQuestion(rubricData)}
        onPublish={currentUser?.role === 'ADMIN' || (currentUser?.role === 'TEACHER' && (drawerOpenPaper as any)?.examSchedule?.mode === 'MOCK')
          ? (p) => {
              setSelectedPaper(null);
              runAction(p, 'publish');
            }
          : undefined}
        onArchive={(p) => {
          setSelectedPaper(null);
          runAction(p, 'archive');
        }}
        currentUserRole={currentUser?.role}
        busyId={busyId}
      />

      {/* Modal Đổi Câu Hỏi Lẻ */}
      {swapModal.isOpen && (
        <Modal
          isOpen={swapModal.isOpen}
          onClose={() => setSwapModal({ isOpen: false, questionIndex: null, targetQuestion: null, alternatives: [], loading: false })}
          title={`Đổi câu hỏi #${(swapModal.questionIndex ?? 0) + 1} – Gợi ý thay thế`}
        >
          <div className="space-y-4">
            {/* Header thông tin câu hỏi đang thay thế */}
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-type-helper font-semibold text-slate-500 dark:text-slate-400">Câu hỏi đang thay thế:</span>
                <span className="px-2 py-0.5 ui-pill rounded-full text-type-helper font-medium text-slate-700 dark:text-slate-300">
                  {swapModal.targetQuestion?.type === 'ESSAY' ? 'Tự luận' : swapModal.targetQuestion?.type === 'FILL_BLANK' ? 'Điền khuyết' : 'Trắc nghiệm'} | {swapModal.targetQuestion?.difficulty || 'Trung bình'}
                </span>
              </div>
              <p className="text-type-body-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed italic border-l-2 border-blue-500 pl-3">
                &ldquo;{swapModal.targetQuestion?.content}&rdquo;
              </p>
              <p className="text-type-helper text-blue-600 dark:text-blue-400 font-medium">
                Tìm thấy {swapModal.alternatives.length} câu hỏi tương đương từ ngân hàng đề.
              </p>
            </div>

            {swapModal.loading ? (
              <div className="py-10 text-center text-type-helper text-slate-400 font-semibold flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Đang tải câu hỏi tương đương từ Ngân hàng đề...</span>
              </div>
            ) : swapModal.alternatives.length === 0 ? (
              <div className="py-10 text-center space-y-1.5">
                <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-type-body-sm font-semibold text-slate-700 dark:text-slate-300">Không tìm thấy câu hỏi tương đương</p>
                <p className="text-type-helper text-slate-400">Ngân hàng đề hiện chưa có thêm câu hỏi khác cùng dạng và độ khó này.</p>
              </div>
            ) : (
              <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                {swapModal.alternatives.map((altQ: any) => (
                  <div key={altQ.id} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-type-body-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed flex-1">
                        {altQ.content}
                      </p>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleSelectSwapQuestion(altQ)}
                      >
                        Chọn câu này
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 text-type-helper text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        Mã: <IdentifierBadge tone="neutral" size="sm">#{altQ.id}</IdentifierBadge>
                      </span>
                      <span>|</span>
                      <span>Độ khó: {altQ.difficulty || 'Trung bình'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setSwapModal({ isOpen: false, questionIndex: null, targetQuestion: null, alternatives: [], loading: false })}
              >
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <CriticalConfirmModal
        isOpen={criticalModal.isOpen}
        title={`${(criticalModal.paper as any)?.examSchedule?.mode === 'MOCK' ? 'Phát hành đề thi thử' : 'Phát hành đề thi'} #${criticalModal.paper?.paperCode || ''}`}
        warningMessage={(criticalModal.paper as any)?.examSchedule?.mode === 'MOCK'
          ? `Khi phát hành đề thi thử ${criticalModal.paper?.paperCode || ''}, sinh viên có thể vào làm bài theo thời gian của lịch thi thử. Điểm chỉ dùng cho luyện tập.`
          : `Khi phát hành đề thi ${criticalModal.paper?.paperCode || ''}, đề thi sẽ chính thức được niêm phong, lịch thi chuyển sang trạng thái sẵn sàng và thí sinh có thể bắt đầu làm bài theo ca thi.`}
        confirmPhrase="PHAT HANH DE THI"
        examPasswordRequired={(criticalModal.paper as any)?.examSchedule?.mode === 'OFFICIAL'}
        onClose={() => setCriticalModal({ isOpen: false, paper: null })}
        onConfirm={handleCriticalConfirm}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
      />

      <RubricDialog
        isOpen={Boolean(rubricQuestion)}
        question={rubricQuestion}
        onClose={() => setRubricQuestion(null)}
        onSuccess={() => {
          setRubricQuestion(null);
          setToast({ message: 'Đã cập nhật Rubric. Đề thi đủ điều kiện phát hành.', type: 'success' });
          fetchData();
        }}
      />

      <ChangeExamPasswordModal
        isOpen={changePasswordModal.isOpen}
        paper={changePasswordModal.paper}
        onClose={() => setChangePasswordModal({ isOpen: false, paper: null })}
        onSubmit={handleChangePasswordSubmit}
      />

      <ExamPaperExportModal
        isOpen={Boolean(exportModalPaper)}
        onClose={() => setExportModalPaper(null)}
        basePaper={exportModalPaper}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
