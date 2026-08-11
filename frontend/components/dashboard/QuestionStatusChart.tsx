'use client';

import React, { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardOverview } from '../../types/dashboard';
import { ChevronDown, CheckCircle2, Clock, XCircle, Pencil } from 'lucide-react';

export function QuestionStatusChart({ data }: { data?: DashboardOverview['questionStatus'] }) {
  const [filter, setFilter] = useState('Tất cả');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Find counts from real API data or fallback to mockup values if API data missing
  const approvedCount = data?.find((x) => x.status === 'APPROVED')?.count ?? 2205;
  const pendingCount = data?.find((x) => x.status === 'PENDING')?.count ?? 8;
  const rejectedCount = data?.find((x) => x.status === 'REJECTED')?.count ?? 0;
  const editCount = data?.find((x) => String(x.status) === 'NEEDS_REVISION' || String(x.status) === 'EDIT')?.count ?? 3;

  const rawItems = [
    {
      status: 'APPROVED',
      label: 'Đã duyệt',
      count: approvedCount,
      color: '#10b981',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
    },
    {
      status: 'PENDING',
      label: 'Chờ duyệt',
      count: pendingCount,
      color: '#f59e0b',
      icon: Clock,
      iconColor: 'text-amber-500',
    },
    {
      status: 'REJECTED',
      label: 'Bị từ chối',
      count: rejectedCount,
      color: '#ef4444',
      icon: XCircle,
      iconColor: 'text-rose-500',
    },
    {
      status: 'NEEDS_REVISION',
      label: 'Cần chỉnh sửa',
      count: editCount,
      color: '#3b82f6',
      icon: Pencil,
      iconColor: 'text-blue-500',
    },
  ];

  const totalCount = rawItems.reduce((acc, curr) => acc + curr.count, 0);

  const chartData = rawItems.map((item) => {
    const rawPct = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
    const formattedPct = rawPct.toFixed(1).replace('.', ',') + '%';
    return {
      ...item,
      percent: formattedPct,
    };
  });

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs h-full flex flex-col justify-between overflow-hidden">
      {/* Header & Dropdown */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-[17px] font-bold text-slate-900">Thống kê trạng thái câu hỏi</h3>

        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-white px-3 py-1.5 pr-7 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <option value="Tất cả">Tất cả</option>
            <option value="Tháng này">Tháng này</option>
            <option value="Học kỳ này">Học kỳ này</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Donut & Legend side by side */}
      <div className="flex-1 flex flex-row items-center justify-between gap-4 py-4 min-w-0 my-auto">
        {/* Donut Canvas */}
        <div className="relative h-44 w-44 shrink-0">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  stroke="none"
                >
                  {chartData.map((item) => (
                    <Cell key={item.status} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                  formatter={(value, name) => [`${Number(value).toLocaleString('vi-VN')} câu`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded-full bg-slate-100 animate-pulse" />
          )}

          {/* Center Text */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] font-medium text-slate-400">Tổng</span>
            <span className="text-xl font-black text-slate-900 leading-tight my-0.5">
              {totalCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-[11px] font-medium text-slate-400">câu hỏi</span>
          </div>
        </div>

        {/* Legend List on Right - Generous Padding & Spacing */}
        <div className="flex-1 min-w-0 space-y-4 py-1">
          {chartData.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.status} className="flex items-center justify-between text-xs sm:text-sm gap-2 py-1">
                <div className="flex items-center gap-2 shrink-0">
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${item.iconColor}`} />
                  <span className="font-semibold text-slate-700 whitespace-nowrap">{item.label}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-extrabold text-slate-900">{item.count.toLocaleString('vi-VN')}</span>
                  <span className="w-12 text-right text-xs font-semibold text-slate-400">{item.percent}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}



