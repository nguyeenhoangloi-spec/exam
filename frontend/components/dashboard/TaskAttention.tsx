'use client';

import React from 'react';
import { FileText, Layers, UserCheck, Send, ChevronRight, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardAttention } from '../../types/dashboard';

export function TaskAttention({ attention }: { attention?: Partial<DashboardAttention> }) {
  const router = useRouter();

  const tasks = [
    {
      id: 'pending-questions',
      title: 'Câu hỏi chờ duyệt',
      subtitle: 'Cần duyệt các câu hỏi mới',
      count: attention?.pendingQuestions ?? 12,
      priority: 'Cao',
      priorityColor: 'bg-rose-50 text-rose-700 border-rose-200',
      iconBg: 'bg-rose-100 text-rose-700',
      icon: FileText,
      route: '/question-bank?status=PENDING',
    },
    {
      id: 'unassigned-rooms',
      title: 'Kỳ thi chưa xếp phòng',
      subtitle: 'Chưa hoàn tất xếp phòng thi',
      count: attention?.unassignedRooms ?? 3,
      priority: 'Trung bình',
      priorityColor: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBg: 'bg-amber-100 text-amber-700',
      icon: Layers,
      route: '/exam-arrangement',
    },
    {
      id: 'missing-supervisors',
      title: 'Ca thi thiếu giám thị',
      subtitle: 'Chưa đủ giám thị cho ca thi',
      count: attention?.missingSupervisors ?? 5,
      priority: 'Trung bình',
      priorityColor: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBg: 'bg-amber-100 text-amber-700',
      icon: UserCheck,
      route: '/exam-supervisors',
    },
    {
      id: 'upcoming-exams',
      title: 'Kỳ thi sắp diễn ra',
      subtitle: 'Trong 7 ngày tới',
      count: attention?.upcomingExams ?? 8,
      priority: 'Thấp',
      priorityColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-700',
      icon: Send,
      route: '/exam-periods',
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-base font-black text-slate-900">Công việc cần xử lý</h3>
      </div>

      {/* 4 Priority Items */}
      <div className="space-y-2.5">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => router.push(task.route)}
              className="w-full flex items-center justify-between gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50/30 hover:border-blue-300 cursor-pointer"
            >
              {/* Left icon & text */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold ${task.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 leading-tight">
                  <h4 className="text-xs font-black text-slate-900 truncate">{task.title}</h4>
                  <p className="text-[10.5px] font-medium text-slate-500 truncate mt-0.5">{task.subtitle}</p>
                </div>
              </div>

              {/* Right count, priority badge, arrow */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-black text-slate-900">{task.count}</span>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9.5px] font-extrabold ${task.priorityColor}`}>
                  {task.priority}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Link */}
      <div className="border-t border-slate-100 pt-2">
        <button
          type="button"
          onClick={() => router.push('/question-bank?status=PENDING')}
          className="w-full flex items-center justify-between text-xs font-extrabold text-blue-600 hover:text-blue-700 transition cursor-pointer"
        >
          <span>Xem tất cả công việc</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
