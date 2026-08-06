'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { ConfirmModal } from '../../../components/ConfirmModal';

export default function EssayGradingPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'success' | 'warning' | 'info';
    confirmText?: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'info', confirmText: 'Xác nhận', onConfirm: () => {} });

  const load = async () => {
    setLoading(true);
    try { const res = await api.get('/essay/grading/assignments', { params: { noCache: true } }); setRows(res.data || []); }
    catch (e: any) { setMessage(e?.response?.data?.message || 'Không thể tải danh sách bài tự luận'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const open = async (id: string) => {
    try { const res = await api.get(`/essay/grading/attempts/${id}`, { params: { noCache: true } }); setSelected(res.data); setMessage(''); }
    catch (e: any) { setMessage(e?.response?.data?.message || 'Không thể tải bài làm'); }
  };
  const grade = async (answer: any) => {
    const criteria = (selected.questions.find((q: any) => q.questionId === answer.questionId)?.rubric || []).map((r: any) => ({ criterionId: r.id, score: Number(scores[r.id] || 0), comment: comments[r.id] || '' }));
    await api.patch(`/essay/grading/answers/${answer.id}`, { criteria });
    setMessage('Đã lưu điểm câu trả lời');
    await open(selected.id);
  };
  const complete = () => {
    if (!selected) return;
    setConfirmModal({
      isOpen: true,
      title: 'Hoàn tất chấm bài',
      message: 'Bạn có chắc chắn muốn hoàn tất chấm bài này? Sau khi hoàn tất, điểm sẽ được gửi lên ADMIN duyệt và bạn không thể chỉnh sửa nữa.',
      type: 'success',
      confirmText: 'Hoàn tất',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/essay/grading/attempts/${selected.id}/submit`);
          setMessage('Đã hoàn tất chấm, chờ ADMIN duyệt');
          await load();
          await open(selected.id);
        } catch (e: any) {
          setMessage(e?.response?.data?.message || 'Không thể hoàn tất chấm bài');
        }
      },
    });
  };
  const approve = (publish = false) => {
    if (!selected) return;
    setConfirmModal({
      isOpen: true,
      title: publish ? 'Công bố điểm' : 'Duyệt điểm',
      message: publish
        ? 'Bạn có chắc chắn muốn công bố điểm bài này? Điểm sẽ được gửi tới sinh viên và không thể hoàn tác.'
        : 'Bạn có chắc chắn muốn duyệt điểm bài này? Sau khi duyệt, điểm sẽ được ghi nhận chính thức.',
      type: publish ? 'warning' : 'success',
      confirmText: publish ? 'Công bố' : 'Duyệt',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/essay/grading/attempts/${selected.id}/${publish ? 'publish' : 'approve'}`);
          setMessage(publish ? 'Đã công bố điểm' : 'Đã duyệt điểm');
          await load();
          await open(selected.id);
        } catch (e: any) {
          setMessage(e?.response?.data?.message || 'Không thể xử lý yêu cầu');
        }
      },
    });
  };

  return <div className="min-h-screen bg-slate-50 p-6 md:p-8 text-slate-900">
    <div className="mx-auto max-w-7xl space-y-6">
      <div><h1 className="text-2xl font-black">Chấm bài tự luận</h1><p className="text-sm text-slate-500">Chấm theo rubric, lưu nháp và gửi ADMIN duyệt.</p></div>
      {message && <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">{message}</div>}
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border bg-white p-4 shadow-sm"><h2 className="mb-3 font-bold">Bài chờ chấm</h2>{loading ? <p>Đang tải...</p> : rows.length === 0 ? <p className="text-sm text-slate-500">Chưa có bài.</p> : <div className="space-y-2">{rows.map((r) => <button key={r.id} onClick={() => open(r.id)} className={`w-full rounded-xl border p-3 text-left hover:border-blue-400 ${selected?.id === r.id ? 'border-blue-500 bg-blue-50' : ''}`}><div className="font-bold">{r.student?.fullName || r.student?.user?.fullName || 'Sinh viên'}</div><div className="text-xs text-slate-500">{r.status} · {r.gradingStatus || 'Chưa chấm'}</div></button>)}</div>}</section>
        <section className="rounded-2xl border bg-white p-6 shadow-sm">{!selected ? <div className="py-20 text-center text-slate-500">Chọn một bài để bắt đầu chấm.</div> : <div className="space-y-6"><div><h2 className="text-xl font-black">Bài làm của {selected.student?.fullName || selected.student?.user?.fullName || 'sinh viên'}</h2><p className="text-sm text-slate-500">Trạng thái: {selected.gradingStatus || selected.status}</p></div>{selected.attemptAnswers?.map((answer: any, index: number) => { const q = selected.questions.find((x: any) => x.questionId === answer.questionId); return <div key={answer.id} className="rounded-xl border p-4"><div className="mb-3 font-bold">Câu {index + 1}: {q?.content}</div><div className="mb-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm">{answer.textAnswer || 'Không có nội dung'}</div>{(q?.rubric || []).map((rubric: any) => <div key={rubric.id} className="mb-2 grid gap-2 sm:grid-cols-[1fr_120px]"><label className="text-sm">{rubric.label} <span className="text-slate-400">({rubric.maxScore} điểm)</span></label><input type="number" min="0" max={rubric.maxScore} value={scores[rubric.id] ?? ''} onChange={(e) => setScores((s) => ({ ...s, [rubric.id]: Number(e.target.value) }))} className="rounded-lg border px-2 py-1" /></div>)}<button onClick={() => grade(answer)} className="mt-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white">Lưu điểm câu</button></div>})}<div className="flex flex-wrap gap-2"><button onClick={complete} className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white">Hoàn tất chấm</button><button onClick={() => approve(false)} className="rounded-lg border px-4 py-2 font-bold">Duyệt (ADMIN)</button><button onClick={() => approve(true)} className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white">Công bố (ADMIN)</button></div></div>}</section>
      </div>
    </div>
    <ConfirmModal
      isOpen={confirmModal.isOpen}
      onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      onConfirm={() => confirmModal.onConfirm()}
      title={confirmModal.title}
      message={confirmModal.message}
      type={confirmModal.type}
      confirmText={confirmModal.confirmText}
    />
  </div>;
}
