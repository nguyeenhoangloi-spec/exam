'use client';

import React from 'react';
import { ArrowRight, Check, X, MoreVertical, Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardOverview } from '../../types/dashboard';
import { Button } from '../ui/Button';

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
 <h3 className="edu-card-title">
 Câu hỏi chờ duyệt <span className="text-blue-600 font-semibold">({count})</span>
 </h3>

 <button
 type="button"
 onClick={() => router.push('/question-bank?status=PENDING')}
 className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition cursor-pointer"
 >
 <span>Xem tất cả</span>
 <ArrowRight className="h-3.5 w-3.5" />
 </button>
 </div>

 {/* Table Container */}
 {list.length > 0 ? (
 <div className="overflow-x-auto rounded-xl border border-slate-200/80">
 <table className="w-full text-left text-[15px] leading-6 min-w-[760px] text-slate-700 border-collapse">
 <thead className="bg-slate-50 text-[12px] font-semibold tracking-wider text-slate-500 border-b border-slate-200">
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
 <tbody className="divide-y divide-slate-100 font-normal text-[15px] leading-6">
 {list.map((q) => {
 const difficultyInfo = difficultyBadge[q.difficulty as keyof typeof difficultyBadge] || difficultyBadge['MEDIUM'];
 return (
 <tr key={q.id} className="hover:bg-slate-50/60 transition">
 <td className="py-3 px-3 whitespace-nowrap tabular-nums font-medium text-slate-900">
 {q.code}
 </td>
 <td className="py-3 px-3 font-medium text-slate-900 max-w-xs truncate">
 {q.content}
 </td>
 <td className="py-3 px-3 font-medium text-slate-900 whitespace-nowrap">
 {q.subjectName}
 </td>
 <td className="py-3 px-3 text-slate-500 font-normal whitespace-nowrap">
 {q.chapter}
 </td>
 <td className="py-3 px-3 text-center whitespace-nowrap">
 <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${difficultyInfo[1]}`}>
 {difficultyInfo[0]}
 </span>
 </td>
 <td className="py-3 px-3 text-slate-700 font-semibold whitespace-nowrap">
 {q.creator}
 </td>
 <td className="py-3 px-3 text-slate-400 font-medium whitespace-nowrap">
 {q.createdAt}
 </td>
 <td className="py-3 px-3 text-center whitespace-nowrap">
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
 <div className="py-10 text-center space-y-1.5 text-slate-400 border border-slate-100 rounded-xl bg-slate-50/40">
 <Inbox className="w-7 h-7 mx-auto text-slate-700 stroke-[1.5]" />
 <p className="text-xs font-semibold text-slate-600">Không có câu hỏi nào đang chờ duyệt</p>
 <p className="text-[12px] text-slate-400">Toàn bộ câu hỏi trong ngân hàng đã được phê duyệt.</p>
 </div>
 )}
 </div>
 );
}
