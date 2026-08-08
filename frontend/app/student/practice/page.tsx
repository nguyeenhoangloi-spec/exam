'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Toast } from '../../../components/Toast';
import { ConfirmModal } from '../../../components/ConfirmModal';
import api from '../../../lib/api';
import { getAuthUser } from '../../../lib/auth';
import { BookOpen, CheckCircle2, Loader2, Play, Send } from 'lucide-react';

type Subject = { id: number; subjectName: string; subjectCode?: string };
type Option = { id: string; content: string };
type PracticeQuestion = { id: string; content: string; type?: string; options?: Option[] };
type Session = { sessionId: string; title?: string; questions: PracticeQuestion[] };

export default function PracticePage() {
  usePageTitle('Luyện tập tự do');
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [questionCount, setQuestionCount] = useState(20);
  const [session, setSession] = useState<Session | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const current = getAuthUser();
    if (!current) {
      router.replace('/login');
      return;
    }
    if (current.role !== 'STUDENT') {
      router.replace('/dashboard');
      return;
    }
    setUser(current);
    api.get<Subject[]>('/subjects')
      .then((response) => {
        setSubjects(response.data || []);
        if (response.data?.[0]) setSubjectId(String(response.data[0].id));
      })
      .catch((error) => setToast({ message: error.message || 'Không thể tải danh sách môn học', type: 'error' }))
      .finally(() => setLoading(false));
  }, [router]);

  const startPractice = async () => {
    if (!subjectId) return setToast({ message: 'Vui lòng chọn môn học', type: 'error' });
    try {
      setWorking(true);
      const response = await api.post<Session>('/practice/generate', { subjectId: Number(subjectId), questionCount, durationMinutes: 30 });
      setSession(response.data);
      setAnswers({});
      setResult(null);
    } catch (error: any) {
      setToast({ message: error.message || 'Không thể tạo bài luyện tập', type: 'error' });
    } finally {
      setWorking(false);
    }
  };

  const toggleAnswer = (questionId: string, optionId: string, single: boolean) => {
    setAnswers((current) => {
      const selected = current[questionId] || [];
      if (single) return { ...current, [questionId]: [optionId] };
      return { ...current, [questionId]: selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId] };
    });
  };

  const submitPractice = async () => {
    if (!session || working) return;
    try {
      setWorking(true);
      const response = await api.post(`/practice/${session.sessionId}/submit`, { answers });
      setResult(response.data);
      setSession(null);
      setToast({ message: 'Đã nộp bài luyện tập và chấm kết quả thành công.', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Không thể nộp bài luyện tập', type: 'error' });
    } finally {
      setWorking(false);
    }
  };

  const answeredCount = session
    ? session.questions.filter((question) => (answers[question.id] || []).length > 0).length
    : 0;

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><BookOpen className="text-blue-600" /> Luyện tập tự do</h1>
          <p className="mt-1 text-sm text-slate-500">Tạo bài luyện tập theo môn học, làm bài và nhận kết quả ngay.</p>
        </div>

        {!session && !result && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Môn học
                <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} disabled={loading} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal">
                  {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.subjectName}{subject.subjectCode ? ` (${subject.subjectCode})` : ''}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">Số câu hỏi
                <select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal">
                  {[10, 20, 30, 40].map((count) => <option key={count} value={count}>{count} câu</option>)}
                </select>
              </label>
            </div>
            <button onClick={startPractice} disabled={working || loading || !subjects.length} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Bắt đầu luyện tập
            </button>
          </div>
        )}

        {session && (
          <div className="space-y-4">
            {session.questions.map((question, index) => {
              const single = question.type !== 'MULTIPLE_CHOICE';
              return <div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-900">Câu {index + 1}. {question.content}</p>
                <div className="mt-3 space-y-2">{(question.options || []).map((option) => <label key={option.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 p-3 text-sm hover:bg-slate-50">
                  <input type={single ? 'radio' : 'checkbox'} name={`question-${question.id}`} checked={(answers[question.id] || []).includes(option.id)} onChange={() => toggleAnswer(question.id, option.id, single)} /> {option.content}
                </label>)}</div>
              </div>;
            })}
            <button onClick={() => setShowSubmitConfirm(true)} disabled={working} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><Send className="h-4 w-4" /> Nộp bài luyện tập</button>
          </div>
        )}

        {result && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /><h2 className="mt-3 text-2xl font-bold text-slate-900">Hoàn thành bài luyện tập</h2><p className="mt-2 text-slate-700">Điểm: <strong>{result.totalScore ?? result.score ?? 0}</strong> / {result.maxScore ?? 10}</p><button onClick={() => setResult(null)} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Tạo bài mới</button></div>}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmModal
        isOpen={showSubmitConfirm}
        isLoading={working}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={() => {
          setShowSubmitConfirm(false);
          void submitPractice();
        }}
        title="Xác nhận nộp bài luyện tập"
        message={`Bạn đã trả lời ${answeredCount}/${session?.questions.length ?? 0} câu. Sau khi nộp, phiên luyện tập này sẽ được chấm và không thể sửa đáp án.`}
        type="warning"
        confirmText="Nộp bài"
        cancelText="Tiếp tục làm bài"
      />
    </>
  );
}
