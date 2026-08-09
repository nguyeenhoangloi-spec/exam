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
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-[18px] font-semibold text-[#0F172A]">Công việc cần xử lý</h3>
      </div>

      {/* 4 Items */}
      <div className="space-y-2.5">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => router.push(task.route)}
              className="w-full flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50/30 hover:border-blue-300 cursor-pointer"
            >
              {/* Left icon & text */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-blue-50 border border-blue-200/60 text-[#2563EB] font-semibold">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 leading-tight">
                  <h4 className="text-[15px] font-medium text-[#0F172A] truncate">{task.title}</h4>
                  <p className="text-[13px] font-normal text-[#64748B] truncate mt-0.5">{task.subtitle}</p>
                </div>
              </div>

              {/* Right count, priority badge, arrow */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[15px] font-bold text-[#0F172A]">{task.count}</span>
                <Badge tone={task.tone} size="xs">
                  {task.priority}
                </Badge>
                <ChevronRight className="h-4 w-4 text-[#64748B]" />
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
          className="text-xs font-extrabold text-blue-600 hover:text-blue-700 transition cursor-pointer"
        >
          Xem tất cả công việc cần xử lý →
        </button>
      </div>
    </div>
  );
}
