'use client';

import React, { FormEvent, useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { usePageTitle } from '../../components/PageTitleContext';
import { exportToFormattedExcel } from '../../lib/export-excel';
import { exportExamPaperToWord } from '../../lib/export-docx';
import { printReport } from '../../lib/export-print';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CriticalConfirmModal, CriticalConfirmPayload } from '../../components/CriticalConfirmModal';
import { ExamPaper, ExamSchedule, User } from '../../types';
import { Search, X, ChevronDown, Download, KeyRound, Printer, Eye, HelpCircle, CheckCircle2, Award, RotateCcw, RefreshCw, Trash2, Send, Archive } from 'lucide-react';

import { ExamPaperHeader } from '../../components/exam-papers/ExamPaperHeader';
import { ExamPaperKPICards } from '../../components/exam-papers/ExamPaperKPICards';
import { ExamPaperMatrixForm, ExamPaperMatrixFormData } from '../../components/exam-papers/ExamPaperMatrixForm';
import { ExamPaperTableToolbar } from '../../components/exam-papers/ExamPaperTableToolbar';
import { ExamPaperTable } from '../../components/exam-papers/ExamPaperTable';
import { ChangeExamPasswordModal } from '../../components/exam-papers/ChangeExamPasswordModal';
import { RubricDialog } from '../../components/question-bank/RubricDialog';
import { TabBar } from '../../components/ui/TabBar';
import { ExamPaperPaginationBar } from '../../components/exam-papers/ExamPaperPaginationBar';

function formatPaperForExport(paper: any) {
  const details = paper.details || paper.questions || paper.paperDetails || [];
  const subjectName = paper.subjectName || paper.examSchedule?.subjectName || paper.examSchedule?.subject?.subjectName || 'Môn thi';
  const subjectCode = paper.subjectCode || paper.examSchedule?.subjectCode || paper.examSchedule?.subject?.subjectCode || 'MH';

  return {
    paperCode: paper.paperCode,
    title: `ĐỀ THI MÔN ${subjectName.toUpperCase()}`,
    subjectName,
    subjectCode,
    durationMinutes: paper.durationMinutes,
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

export default function ExamPapersPage() {
  usePageTitle('Quản lý đề thi');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [formData, setFormData] = useState<ExamPaperMatrixFormData>(initialForm);
  const [selectedPaper, setSelectedPaper] = useState<ExamPaper | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [sortOrder, setSortOrder] = useState('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
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
      const response = await api.get('/questions', {
        params: {
          type: targetQuestion.type || 'MULTIPLE_CHOICE',
          difficulty: targetQuestion.difficulty || 'MEDIUM',
          limit: 10,
        },
      });

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
      title: 'Xác nhận đổi câu hỏi',
      message: `Bạn có chắc chắn muốn thay thế Câu #${qIndex + 1} bằng câu hỏi mới chọn từ Ngân hàng đề không?`,
      type: 'info',
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
    message: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
  });

  const [criticalModal, setCriticalModal] = useState<{
    isOpen: boolean;
    paper: ExamPaper | null;
  }>({
    isOpen: false,
    paper: null,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [scheduleResponse, paperResponse] = await Promise.all([
        api.get<ExamSchedule[]>('/exam-schedules').catch(() => ({ data: [] })),
        api.get<ExamPaper[]>('/exam-papers').catch(() => ({ data: [] })),
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

      setFormData((previous) => ({
        ...previous,
        examScheduleId: previous.examScheduleId || String(defaultSchedule?.id || ''),
      }));
    } catch (error: any) {
      setToast({ message: error.message || 'Không tải được dữ liệu đề thi.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = getAuthUser();
    if (!user) return void router.replace('/login');
    if (!['ADMIN', 'TEACHER'].includes(user.role)) {
      return void router.replace('/student/exam-schedule');
    }
    setCurrentUser(user);
    fetchData();
  }, [fetchData, router]);

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
        title: variantCount > 1 ? `Tạo ${variantCount} Mã Đề Thi Đảo Câu` : 'Xác nhận tạo đề thi',
        message: `Hệ thống sẽ sinh ${variantCount > 1 ? `${variantCount} mã đề thi khác nhau` : `1 đề thi mã số ${paperCode}`} gồm ${questionCount} câu hỏi (${totalScore} điểm). Bạn có muốn tạo không?`,
        type: 'info',
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
              message: variantCount > 1 ? `Đã tạo ${variantCount} mã đề đảo câu.` : `Đã tạo đề ${createdPaper.paperCode} (bản nháp).`,
              type: 'success',
            });

            setFormData((previous) => ({
              ...previous,
              paperCode: String(Number(previous.paperCode) + variantCount).padStart(3, '0'),
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
      exportExamPaperToWord(formatPaperForExport(response.data), showAnswers);
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

    const messages = {
      archive: `Bạn muốn lưu trữ đề thi ${paper.paperCode}?`,
      restore: `Khôi phục đề thi ${paper.paperCode} về bản nháp?`,
      delete: `Bạn có chắc muốn xóa đề thi ${paper.paperCode}?`,
    };

    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận thao tác',
      message: messages[action] || 'Xác nhận thực hiện thao tác?',
      type: action === 'delete' ? 'danger' : 'warning',
      onConfirm: async () => {
        setConfirmModal((previous) => ({ ...previous, isOpen: false }));
        try {
          if (action === 'delete') {
            await api.delete(`/exam-papers/${paper.id}`);
            setToast({ message: `Đã xóa đề thi ${paper.paperCode}.`, type: 'success' });
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
        title: 'Phát hành Đề thi Thành công!',
        message: `Đã phát hành Đề thi mã số [${paper.paperCode}] thành công. Lịch thi tương ứng đã được KHOÁ CHỈNH SỬA chính thức và sinh viên đã có thể tham gia thi.`,
        type: 'success',
        confirmText: 'Đóng',
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
        return matchesSearch && matchesStatus;
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
  }, [papers, search, statusFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredPapers.length / limit));
  const paginatedPapers = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredPapers.slice(start, start + limit);
  }, [filteredPapers, page, limit]);

  const exportExcel = () => {
    const columns = [
      { header: 'STT', width: 8, align: 'center' as const },
      { header: 'Mã Đề', width: 15 },
      { header: 'Môn học', width: 35 },
      { header: 'Trạng thái', width: 18 },
      { header: 'Số câu', width: 12, align: 'center' as const },
      { header: 'Thời gian', width: 15, align: 'center' as const },
      { header: 'Tổng điểm', width: 12, align: 'center' as const },
    ];

    const rows = filteredPapers.map((p: any, idx) => [
      idx + 1,
      p.paperCode,
      p.subjectName || (p.examSchedule as any)?.subjectName || (p.examSchedule?.subject as any)?.subjectName || '',
      p.status,
      p.questionCount ?? p.questions?.length ?? 0,
      `${p.durationMinutes} phút`,
      `${p.totalScore} đ`,
    ]);

    exportToFormattedExcel({
      filename: 'Danh_sach_de_thi.xls',
      title: 'DANH SÁCH ĐỀ THI HỆ THỐNG',
      subtitle: 'Trích xuất dữ liệu danh mục đề thi ngẫu nhiên',
      columns,
      rows,
    });
  };

  const handlePrintReport = () => {
    printReport({
      title: 'BÁO CÁO DANH SÁCH ĐỀ THI',
      subtitle: 'Danh sách đề thi và phân bổ ma trận câu hỏi',
      metaInfo: [
        { label: 'Tổng số đề thi', value: String(papers.length) },
        { label: 'Đã phát hành', value: String(kpiData.publishedCount) },
      ],
      columns: [
        { header: 'STT', width: '40px' },
        { header: 'Mã Đề', width: '80px' },
        { header: 'Tên Môn học', width: '220px' },
        { header: 'Trạng thái', width: '110px' },
        { header: 'Số câu', width: '70px', align: 'center' },
        { header: 'Thời gian', width: '90px', align: 'center' },
        { header: 'Điểm', width: '70px', align: 'center' },
      ],
      rows: filteredPapers.map((p: any, idx) => [
        idx + 1,
        p.paperCode,
        p.subjectName || (p.examSchedule as any)?.subjectName || (p.examSchedule?.subject as any)?.subjectName || '',
        p.status,
        `${p.questionCount ?? p.questions?.length ?? 0} câu`,
        `${p.durationMinutes} ph`,
        `${p.totalScore} đ`,
      ]),
    });
  };

  return (
    <>
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen">
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

        {currentUser?.role === 'ADMIN' && (
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

        {/* Status Tabs & Search Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/80 pb-1">
          <TabBar
            tabs={[
              { key: 'ALL', label: 'Tất cả đề thi', count: kpiData.total },
              { key: 'PUBLISHED', label: 'Đã phát hành', count: kpiData.publishedCount },
              { key: 'DRAFT', label: 'Bản nháp', count: kpiData.draftCount },
              { key: 'ARCHIVED', label: 'Lưu trữ', count: kpiData.archivedCount },
            ]}
            active={statusFilter}
            onChange={(key) => { setStatusFilter(key); setPage(1); }}
            className="border-b-0 pt-0 w-auto"
          />

          <div className="relative w-full md:w-80 shrink-0 pb-1 md:pb-0">
            <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo Mã đề, Tên môn học..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none transition shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <ExamPaperTableToolbar
          totalCount={filteredPapers.length}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          visibleColumns={visibleColumns}
          onColumnToggle={handleColumnToggle}
          onRefresh={fetchData}
        />

        {loading ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : !paginatedPapers.length ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-slate-500 font-bold shadow-2xs">
            Không tìm thấy Đề thi phù hợp.
          </div>
        ) : (
          <ExamPaperTable
            papers={paginatedPapers}
            selected={selected}
            viewMode={viewMode}
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
      </main>

      {selectedPaper && (
        <Modal
          isOpen={Boolean(selectedPaper)}
          onClose={() => setSelectedPaper(null)}
          title={`Đề Thi Mã Số: ${selectedPaper.paperCode} - ${(selectedPaper as any).subjectName || (selectedPaper.examSchedule as any)?.subjectName || (selectedPaper.examSchedule?.subject as any)?.subjectName || 'Chi tiết Đề thi'}`}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
                  {(selectedPaper as any).questionCount ?? selectedPaper.questions?.length ?? (selectedPaper as any).details?.length ?? 0} câu hỏi
                </span>
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
                  {selectedPaper.totalScore} điểm
                </span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                  {selectedPaper.durationMinutes} phút
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAnswers(!showAnswers)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition cursor-pointer ${
                    showAnswers
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>{showAnswers ? 'Ẩn Đáp án' : 'Hiện Đáp án'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportExamPaperToWord(formatPaperForExport(selectedPaper), showAnswers)}
                  className="flex items-center gap-1.5 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 text-xs font-extrabold transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Tải Word (.doc)</span>
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
              {((selectedPaper as any).details || selectedPaper.questions || []).map((detail: any, index: number) => {
                const q = detail.question || detail;
                const choices = questionChoices(q);
                const answerText = q.correctAnswer || q.sampleAnswer || q.explanation || q.answer || q.solution || '';

                return (
                  <div key={detail.id || index} className="py-4 space-y-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-black text-slate-900 leading-snug">
                        Câu {index + 1}: {q.content}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {selectedPaper.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => openSwapModal(index, q)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 text-xs font-black rounded-lg transition cursor-pointer"
                            title="Đổi câu hỏi này bằng 1 câu hỏi ngẫu nhiên tương đương trong Ngân hàng đề"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-blue-600" /> Đổi câu hỏi
                          </button>
                        )}
                        {q.type === 'ESSAY' && (
                          <button
                            type="button"
                            onClick={() => setRubricQuestion({ id: q.id || detail.questionId || detail.id, code: q.code || `Câu ${index + 1}`, content: q.content, score: detail.score || 1 })}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline text-xs font-bold transition cursor-pointer"
                            title="Cấu hình thang điểm chi tiết (Rubric) cho câu tự luận"
                          >
                            <Award className="w-3.5 h-3.5 text-blue-600" /> Cấu hình Rubric
                          </button>
                        )}
                        <span className="text-xs font-extrabold text-blue-600">
                          {q.type === 'ESSAY' ? 'TỰ LUẬN' : q.type === 'FILL_BLANK' ? 'ĐIỀN KHUYẾT' : q.type === 'TRUE_FALSE' ? 'ĐÚNG/SAI' : 'TRẮC NGHIỆM'} · {q.difficulty || 'TRUNG BÌNH'} · {detail.score || (selectedPaper.totalScore / (((selectedPaper as any).details || selectedPaper.questions || []).length || 1)).toFixed(2)}đ
                        </span>
                      </div>
                    </div>

                    {/* Dạng Trắc Nghiệm */}
                    {choices.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {choices.map((c) => {
                          const isCorrect = c.isCorrect;
                          return (
                            <div
                              key={c.label}
                              className={`rounded-xl border p-2.5 font-medium transition ${
                                showAnswers && isCorrect
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-extrabold'
                                  : 'border-slate-200 bg-slate-50/70 text-slate-700'
                              }`}
                            >
                              <span className="font-black text-slate-900 mr-1.5">{c.label}.</span>
                              <span>{c.text}</span>
                              {showAnswers && isCorrect && (
                                <span className="ml-2 inline-flex items-center text-emerald-700 font-black text-[10.5px]">
                                  ✓ Đáp án đúng
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : q.type === 'FILL_BLANK' ? (
                      /* Dạng Điền vào chỗ trống */
                      <div className="text-xs pt-1 space-y-2">
                        {showAnswers ? (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 space-y-1 text-emerald-900">
                            <p className="font-black text-emerald-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đáp án chính xác cho các chỗ trống:
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {(q.fillBlankAnswers || (q as any).answers || []).length > 0 ? (
                                (q.fillBlankAnswers || (q as any).answers).map((ans: any, idx: number) => (
                                  <span key={idx} className="rounded-lg bg-emerald-100/90 px-2.5 py-1 text-xs font-bold text-emerald-900 border border-emerald-300">
                                    Ô #{ans.blankIndex || idx + 1}: {ans.answer || ans.text || 'đáp án đúng'} {ans.score ? `(${ans.score}đ)` : ''}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs font-semibold text-slate-600 italic">Dữ liệu đáp án điền khuyết theo cú pháp {'{{blank_1}}'} trong câu hỏi.</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] italic font-semibold text-slate-400">
                            (Bấm &quot;Hiện Đáp án&quot; để xem đáp án các ô điền khuyết)
                          </p>
                        )}
                      </div>
                    ) : (
                      /* Dạng Tự Luận hoặc Khác */
                      <div className="text-xs pt-1 space-y-2">
                        {showAnswers ? (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 space-y-1 text-emerald-900">
                            <p className="font-black text-emerald-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Gợi ý Đáp án & Thang điểm Tự luận:
                            </p>
                            <p className="font-semibold whitespace-pre-wrap leading-relaxed">
                              {answerText || 'Chưa có đáp án mẫu hoặc hướng dẫn chấm cho câu hỏi này.'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] italic font-semibold text-slate-400">
                             (Bấm &quot;Hiện Đáp án&quot; để xem đáp án gợi ý &amp; thang điểm)
                           </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Action Bar inside Detail Modal */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  Trạng thái: <strong className={
                    selectedPaper.status === 'PUBLISHED'
                      ? 'text-emerald-700 font-extrabold'
                      : selectedPaper.status === 'ARCHIVED'
                      ? 'text-slate-600 font-extrabold'
                      : 'text-amber-800 font-extrabold'
                  }>
                    {selectedPaper.status === 'PUBLISHED' ? 'Đã phát hành' : selectedPaper.status === 'ARCHIVED' ? 'Lưu trữ' : 'Bản nháp'}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedPaper.status === 'DRAFT' && (currentUser?.role === 'ADMIN' || currentUser?.role === 'TEACHER') && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const p = selectedPaper;
                        setSelectedPaper(null);
                        runAction(p, 'delete');
                      }}
                      className="flex items-center gap-1.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-slate-100 px-3 py-2 text-xs font-bold transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Xóa đề thi nháp
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const p = selectedPaper;
                        setSelectedPaper(null);
                        runAction(p, 'publish');
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 text-xs font-black shadow-2xs transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-white" /> Phát hành Đề thi
                    </button>
                  </>
                )}

                {selectedPaper.status === 'PUBLISHED' && currentUser?.role === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      const p = selectedPaper;
                      setSelectedPaper(null);
                      runAction(p, 'archive');
                    }}
                    className="flex items-center gap-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 text-xs font-bold transition cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5 text-slate-500" /> Lưu trữ Đề thi
                  </button>
                )}

                {selectedPaper.status === 'ARCHIVED' && currentUser?.role === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      const p = selectedPaper;
                      setSelectedPaper(null);
                      runAction(p, 'restore');
                    }}
                    className="flex items-center gap-1.5 rounded-xl text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-3 py-2 text-xs font-bold transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" /> Khôi phục về nháp
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Đổi Câu Hỏi Lẻ */}
      {swapModal.isOpen && (
        <Modal
          isOpen={swapModal.isOpen}
          onClose={() => setSwapModal({ isOpen: false, questionIndex: null, targetQuestion: null, alternatives: [], loading: false })}
          title={`Đổi Câu Hỏi #${(swapModal.questionIndex ?? 0) + 1} - Danh sách gợi ý thay thế`}
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-blue-50 p-3 border border-blue-200 text-xs text-blue-900">
              <p className="font-bold">Câu hỏi hiện tại đang bị thay thế:</p>
              <p className="mt-1 font-semibold text-slate-700 italic border-l-2 border-blue-400 pl-2">
                &quot;{swapModal.targetQuestion?.content}&quot;
              </p>
              <p className="mt-1 text-[11px] text-blue-700 font-bold">
                Hệ thống đã tìm được {swapModal.alternatives.length} câu hỏi cùng dạng ({swapModal.targetQuestion?.type || 'Trắc nghiệm'}) & độ khó tương đương từ Ngân hàng đề.
              </p>
            </div>

            {swapModal.loading ? (
              <div className="py-8 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Đang tải câu hỏi tương đương từ Ngân hàng đề...</span>
              </div>
            ) : swapModal.alternatives.length === 0 ? (
              <p className="py-6 text-center text-xs font-semibold text-slate-400">
                Không tìm thấy câu hỏi khác cùng dạng & độ khó trong ngân hàng đề.
              </p>
            ) : (
              <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
                {swapModal.alternatives.map((altQ: any) => (
                  <div key={altQ.id} className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2 hover:border-blue-300 transition shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-extrabold text-slate-900 leading-snug">
                        {altQ.content}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSelectSwapQuestion(altQ)}
                        className="shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3 py-1.5 shadow-2xs transition cursor-pointer"
                      >
                        Chọn câu này
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[10.5px] font-semibold text-slate-500">
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-700 font-bold">
                        Mã câu: #{altQ.id}
                      </span>
                      <span>Độ khó: {altQ.difficulty || 'TRUNG BÌNH'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSwapModal({ isOpen: false, questionIndex: null, targetQuestion: null, alternatives: [], loading: false })}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}

      <CriticalConfirmModal
        isOpen={criticalModal.isOpen}
        title={`Phát hành Đề thi Mã số: ${criticalModal.paper?.paperCode || ''}`}
        warningMessage={`Khi phát hành đề thi ${criticalModal.paper?.paperCode || ''}, lịch thi sẽ bị KHOÁ CHỈNH SỬA và thí sinh có thể bắt đầu làm bài.`}
        confirmPhrase="PHAT HANH DE THI"
        examPasswordRequired={true}
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
