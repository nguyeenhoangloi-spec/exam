'use client';

import React from 'react';
import {
  CalendarPlus,
  Clock,
  Layers,
  UserCheck,
  CheckSquare,
  FileText,
  FileSpreadsheet,
  BarChart3,
  LucideIcon,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuickActionItem {
  title: string;
  desc: string;
  icon: LucideIcon;
  route: string;
  iconBg: string;
  iconColor: string;
}

const quickActions: QuickActionItem[] = [
  {
    title: 'Tạo kỳ thi',
    desc: 'Đợt thi mới',
    icon: CalendarPlus,
    route: '/exam-periods?action=create',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Tạo lịch thi',
    desc: 'Lập ca thi',
    icon: Clock,
    route: '/exam-schedules?action=create',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Xếp phòng',
    desc: 'Xếp tự động',
    icon: Layers,
    route: '/exam-arrangement',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Phân công GT',
    desc: 'Coi thi',
    icon: UserCheck,
    route: '/exam-supervisors',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Duyệt câu hỏi',
    desc: 'Kiểm duyệt',
    icon: CheckSquare,
    route: '/question-bank?status=PENDING',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Tạo đề thi',
    desc: 'Sinh tự động',
    icon: FileText,
    route: '/exam-papers',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Nhập điểm',
    desc: 'Quản lý điểm',
    icon: FileSpreadsheet,
    route: '/exam-reports',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Báo cáo',
    desc: 'Thống kê',
    icon: BarChart3,
    route: '/reports',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
          <Zap className="h-3.5 w-3.5 fill-blue-600" />
        </span>
        <h3 className="text-sm font-semibold text-slate-900">Thao tác nhanh</h3>
      </div>

      {/* Grid 8 Buttons Horizontally across 8 cols on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {quickActions.map(({ title, desc, icon: Icon, route, iconBg, iconColor }) => (
          <button
            key={title}
            type="button"
            onClick={() => router.push(route)}
            className="group flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white p-2.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs hover:border-slate-300/90 hover:bg-slate-50/60 outline-none focus:outline-none ring-0 focus:ring-0 active:scale-98 cursor-pointer"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl font-semibold transition-transform group-hover:scale-110 mb-1.5 ${iconBg} ${iconColor}`}>
              <Icon className="h-4 w-4 stroke-[2.2]" />
            </div>
            <span className="text-[15px] font-semibold text-slate-900 group-hover:text-blue-700 leading-tight block truncate w-full">
              {title}
            </span>
            <span className="text-[13px] font-normal text-slate-500 block truncate w-full mt-0.5">
              {desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
