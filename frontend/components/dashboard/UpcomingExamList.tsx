'use client';

import React, { useState } from 'react';
import { Eye, ArrowRight, ChevronLeft, ChevronRight, CalendarX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '../common/StatusBadge';
import type { DashboardOverview } from '../../types/dashboard';

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
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-black text-slate-900">Kỳ thi sắp tới</h3>

        <button
          type="button"
          onClick={() => router.push('/exam-periods')}
          className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-700 transition cursor-pointer"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Table Container */}
      {list.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-600 font-extrabold text-[11px] border-b border-slate-200/80">
              <tr>
                <th className="py-2.5 px-2.5 whitespace-nowrap">Mã môn</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap">Tên môn thi</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Ngày thi</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Khung giờ</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Phòng thi</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Thí sinh</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Trạng thái</th>
                <th className="py-2.5 px-1.5 text-center whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-semibold text-slate-800 text-xs">
              {list.map((exam) => (
                <tr key={exam.id} className="hover:bg-blue-50/30 transition">
                  <td className="py-2.5 px-2.5 whitespace-nowrap font-bold text-slate-700">{exam.code}</td>
                  <td className="py-2.5 px-2.5 font-black text-slate-900 whitespace-nowrap">{exam.name}</td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap font-medium text-slate-600">{exam.date}</td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap font-medium text-slate-600">{exam.time}</td>
                  <td className="py-2.5 px-2 text-center font-bold text-slate-700 whitespace-nowrap">{exam.rooms}</td>
                  <td className="py-2.5 px-2 text-center font-black text-slate-900 whitespace-nowrap">{exam.students}</td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap">
                    <StatusBadge status={exam.status} />
                  </td>
                  <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => router.push(`/exam-schedules?view=${exam.id}`)}
                      className="flex h-6.5 w-6.5 items-center justify-center mx-auto rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer"
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
        <div className="py-12 text-center my-auto space-y-2 text-slate-400">
          <CalendarX className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-xs font-semibold text-slate-500">Chưa có kỳ thi nào sắp diễn ra</p>
        </div>
      )}

      {/* Footer Pagination */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
        <span>Hiển thị {list.length} trong {exams?.length || 0} kỳ thi</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
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
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 opacity-40 cursor-not-allowed"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
