'use client';

import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '../common/StatusBadge';
import type { DashboardOverview } from '../../types/dashboard';
import { IdentifierBadge } from '../ui/IdentifierBadge';
import { CardActionLink } from '../ui/CardActionLink';

export function UpcomingExamList({
  exams,
}: {
  exams?: DashboardOverview['upcomingExams'];
}) {
  const router = useRouter();

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
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 min-w-0">
        <h3 className="edu-card-title truncate whitespace-nowrap min-w-0">Kỳ thi sắp tới</h3>

        <CardActionLink href="/exam-periods">
          Xem tất cả
        </CardActionLink>
      </div>

      {/* Table Container */}
      {list.length > 0 ? (
        <div className="ui-table-wrap overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
          <table className="ui-table w-full min-w-[580px] text-left text-type-body-sm text-slate-700 dark:text-slate-300 border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-type-helper font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-2.5 whitespace-nowrap">Mã môn</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap">Tên môn thi</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Ngày thi</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Khung giờ</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Phòng</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Thí sinh</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
              {list.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => router.push(`/exam-schedules?id=${row.id}`)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <td className="py-2 px-2.5 whitespace-nowrap">
                    <IdentifierBadge>{row.code}</IdentifierBadge>
                  </td>
                  <td className="py-2 px-2.5 whitespace-nowrap font-semibold text-slate-900 dark:text-slate-100 max-w-[200px] truncate" title={row.name}>
                    {row.name}
                  </td>
                  <td className="py-2 px-2 text-center whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {row.date}
                  </td>
                  <td className="py-2 px-2 text-center whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {row.time}
                  </td>
                  <td className="py-2 px-2 text-center whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {row.rooms}
                  </td>
                  <td className="py-2 px-2 text-center whitespace-nowrap font-semibold text-slate-800 dark:text-slate-200">
                    {row.students}
                  </td>
                  <td className="py-2 px-2 text-center whitespace-nowrap">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-slate-400 text-type-body-sm">
          Chưa có ca thi nào được lên lịch trong thời gian tới.
        </div>
      )}
    </div>
  );
}
