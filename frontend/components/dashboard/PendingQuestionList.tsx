'use client';

import React from 'react';
import { ArrowRight, Check, X, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardOverview } from '../../types/dashboard';

const difficultyBadge = {
  EASY: ['Dễ', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
  MEDIUM: ['Trung bình', 'bg-amber-50 text-amber-800 border-amber-200'],
  HARD: ['Khó', 'bg-rose-50 text-rose-700 border-rose-200'],
};

const samplePendingQuestionsMockup = [
  {
    id: '1',
    code: 'QH24561',
    content: 'Cho hàm số f(x) = x^2 + 2x + 1. Giá trị của f(2) bằng bao nhiêu?',
    subjectName: 'Toán cao cấp',
    chapter: 'Chương 2',
    difficulty: 'EASY',
    creator: 'Nguyễn Văn A',
    createdAt: '24/05/2024 09:15',
  },
  {
    id: '2',
    code: 'QH24560',
    content: 'Một vật có khối lượng 2kg chịu tác dụng của lực 10N. Gia tốc của vật là?',
    subjectName: 'Vật lý đại cương',
    chapter: 'Chương 1',
    difficulty: 'MEDIUM',
    creator: 'Trần Thị B',
    createdAt: '24/05/2024 08:45',
  },
  {
    id: '3',
    code: 'QH24559',
    content: 'Viết chương trình in ra dãy Fibonacci n phần tử đầu tiên.',
    subjectName: 'Lập trình C++',
    chapter: 'Chương 3',
    difficulty: 'HARD',
    creator: 'Lê Văn C',
    createdAt: '24/05/2024 08:30',
  },
];

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
        code: q.code || `QH245${61 - (questions.indexOf(q))}`,
        content: q.content,
        subjectName: q.subject?.subjectName || q.subject?.subjectCode || 'Toán cao cấp',
        chapter: 'Chương 1',
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
        })() : '24/05/2024 09:15',
      }))
    : samplePendingQuestionsMockup;

  const count = questions?.length || 12;

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

      {/* Table Container with smooth scrollbar */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/80">
        <table className="w-full text-left text-xs min-w-[760px]">
          <thead className="bg-slate-50/90 text-slate-600 font-extrabold text-[11px] border-b border-slate-200/80">
            <tr>
              <th className="py-3 px-3 whitespace-nowrap">Mã câu hỏi</th>
              <th className="py-3 px-3">Nội dung câu hỏi</th>
              <th className="py-3 px-3 whitespace-nowrap">Môn học</th>
              <th className="py-3 px-3 whitespace-nowrap">Chương</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">Độ khó</th>
              <th className="py-3 px-3 whitespace-nowrap">Người tạo</th>
              <th className="py-3 px-3 whitespace-nowrap">Thời gian tạo</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-semibold text-slate-800 text-xs">
            {list.map((q) => {
              const difficultyInfo = difficultyBadge[q.difficulty as keyof typeof difficultyBadge] || difficultyBadge['MEDIUM'];
              return (
                <tr key={q.id} className="hover:bg-blue-50/20 transition">
                  <td className="py-3 px-3 font-black text-blue-600 whitespace-nowrap">
                    {q.code}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800 max-w-xs truncate">
                    {q.content}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
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

                      {/* More Menu */}
                      <button
                        type="button"
                        onClick={() => (onView ? onView(q.id) : router.push(`/question-bank?view=${q.id}`))}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        title="Xem thêm"
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
    </div>
  );
}
