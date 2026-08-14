'use client';

import React from 'react';
import { FileText, Layers, UserCheck, Send, ChevronRight, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '../ui/Badge';
import type { DashboardAttention } from '../../types/dashboard';

export function TaskAttention({ attention }: { attention?: Partial<DashboardAttention> }) {
  const router = useRouter();

  const tasks = [
    {
      id: 'pending-questions',
      title: 'Câu hỏi chờ duyệt',
      subtitle: 'Cần duyệt câu hỏi mới',
      count: attention?.pendingQuestions ?? 0,
      priority: 'Khẩn cấp',
      tone: 'rose' as const,
      icon: FileText,
      iconBg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
      route: '/question-bank?status=PENDING',
    },
    {
      id: 'unassigned-rooms',
      title: 'Kỳ thi chưa xếp phòng',
      subtitle: 'Chưa hoàn tất xếp phòng thi',
      count: attention?.unassignedRooms ?? 0,
      priority: 'Cần xử lý',
      tone: 'amber' as const,
      icon: Layers,
      iconBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
      route: '/exam-arrangement',
    },
    {
      id: 'missing-supervisors',
      title: 'Ca thi thiếu giám thị',
      subtitle: 'Chưa đủ giám thị coi thi',
      count: attention?.missingSupervisors ?? 0,
      priority: 'Cần xử lý',
      tone: 'amber' as const,
      icon: UserCheck,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400',
      route: '/exam-supervisors',
    },
    {
      id: 'upcoming-exams',
      title: 'Kỳ thi sắp diễn ra',
      subtitle: 'Trong 7 ngày tới',
      count: attention?.upcomingExams ?? 0,
      priority: 'Kế hoạch',
      tone: 'emerald' as const,
      icon: Send,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
      route: '/exam-periods',
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-2 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <h3 className="edu-card-title">Công việc cần xử lý</h3>
        <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3" />
          <span>Theo ưu tiên</span>
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
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-semibold transition-transform duration-150 group-hover:scale-105 ${task.iconBg}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 leading-tight">
                  <h4 className="text-[14.5px] font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {task.title}
                  </h4>
                  <p className="text-[12.5px] font-normal text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {task.subtitle}
                  </p>
                </div>
              </div>

              {/* Right count, priority badge, arrow */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[14.5px] font-bold text-slate-900 dark:text-slate-100">
                  {task.count}
                </span>
                <Badge tone={task.tone} size="xs">
                  {task.priority}
                </Badge>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Link */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-2 text-center">
        <button
          type="button"
          onClick={() => router.push('/question-bank?status=PENDING')}
          className="inline-flex items-center gap-1 text-[13.5px] leading-5 font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition cursor-pointer select-none"
        >
          <span>Xem tất cả công việc</span>
          <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </button>
      </div>
    </div>
  );
}

