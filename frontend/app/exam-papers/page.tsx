'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  Archive,
  Download,
  Eye,
  FileText,
  KeyRound,
  Printer,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/AppShell';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CriticalConfirmModal, CriticalConfirmPayload } from '../../components/CriticalConfirmModal';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import api from '../../lib/api';
import { getAuthUser } from '../../lib/auth';
import { exportExamPaperToWord } from '../../lib/export-docx';
import { ExamPaper, ExamSchedule, User } from '../../types';

const statusStyle = {
  DRAFT: { label: 'Bản nháp', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  PUBLISHED: { label: 'Đã phát hành', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ARCHIVED: { label: 'Đã lưu trữ', className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const initialForm = {
  examScheduleId: '',
  paperCode: '101',
  durationMinutes: '60',
  easyCount: '16',
  mediumCount: '16',
  hardCount: '8',
  variantCount: '1',
};

export default function ExamPapersPage() {
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [scheduleResponse, paperResponse] = await Promise.all([
        api.get<ExamSchedule[]>('/exam-schedules'),
        api.get<ExamPaper[]>('/exam-papers'),
      ]);
      setSchedules(scheduleResponse.data);
      setPapers(paperResponse.data);
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

  const selectedSchedule = schedules.find((schedule) => String(schedule.id) === formData.examScheduleId);
  const scheduleDuration = selectedSchedule
    ? (() => {
        const [startHour, startMinute] = selectedSchedule.startTime.split(':').map(Number);
        const [endHour, endMinute] = selectedSchedule.endTime.split(':').map(Number);
        return endHour * 60 + endMinute - (startHour * 60 + startMinute);
      })()
    : 0;

  useEffect(() => {
    if (scheduleDuration > 0 && Number(formData.durationMinutes) > scheduleDuration) {
      setFormData((previous) => ({ ...previous, durationMinutes: String(scheduleDuration) }));
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
  const requiredTotal =
    Number(formData.durationMinutes) === 60 ? 40 : Number(formData.durationMinutes) === 90 ? 60 : 0;
  const isValidTotal = requiredTotal === 0 || currentTotal === requiredTotal;

  const createPaper = async (event: FormEvent) => {
    event.preventDefault();
    if (!formData.examScheduleId || currentTotal < 1) {
      setToast({ message: 'Hãy chọn lịch thi và ít nhất một câu hỏi.', type: 'error' });
      return;
    }
    if (requiredTotal > 0 && currentTotal !== requiredTotal) {
      setToast({
        message: `Đề thi ${formData.durationMinutes} phút phải có đúng ${requiredTotal} câu hỏi (hiện tại: ${currentTotal} câu).`,
        type: 'error',
      });
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
        message: `Hệ thống sẽ sinh ${variantCount > 1 ? `${variantCount} mã đề thi khác nhau (tự động đảo câu hỏi & đáp án)` : `1 đề thi mã số ${paperCode}`} gồm ${questionCount} câu hỏi (${totalScore} điểm). Bạn có muốn tạo không?`,
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

  const [criticalModal, setCriticalModal] = useState<{
    isOpen: boolean;
    paper: ExamPaper | null;
  }>({
    isOpen: false,
    paper: null,
  });

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
      publish: 'Phát hành đề thi',
      archive: 'Lưu trữ đề thi',
      restore: 'Khôi phục đề thi',
      delete: 'Xóa bản nháp đề thi',
    };
    const messages = {
      publish: `Phát hành đề ${paper.paperCode}? Sau khi phát hành không thể xóa đề.`,
      archive: `Lưu trữ đề ${paper.paperCode}?`,
      restore: `Khôi phục đề ${paper.paperCode} về bản nháp?`,
      delete: `Xóa bản nháp ${paper.paperCode}? Đề sẽ không còn xuất hiện trong danh sách.`,
    };
    const types: Record<string, 'danger' | 'warning' | 'info' | 'success'> = {
      publish: 'success',
      archive: 'warning',
      restore: 'info',
      delete: 'danger',
    };

    setConfirmModal({
      isOpen: true,
      title: titles[action],
      message: messages[action],
      type: types[action],
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setBusyId(paper.id);
        try {
          if (action === 'delete') await api.delete(`/exam-papers/${paper.id}`);
          else await api.post(`/exam-papers/${paper.id}/${action}`);
          setSelectedPaper(null);
          setToast({ message: 'Thao tác đề thi thành công.', type: 'success' });
          await fetchData();
        } catch (error: any) {
          setToast({ message: error.message, type: 'error' });
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  const handleConfirmCriticalPublish = async (payload: CriticalConfirmPayload) => {
    if (!criticalModal.paper) return;
    const paperId = criticalModal.paper.id;
    try {
      await api.post(`/exam-papers/${paperId}/publish`, payload);
      setSelectedPaper(null);
      setToast({ message: `Đã phát hành thành công đề thi ${criticalModal.paper.paperCode}!`, type: 'success' });
      await fetchData();
    } catch (error: any) {
      throw error;
    }
  };

  const handleExportWord = (includeAnswerKey: boolean) => {
    if (!selectedPaper) return;
    const exportData = {
      paperCode: selectedPaper.paperCode,
      title: selectedPaper.title,
      subjectName: selectedPaper.examSchedule?.subject?.subjectName || 'Môn học',
      subjectCode: selectedPaper.examSchedule?.subject?.subjectCode || 'MH001',
      durationMinutes: selectedPaper.durationMinutes,
      totalScore: selectedPaper.totalScore,
      questions: (selectedPaper.questions || []).map((qItem) => ({
        order: qItem.questionOrder,
        code: qItem.question.code,
        content: qItem.question.content,
        score: qItem.score,
        explanation: qItem.question.explanation || undefined,
        options: (qItem.question.options || []).map((opt) => ({
          label: opt.label,
          content: opt.content,
          isCorrect: opt.isCorrect,
        })),
      })),
    };

    exportExamPaperToWord(exportData, includeAnswerKey);
    setToast({
      message: `Đã xuất File Word Đề thi ${selectedPaper.paperCode} ${includeAnswerKey ? 'kèm Bảng đáp án' : ''} thành công!`,
      type: 'success',
    });
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <AppShell user={currentUser} title="Quản lý đề thi">
      <main className="w-full px-6 py-6 space-y-6">

        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Creation Form Panel */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-4">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
              <Sparkles className="h-5 w-5 text-violet-600" /> Rút đề thi ngẫu nhiên
            </h2>

            <form onSubmit={createPaper} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-slate-600">
                  Lịch thi tập trung
                </span>
                <select
                  required
                  value={formData.examScheduleId}
                  onChange={(event) => setFormData({ ...formData, examScheduleId: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-500 font-semibold"
                >
                  {!schedules.length && <option value="">Chưa có lịch thi</option>}
                  {schedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.subject?.subjectName} ({schedule.subject?.subjectCode}) - Kíp {schedule.startTime}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase text-slate-600">Mã đề gốc</span>
                  <input
                    required
                    maxLength={30}
                    value={formData.paperCode}
                    onChange={(event) => setFormData({ ...formData, paperCode: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-sky-500"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase text-slate-600">Sinh số lượng mã đề</span>
                  <select
                    value={formData.variantCount}
                    onChange={(e) => setFormData({ ...formData, variantCount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-sky-700 outline-none focus:border-sky-500"
                  >
                    <option value="1">1 mã đề độc lập</option>
                    <option value="2">2 mã đề (101, 102)</option>
                    <option value="4">4 mã đề (101, 102, 103, 104)</option>
                    <option value="6">6 mã đề (101-106)</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-slate-600">Thời gian làm bài</span>
                <select
                  required
                  value={formData.durationMinutes}
                  onChange={(event) => handleDurationChange(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-sky-500"
                >
                  <option value="60">60 phút (40 câu)</option>
                  <option value="90">90 phút (60 câu)</option>
                  {scheduleDuration > 0 && scheduleDuration !== 60 && scheduleDuration !== 90 && (
                    <option value={scheduleDuration}>{scheduleDuration} phút (theo lịch thi)</option>
                  )}
                </select>
              </label>

              <div className="border-t border-slate-100 pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-slate-600">Ma trận độ khó</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      isValidTotal
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    Tổng: {currentTotal} / {requiredTotal} câu {isValidTotal ? '✓' : `(Cần ${requiredTotal} câu)`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['easyCount', 'Câu dễ', 'text-emerald-700'],
                    ['mediumCount', 'Trung bình', 'text-amber-700'],
                    ['hardCount', 'Câu khó', 'text-rose-700'],
                  ].map(([key, label, color]) => (
                    <label key={key}>
                      <span className={`mb-1 block text-[11px] font-medium ${color}`}>{label}</span>
                      <input
                        type="number"
                        min={0}
                        max={200}
                        required
                        value={formData[key as keyof typeof formData]}
                        onChange={(event) => setFormData({ ...formData, [key]: event.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-2 py-2 text-center text-sm font-bold outline-none focus:border-sky-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <button
                disabled={creating || !schedules.length || !isValidTotal}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1e66f5] to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3 text-sm font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" /> {creating ? 'Đang tạo đề...' : `Tạo ${Number(formData.variantCount) > 1 ? `${formData.variantCount} Mã Đề Đảo Câu` : 'Đề Thi'}`}
              </button>
            </form>
          </section>

          {/* Paper List Panel */}
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-bold text-slate-900">
                  <FileText className="h-5 w-5 text-sky-600" /> Danh sách đề thi
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {isAdmin ? 'Tất cả đề thi trong hệ thống' : 'Đề thi do bạn tạo và Đề thi đã phát hành'}
                </p>
              </div>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {papers.length} đề
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="px-3 py-3">Mã đề</th>
                    <th className="px-3 py-3">Tên đề</th>
                    <th className="px-3 py-3">Người tạo</th>
                    <th className="px-3 py-3">Trạng thái</th>
                    <th className="px-3 py-3">Cấu trúc</th>
                    <th className="px-3 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-10 text-center text-slate-400">
                        Đang tải danh sách đề thi...
                      </td>
                    </tr>
                  ) : !papers.length ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-10 text-center text-slate-400">
                        Chưa có đề thi phù hợp.
                      </td>
                    </tr>
                  ) : (
                    papers.map((paper) => (
                      <tr key={paper.id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-3 font-bold text-violet-700">{paper.paperCode}</td>
                        <td className="max-w-64 px-3 py-3">
                          <p className="truncate font-semibold text-slate-800" title={paper.title}>
                            {paper.title}
                          </p>
                          <p className="text-xs text-slate-500">{paper.examSchedule?.subject?.subjectCode}</p>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{paper.createdBy?.username}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${
                              statusStyle[paper.status].className
                            }`}
                          >
                            {statusStyle[paper.status].label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-600">
                          {paper._count?.questions || 0} câu · {paper.totalScore} điểm · {paper.durationMinutes} phút
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              disabled={busyId === paper.id}
                              onClick={() => openDetail(paper.id)}
                              title="Xem chi tiết & Xuất Word"
                              className="rounded-lg p-2 text-sky-600 hover:bg-sky-50"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {isAdmin && paper.status === 'DRAFT' && (
                              <button
                                onClick={() => runAction(paper, 'publish')}
                                title="Phát hành đề thi"
                                className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                            {isAdmin && paper.status !== 'ARCHIVED' && (
                              <button
                                onClick={() => runAction(paper, 'archive')}
                                title="Lưu trữ"
                                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                            )}
                            {isAdmin && paper.status === 'ARCHIVED' && (
                              <button
                                onClick={() => runAction(paper, 'restore')}
                                title="Khôi phục"
                                className="rounded-lg p-2 text-violet-600 hover:bg-violet-50"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                            )}
                            {paper.status === 'DRAFT' && (
                              <button
                                onClick={() => runAction(paper, 'delete')}
                                title="Xóa bản nháp"
                                className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* Detail Modal with Word Export & Answers */}
      <Modal
        isOpen={Boolean(selectedPaper)}
        onClose={() => setSelectedPaper(null)}
        title={selectedPaper ? `Chi tiết đề thi ${selectedPaper.paperCode}` : 'Chi tiết đề thi'}
      >
        {selectedPaper && (
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">{selectedPaper.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedPaper.examSchedule?.examPeriod?.name} · {selectedPaper.examSchedule?.subject?.subjectName}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${
                    statusStyle[selectedPaper.status].className
                  }`}
                >
                  {statusStyle[selectedPaper.status].label}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-slate-600">
                <span>{selectedPaper.durationMinutes} phút</span>
                <span>{selectedPaper.totalScore} điểm</span>
                <span>{selectedPaper.questions?.length || 0} câu</span>
                <span>Người tạo: {selectedPaper.createdBy?.username}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handleExportWord(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5" /> Xuất Word Đề Thi (.doc)
                </button>
                <button
                  onClick={() => handleExportWord(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs"
                >
                  <KeyRound className="h-3.5 w-3.5" /> Xuất Word + Bảng Đáp Án
                </button>
                <button
                  onClick={() => setShowAnswers((value) => !value)}
                  className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700"
                >
                  {showAnswers ? 'Ẩn đáp án' : 'Hiện đáp án màn hình'}
                </button>
              </div>
            </div>

            <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
              {selectedPaper.questions?.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Câu {item.questionOrder}. ({item.score} điểm) {item.question.content}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {item.question.options?.map((option) => (
                      <div
                        key={option.id}
                        className={`rounded-lg border p-2 text-xs ${
                          showAnswers && option.isCorrect
                            ? 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-800'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        {option.label}. {option.content}
                        {showAnswers && option.isCorrect && ' ✓'}
                      </div>
                    ))}
                  </div>
                  {showAnswers && item.question.explanation && (
                    <p className="mt-3 rounded-lg bg-sky-50 p-2 text-xs text-sky-800">
                      <strong>Giải thích:</strong> {item.question.explanation}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      <CriticalConfirmModal
        isOpen={criticalModal.isOpen}
        onClose={() => setCriticalModal({ isOpen: false, paper: null })}
        title={`Phát Hành Đề Thi Official (${criticalModal.paper?.paperCode || ''})`}
        warningMessage="Phát hành đề thi sẽ tự động khởi tạo cấu hình ca thi trực tuyến và KHÓA CHỈNH SỬA đề thi này. Đề thi sẽ sẵn sàng phát cho thí sinh khi ca thi bắt đầu."
        confirmPhrase="PHAT HANH DE THI"
        reasons={[
          'Hoàn tất thẩm định và duyệt cấu trúc đề thi',
          'Đến thời điểm phát hành theo kế hoạch thi',
          'Phát hành bổ sung mã đề dự phòng',
          'Yêu cầu chỉ đạo phát hành khẩn cấp',
          'Lý do khác',
        ]}
        actionButtonText="Phát Hành & Kích Hoạt Ca Thi"
        onConfirm={handleConfirmCriticalPublish}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
