'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePageTitle } from '../../../components/PageTitleContext';
import { Toast } from '../../../components/Toast';
import { ConfirmModal } from '../../../components/ConfirmModal';
import api from '../../../lib/api';
import { FilterSelect } from '../../../components/ui/FilterSelect';
import { Button } from '../../../components/ui/Button';
import { IdentifierBadge } from '../../../components/ui/IdentifierBadge';
import { ProfileDrawer } from '../../../components/ProfileDrawer';
import { getAuthUser } from '../../../lib/auth';
import {
  BookOpen,
  CheckCircle2,
  Play,
  Send,
  Sparkles,
  Award,
  Clock,
  RotateCcw,
  Eye,
  Info,
  Layers,
  HelpCircle,
  BarChart2,
} from 'lucide-react';

type Subject = { id: number; subjectName: string; subjectCode?: string };
type Option = { id: string; content: string };
type PracticeQuestion = { id: string; content: string; type?: string; options?: Option[] };
type Session = { sessionId: string; title?: string; questions: PracticeQuestion[] };

export default function PracticePage() {
  usePageTitle('Luyện thi trắc nghiệm');
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
  const [showSubjectDrawer, setShowSubjectDrawer] = useState(false);
  const [showResultDrawer, setShowResultDrawer] = useState(false);

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

  const selectedSubject = subjects.find((s) => String(s.id) === subjectId);

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
      <main className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[13px] font-semibold tracking-wide">
              <BookOpen className="w-3.5 h-3.5" />
              Luyện Tập Trắc Nghiệm Trực Tuyến
            </div>
            <h1 className="text-[28px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Luyện thi trắc nghiệm
            </h1>
            <p className="text-[15px] font-normal text-slate-500 dark:text-slate-400">
              Tạo bài luyện tập theo môn học, tự làm bài trắc nghiệm và nhận kết quả chấm điểm ngay.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => router.push('/student/curriculum')}
              leftIcon={<Layers className="w-4 h-4 text-slate-500" />}
            >
              Xem CTĐT
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => router.push('/student/results')}
              leftIcon={<Award className="w-4 h-4 text-slate-500" />}
            >
              Kết quả thi
            </Button>
          </div>
        </div>

        {/* ── 1. Setup Practice Card ── */}
        {!session && !result && (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-5 max-w-3xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[20px] font-semibold text-slate-900 dark:text-slate-100">
                Cấu hình bài luyện tập
              </h3>
              {selectedSubject && (
                <button
                  type="button"
                  onClick={() => setShowSubjectDrawer(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Chi tiết môn học</span>
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 block">
                <label className="text-[15px] font-medium text-slate-900 dark:text-slate-100 block">
                  Chọn Môn học
                </label>
                <FilterSelect
                  value={subjectId}
                  onChange={(event) => setSubjectId(event.target.value)}
                  disabled={loading}
                  containerClassName="w-full"
                  className="w-full"
                >
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subjectName}{subject.subjectCode ? ` (${subject.subjectCode})` : ''}
                    </option>
                  ))}
                </FilterSelect>
              </div>

              <div className="space-y-1.5 block">
                <label className="text-[15px] font-medium text-slate-900 dark:text-slate-100 block">
                  Số lượng câu hỏi
                </label>
                <FilterSelect
                  value={questionCount}
                  onChange={(event) => setQuestionCount(Number(event.target.value))}
                  containerClassName="w-full"
                  className="w-full"
                >
                  {[10, 20, 30, 40].map((count) => (
                    <option key={count} value={count}>{count} câu</option>
                  ))}
                </FilterSelect>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                Thời lượng khuyến nghị: <strong>30 phút</strong> • Hệ thống tự động chọn ngẫu nhiên từ ngân hàng câu hỏi.
              </span>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={startPractice}
                disabled={working || loading || !subjects.length}
                isLoading={working}
                leftIcon={<Play className="h-4 w-4" />}
              >
                Bắt đầu luyện tập
              </Button>
            </div>
          </div>
        )}

        {/* ── 2. Practice Questions Workspace ── */}
        {session && (
          <div className="space-y-5 max-w-3xl">
            {/* Progress status bar */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 shadow-2xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-slate-600 dark:text-slate-300">
                  Tiến độ trả lời:
                </span>
                <strong className="text-[15px] font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                  {answeredCount} / {session.questions.length} câu
                </strong>
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowSubmitConfirm(true)}
                disabled={working}
                leftIcon={<Send className="h-4 w-4" />}
              >
                Nộp bài luyện tập
              </Button>
            </div>

            {session.questions.map((question, index) => {
              const single = question.type !== 'MULTIPLE_CHOICE';
              const isAnswered = (answers[question.id] || []).length > 0;

              return (
                <div
                  key={question.id}
                  className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-3 transition duration-200 ${
                    isAnswered
                      ? 'border-blue-300 dark:border-blue-800/80'
                      : 'border-slate-200/90 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-[17px] text-slate-900 dark:text-slate-100 leading-snug">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">Câu {index + 1}:</span> {question.content}
                    </p>
                    {isAnswered && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã chọn
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    {(question.options || []).map((option) => {
                      const isSelected = (answers[question.id] || []).includes(option.id);

                      return (
                        <label
                          key={option.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-[15px] font-medium transition select-none ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/70 text-blue-900 dark:border-blue-600 dark:bg-blue-950/40 dark:text-blue-100 shadow-2xs'
                              : 'border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <input
                            type={single ? 'radio' : 'checkbox'}
                            name={`question-${question.id}`}
                            checked={isSelected}
                            onChange={() => toggleAnswer(question.id, option.id, single)}
                            className="h-4.5 w-4.5 rounded-xl border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="leading-relaxed">{option.content}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setShowSubmitConfirm(true)}
                disabled={working}
                leftIcon={<Send className="h-4 w-4" />}
              >
                Hoàn thành &amp; Nộp bài
              </Button>
            </div>
          </div>
        )}

        {/* ── 3. Completed Results Card ── */}
        {result && (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center max-w-xl mx-auto shadow-2xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-[24px] font-semibold text-slate-900 dark:text-slate-100">
                Hoàn thành bài luyện tập
              </h2>
              <p className="text-[14px] text-slate-500 dark:text-slate-400 font-normal">
                Môn học: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{selectedSubject?.subjectName}</strong>
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 p-4 space-y-2 text-left">
              <div className="flex items-center justify-between text-[15px]">
                <span className="font-medium text-slate-600 dark:text-slate-300">Điểm số đạt được:</span>
                <span className="font-semibold text-xl text-blue-600 dark:text-blue-400 tabular-nums">
                  {result.totalScore ?? result.score ?? 0} / {result.maxScore ?? 10} điểm
                </span>
              </div>
              {result.correctCount !== undefined && (
                <div className="flex items-center justify-between text-[14px]">
                  <span className="font-medium text-slate-600 dark:text-slate-300">Số câu đúng:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {result.correctCount} / {result.totalQuestions || questionCount} câu
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setShowResultDrawer(true)}
                leftIcon={<Eye className="w-4 h-4 text-blue-600" />}
              >
                Xem chi tiết
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setResult(null)}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Luyện tập đề khác
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ── 4. Subject Detail Drawer ── */}
      <ProfileDrawer
        isOpen={showSubjectDrawer}
        onClose={() => setShowSubjectDrawer(false)}
        title={selectedSubject?.subjectName || ''}
        subtitle={`Mã môn: ${selectedSubject?.subjectCode || '---'}`}
        avatarText={selectedSubject?.subjectCode?.slice(0, 2)?.toUpperCase() || 'LT'}
        badge={{
          label: 'Môn luyện tập',
          status: 'OFFICIAL',
        }}
        details={[
          { label: 'Tên học phần', value: selectedSubject?.subjectName, icon: BookOpen },
          { label: 'Mã học phần', value: <IdentifierBadge tone="blue">{selectedSubject?.subjectCode || '---'}</IdentifierBadge>, icon: Info },
          { label: 'Hình thức luyện tập', value: 'Trắc nghiệm tự động chấm', icon: HelpCircle },
          { label: 'Số lượng câu mỗi đề', value: `${questionCount} câu hỏi`, icon: Layers },
          { label: 'Thời gian làm bài', value: '30 phút (tự do)', icon: Clock },
        ]}
        extraSections={[
          {
            title: 'Hướng dẫn luyện tập',
            content: (
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
                <p>
                  Hệ thống hỗ trợ sinh viên tự luyện đề thi trắc nghiệm nhằm nâng cao kiến thức và làm quen với áp lực thời gian.
                </p>
                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setShowSubjectDrawer(false);
                      void startPractice();
                    }}
                    leftIcon={<Play className="w-3.5 h-3.5" />}
                  >
                    Bắt đầu làm bài
                  </Button>
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* ── 5. Result Detail Drawer ── */}
      <ProfileDrawer
        isOpen={showResultDrawer}
        onClose={() => setShowResultDrawer(false)}
        title="Chi Tiết Kết Quả Luyện Tập"
        subtitle={selectedSubject?.subjectName}
        avatarText="KQ"
        badge={{
          label: (result?.totalScore ?? result?.score ?? 0) >= 5 ? 'Đạt' : 'Cần ôn thêm',
          status: (result?.totalScore ?? result?.score ?? 0) >= 5 ? 'COMPLETED' : 'REJECTED',
        }}
        details={[
          { label: 'Môn luyện tập', value: selectedSubject?.subjectName, icon: BookOpen },
          { label: 'Mã môn học', value: <IdentifierBadge tone="blue">{selectedSubject?.subjectCode || '---'}</IdentifierBadge> },
          {
            label: 'Điểm số tổng kết',
            value: (
              <span className="text-[15px] font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                {result?.totalScore ?? result?.score ?? 0} / {result?.maxScore ?? 10} điểm
              </span>
            ),
            icon: Award,
          },
          {
            label: 'Số câu trả lời đúng',
            value: result?.correctCount !== undefined ? `${result.correctCount} / ${result.totalQuestions || questionCount} câu` : '---',
            icon: CheckCircle2,
          },
          { label: 'Thời gian kết thúc', value: new Date().toLocaleString('vi-VN'), icon: Clock },
        ]}
        extraSections={[
          {
            title: 'Kế hoạch học tập tiếp theo',
            content: (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 font-normal leading-relaxed">
                  Bạn có thể tiếp tục tạo thêm các đề luyện tập khác để rèn luyện kỹ năng, hoặc tra cứu khung chương trình đào tạo để chuẩn bị cho kỳ thi chính thức.
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowResultDrawer(false);
                      router.push('/student/curriculum');
                    }}
                    leftIcon={<Layers className="w-3.5 h-3.5" />}
                  >
                    Xem CTĐT
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setShowResultDrawer(false);
                      setResult(null);
                    }}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Luyện tập đề khác
                  </Button>
                </div>
              </div>
            ),
          },
        ]}
      />

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
