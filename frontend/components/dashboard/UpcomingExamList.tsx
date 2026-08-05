'use client';

import React from 'react';
import { Calendar, Eye, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardOverview } from '../../types/dashboard';

const sampleExams = [
  {
    id: 1,
    examDate: '24/05/2025',
    startTime: '07:30',
    subjectName: 'Cấu trúc dữ liệu',
    className: 'CNTT K15A',
    roomCode: 'A201',
    studentCount: 120,
    supervisorCount: '2/2',
    status: 'READY',
  },
  {
    id: 2,
    examDate: '24/05/2025',
    startTime: '13:30',
    subjectName: 'Cơ sở dữ liệu',
    className: 'CNTT K15B',
    roomCode: 'A202',
    studentCount: 110,
    supervisorCount: '1/2',
    status: 'MISSING_SUPERVISOR',
  },
  {
    id: 3,
    examDate: '25/05/2025',
    startTime: '07:30',
    subjectName: 'Toán cao cấp',
    className: 'Kinh tế K15A',
    roomCode: 'B101',
    studentCount: 95,
    supervisorCount: '0/2',
    status: 'NOT_ARRANGED',
  },
  {
    id: 4,
    examDate: '25/05/2025',
    startTime: '13:30',
    subjectName: 'Tiếng Anh 2',
    className: 'CNTT K15C',
    roomCode: '-',
    studentCount: 80,
    supervisorCount: '0/2',
    status: 'NOT_ARRANGED',
  },
  {
    id: 5,
    examDate: '26/05/2025',
    startTime: '07:30',
    subjectName: 'Lập trình Web',
    className: 'CNTT K15A',
    roomCode: 'C301',
    studentCount: 120,
    supervisorCount: '2/2',
    status: 'READY',
  },
];

export function UpcomingExamList({ exams }: { exams?: DashboardOverview['upcomingExams'] }) {
  const router = useRouter();

  const list = (exams && exams.length > 0)
    ? exams.slice(0, 5).map((ex, idx) => ({
        id: ex.id,
        examDate: ex.examDate ? (() => {
          const parts = ex.examDate.split('T')[0].split('-');
          return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ex.examDate;
        })() : '24/05/2025',
        startTime: ex.startTime || '07:30',
        subjectName: ex.subjectName || 'Cấu trúc dữ liệu',
        className: 'CNTT K15A',
        roomCode: ex.roomCodes?.[0] || 'A201',
        studentCount: ex.studentCount || 120,
        supervisorCount: idx % 2 === 0 ? '2/2' : '1/2',
        status: idx === 0 || idx === 4 ? 'READY' : idx === 1 ? 'MISSING_SUPERVISOR' : 'NOT_ARRANGED',
      }))
    : sampleExams;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-black text-slate-900">Lịch thi sắp tới</h3>

        <button
          type="button"
          onClick={() => router.push('/exam-schedules')}
          className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-700 transition cursor-pointer"
        >
          <span>Xem toàn bộ</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Table Container with smooth scrollbar */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/80">
        <table className="w-full min-w-[580px] text-left text-xs">
          <thead className="bg-slate-50/90 text-slate-600 font-extrabold uppercase tracking-wider text-[10.5px] border-b border-slate-200/80">
            <tr>
              <th className="py-2.5 px-2.5 whitespace-nowrap">Ngày thi</th>
              <th className="py-2.5 px-2 whitespace-nowrap">Giờ thi</th>
              <th className="py-2.5 px-2.5 whitespace-nowrap">Môn thi</th>
              <th className="py-2.5 px-2 whitespace-nowrap">Lớp/Nhóm</th>
              <th className="py-2.5 px-2 whitespace-nowrap">Phòng thi</th>
              <th className="py-2.5 px-1.5 text-center whitespace-nowrap">SV</th>
              <th className="py-2.5 px-1.5 text-center whitespace-nowrap">Giám thị</th>
              <th className="py-2.5 px-2 text-center whitespace-nowrap">Trạng thái</th>
              <th className="py-2.5 px-1.5 text-center whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-semibold text-slate-800 text-xs">
            {list.map((exam) => (
              <tr key={exam.id} className="hover:bg-blue-50/30 transition">
                <td className="py-2.5 px-2.5 whitespace-nowrap font-bold text-slate-800">{exam.examDate}</td>
                <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap font-medium">{exam.startTime}</td>
                <td className="py-2.5 px-2.5 font-black text-slate-900 whitespace-nowrap">{exam.subjectName}</td>
                <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap font-medium">{exam.className}</td>
                <td className="py-2.5 px-2 font-bold text-blue-700 whitespace-nowrap">{exam.roomCode}</td>
                <td className="py-2.5 px-1.5 text-center font-black text-slate-900 whitespace-nowrap">{exam.studentCount}</td>
                <td className="py-2.5 px-1.5 text-center whitespace-nowrap text-slate-700 font-bold">{exam.supervisorCount}</td>
                <td className="py-2.5 px-2 text-center whitespace-nowrap">
                  {exam.status === 'READY' ? (
                    <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[9.5px] font-extrabold">
                      Đã sẵn sàng
                    </span>
                  ) : exam.status === 'MISSING_SUPERVISOR' ? (
                    <span className="inline-flex rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[9.5px] font-extrabold">
                      Thiếu giám thị
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[9.5px] font-extrabold">
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
    </div>
  );
}
