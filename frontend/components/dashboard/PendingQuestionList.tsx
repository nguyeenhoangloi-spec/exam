'use client';

import React from 'react';
import { Check, X, MoreVertical, Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardOverview } from '../../types/dashboard';
import { Button } from '../ui/Button';
import { QuestionDifficultyBadge } from '../question-bank/QuestionBadges';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { CardActionLink } from '../ui/CardActionLink';

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
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <h3 className="edu-card-title">
          Câu hỏi chờ duyệt <span className="text-blue-600 dark:text-blue-400 font-semibold">({count})</span>
        </h3>
        <CardActionLink href="/question-bank?status=PENDING">
          Xem tất cả
        </CardActionLink>
      </div>

      {/* Table Container */}
      {list.length > 0 ? (
        <div className="ui-table-wrap overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
          <table className="ui-table w-full text-left text-type-body-sm leading-6 min-w-[760px] text-slate-700 dark:text-slate-300 border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-type-helper font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3 whitespace-nowrap">Mã câu</th>
                <th className="py-2.5 px-3">Nội dung câu hỏi</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Môn học</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Chương</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Độ khó</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Người tạo</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Thời gian gửi</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-type-body">
              {list.map((q) => {
                return (
                  <tr key={q.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                    <td className="py-2.5 px-3 whitespace-nowrap tabular-nums font-semibold text-blue-600">
                      <IdentifierBadge>{q.code}</IdentifierBadge>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                      {q.content}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">
                      {q.subjectName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-normal whitespace-nowrap">
                      {q.chapter}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <QuestionDifficultyBadge difficulty={q.difficulty as any} />
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                      {q.creator}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 dark:text-slate-500 font-normal whitespace-nowrap">
                      {q.createdAt}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          type="button"
                          variant="success"
                          size="sm"
                          disabled={busyId === q.id}
                          isLoading={busyId === q.id}
                          onClick={() => onApprove(q.id, q.code)}
                          leftIcon={<Check className="h-3.5 w-3.5 stroke-[3]" />}
                        >
                          Duyệt
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={busyId === q.id}
                          onClick={() => onReject(q.id, q.code)}
                          leftIcon={<X className="h-3.5 w-3.5 stroke-[3]" />}
                        >
                          Từ chối
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => (onView ? onView(q.id) : router.push(`/question-bank?view=${q.id}`))}
                          title="Xem chi tiết"
                        >
                          <MoreVertical className="h-4 w-4 text-slate-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center space-y-1 text-slate-400 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/40 dark:bg-slate-800/40">
          <Inbox className="w-6 h-6 mx-auto text-slate-400 dark:text-slate-600 stroke-[1.5]" />
          <p className="text-type-helper font-semibold text-slate-600 dark:text-slate-400">Không có câu hỏi nào đang chờ duyệt</p>
          <p className="text-type-helper text-slate-400 dark:text-slate-500">Toàn bộ câu hỏi trong ngân hàng đã được phê duyệt.</p>
        </div>
      )}
    </div>
  );
}
