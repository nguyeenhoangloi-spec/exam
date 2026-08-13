'use client';

import React, { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardOverview } from '../../types/dashboard';
import { CheckCircle2, Clock, XCircle, Pencil } from 'lucide-react';
import { FilterSelect } from '../ui/FilterSelect';

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
      color: 'var(--ui-chart-success)',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
    },
    {
      status: 'PENDING',
      label: 'Chờ duyệt',
      count: pendingCount,
      color: 'var(--ui-chart-warning)',
      icon: Clock,
      iconColor: 'text-amber-500',
    },
    {
      status: 'REJECTED',
      label: 'Bị từ chối',
      count: rejectedCount,
      color: 'var(--ui-chart-danger)',
      icon: XCircle,
      iconColor: 'text-rose-500',
    },
    {
      status: 'NEEDS_REVISION',
      label: 'Cần chỉnh sửa',
      count: editCount,
      color: 'var(--ui-chart-primary-light)',
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
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs h-full flex flex-col justify-between overflow-hidden">
      {/* Header & Dropdown */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h3 className="edu-card-title">Thống kê trạng thái câu hỏi</h3>

        <FilterSelect
          size="sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="Tất cả">Tất cả</option>
          <option value="Tháng này">Tháng này</option>
          <option value="Học kỳ này">Học kỳ này</option>
        </FilterSelect>
      </div>

      {/* Donut & Legend side by side */}
      <div className="flex-1 flex flex-row items-center justify-between gap-3 py-2 min-w-0 my-auto">
        {/* Donut Canvas */}
        <div className="relative h-36 w-36 shrink-0">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={40}
                  outerRadius={62}
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
                    border: '1px solid var(--ui-border)',
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
            <span className="text-[12px] font-medium text-slate-400">Tổng</span>
            <span className="text-xl font-semibold text-slate-900 leading-tight my-0.5">
              {totalCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-[12px] font-medium text-slate-400">câu hỏi</span>
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
                  <span className="font-semibold text-slate-900">{item.count.toLocaleString('vi-VN')}</span>
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

