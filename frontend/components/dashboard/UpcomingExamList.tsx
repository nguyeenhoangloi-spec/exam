'use client';

import React, { useState } from 'react';
import { Eye, ArrowRight, ChevronLeft, ChevronRight, CalendarX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '../common/StatusBadge';
import type { DashboardOverview } from '../../types/dashboard';
import { IdentifierBadge } from '../ui/IdentifierBadge';

export function UpcomingExamList({ exams }: { exams?: DashboardOverview['upcomingExams'] }) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const list = (exams && exams.length > 0)
    ? exams.slice(0, 5).map((ex) => ({
        id: ex.id,
        code: ex.subjectCode || `KTI-${ex.id}`,
        name: ex.subjectName || ex.periodName || 'Kỳ thi',
        date: ex.examDate ? (() => {
          const parts = ex.examDate.split('T')[0].split('-');
          return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ex.examDate;
        })() : 'Chưa xếp',
        time: ex.startTime ? `${ex.startTime} - ${ex.endTime}` : 'Tự do',
        rooms: ex.roomCodes?.length ? ex.roomCodes.join(', ') : 'Chưa xếp phòng',
        students: ex.studentCount ?? 0,
        status: ex.status || 'UPCOMING',
      }))
    : [];

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <h3 className="edu-card-title">Kỳ thi sắp tới</h3>

        <button
          type="button"
          onClick={() => router.push('/exam-periods')}
          className="inline-flex items-center gap-1 text-[13.5px] leading-5 font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition cursor-pointer select-none"
        >
          <span>Xem tất cả</span>
          <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </button>
      </div>

      {/* Table Container */}
      {list.length > 0 ? (
        <div className="ui-table-wrap overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
          <table className="ui-table w-full min-w-[580px] text-left text-[14px] text-slate-700 dark:text-slate-300 border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[13px] font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-2.5 whitespace-nowrap">Mã môn</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap">Tên môn thi</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Ngày thi</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Khung giờ</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Phòng</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Thí sinh</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Trạng thái</th>
                <th className="py-2.5 px-1.5 text-center whitespace-nowrap">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13.5px]">
              {list.map((exam) => (
                <tr key={exam.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                  <td className="py-2.5 px-2.5 whitespace-nowrap">
                    <IdentifierBadge tone="neutral">{exam.code}</IdentifierBadge>
                  </td>
                  <td className="py-2.5 px-2.5 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">{exam.name}</td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap font-normal text-slate-500 dark:text-slate-400">{exam.date}</td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap font-normal text-slate-500 dark:text-slate-400">{exam.time}</td>
                  <td className="py-2.5 px-2 text-center font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{exam.rooms}</td>
                  <td className="py-2.5 px-2 text-center font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{exam.students}</td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap">
                    <StatusBadge status={exam.status} />
                  </td>
                  <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => router.push(`/exam-schedules?view=${exam.id}`)}
                      className="flex h-7 w-7 items-center justify-center mx-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 transition cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-10 text-center my-auto space-y-2 text-slate-400">
          <CalendarX className="w-7 h-7 mx-auto text-slate-400 dark:text-slate-600" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Chưa có kỳ thi nào sắp diễn ra</p>
        </div>
      )}

      {/* Footer Pagination */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span>Hiển thị {list.length} trong {exams?.length || 0} kỳ thi</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold bg-blue-600 text-white"
          >
            1
          </button>
          <button
            type="button"
            disabled
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 opacity-40 cursor-not-allowed"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
