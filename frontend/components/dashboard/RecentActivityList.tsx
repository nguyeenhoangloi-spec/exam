'use client';

import React from 'react';
import {
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  FileQuestion,
  FileText,
  Layers,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardOverview } from '../../types/dashboard';

const sampleActivities = [
  {
    id: '1',
    user: 'Nguyễn Văn A',
    text: 'đã tạo kỳ thi Học kỳ II năm 2024 - 2025',
    time: '2 phút trước',
    icon: CalendarPlus,
    iconBg: 'bg-purple-100 text-purple-700',
  },
  {
    id: '2',
    user: 'Trần Thị B',
    text: 'đã thêm 20 câu hỏi mới Môn: Cấu trúc dữ liệu',
    time: '15 phút trước',
    icon: FileQuestion,
    iconBg: 'bg-amber-100 text-amber-800',
  },
  {
    id: '3',
    user: 'Lê Văn C',
    text: 'đã duyệt 15 câu hỏi Môn: Cơ sở dữ liệu',
    time: '1 giờ trước',
    icon: CheckCircle2,
    iconBg: 'bg-blue-100 text-blue-700',
  },
  {
    id: '4',
    user: 'Hệ thống',
    text: 'đã xếp 120 sinh viên vào phòng thi A201',
    time: '2 giờ trước',
    icon: Layers,
    iconBg: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: '5',
    user: 'Phạm Minh Đức',
    text: 'đã tạo đề thi Đề thi giữa kỳ - CNTT K15A',
    time: '3 giờ trước',
    icon: FileText,
    iconBg: 'bg-rose-100 text-rose-700',
  },
];

export function RecentActivityList({ activities }: { activities?: DashboardOverview['recentActivities'] }) {
  const router = useRouter();

  const activityList = (activities && activities.length > 0)
    ? activities.slice(0, 5).map((act, idx) => {
        const icons = [CalendarPlus, FileQuestion, CheckCircle2, Layers, FileText];
        const bgs = ['bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-800', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-rose-100 text-rose-700'];

        return {
          id: act.id || String(idx),
          user: act.actor?.username || 'Hệ thống',
          text: act.description || 'thực hiện thao tác trên hệ thống',
          time: act.createdAt ? '2 phút trước' : 'vừa xong',
          icon: icons[idx % icons.length],
          iconBg: bgs[idx % bgs.length],
        };
      })
    : sampleActivities;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-black text-slate-900">Hoạt động gần đây</h3>

        <button
          type="button"
          onClick={() => router.push('/reports')}
          className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-700 transition cursor-pointer"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Timeline Items List */}
      <div className="space-y-3.5">
        {activityList.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="flex items-start gap-3 text-xs">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold mt-0.5 ${item.iconBg}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0 leading-tight">
                <p className="text-slate-800">
                  <strong className="font-extrabold text-slate-900">{item.user}</strong>{' '}
                  <span className="font-medium text-slate-700">{item.text}</span>
                </p>
                <span className="text-[10.5px] font-semibold text-slate-400 block mt-1">
                  {item.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
