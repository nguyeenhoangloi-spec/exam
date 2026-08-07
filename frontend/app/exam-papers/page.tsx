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
import { Search, X, ChevronDown, Download, KeyRound, Printer, Eye, HelpCircle, CheckCircle2, Award } from 'lucide-react';

import { ExamPaperHeader } from '../../components/exam-papers/ExamPaperHeader';
import { ExamPaperKPICards } from '../../components/exam-papers/ExamPaperKPICards';
import { ExamPaperMatrixForm } from '../../components/exam-papers/ExamPaperMatrixForm';
import { ExamPaperTableToolbar } from '../../components/exam-papers/ExamPaperTableToolbar';
import { ExamPaperTable } from '../../components/exam-papers/ExamPaperTable';
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

const initialForm = {
  examScheduleId: '',
  paperCode: '101',
  durationMinutes: '60',
  easyCount: '16',
  mediumCount: '16',
  hardCount: '8',
  variantCount: '1',
  examType: 'TRAC_NGHIEM',
};

export default function ExamPapersPage() {
  usePageTitle('Quản lý đề thi');
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [formData, setFormData] = useState(initialForm);
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
      setSchedules(scheduleResponse.data || []);
      setPapers(paperResponse.data || []);
      setFormData((previous) => ({
        ...previous,
        examScheduleId: previous.examScheduleId || String(scheduleResponse.data[0]?.id || ''),
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

  // The schedule is the source of truth: a paper cannot change a published
  // schedule from multiple-choice to essay (or vice versa).
  useEffect(() => {
    const scheduleType = selectedSchedule?.examType;
    if (!scheduleType) return;
    setFormData((previous) => scheduleType === 'TU_LUAN'
      ? { ...previous, examType: scheduleType, easyCount: '3', mediumCount: '2', hardCount: '0' }
      : { ...previous, examType: scheduleType, easyCount: '16', mediumCount: '16', hardCount: '8' });
  }, [selectedSchedule?.examType, selectedSchedule?.id]);
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

  const createPaper = async (event: FormEvent) => {
    event.preventDefault();
    if (!formData.examScheduleId || currentTotal < 1) {
      setToast({ message: 'Hãy chọn lịch thi và ít nhất một câu hỏi.', type: 'error' });
      return;
    }

    const variantCount = Number(formData.variantCount) || 1;
    setCreating(true);

    try {
      const payload = {
        examScheduleId: Number(formData.examScheduleId),
        paperCode: formData.paperCode.trim(),
        durationMinutes: Number(formData.durationMinutes),
        easyCount: Number(formData.easyCount),
        mediumCount: Number(formData.mediumCount),
        hardCount: Number(formData.hardCount),
        variantCount,
        examType: formData.examType || 'TRAC_NGHIEM',
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
              message: variantCount > 1 ? `🎉 Đã tạo thành công ${variantCount} mã đề thi đảo câu!` : `Đã tạo đề ${createdPaper.paperCode} ở trạng thái bản nháp.`,
              type: 'success',
            });

            setFormData((previous) => ({
              ...previous,
              paperCode: String(Number(previous.paperCode) + variantCount).padStart(3, '0'),
            }));
            await fetchData();
          } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
          } finally {
            setCreating(false);
          }
        },
      });
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
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
      setToast({ message: error.message, type: 'error' });
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
          setToast({ message: error.message, type: 'error' });
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
      setToast({
        message: `Đề thi ${paper.paperCode} đã phát hành chính thức! Lịch thi đã được KHÓA CHỈNH SỬA.`,
        type: 'success',
      });
      if (selectedPaper?.id === paper.id) setSelectedPaper(null);
      await fetchData();
    } catch (error: any) {
      setToast({ message: error.message || 'Lỗi khi phát hành đề thi.', type: 'error' });
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
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700 border border-blue-200">
                  {(selectedPaper as any).questionCount ?? selectedPaper.questions?.length ?? (selectedPaper as any).details?.length ?? 0} câu hỏi
                </span>
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 border border-emerald-200">
                  {selectedPaper.totalScore} điểm
                </span>
                <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-700 border border-slate-200">
                  {selectedPaper.durationMinutes} phút
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAnswers(!showAnswers)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer border ${
                    showAnswers
                      ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>{showAnswers ? 'Ẩn Đáp án' : 'Hiện Đáp án'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportExamPaperToWord(formatPaperForExport(selectedPaper), showAnswers)}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 text-xs font-extrabold border border-blue-200 transition cursor-pointer"
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
                  <div key={detail.id || index} className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-black text-slate-900 leading-snug">
                        Câu {index + 1}: {q.content}
                      </span>
                      <span className="shrink-0 rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">
                        {q.type === 'ESSAY' ? 'TỰ LUẬN' : q.type === 'MULTIPLE_CHOICE' ? 'TRẮC NGHIỆM' : (q.type || 'CÂU HỎI')} · {q.difficulty || 'TRUNG BÌNH'} · {detail.score || (selectedPaper.totalScore / (((selectedPaper as any).details || selectedPaper.questions || []).length || 1)).toFixed(2)}đ
                      </span>
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
                    ) : (
                      /* Dạng Tự Luận hoặc Không Có Trắc Nghiệm */
                      <div className="text-xs pt-1">
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
                          <p className="text-[11px] italic font-semibold text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            (Nội dung câu hỏi tự luận - Bấm nút &quot;Hiện Đáp án&quot; ở góc trên để xem đáp án gợi ý & thang điểm)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
