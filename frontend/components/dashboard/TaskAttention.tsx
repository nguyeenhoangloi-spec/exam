'use client';

import React from 'react';
import { FileText, Layers, Users, Calendar, ArrowRight, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardAttention } from '../../types/dashboard';

type TaskTone = 'danger' | 'warning' | 'blue' | 'orange';

const toneStyles: Record<TaskTone, { border: string; bg: string; chip: string }> = {
  danger: {
    border: 'border-rose-200/90 hover:border-rose-300',
    bg: 'bg-rose-50/50 hover:bg-rose-50/80',
    chip: 'bg-rose-100 text-rose-700 font-extrabold',
  },
  warning: {
    border: 'border-amber-200/90 hover:border-amber-300',
    bg: 'bg-amber-50/50 hover:bg-amber-50/80',
    chip: 'bg-amber-100 text-amber-800 font-extrabold',
  },
  blue: {
    border: 'border-blue-200/90 hover:border-blue-300',
    bg: 'bg-blue-50/50 hover:bg-blue-50/80',
    chip: 'bg-blue-100 text-blue-800 font-extrabold',
  },
  orange: {
    border: 'border-orange-200/90 hover:border-orange-300',
    bg: 'bg-orange-50/50 hover:bg-orange-50/80',
    chip: 'bg-orange-100 text-orange-800 font-extrabold',
  },
};

export function TaskAttention({ attention }: { attention?: Partial<DashboardAttention> }) {
  const router = useRouter();

  const tasks = [
    {
      id: 'pending-questions',
      title: 'Câu hỏi chờ duyệt',
      count: attention?.pendingQuestions ?? 23,
      route: '/question-bank?status=PENDING',
      tone: 'danger' as TaskTone,
      icon: FileText,
    },
    {
      id: 'unassigned-rooms',
      title: 'Lịch thi chưa xếp phòng',
      count: attention?.unassignedRooms ?? 5,
      route: '/exam-arrangement',
      tone: 'warning' as TaskTone,
      icon: Layers,
    },
    {
      id: 'missing-supervisors',
      title: 'Phòng thi thiếu giám thị',
      count: attention?.missingSupervisors ?? 3,
      route: '/exam-supervisors',
      tone: 'blue' as TaskTone,
      icon: Users,
    },
    {
      id: 'upcoming-exams',
      title: 'Kỳ thi sắp diễn ra',
      count: attention?.upcomingExams ?? 2,
      route: '/exam-periods',
      tone: 'orange' as TaskTone,
      icon: Calendar,
    },
  ];

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-white p-5 shadow-2xs h-full flex flex-col justify-between">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 font-bold text-amber-700">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-black text-slate-900">Công việc cần chú ý</h3>
        </div>
        <span className="rounded-full bg-amber-100/90 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800">
          Cần ưu tiên xử lý
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tasks.map((task) => {
          const Icon = task.icon;
          const tone = toneStyles[task.tone];
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => router.push(task.route)}
              className={`group relative flex flex-col justify-between rounded-xl border ${tone.border} ${tone.bg} p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.98] cursor-pointer`}
            >
              <div className="mb-1.5 flex items-start justify-between gap-1.5">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tone.chip}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-xl font-black tracking-tight text-slate-900">{task.count}</span>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-800 transition-colors group-hover:text-slate-900 leading-tight">
                  {task.title}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold text-blue-600 group-hover:text-blue-700">
                  <span>Xem ngay</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
