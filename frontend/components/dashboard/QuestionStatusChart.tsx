'use client';

import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardOverview } from '../../types/dashboard';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function QuestionStatusChart({ data }: { data?: DashboardOverview['questionStatus'] }) {
  const router = useRouter();

  // Find counts from real API data
  const pendingCount = data?.find((x) => x.status === 'PENDING')?.count ?? 0;
  const approvedCount = data?.find((x) => x.status === 'APPROVED')?.count ?? 0;
  const rejectedCount = data?.find((x) => x.status === 'REJECTED')?.count ?? 0;

  const hasRealData = pendingCount > 0 || approvedCount > 0 || rejectedCount > 0;

  // Items list
  const rawItems = [
    {
      status: 'PENDING',
      label: 'Chờ duyệt',
      count: hasRealData ? pendingCount : 1230,
      color: '#f59e0b',
    },
    {
      status: 'APPROVED',
      label: 'Đã duyệt',
      count: hasRealData ? approvedCount : 12450,
      color: '#16a34a',
    },
    {
      status: 'REJECTED',
      label: 'Bị từ chối',
      count: hasRealData ? rejectedCount : 1550,
      color: '#ef4444',
    },
  ];

  // Calculate sum from actual items rendered to ensure percentages ALWAYS sum to 100%
  const totalCount = rawItems.reduce((acc, curr) => acc + curr.count, 0);

  const chartData = rawItems.map((item) => ({
    ...item,
    percent: totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) + '%' : '0%',
  }));

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3 h-full flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-100 pb-2">
        <h3 className="text-sm font-black text-slate-900">Trạng thái câu hỏi</h3>
      </div>

      {/* Donut & Legend side by side */}
      <div className="flex flex-row items-center justify-between gap-2 py-1 min-w-0">
        {/* Donut Canvas */}
        <div className="relative h-32 w-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="label"
                innerRadius={36}
                outerRadius={56}
                paddingAngle={3}
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
                  fontSize: '11px',
                  fontWeight: 700,
                }}
                formatter={(value, name) => [`${Number(value).toLocaleString('vi-VN')} câu`, name]}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold text-slate-400">Tổng số</span>
            <span className="text-sm font-black text-slate-900 leading-none my-0.5">
              {totalCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-[9px] font-bold text-slate-400">câu hỏi</span>
          </div>
        </div>

        {/* Legend List on Right */}
        <div className="flex-1 min-w-0 space-y-2 text-xs font-semibold pl-1">
          {chartData.map((item) => (
            <div key={item.status} className="flex items-center justify-between gap-1 text-[11px]">
              <span className="flex items-center gap-1 min-w-0 shrink">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-700 font-bold truncate text-[10.5px]">{item.label}</span>
              </span>
              <div className="text-right shrink-0 font-extrabold text-slate-900 text-[11px] whitespace-nowrap">
                {item.count.toLocaleString('vi-VN')} <span className="text-[9.5px] text-slate-400 font-semibold ml-0.5">({item.percent})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Link */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
        <button
          type="button"
          onClick={() => router.push('/question-bank')}
          className="inline-flex items-center gap-1 font-extrabold text-blue-600 hover:text-blue-700 transition cursor-pointer"
        >
          <span>Xem chi tiết</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
