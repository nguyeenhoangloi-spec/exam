'use client';

import React, { useState } from 'react';
import { Eye, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardOverview } from '../../types/dashboard';

const sampleExamsMockup = [
  {
    id: 1,
    code: 'KT2024001',
    name: 'Kiểm tra học kỳ II',
    date: '24/05/2024',
    time: '08:00',
    rooms: 'P.101 - P.105',
    students: 120,
    status: 'UPCOMING', // Sắp diễn ra
  },
  {
    id: 2,
    code: 'KT2024002',
    name: 'Thi giữa kỳ',
    date: '25/05/2024',
    time: '08:00',
    rooms: 'P.201 - P.203',
    students: 98,
    status: 'UPCOMING', // Sắp diễn ra
  },
  {
    id: 3,
    code: 'KT2024003',
    name: 'Kiểm tra học kỳ II',
    date: '26/05/2024',
    time: '13:30',
    rooms: 'P.301 - P.304',
    students: 150,
    status: 'ARRANGED', // Đã xếp phòng
  },
  {
    id: 4,
    code: 'KT2024004',
    name: 'Thi cuối kỳ',
    date: '27/05/2024',
    time: '07:30',
    rooms: 'P.102 - P.107',
    students: 200,
    status: 'UNARRANGED', // Chưa xếp phòng
  },
  {
    id: 5,
    code: 'KT2024005',
    name: 'Kiểm tra giữa kỳ',
    date: '28/05/2024',
    time: '09:00',
    rooms: 'P.202 - P.205',
    students: 180,
    status: 'ARRANGED', // Đã xếp phòng
  },
];

export function UpcomingExamList({ exams }: { exams?: DashboardOverview['upcomingExams'] }) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const list = (exams && exams.length > 0)
    ? exams.slice(0, 5).map((ex, idx) => ({
        id: ex.id,
        code: `KT202400${idx + 1}`,
        name: ex.subjectName || 'Kiểm tra học kỳ II',
        date: ex.examDate ? (() => {
          const parts = ex.examDate.split('T')[0].split('-');
          return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ex.examDate;
        })() : '24/05/2024',
        time: ex.startTime || '08:00',
        rooms: ex.roomCodes?.length ? ex.roomCodes.join(' - ') : `P.${101 + idx} - P.${105 + idx}`,
        students: ex.studentCount || 120,
        status: idx < 2 ? 'UPCOMING' : idx === 3 ? 'UNARRANGED' : 'ARRANGED',
      }))
    : sampleExamsMockup;

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

      {/* Table Container with smooth scrollbar */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/80">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead className="bg-slate-50/90 text-slate-600 font-extrabold text-[11px] border-b border-slate-200/80">
            <tr>
              <th className="py-2.5 px-2.5 whitespace-nowrap">Mã kỳ thi</th>
              <th className="py-2.5 px-2.5 whitespace-nowrap">Tên kỳ thi</th>
              <th className="py-2.5 px-2 text-center whitespace-nowrap">Ngày thi</th>
              <th className="py-2.5 px-2 text-center whitespace-nowrap">Giờ bắt đầu</th>
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
                  {exam.status === 'UPCOMING' ? (
                    <span className="inline-flex rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[10px] font-extrabold">
                      Sắp diễn ra
                    </span>
                  ) : exam.status === 'ARRANGED' ? (
                    <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-extrabold">
                      Đã xếp phòng
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 text-[10px] font-extrabold">
                      Chưa xếp phòng
                    </span>
                  )}
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

      {/* Footer Pagination matching mockup */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
        <span>Hiển thị 1-5 trong 8 kỳ thi</span>
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
            onClick={() => setCurrentPage(1)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
              currentPage === 1 ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            1
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(2)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
              currentPage === 2 ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            2
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => p + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
