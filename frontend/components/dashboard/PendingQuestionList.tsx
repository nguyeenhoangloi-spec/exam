'use client';

import { ArrowRight, Check, Eye, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardOverview } from '../../types/dashboard';
import { DashboardEmptyState } from './DashboardEmptyState';

const difficultyLabel = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' };

export function PendingQuestionList({
  questions,
  canReview,
  busyId,
  onApprove,
  onReject,
}: {
  questions: DashboardOverview['pendingQuestions'];
  canReview: boolean;
  busyId?: string;
  onApprove: (id: string, code: string) => void;
  onReject: (id: string, code: string) => void;
}) {
  const router = useRouter();
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-900">Câu hỏi chờ duyệt</h2>
          <p className="text-xs text-slate-500">Ưu tiên các câu gửi gần nhất</p>
        </div>
        <button onClick={() => router.push('/question-bank?status=PENDING')} className="flex items-center gap-1 text-xs font-semibold text-sky-700">
          Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {!questions.length ? <DashboardEmptyState message="Không có câu hỏi chờ duyệt." /> : (
        <div className="space-y-2">
          {questions.map((question) => (
            <article key={question.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-xs text-sky-700">{question.code}</strong>
                    <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{difficultyLabel[question.difficulty]}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-slate-800">{question.content}</p>
                  <p className="mt-1 truncate text-[11px] text-slate-500">
                    {question.subject.subjectCode} · {question.chapter.name} · {question.createdBy.username}
                  </p>
                </div>
                <button
                  title="Xem chi tiết"
                  onClick={() => router.push(`/question-bank?status=PENDING&questionId=${question.id}`)}
                  className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-sky-700"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
              {canReview && (
                <div className="mt-2 flex justify-end gap-2 border-t border-slate-200 pt-2">
                  <button disabled={busyId === question.id} onClick={() => onReject(question.id, question.code)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                    <X className="h-3.5 w-3.5" /> Từ chối
                  </button>
                  <button disabled={busyId === question.id} onClick={() => onApprove(question.id, question.code)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                    <Check className="h-3.5 w-3.5" /> Duyệt
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
