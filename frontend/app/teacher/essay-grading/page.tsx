'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { RubricDialog } from '../../../components/question-bank/RubricDialog';
import { usePageTitle } from '../../../components/PageTitleContext';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { TabBar } from '../../../components/ui/TabBar';
import { Search, X, RotateCcw, Sparkles, Sliders, Save, CheckCircle2, FileText, User, AlertCircle } from 'lucide-react';

export default function TeacherEssayGradingPage() {
  usePageTitle('Chấm Bài Thi Tự Luận');
  const searchParams = useSearchParams();
  const attemptIdParam = searchParams.get('attemptId');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [teacherComments, setTeacherComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'GRADING' | 'WAITING_APPROVAL' | 'PUBLISHED'>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');

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
    try {
      const res = await api.get(`/essay/grading/attempts/${id}`, { params: { noCache: true } });
      const attemptData = res.data;
      setSelected(attemptData);
      setMessage('');

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

      setScores(initScores);
      setComments(initComments);
      setTeacherComments(initTeacherComments);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Không thể tải chi tiết bài làm.');
    }
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

  const gradeQuestionAnswer = async (answer: any, question: any) => {
    const rubric = question.rubric || [];
    if (!rubric.length) {
      setMessage('Câu hỏi này chưa được cài đặt rubric chấm điểm.');
      return;
    }

    for (const r of rubric) {
      if (scores[r.id] === undefined || scores[r.id] === null) {
        setMessage(`Vui lòng nhập điểm cho tiêu chí "${r.label}".`);
        return;
      }
    }

    const criteria = rubric.map((r: any) => ({
      criterionId: r.id,
      score: Number(scores[r.id] || 0),
      comment: comments[r.id] || '',
    }));

    setSaving(true);
    try {
      await api.patch(`/essay/grading/answers/${answer.id}`, {
        criteria,
        teacherComment: teacherComments[question.questionId] || '',
      });
      setMessage(`Đã lưu điểm câu hỏi "${question.code || 'Tự luận'}".`);
      await openAttempt(selected.id);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Không thể lưu điểm.');
    } finally {
      setSaving(false);
    }
  };

  const handleAiSuggest = async (answer: any, question: any) => {
    try {
      setAiLoading(answer.id);
      const res = await api.post(`/essay-grading/answers/${answer.id}/ai-suggest`);
      const aiData = res.data;

      (aiData.criteria || []).forEach((item: any) => {
        setScores((prev) => ({ ...prev, [item.criterionId]: item.score }));
        if (item.comment) {
          setComments((prev) => ({ ...prev, [item.criterionId]: item.comment }));
        }
      });

      if (aiData.overallComment) {
        setTeacherComments((prev) => ({ ...prev, [question.questionId]: aiData.overallComment }));
      }

      let msg = `AI đã đề xuất điểm (Độ tin cậy: ${Math.round((aiData.confidence || 0.8) * 100)}%).`;
      if (aiData.warning) {
        msg += ` ${aiData.warning}`;
      } else {
        msg += ' Vui lòng kiểm tra lại điểm số trước khi bấm Lưu.';
      }
      setMessage(msg);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Không thể kết nối AI gợi ý chấm.');
    } finally {
      setAiLoading(null);
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

    const essayQuestions = (selected.questions || []).filter((q: any) => q.type === 'ESSAY');
    for (const q of essayQuestions) {
      const ans = (selected.attemptAnswers || []).find((a: any) => a.questionId === q.questionId);
      if (!ans || ans.finalScore === null || ans.finalScore === undefined) {
        showResultPopup(
          'Chưa Thể Hoàn Tất',
          `Câu hỏi "${q.code || q.content}" chưa được chấm điểm. Vui lòng chấm đủ các câu trước khi hoàn tất.`,
          'warning',
        );
        return;
      }
    }

    const isAdmin = currentUser?.role === 'ADMIN';

    setConfirmModal({
      isOpen: true,
      title: isAdmin ? 'Hoàn tất chấm & Duyệt luôn' : 'Hoàn tất chấm bài thi',
      message: isAdmin
        ? `Xác nhận hoàn tất chấm và duyệt điểm bài thi của thí sinh ${selected.student?.fullName}? Vì bạn là Admin, điểm sẽ được duyệt luôn không qua bước chờ.`
        : 'Bạn có chắc chắn muốn HOÀN TẤT CHẤM BÀI thi này? Bài thi sẽ được gửi tới ADMIN để duyệt và công bố chính thức.',
      type: 'success',
      confirmText: isAdmin ? 'Hoàn tất & Duyệt luôn' : 'Hoàn tất & Gửi duyệt',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/essay/grading/attempts/${selected.id}/submit`);
          if (isAdmin) {
            await api.post(`/essay/grading/attempts/${selected.id}/approve`);
            const msg = 'Đã hoàn tất chấm và duyệt điểm bài thi thành công!';
            setMessage(msg);
            await loadAssignments();
            await openAttempt(selected.id);
            showResultPopup('Duyệt Bài Thành Công', msg, 'success');
          } else {
            const msg = 'Đã hoàn tất chấm bài thi! Bài thi hiện đang chờ ADMIN duyệt.';
            setMessage(msg);
            await loadAssignments();
            await openAttempt(selected.id);
            showResultPopup('Hoàn Tất Chấm Bài', msg, 'success');
          }
        } catch (e: any) {
          const errMsg = e?.response?.data?.message || 'Không thể hoàn tất chấm bài.';
          setMessage(errMsg);
          showResultPopup('Không Thể Hoàn Tất', errMsg, 'danger');
        }
      },
    });
  };

  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [scheduleFilter, setScheduleFilter] = useState<string>('ALL');

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
    let all = 0, grading = 0, waiting = 0, published = 0;
    rows.forEach((r) => {
      all++;
      if (r.gradingStatus === 'PUBLISHED') published++;
      else if (r.gradingStatus === 'WAITING_APPROVAL') waiting++;
      else grading++;
    });
    return { all, grading, waiting, published };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'GRADING' && r.gradingStatus && r.gradingStatus !== 'GRADING' && r.gradingStatus !== 'IN_PROGRESS') return false;
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
  }, [rows, statusFilter, subjectFilter, dateFilter, scheduleFilter, searchQuery]);

  return (
    <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 min-h-screen text-slate-900">
      {/* Page Header (Match System Standard Header Layout) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-1">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Chấm Bài Thi Tự Luận
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              Chấm điểm và đánh giá bài làm tự luận của sinh viên theo chuẩn Rubric.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={loadAssignments}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-60 shrink-0 whitespace-nowrap"
            >
              <RotateCcw className={`h-3.5 w-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới danh sách</span>
            </button>
          </div>
        </div>

        {message && (
          <div className="rounded-lg border border-slate-300 bg-white p-3.5 text-xs font-medium text-slate-800 flex items-center justify-between shadow-xs">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-slate-400 hover:text-slate-600 font-bold ml-4">
              Đóng
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Panel: Attempt List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                    className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer select-none"
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
                  placeholder="Tìm Mã SV, Tên SV, Môn, Ca thi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-2xs"
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

              {/* Dropdown Filters Row: Môn thi & Ngày thi (Phụ thuộc lẫn nhau) */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer truncate"
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer truncate"
                >
                  <option value="ALL">Tất cả ngày thi ({availableDates.length})</option>
                  {availableDates.map((d) => (
                    <option key={d} value={d}>
                      Ngày {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Schedule / Ca thi Filter if multiple schedules exist */}
              {availableSchedules.length > 1 && (
                <div>
                  <select
                    value={scheduleFilter}
                    onChange={(e) => setScheduleFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer truncate"
                  >
                    <option value="ALL">Tất cả ca thi / lịch thi</option>
                    {availableSchedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {loading ? (
                <div className="text-center py-10 text-xs font-semibold text-slate-400">
                  <RotateCcw className="h-4 w-4 animate-spin mx-auto mb-2 text-blue-600" />
                  Đang tải danh sách bài làm...
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="text-center py-10 text-xs font-medium text-slate-400">
                  Không tìm thấy bài thi tự luận nào phù hợp bộ lọc.
                </div>
              ) : (
                <div className="space-y-2 max-h-[64vh] overflow-y-auto pr-1">
                  {filteredRows.map((row) => {
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
                        className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                          isSel
                            ? 'border-blue-500 bg-blue-50/50 border-l-4 shadow-2xs'
                            : 'border-slate-200/90 bg-white hover:bg-slate-50/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{row.student?.fullName}</span>
                          <StatusBadge status={row.gradingStatus} />
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Mã SV: <strong className="text-slate-800">{row.student?.studentCode}</strong> · Điểm: <strong className="text-slate-900 font-bold">{row.totalScore ?? 'Chưa chấm'}</strong>
                        </p>
                        <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 font-medium border-t border-slate-100 pt-1.5 mt-0.5">
                          <span className="truncate flex-1 font-semibold text-slate-700">
                            Môn: {row.onlineExamConfig?.examSchedule?.subject?.subjectName || row.subjectName || 'Môn thi'}
                            {schedCode ? ` (${schedCode})` : ''}
                          </span>
                          {dateStr && (
                            <span className="shrink-0 text-[9.5px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                              {dateStr}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Grading Form */}
          <div className="lg:col-span-8 space-y-4">
            {!selected ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 text-xs font-medium shadow-2xs">
                Vui lòng chọn bài thi từ danh sách bên trái để chấm điểm.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-5 shadow-2xs">
                {/* Header Information */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-4 flex-wrap gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{selected.student?.fullName}</h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Mã sinh viên: <strong className="text-slate-800">{selected.student?.studentCode}</strong> · Trạng thái: <span className="font-semibold text-slate-800">{selected.gradingStatus}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-mono font-black text-slate-900">
                      {selected.totalScore ?? '--'} <span className="text-xs text-slate-500 font-normal">/ {selected.maxScore || 10} điểm</span>
                    </span>
                    {selected.penaltyPoints > 0 && (
                      <p className="text-xs font-semibold text-rose-600 mt-0.5">
                        Điểm phạt: -{selected.penaltyPoints}đ ({selected.penaltyReason})
                      </p>
                    )}
                  </div>
                </div>

                {/* Essay Questions List */}
                <div className="space-y-5 max-h-[62vh] overflow-y-auto pr-1">
                  {(selected.questions || []).filter((q: any) => q.type === 'ESSAY').map((q: any, idx: number) => {
                    const ans = (selected.attemptAnswers || []).find((a: any) => a.questionId === q.questionId);

                    return (
                      <div key={q.questionId || idx} className="rounded-xl border border-slate-200/90 p-4 bg-slate-50/50 space-y-4">
                        {/* Question Title & Actions */}
                        <div className="flex justify-between items-start font-bold text-xs text-slate-900 border-b border-slate-200/60 pb-2">
                          <div className="pr-4">
                            <span className="text-slate-700 font-bold">Câu {idx + 1} (Tự luận):</span> {q.content}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setRubricQuestion({ id: q.questionId, code: `Câu ${idx + 1}`, score: q.score, rubric: q.rubric || [] })}
                              className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer shadow-2xs"
                            >
                              <Sliders className="h-3 w-3 text-slate-500" />
                              <span>Sửa Rubric</span>
                            </button>
                            <span className="text-slate-900 font-mono text-sm font-black">
                              {ans?.finalScore ?? '--'} / {q.score}đ
                            </span>
                          </div>
                        </div>

                        {/* Student Answer */}
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Bài làm của sinh viên:</div>
                          <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 whitespace-pre-wrap leading-relaxed shadow-2xs">
                            {ans?.textAnswer || <span className="italic text-slate-400">Sinh viên không nhập nội dung văn bản</span>}
                          </div>
                        </div>

                        {/* Files */}
                        {ans?.submissionFiles?.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">File đính kèm ({ans.submissionFiles.length}):</div>
                            <div className="flex gap-2 flex-wrap">
                              {ans.submissionFiles.map((f: any) => (
                                <a
                                  key={f.id}
                                  href={f.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-blue-700 text-xs font-semibold hover:bg-blue-50 transition shadow-2xs"
                                >
                                  <span>Tải file: {f.fileName} ({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AI Suggest Button */}
                        {ans && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleAiSuggest(ans, q)}
                              disabled={Boolean(aiLoading)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition disabled:opacity-50 cursor-pointer active:scale-95"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-blue-100" />
                              <span>{aiLoading === ans.id ? 'Đang phân tích...' : 'AI Gợi Ý Chấm'}</span>
                            </button>
                          </div>
                        )}

                        {/* Rubric Criteria Table */}
                        {q.rubric?.length > 0 ? (
                          <div className="space-y-2 pt-1">
                            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Tiêu chí chấm Rubric:</div>
                            <div className="space-y-2">
                              {q.rubric.map((r: any) => (
                                <div key={r.id} className="bg-white p-3 rounded-xl border border-slate-200/90 space-y-2 shadow-2xs">
                                  <div className="flex justify-between items-start text-xs">
                                    <div>
                                      <span className="font-bold text-slate-900">{r.label}</span>
                                      {r.description && <p className="text-[11px] text-slate-500 mt-0.5">{r.description}</p>}
                                    </div>
                                    <span className="font-mono text-xs font-bold text-slate-600 shrink-0 ml-2">Tối đa {r.maxScore}đ</span>
                                  </div>

                                  <div className="flex gap-2 items-center">
                                    <input
                                      type="number"
                                      step={0.25}
                                      min={0}
                                      max={r.maxScore}
                                      placeholder="Điểm"
                                      value={scores[r.id] ?? ''}
                                      onChange={(e) => handleScoreChange(r.id, e.target.value, r.maxScore)}
                                      className="w-24 bg-slate-50/50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold font-mono text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Nhận xét tiêu chí..."
                                      value={comments[r.id] || ''}
                                      onChange={(e) => setComments((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                      className="flex-1 bg-slate-50/50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
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
                              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                            >
                              Cấu hình Rubric ngay
                            </button>
                          </div>
                        )}

                        {/* Overall Teacher Comment */}
                        <div className="space-y-1 pt-1">
                          <label className="text-[10px] font-bold uppercase text-slate-500">Nhận xét tổng quát câu hỏi:</label>
                          <input
                            type="text"
                            placeholder="Nhập nhận xét tổng quát cho câu tự luận này..."
                            value={teacherComments[q.questionId] || ''}
                            onChange={(e) => setTeacherComments((prev) => ({ ...prev, [q.questionId]: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none shadow-2xs"
                          />
                        </div>

                        {/* Save Question Grade */}
                        {ans && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => gradeQuestionAnswer(ans, q)}
                              disabled={saving}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-2xs"
                            >
                              <Save className="h-3.5 w-3.5 text-slate-300" />
                              <span>Lưu điểm câu hỏi</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Action Footer */}
                <div className="border-t border-slate-100 pt-4 flex justify-between items-center flex-wrap gap-3">
                  <div className="text-xs text-slate-500 font-medium">
                    {currentUser?.role === 'ADMIN'
                      ? 'Admin có thể duyệt điểm luôn sau khi chấm xong, không cần qua bước chờ.'
                      : 'Sau khi hoàn tất chấm tất cả các câu, bấm nút bên phải để gửi bài thi lên ADMIN duyệt.'}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCompleteGrading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs hover:shadow-xs active:scale-95 transition cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4 text-blue-100" />
                      <span>
                        {currentUser?.role === 'ADMIN'
                          ? 'Hoàn tất chấm & Duyệt luôn'
                          : 'Hoàn tất chấm & Gửi ADMIN duyệt'}
                      </span>
                    </button>
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
