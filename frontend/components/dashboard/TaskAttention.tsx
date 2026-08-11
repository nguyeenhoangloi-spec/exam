'use client';

import React from 'react';
import { FileText, Layers, UserCheck, Send, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '../ui/Badge';
import type { DashboardAttention } from '../../types/dashboard';

export function TaskAttention({ attention }: { attention?: Partial<DashboardAttention> }) {
  const router = useRouter();

  const tasks = [
    {
      id: 'pending-questions',
      title: 'Câu hỏi chờ duyệt',
      subtitle: 'Cần duyệt các câu hỏi mới',
      count: attention?.pendingQuestions ?? 0,
      priority: 'Cao',
      tone: 'rose' as const,
      icon: FileText,
      route: '/question-bank?status=PENDING',
    },
    {
      id: 'unassigned-rooms',
      title: 'Kỳ thi chưa xếp phòng',
      subtitle: 'Chưa hoàn tất xếp phòng thi',
      count: attention?.unassignedRooms ?? 0,
      priority: 'Trung bình',
      tone: 'amber' as const,
      icon: Layers,
      route: '/exam-arrangement',
    },
    {
      id: 'missing-supervisors',
      title: 'Ca thi thiếu giám thị',
      subtitle: 'Chưa đủ giám thị cho ca thi',
      count: attention?.missingSupervisors ?? 0,
      priority: 'Trung bình',
      tone: 'amber' as const,
      icon: UserCheck,
      route: '/exam-supervisors',
    },
    {
      id: 'upcoming-exams',
      title: 'Kỳ thi sắp diễn ra',
      subtitle: 'Trong 7 ngày tới',
      count: attention?.upcomingExams ?? 0,
      priority: 'Thấp',
      tone: 'emerald' as const,
      icon: Send,
      route: '/exam-periods',
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-2 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="border-b border-slate-100 pb-2.5">
        <h3 className="text-[17px] font-semibold text-[#0F172A]">Công việc cần xử lý</h3>
      </div>

      {/* 4 Items - Bỏ khung riêng từng item */}
      <div className="divide-y divide-slate-100">
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
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] group-hover:bg-blue-600 group-hover:text-white transition-colors duration-150">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 leading-tight">
                  <h4 className="text-[15px] font-medium text-[#0F172A] dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">{task.title}</h4>
                  <p className="text-[13px] font-normal text-[#64748B] dark:text-slate-400 truncate mt-0.5">{task.subtitle}</p>
                </div>
              </div>

              {/* Right count, priority badge, arrow */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[15px] font-semibold text-[#0F172A] dark:text-slate-200">{task.count}</span>
                <Badge tone={task.tone} size="xs">
                  {task.priority}
                </Badge>
                <ChevronRight className="h-4 w-4 text-[#64748B] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Link */}
      <div className="border-t border-slate-100 pt-2 text-center">
        <button
          type="button"
          onClick={() => router.push('/question-bank?status=PENDING')}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition cursor-pointer"
        >
          Xem tất cả công việc cần xử lý →
        </button>
      </div>
    </div>
  );
}
