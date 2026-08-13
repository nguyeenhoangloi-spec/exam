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
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[13px] font-semibold tracking-wide">
              <BookOpen className="w-3.5 h-3.5" />
              Luyện Tập Kiến Thức
            </div>
            <h1 className="text-[28px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Luyện tập tự do
            </h1>
            <p className="text-[15px] font-normal text-slate-500 dark:text-slate-400">
              Tạo bài luyện tập theo môn học, tự làm bài trắc nghiệm và nhận kết quả chấm điểm ngay.
            </p>
          </div>
        </div>

        {!session && !result && (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-5 max-w-3xl">
            <h3 className="text-[20px] font-semibold text-slate-900 dark:text-slate-100">Cấu hình bài luyện tập</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-[15px] font-medium text-slate-900 dark:text-slate-100 space-y-1.5 block">
                <span>Chọn Môn học</span>
                <select
                  value={subjectId}
                  onChange={(event) => setSubjectId(event.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-[15px] font-medium text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none transition cursor-pointer"
                >
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subjectName}{subject.subjectCode ? ` (${subject.subjectCode})` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[15px] font-medium text-slate-900 dark:text-slate-100 space-y-1.5 block">
                <span>Số lượng câu hỏi</span>
                <select
                  value={questionCount}
                  onChange={(event) => setQuestionCount(Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-[15px] font-medium text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none transition cursor-pointer"
                >
                  {[10, 20, 30, 40].map((count) => (
                    <option key={count} value={count}>{count} câu</option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={startPractice}
              disabled={working || loading || !subjects.length}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-[15px] font-medium shadow-2xs active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Bắt đầu luyện tập
            </button>
          </div>
        )}

        {session && (
          <div className="space-y-4 max-w-3xl">
            {session.questions.map((question, index) => {
              const single = question.type !== 'MULTIPLE_CHOICE';
              return (
                <div key={question.id} className="rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-3">
                  <p className="font-semibold text-[18px] text-slate-900 dark:text-slate-100 leading-snug">Câu {index + 1}. {question.content}</p>
                  <div className="space-y-2">
                    {(question.options || []).map((option) => (
                      <label
                        key={option.id}
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700 p-3 text-[15px] font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-800 transition"
                      >
                        <input
                          type={single ? 'radio' : 'checkbox'}
                          name={`question-${question.id}`}
                          checked={(answers[question.id] || []).includes(option.id)}
                          onChange={() => toggleAnswer(question.id, option.id, single)}
                          className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>{option.content}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              disabled={working}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-[15px] font-medium shadow-2xs active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Nộp bài luyện tập
            </button>
          </div>
        )}

        {result && (
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/30 p-8 text-center max-w-xl mx-auto shadow-2xs space-y-3">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="text-[28px] font-semibold text-slate-900 dark:text-slate-100">Hoàn thành bài luyện tập</h2>
            <p className="text-[15px] font-medium text-slate-700 dark:text-slate-300">
              Điểm số: <strong className="text-emerald-700 font-semibold text-xl">{result.totalScore ?? result.score ?? 0}</strong> / {result.maxScore ?? 10}
            </p>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="mt-3 inline-flex items-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-[15px] font-medium shadow-2xs active:scale-95 transition cursor-pointer"
            >
              Tạo bài mới
            </button>
          </div>
        )}
      </main>
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
