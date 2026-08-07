'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { ConfirmModal } from '../../../components/ConfirmModal';
import {
  FileCheck,
  Send,
  Download,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  BookOpen,
  Loader2,
  Save,
} from 'lucide-react';

export default function TeacherEssayGradingPage() {
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

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'success' | 'warning' | 'info';
    confirmText?: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'info', confirmText: 'Xác nhận', onConfirm: () => {} });

  const loadAssignments = async () => {
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
  };

  useEffect(() => {
    loadAssignments();
  }, [attemptIdParam]);

  const openAttempt = async (id: string) => {
    try {
      const res = await api.get(`/essay/grading/attempts/${id}`, { params: { noCache: true } });
      const attemptData = res.data;
      setSelected(attemptData);
      setMessage('');

      // Populate existing scores and comments
      const initScores: Record<string, number> = {};
      const initComments: Record<string, string> = {};
      const initTeacherComments: Record<string, string> = {};

      (attemptData.attemptAnswers || []).forEach((ans: any) => {
        if (ans.teacherComment) {
          initTeacherComments[ans.questionId] = ans.teacherComment;
        }
        (ans.essayGrades || []).forEach((g: any) => {
          initScores[g.criterionId] = g.score;
          if (g.comment) initComments[g.criterionId] = g.comment;
        });
      });

      setScores(initScores);
      setComments(initComments);
      setTeacherComments(initTeacherComments);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Không thể tải bài làm.');
    }
  };

  const handleScoreChange = (criterionId: string, val: string, maxScore: number) => {
    const num = Number(val);
    if (isNaN(num)) return;
    if (num < 0) {
      alert('Điểm số không được nhỏ hơn 0.');
      return;
    }
    if (num > maxScore) {
      alert(`Điểm số không được vượt quá điểm tối đa của tiêu chí (${maxScore}đ).`);
      return;
    }
    setScores((prev) => ({ ...prev, [criterionId]: num }));
  };

  const gradeQuestionAnswer = async (answer: any, question: any) => {
    const rubric = question.rubric || [];
    if (!rubric.length) {
      alert('Câu hỏi này chưa được cài đặt Rubric chấm điểm.');
      return;
    }

    // Kiểm tra xem đã nhập đủ tất cả các tiêu chí chưa
    for (const r of rubric) {
      if (scores[r.id] === undefined || scores[r.id] === null) {
        alert(`Vui lòng nhập điểm cho tiêu chí "${r.label}".`);
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

      let msg = `✨ AI đã đề xuất điểm (Độ tin cậy: ${Math.round((aiData.confidence || 0.8) * 100)}%).`;
      if (aiData.warning) {
        msg += ` Cảnh báo: ${aiData.warning}`;
      }
      msg += ' Vui lòng kiểm tra lại trước khi bấm Lưu.';
      setMessage(msg);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Không thể kết nối AI gợi ý chấm.');
    } finally {
      setAiLoading(null);
    }
  };

  const handleCompleteGrading = () => {
    if (!selected) return;

    // Check if all essay questions have scores
    const essayQuestions = (selected.questions || []).filter((q: any) => q.type === 'ESSAY');
    for (const q of essayQuestions) {
      const ans = (selected.attemptAnswers || []).find((a: any) => a.questionId === q.questionId);
      if (!ans || ans.finalScore === null || ans.finalScore === undefined) {
        alert(`Câu hỏi "${q.code || q.content}" chưa được chấm điểm. Vui lòng chấm đủ các câu trước khi hoàn tất.`);
        return;
      }
    }

    setConfirmModal({
      isOpen: true,
      title: 'Hoàn tất chấm bài thi',
      message: 'Bạn có chắc chắn muốn HOÀN TẤT CHẤM BÀI thi này? Bài thi sẽ được gửi tới ADMIN để duyệt và công bố chính thức.',
      type: 'success',
      confirmText: 'Hoàn tất & Gửi duyệt',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/essay/grading/attempts/${selected.id}/submit`);
          setMessage('Đã hoàn tất chấm bài thi! Bài thi hiện đang chờ ADMIN duyệt.');
          await loadAssignments();
          await openAttempt(selected.id);
        } catch (e: any) {
          setMessage(e?.response?.data?.message || 'Không thể hoàn tất chấm bài.');
        }
      },
    });
  };

  const isTeacher = currentUser?.role === 'TEACHER';
  const isAdmin = currentUser?.role === 'ADMIN';

  const filteredRows = rows.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const code = (r.student?.studentCode || '').toLowerCase();
      const name = (r.student?.fullName || '').toLowerCase();
      return code.includes(q) || name.includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <FileCheck className="w-7 h-7 text-violet-600" />
              Chấm Bài Thi Tự Luận
            </h1>
            <p className="text-sm text-slate-500">
              Chấm điểm bài làm tự luận của sinh viên theo tiêu chí Rubric chuẩn hóa.
            </p>
          </div>
          <button
            onClick={loadAssignments}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            Làm mới danh sách
          </button>
        </div>

        {message && (
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm font-semibold text-violet-800 flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-violet-500 hover:text-violet-700">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <input
                type="text"
                placeholder="Tìm Mã SV hoặc Họ tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-500"
              />

              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="text-center py-10 text-xs font-semibold text-slate-400">
                  Không có bài thi tự luận nào cần chấm.
                </div>
              ) : (
                <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                  {filteredRows.map((row) => {
                    const isSel = selected?.id === row.id;
                    const stCls =
                      row.gradingStatus === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : row.gradingStatus === 'WAITING_APPROVAL'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200';

                    return (
                      <button
                        key={row.id}
                        onClick={() => openAttempt(row.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition ${
                          isSel ? 'border-violet-500 bg-violet-50/40 shadow-xs' : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-xs text-slate-900">{row.student?.fullName}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${stCls}`}>
                            {row.gradingStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Mã SV: {row.student?.studentCode} · Điểm: <strong className="text-slate-800">{row.totalScore ?? 'Chưa chấm'}</strong>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Môn: {row.onlineExamConfig?.examSchedule?.subject?.subjectName || 'Môn thi'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Grading Work Area */}
          <div className="lg:col-span-8 space-y-4">
            {!selected ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm font-semibold">
                Chọn một bài thi ở danh sách bên trái để mở giao diện chấm điểm chi tiết.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
                {/* Header Info */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-4 flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selected.student?.fullName}</h2>
                    <p className="text-xs text-slate-500 font-mono">
                      Mã SV: {selected.student?.studentCode} · Trạng thái bài thi: <span className="font-bold text-violet-700">{selected.gradingStatus}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-mono font-black text-violet-700">
                      {selected.totalScore ?? '--'} <span className="text-xs text-slate-500 font-bold">/ {selected.maxScore || 10}đ</span>
                    </span>
                    {selected.penaltyPoints > 0 && (
                      <p className="text-xs font-bold text-rose-600">Phạt: -{selected.penaltyPoints}đ ({selected.penaltyReason})</p>
                    )}
                  </div>
                </div>

                {/* Essay Questions List */}
                <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-1">
                  {(selected.questions || []).filter((q: any) => q.type === 'ESSAY').map((q: any, idx: number) => {
                    const ans = (selected.attemptAnswers || []).find((a: any) => a.questionId === q.questionId);

                    return (
                      <div key={q.questionId || idx} className="rounded-2xl border border-violet-200 p-5 bg-violet-50/20 space-y-4">
                        {/* Question title & score */}
                        <div className="flex justify-between items-start font-bold text-sm text-slate-900 border-b border-violet-100 pb-2">
                          <div>
                            <span className="text-violet-700 font-black">Câu {idx + 1} (Tự luận):</span> {q.content}
                          </div>
                          <span className="text-violet-700 font-mono text-base font-black shrink-0 ml-2">
                            {ans?.finalScore ?? '--'} / {q.score}đ
                          </span>
                        </div>

                        {/* Student Rich-Text Answer */}
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Bài làm sinh viên:</p>
                          <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 whitespace-pre-wrap leading-relaxed shadow-2xs">
                            {ans?.textAnswer || <span className="italic text-slate-400">Sinh viên không nhập nội dung bài làm</span>}
                          </div>
                        </div>

                        {/* Files */}
                        {ans?.submissionFiles?.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">File đính kèm ({ans.submissionFiles.length}):</p>
                            <div className="flex gap-2 flex-wrap">
                              {ans.submissionFiles.map((f: any) => (
                                <a
                                  key={f.id}
                                  href={f.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-violet-200 text-violet-700 text-xs font-bold hover:bg-violet-50 shadow-2xs transition"
                                >
                                  <Download className="w-3.5 h-3.5 text-violet-600" />
                                  {f.fileName} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AI Suggest Button */}
                        {ans && (
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleAiSuggest(ans, q)}
                              disabled={Boolean(aiLoading)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition shadow-2xs disabled:opacity-50"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              {aiLoading === ans.id ? 'AI đang phân tích...' : '✨ AI Gợi Ý Chấm'}
                            </button>
                          </div>
                        )}

                        {/* Rubric Criteria Table */}
                        {q.rubric?.length > 0 ? (
                          <div className="space-y-3 pt-2">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Chấm theo tiêu chí Rubric:</p>
                            <div className="space-y-2">
                              {q.rubric.map((r: any) => (
                                <div key={r.id} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                                  <div className="flex justify-between items-start text-xs">
                                    <div>
                                      <span className="font-bold text-slate-900">{r.label}</span>
                                      {r.description && <p className="text-[11px] text-slate-500">{r.description}</p>}
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
                                      className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold font-mono text-slate-800 focus:outline-none focus:border-violet-500"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Nhận xét tiêu chí..."
                                      value={comments[r.id] || ''}
                                      onChange={(e) => setComments((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-violet-500"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800">
                            Câu hỏi này chưa được cài đặt Rubric.
                          </div>
                        )}

                        {/* Overall Teacher Comment for this question */}
                        <div className="space-y-1 pt-1">
                          <label className="text-[10px] font-bold uppercase text-slate-500">Nhận xét tổng câu hỏi:</label>
                          <input
                            type="text"
                            placeholder="Nhập nhận xét tổng quát cho câu tự luận này..."
                            value={teacherComments[q.questionId] || ''}
                            onChange={(e) => setTeacherComments((prev) => ({ ...prev, [q.questionId]: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                          />
                        </div>

                        {/* Save Question Grade */}
                        {ans && (
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => gradeQuestionAnswer(ans, q)}
                              disabled={saving}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-2xs"
                            >
                              <Save className="w-3.5 h-3.5" /> Lưu điểm câu hỏi
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Action Footer */}
                <div className="border-t border-slate-200 pt-4 flex justify-between items-center flex-wrap gap-3">
                  <div className="text-xs text-slate-500 font-semibold">
                    Sau khi chấm xong tất cả các câu, bấm nút bên phải để gửi kết quả bài làm lên ADMIN duyệt.
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCompleteGrading}
                      className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-2xs transition cursor-pointer"
                    >
                      <Send className="w-4 h-4" /> Hoàn tất chấm & Gửi ADMIN duyệt
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
