'use client';

import React from 'react';
import { FileText, Layers, UserCheck, Send, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardAttention } from '../../types/dashboard';

export function TaskAttention({ attention }: { attention?: Partial<DashboardAttention> }) {
  const router = useRouter();

  const tasks = [
    {
      id: 'pending-questions',
      title: 'Câu hỏi chờ duyệt',
      subtitle: 'Cần duyệt câu hỏi mới',
      count: attention?.pendingQuestions ?? 0,
      icon: FileText,
      route: '/question-bank?status=PENDING',
    },
    {
      id: 'unassigned-rooms',
      title: 'Kỳ thi chưa xếp phòng',
      subtitle: 'Chưa hoàn tất xếp phòng thi',
      count: attention?.unassignedRooms ?? 0,
      icon: Layers,
      route: '/exam-arrangement',
    },
    {
      id: 'missing-supervisors',
      title: 'Ca thi thiếu giám thị',
      subtitle: 'Chưa đủ cán bộ coi thi',
      count: attention?.missingSupervisors ?? 0,
      icon: UserCheck,
      route: '/exam-supervisors',
    },
    {
      id: 'upcoming-exams',
      title: 'Kỳ thi sắp diễn ra',
      subtitle: 'Trong 7 ngày tới',
      count: attention?.upcomingExams ?? 0,
      icon: Send,
      route: '/exam-periods',
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-2 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <h3 className="edu-card-title">Công việc cần xử lý</h3>
        <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
          <span>Ưu tiên khảo thí</span>
        </span>
      </div>

      {/* 4 Task Items */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80 my-auto">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => router.push(task.route)}
              className="w-full flex items-center justify-between gap-2.5 py-2.5 px-2 rounded-xl text-left transition-all duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer group"
            >
              {/* Left icon & text */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/60 dark:border-blue-900/60 transition-transform duration-150 group-hover:scale-105">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 leading-tight">
                  <h4 className="text-[14px] font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {task.title}
                  </h4>
                  <p className="text-[12.5px] font-normal text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {task.subtitle}
                  </p>
                </div>
              </div>

              {/* Right count and arrow */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-lg text-[13px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                  {task.count}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between text-[12.5px]">
        <span className="text-slate-400">Trạng thái công việc</span>
        <span className="font-semibold text-blue-600 dark:text-blue-400">
          Tự động đồng bộ
        </span>
      </div>
    </div>
  );
}
