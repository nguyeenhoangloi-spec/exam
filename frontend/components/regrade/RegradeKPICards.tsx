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
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Đã duyệt & Đổi điểm',
      value: approved,
      unit: 'đơn',
      subtext: `Tỷ lệ đổi điểm ${approveRate}%`,
      icon: CheckCircle2,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Từ chối phúc khảo',
      value: rejected,
      unit: 'đơn',
      subtext: 'Giữ nguyên điểm số ban đầu',
      icon: XCircle,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
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
              <div className="space-y-1">
                <span className="text-[13px] font-semibold text-[#64748B] tracking-wider">
                  {item.title}
                </span>
                <p className="text-[32px] font-bold text-[#0F172A] leading-[38px]">
                  {item.value.toLocaleString('vi-VN')}
                  {item.unit ? <span className="text-xs font-normal text-[#64748B] ml-1">{item.unit}</span> : ''}
                </p>
              </div>

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.iconBg} transition-all duration-200 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600`}
              >
                <IconComponent className="h-5 w-5" />
              </div>
            </div>

            <span className="text-[13px] font-normal text-[#64748B] mt-2">
              {item.subtext}
            </span>
          </div>
        );
      })}
    </div>
  );
}
