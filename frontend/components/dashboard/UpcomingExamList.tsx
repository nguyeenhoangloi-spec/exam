'use client';

import { ArrowRight, MoreVertical, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardOverview } from '../../types/dashboard';
import { DashboardEmptyState } from './DashboardEmptyState';

const statusLabel = {
  UPCOMING: ['Sắp diễn ra', 'bg-sky-50 text-sky-700 border-sky-200'],
  ONGOING: ['Đang diễn ra', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
  COMPLETED: ['Đã hoàn thành', 'bg-slate-100 text-slate-600 border-slate-200'],
  CANCELLED: ['Đã hủy', 'bg-rose-50 text-rose-700 border-rose-200'],
} as const;

export function UpcomingExamList({ exams }: { exams: DashboardOverview['upcomingExams'] }) {
  const router = useRouter();

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Lịch thi sắp tới</h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">5 lịch thi gần nhất cần theo dõi</p>
        </div>
        <button
          onClick={() => router.push('/exam-schedules')}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {!exams.length ? (
        <DashboardEmptyState message="Chưa có lịch thi sắp tới." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
              <tr>
                <th className="p-3">Kỳ thi</th>
                <th className="p-3">Môn thi</th>
                <th className="p-3">Thời gian</th>
                <th className="p-3">Ca thi</th>
                <th className="p-3">Phòng thi</th>
                <th className="p-3 text-center">Sinh viên</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {exams.slice(0, 5).map((exam, idx) => (
                <tr key={exam.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-semibold text-slate-700 whitespace-nowrap">{exam.periodName}</td>
                  <td className="p-3 font-bold text-slate-900 whitespace-nowrap">{exam.subjectName}</td>
                  <td className="p-3 text-slate-600 whitespace-nowrap">
                    <p className="font-semibold text-slate-800">{new Date(exam.examDate).toLocaleDateString('vi-VN')}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{exam.startTime}</p>
                  </td>
                  <td className="p-3 font-medium text-slate-700 whitespace-nowrap">Ca {idx + 1}</td>
                  <td className="p-3 font-bold text-sky-700 whitespace-nowrap">{exam.roomCodes.join(', ') || 'P.101'}</td>
                  <td className="p-3 text-center font-bold text-slate-800 whitespace-nowrap">{exam.studentCount}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusLabel[exam.status][1]}`}>
                      {statusLabel[exam.status][0]}
                    </span>
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => router.push(`/exam-schedules?view=${exam.id}`)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      title="Xem chi tiết ca thi"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
