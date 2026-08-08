'use client';

import React from 'react';
import { ArrowRight, Check, X, MoreVertical, Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardOverview } from '../../types/dashboard';

const difficultyBadge = {
  EASY: ['Dễ', 'bg-slate-100 text-slate-600 border-slate-200'],
  MEDIUM: ['Trung bình', 'bg-slate-100 text-slate-600 border-slate-200'],
  HARD: ['Khó', 'bg-slate-100 text-slate-600 border-slate-200'],
};

export function PendingQuestionList({
  questions,
  canReview = true,
  busyId,
  onApprove,
  onReject,
  onView,
}: {
  questions?: DashboardOverview['pendingQuestions'];
  canReview?: boolean;
  busyId?: string;
  onApprove: (id: string, code: string) => void;
  onReject: (id: string, code: string) => void;
  onView?: (id: string) => void;
}) {
  const router = useRouter();

  const list = (questions && questions.length > 0)
    ? questions.slice(0, 5).map((q) => ({
        id: q.id,
        code: q.code || `QH-${q.id}`,
        content: q.content,
        subjectName: q.subject?.subjectName || q.subject?.subjectCode || 'Môn học',
        chapter: q.chapter?.name || q.chapter?.code || 'Chương 1',
        difficulty: q.difficulty || 'MEDIUM',
        creator: q.createdBy?.username || 'Giảng viên',
        createdAt: q.submittedAt ? (() => {
          const d = new Date(q.submittedAt);
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
        })() : 'Vừa xong',
      }))
    : [];

  const count = questions?.length ?? 0;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-black text-slate-900">
          Câu hỏi chờ duyệt <span className="text-slate-500 font-bold">({count})</span>
        </h3>

        <button
          type="button"
          onClick={() => router.push('/question-bank?status=PENDING')}
          className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-700 transition cursor-pointer"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Table Container */}
      {list.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs min-w-[760px] text-slate-700 border-collapse">
            <thead className="bg-blue-50 text-[11px] font-extrabold uppercase tracking-wider text-blue-700 border-b border-blue-100">
              <tr>
                <th className="py-3 px-3 whitespace-nowrap">Mã câu hỏi</th>
                <th className="py-3 px-3">Nội dung câu hỏi</th>
                <th className="py-3 px-3 whitespace-nowrap">Môn học</th>
                <th className="py-3 px-3 whitespace-nowrap">Chương</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Độ khó</th>
                <th className="py-3 px-3 whitespace-nowrap">Người tạo</th>
                <th className="py-3 px-3 whitespace-nowrap">Thời gian gửi</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-xs">
              {list.map((q) => {
                const difficultyInfo = difficultyBadge[q.difficulty as keyof typeof difficultyBadge] || difficultyBadge['MEDIUM'];
                return (
                  <tr key={q.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        {q.code}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs truncate">
                      {q.content}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-slate-900 whitespace-nowrap">
                      {q.subjectName}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                      {q.chapter}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${difficultyInfo[1]}`}>
                        {difficultyInfo[0]}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-semibold whitespace-nowrap">
                      {q.creator}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-medium whitespace-nowrap">
                      {q.createdAt}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Approve Button */}
                        <button
                          type="button"
                          disabled={busyId === q.id}
                          onClick={() => onApprove(q.id, q.code)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-xs font-bold transition shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                          title="Duyệt câu hỏi"
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                          <span>Duyệt</span>
                        </button>

                        {/* Reject Button */}
                        <button
                          type="button"
                          disabled={busyId === q.id}
                          onClick={() => onReject(q.id, q.code)}
                          className="flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 text-xs font-bold transition shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                          title="Từ chối câu hỏi"
                        >
                          <X className="h-3.5 w-3.5 stroke-[3]" />
                          <span>Từ chối</span>
                        </button>

                        {/* View Details Button */}
                        <button
                          type="button"
                          onClick={() => (onView ? onView(q.id) : router.push(`/question-bank?view=${q.id}`))}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center space-y-2 text-slate-400 border border-slate-100 rounded-xl bg-slate-50/50">
          <Inbox className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-xs font-semibold text-slate-500">Không có câu hỏi nào đang chờ duyệt</p>
          <p className="text-[10.5px] text-slate-400">Toàn bộ câu hỏi trong ngân hàng đã được phê duyệt.</p>
        </div>
      )}
    </div>
  );
}
