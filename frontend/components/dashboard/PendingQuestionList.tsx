'use client';

import React from 'react';
import { ArrowRight, Eye, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardOverview } from '../../types/dashboard';

const difficultyBadge = {
  EASY: ['Dễ', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
  MEDIUM: ['Trung bình', 'bg-amber-50 text-amber-800 border-amber-200'],
  HARD: ['Khó', 'bg-rose-50 text-rose-700 border-rose-200'],
};

const samplePendingQuestions = [
  {
    id: '1',
    code: 'Q12580',
    content: 'Mục tiêu chính của tính toàn vẹn thông tin...',
    difficulty: 'EASY',
    creator: 'Trần Thị Bích',
    subjectName: 'Cơ sở dữ liệu',
    createdAt: '23/05/2025',
  },
  {
    id: '2',
    code: 'Q12579',
    content: 'Độ phức tạp của thuật toán QuickSort...',
    difficulty: 'MEDIUM',
    creator: 'Lê Văn Cường',
    subjectName: 'Cấu trúc dữ liệu',
    createdAt: '23/05/2025',
  },
  {
    id: '3',
    code: 'Q12578',
    content: 'Khái niệm về trang trí hoa trong Python...',
    difficulty: 'HARD',
    creator: 'Phạm Minh Đức',
    subjectName: 'Lập trình Python',
    createdAt: '22/05/2025',
  },
  {
    id: '4',
    code: 'Q12577',
    content: 'Giao thức TCP/IP hoạt động tại tầng nào...',
    difficulty: 'MEDIUM',
    creator: 'Nguyễn Thị Mai',
    subjectName: 'Mạng máy tính',
    createdAt: '22/05/2025',
  },
  {
    id: '5',
    code: 'Q12576',
    content: 'Tính số hoán vị của tập gồm n phần tử...',
    difficulty: 'EASY',
    creator: 'Hoàng Văn Nam',
    subjectName: 'Toán rời rạc',
    createdAt: '22/05/2025',
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
        code: q.code,
        content: q.content,
        difficulty: q.difficulty || 'MEDIUM',
        creator: q.createdBy?.username || 'Giảng viên',
        subjectName: q.subject?.subjectName || q.subject?.subjectCode || 'Tin học',
        createdAt: q.submittedAt ? (() => {
          const d = new Date(q.submittedAt);
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          return `${dd}/${mm}/${yyyy}`;
        })() : '23/05/2025',
      }))
    : samplePendingQuestions;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-black text-slate-900">Câu hỏi chờ duyệt</h3>

        <button
          type="button"
          onClick={() => router.push('/question-bank?status=PENDING')}
          className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-700 transition cursor-pointer"
        >
          <span>Xem toàn bộ</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Table Container with smooth scrollbar */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/80">
        <table className="w-full min-w-[480px] text-left text-xs">
          <thead className="bg-slate-50/90 text-slate-600 font-extrabold uppercase tracking-wider text-[10.5px] border-b border-slate-200/80">
            <tr>
              <th className="py-2.5 px-2.5 whitespace-nowrap">Mã câu hỏi</th>
              <th className="py-2.5 px-2.5 whitespace-nowrap">Môn học</th>
              <th className="py-2.5 px-2 text-center whitespace-nowrap">Độ khó</th>
              <th className="py-2.5 px-2.5 whitespace-nowrap">Người tạo</th>
              <th className="py-2.5 px-2 text-center whitespace-nowrap">Ngày tạo</th>
              <th className="py-2.5 px-2 text-center whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-semibold text-slate-800 text-xs">
            {list.map((q) => {
              const difficultyInfo = difficultyBadge[q.difficulty as keyof typeof difficultyBadge] || difficultyBadge['MEDIUM'];
              return (
                <tr key={q.id} className="hover:bg-amber-50/30 transition">
                  <td className="py-2.5 px-2.5 font-black text-blue-700 whitespace-nowrap">
                    {q.code}
                  </td>
                  <td className="py-2.5 px-2.5 font-black text-slate-900 whitespace-nowrap">
                    {q.subjectName}
                  </td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9.5px] font-extrabold ${difficultyInfo[1]}`}>
                      {difficultyInfo[0]}
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5 text-slate-700 font-semibold whitespace-nowrap">
                    {q.creator}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-500 font-medium whitespace-nowrap">
                    {q.createdAt}
                  </td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* View */}
                      <button
                        type="button"
                        onClick={() => (onView ? onView(q.id) : router.push(`/question-bank?view=${q.id}`))}
                        className="flex h-6.5 w-6.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer"
                        title="Xem chi tiết câu hỏi"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      {/* Approve */}
                      <button
                        type="button"
                        disabled={busyId === q.id}
                        onClick={() => onApprove(q.id, q.code)}
                        className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                        title="Duyệt câu hỏi"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </button>

                      {/* Reject */}
                      <button
                        type="button"
                        disabled={busyId === q.id}
                        onClick={() => onReject(q.id, q.code)}
                        className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold transition shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                        title="Từ chối câu hỏi"
                      >
                        <X className="h-3.5 w-3.5 stroke-[3]" />
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
