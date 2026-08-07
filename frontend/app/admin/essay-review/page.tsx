'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { ConfirmModal } from '../../../components/ConfirmModal';
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
} from 'lucide-react';

export default function AdminEssayReviewPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action inputs
  const [actionReason, setActionReason] = useState<string>('');
  const [extraMinutes, setExtraMinutes] = useState<number>(15);
  const [penaltyInput, setPenaltyInput] = useState<number>(0);

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
      const res = await api.get('/essay/grading/assignments', { params: { noCache: true } });
      setRows(res.data || []);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Không thể tải danh sách bài tự luận.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const openAttempt = async (id: string) => {
    try {
      const res = await api.get(`/essay/grading/attempts/${id}`, { params: { noCache: true } });
      setSelected(res.data);
      setMessage('');
      setActionReason('');
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Không thể tải bài làm.');
    }
  };

  const handleApprove = (publish = false) => {
    if (!selected) return;
    setConfirmModal({
      isOpen: true,
      title: publish ? 'Công bố điểm chính thức' : 'Duyệt điểm bài thi',
      message: publish
        ? `Bạn có chắc chắn muốn CÔNG BỐ điểm bài thi của thí sinh ${selected.student?.fullName}? Sau khi công bố, sinh viên sẽ nhìn thấy điểm số và kết quả bài làm.`
        : `Xác nhận duyệt điểm bài thi của thí sinh ${selected.student?.fullName}?`,
      type: publish ? 'warning' : 'success',
      confirmText: publish ? 'Công bố ngay' : 'Duyệt điểm',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/essay/grading/attempts/${selected.id}/${publish ? 'publish' : 'approve'}`);
          setMessage(publish ? 'Đã công bố điểm cho Sinh viên thành công.' : 'Đã duyệt điểm bài thi.');
          await loadAssignments();
          await openAttempt(selected.id);
        } catch (e: any) {
          setMessage(e?.response?.data?.message || 'Thao tác không thành công.');
        }
      },
    });
  };

  const handleReturn = () => {
    if (!selected) return;
    if (!actionReason.trim()) {
      alert('Vui lòng nhập lý do trả lại bài thi để Giảng viên chấm lại.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Trả lại bài thi để chấm lại',
      message: `Bạn có chắc chắn muốn trả lại bài thi của ${selected.student?.fullName} cho Giảng viên chấm lại? Lý do: "${actionReason}"`,
      type: 'danger',
      confirmText: 'Trả lại chấm lại',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/essay/grading/attempts/${selected.id}/return`, { reason: actionReason });
          setMessage('Đã yêu cầu Giảng viên chấm lại bài thi.');
          await loadAssignments();
          await openAttempt(selected.id);
        } catch (e: any) {
          setMessage(e?.response?.data?.message || 'Không thể trả lại bài thi.');
        }
      },
    });
  };

  const handleReopen = () => {
    if (!selected) return;
    if (!actionReason.trim()) {
      alert('Vui lòng nhập lý do mở lại bài thi.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Mở lại phiên bài thi',
      message: `Xác nhận mở lại phiên thi cho sinh viên ${selected.student?.fullName}? Lý do: "${actionReason}"`,
      type: 'warning',
      confirmText: 'Mở lại bài thi',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/essay/grading/attempts/${selected.id}/reopen`, { reason: actionReason });
          setMessage('Đã mở lại bài thi cho sinh viên tiếp tục.');
          await loadAssignments();
          await openAttempt(selected.id);
        } catch (e: any) {
          setMessage(e?.response?.data?.message || 'Không thể mở lại bài thi.');
        }
      },
    });
  };

  const handleExtend = () => {
    if (!selected) return;
    if (extraMinutes <= 0) {
      alert('Số phút gia hạn phải lớn hơn 0.');
      return;
    }
    if (!actionReason.trim()) {
      alert('Vui lòng nhập lý do gia hạn thời gian.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: `Gia hạn ${extraMinutes} phút`,
      message: `Gia hạn thêm ${extraMinutes} phút làm bài cho ${selected.student?.fullName}? Lý do: "${actionReason}"`,
      type: 'info',
      confirmText: 'Gia hạn ngay',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/essay/grading/attempts/${selected.id}/extend-time`, {
            reason: actionReason,
            extraMinutes: Number(extraMinutes),
          });
          setMessage(`Đã gia hạn thêm ${extraMinutes} phút.`);
          await loadAssignments();
          await openAttempt(selected.id);
        } catch (e: any) {
          setMessage(e?.response?.data?.message || 'Không thể gia hạn.');
        }
      },
    });
  };

  const handlePenalty = () => {
    if (!selected) return;
    if (penaltyInput < 0) {
      alert('Điểm phạt không được âm.');
      return;
    }
    if (!actionReason.trim()) {
      alert('Vui lòng nhập lý do áp dụng điểm phạt.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: `Trừ ${penaltyInput} điểm`,
      message: `Xác nhận trừ ${penaltyInput} điểm của bài thi ${selected.student?.fullName}? Lý do: "${actionReason}"`,
      type: 'danger',
      confirmText: 'Trừ điểm',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/essay/grading/attempts/${selected.id}/penalty`, {
            reason: actionReason,
            penaltyPoints: Number(penaltyInput),
          });
          setMessage(`Đã áp dụng điểm phạt ${penaltyInput} điểm.`);
          await loadAssignments();
          await openAttempt(selected.id);
        } catch (e: any) {
          setMessage(e?.response?.data?.message || 'Không thể trừ điểm.');
        }
      },
    });
  };

  const filteredRows = rows.filter((r) => {
    if (statusFilter !== 'ALL' && r.gradingStatus !== statusFilter) return false;
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
              <ShieldCheck className="w-7 h-7 text-blue-600" />
              Quản Lý & Duyệt Điểm Bài Thi Tự Luận
            </h1>
            <p className="text-sm text-slate-500">
              Khu vực dành cho ADMIN duyệt điểm, công bố kết quả, trả lại chấm lại hoặc xử lý vi phạm.
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
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-800 flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-blue-500 hover:text-blue-700">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tìm theo Mã SV hoặc Họ tên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="WAITING_APPROVAL">Chờ duyệt (WAITING_APPROVAL)</option>
                  <option value="UNDER_GRADING">Đang chấm (UNDER_GRADING)</option>
                  <option value="PUBLISHED">Đã công bố (PUBLISHED)</option>
                </select>
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="text-center py-10 text-xs font-semibold text-slate-400">
                  Không có bài thi nào phù hợp bộ lọc.
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
                          isSel ? 'border-blue-500 bg-blue-50/40 shadow-xs' : 'border-slate-200 bg-white hover:bg-slate-50'
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

          {/* Right panel: Detail & Admin Controls */}
          <div className="lg:col-span-7 space-y-4">
            {!selected ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm font-semibold">
                Chọn một bài thi ở danh sách bên trái để xem chi tiết và thực hiện các thao tác quản trị.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
                {/* Attempt Meta */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-4 flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selected.student?.fullName}</h2>
                    <p className="text-xs text-slate-500 font-mono">
                      Mã SV: {selected.student?.studentCode} · Lớp: {selected.student?.className || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-mono font-black text-blue-700">
                      {selected.totalScore ?? '--'} <span className="text-xs text-slate-500 font-bold">/ {selected.maxScore || 10}đ</span>
                    </span>
                    {selected.penaltyPoints > 0 && (
                      <p className="text-xs font-bold text-rose-600">Phạt: -{selected.penaltyPoints}đ ({selected.penaltyReason})</p>
                    )}
                  </div>
                </div>

                {/* Answers & Rubric Details */}
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                  {(selected.questions || []).filter((q: any) => q.type === 'ESSAY').map((q: any, idx: number) => {
                    const ans = (selected.attemptAnswers || []).find((a: any) => a.questionId === q.questionId);
                    return (
                      <div key={q.questionId || idx} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                        <div className="flex justify-between font-bold text-xs text-slate-900 border-b border-slate-200 pb-2">
                          <span>Câu {idx + 1}: {q.content}</span>
                          <span className="text-blue-600 font-mono">{ans?.finalScore ?? '--'} / {q.score}đ</span>
                        </div>

                        {/* Student Answer */}
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Bài làm sinh viên:</p>
                          <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap">
                            {ans?.textAnswer || <span className="italic text-slate-400">Không có văn bản</span>}
                          </div>
                        </div>

                        {/* Files */}
                        {ans?.submissionFiles?.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase text-slate-400">File đính kèm:</p>
                            <div className="flex gap-2 flex-wrap">
                              {ans.submissionFiles.map((f: any) => (
                                <a
                                  key={f.id}
                                  href={f.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100 transition"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  {f.fileName} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rubric Grades */}
                        {q.rubric?.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-200">
                            <p className="text-[10px] font-bold uppercase text-slate-400">Điểm theo Rubric:</p>
                            {q.rubric.map((r: any) => {
                              const g = (ans?.essayGrades || []).find((item: any) => item.criterionId === r.id);
                              return (
                                <div key={r.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                                  <div>
                                    <span className="font-bold text-slate-800">{r.label}: </span>
                                    <span className="text-slate-600">{g?.comment || 'Không có nhận xét'}</span>
                                  </div>
                                  <span className="font-mono font-bold text-emerald-700">{g?.score ?? 0} / {r.maxScore}đ</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* AI Suggestion */}
                        {ans?.aiSuggestedScore !== undefined && ans?.aiSuggestedScore !== null && (
                          <div className="p-3 rounded-lg bg-violet-50 border border-violet-200 text-xs text-violet-900 space-y-1">
                            <div className="flex justify-between font-bold">
                              <span>✨ AI Đề xuất: {ans.aiSuggestedScore}đ</span>
                              <span>Tin cậy: {Math.round((ans.aiConfidence || 0) * 100)}%</span>
                            </div>
                            {ans.aiSuggestedComment && <p className="text-[11px] text-violet-800">{ans.aiSuggestedComment}</p>}
                          </div>
                        )}

                        {/* Score History */}
                        {ans?.gradeHistories?.length > 0 && (
                          <div className="p-3 rounded-lg bg-slate-100 text-xs space-y-1">
                            <p className="font-bold text-slate-600 flex items-center gap-1">
                              <History className="w-3.5 h-3.5" /> Lịch sử chỉnh điểm ({ans.gradeHistories.length})
                            </p>
                            {ans.gradeHistories.map((h: any) => (
                              <div key={h.id} className="text-[11px] text-slate-600 border-b border-slate-200 pb-1">
                                {new Date(h.createdAt).toLocaleString('vi-VN')}: Điểm cũ {h.oldScore ?? '--'} → Điểm mới {h.newScore}đ ({h.reason || 'Sửa điểm'}) bởi {h.actor?.username}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Admin Actions Panel */}
                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Thao Tác Quản Trị ADMIN</h3>

                  {/* Input reason */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Lý do thao tác (Bắt buộc khi Trả lại, Gia hạn, Mở lại, Trừ điểm):</label>
                    <input
                      type="text"
                      placeholder="Nhập chi tiết lý do..."
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleApprove(false)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-2xs transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt điểm
                    </button>
                    <button
                      onClick={() => handleApprove(true)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-2xs transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Công bố điểm
                    </button>
                    <button
                      onClick={handleReturn}
                      className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-2xs transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Trả lại chấm lại
                    </button>
                    <button
                      onClick={handleReopen}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-2xs transition cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" /> Mở lại bài thi
                    </button>
                  </div>

                  {/* Extend & Penalty Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <input
                        type="number"
                        min={1}
                        max={240}
                        value={extraMinutes}
                        onChange={(e) => setExtraMinutes(Number(e.target.value))}
                        className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-bold"
                      />
                      <span className="text-xs text-slate-600 font-semibold">phút</span>
                      <button
                        onClick={handleExtend}
                        className="ml-auto px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                      >
                        Gia hạn
                      </button>
                    </div>

                    <div className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={penaltyInput}
                        onChange={(e) => setPenaltyInput(Number(e.target.value))}
                        className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-bold"
                      />
                      <span className="text-xs text-slate-600 font-semibold">đ phạt</span>
                      <button
                        onClick={handlePenalty}
                        className="ml-auto px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                      >
                        Trừ điểm
                      </button>
                    </div>
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
