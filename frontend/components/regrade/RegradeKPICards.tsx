'use client';

import React from 'react';
import { FileCheck, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface RegradeKPICardsProps {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

export function RegradeKPICards({
  all,
  pending,
  approved,
  rejected,
}: RegradeKPICardsProps) {
  const approveRate = all > 0 ? Math.round((approved / all) * 100) : 0;

  const items = [
    {
      title: 'Tổng số đơn',
      value: all,
      unit: 'đơn',
      subtext: 'Đã tiếp nhận trong kỳ thi',
      icon: FileCheck,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Chờ thẩm định',
      value: pending,
      unit: 'đơn',
      subtext: 'Cần xử lý & chấm lại bài',
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      title: 'Đã duyệt & Đổi điểm',
      value: approved,
      unit: 'đơn',
      subtext: `Tỷ lệ đổi điểm thành công ${approveRate}%`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Từ chối phúc khảo',
      value: rejected,
      unit: 'đơn',
      subtext: 'Giữ nguyên điểm số ban đầu',
      icon: XCircle,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {items.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.title}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[13px] font-semibold text-slate-500 block truncate tracking-normal">
                  {item.title}
                </span>
                <div className="text-[32px] font-bold text-slate-900 leading-[38px] tracking-tight tabular-nums">
                  {item.value.toLocaleString('vi-VN')}
                  {item.unit ? <span className="text-xs font-normal text-slate-500 ml-1">{item.unit}</span> : ''}
                </div>
              </div>

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.iconBg} transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600`}
              >
                <IconComponent className="h-5 w-5 stroke-[2]" />
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100/80">
              <span className="text-[13px] font-normal text-slate-500 block truncate">
                {item.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
