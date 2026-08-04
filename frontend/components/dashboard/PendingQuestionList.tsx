'use client';

import { ArrowRight, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardOverview } from '../../types/dashboard';
import { DashboardEmptyState } from './DashboardEmptyState';

const difficultyBadge = {
  EASY: ['Dễ', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
  MEDIUM: ['Trung bình', 'bg-amber-50 text-amber-700 border-amber-200'],
  HARD: ['Khó', 'bg-rose-50 text-rose-700 border-rose-200'],
};

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
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Câu hỏi chờ duyệt</h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">{questions.length} câu hỏi cần phê duyệt</p>
        </div>
        <button
          onClick={() => router.push('/question-bank?status=PENDING')}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#1e66f5] hover:text-blue-700 transition"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {!questions.length ? (
        <DashboardEmptyState message="Không có câu hỏi chờ duyệt." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
              <tr>
                <th className="p-3">Mã câu hỏi</th>
                <th className="p-3 max-w-[200px]">Nội dung</th>
                <th className="p-3">Môn học</th>
                <th className="p-3">Người tạo</th>
                <th className="p-3 text-center">Độ khó</th>
                <th className="p-3 text-center">Ngày gửi</th>
                {canReview && <th className="p-3 text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {questions.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-bold text-[#1e66f5] whitespace-nowrap">{q.code}</td>
                  <td className="p-3 max-w-[220px]">
                    <p className="truncate font-medium text-slate-800" title={q.content}>
                      {q.content}
                    </p>
                  </td>
                  <td className="p-3 text-slate-600 font-medium whitespace-nowrap">{q.subject?.subjectName || q.subject?.subjectCode || 'Tin học'}</td>
                  <td className="p-3 text-slate-700 font-semibold whitespace-nowrap">{q.createdBy?.username || 'Giảng viên'}</td>
                  <td className="p-3 text-center whitespace-nowrap">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${difficultyBadge[q.difficulty]?.[1] || 'bg-slate-50 text-slate-700'}`}>
                      {difficultyBadge[q.difficulty]?.[0] || q.difficulty}
                    </span>
                  </td>
                  <td className="p-3 text-center text-slate-500 font-medium whitespace-nowrap">07/04/2026</td>
                  {canReview && (
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          disabled={busyId === q.id}
                          onClick={() => onApprove(q.id, q.code)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition shadow-xs disabled:opacity-50"
                          title="Duyệt câu hỏi"
                        >
                          <Check className="h-4 w-4 stroke-[3]" />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === q.id}
                          onClick={() => onReject(q.id, q.code)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold transition shadow-xs disabled:opacity-50"
                          title="Từ chối câu hỏi"
                        >
                          <X className="h-4 w-4 stroke-[3]" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
