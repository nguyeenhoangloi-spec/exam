'use client';

import React, { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardOverview } from '../../types/dashboard';
import { ChevronDown } from 'lucide-react';

export function QuestionStatusChart({ data }: { data?: DashboardOverview['questionStatus'] }) {
  const [filter, setFilter] = useState('Tất cả');

  // Find counts from real API data
  const pendingCount = data?.find((x) => x.status === 'PENDING')?.count ?? 0;
  const approvedCount = data?.find((x) => x.status === 'APPROVED')?.count ?? 0;
  const rejectedCount = data?.find((x) => x.status === 'REJECTED')?.count ?? 0;

  const hasRealData = pendingCount > 0 || approvedCount > 0 || rejectedCount > 0;

  // Items list matching mockup data format
  const rawItems = [
    {
      status: 'APPROVED',
      label: 'Đã duyệt',
      count: hasRealData ? approvedCount : 1892,
      color: '#16a34a',
    },
    {
      status: 'PENDING',
      label: 'Chờ duyệt',
      count: hasRealData ? pendingCount : 12,
      color: '#f59e0b',
    },
    {
      status: 'REJECTED',
      label: 'Bị từ chối',
      count: hasRealData ? rejectedCount : 18,
      color: '#ef4444',
    },
  ];

  // Calculate sum
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
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3 h-full flex flex-col justify-between overflow-hidden">
      {/* Header & Dropdown */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm sm:text-base font-black text-slate-900">Thống kê trạng thái câu hỏi</h3>

        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-white px-3 py-1 pr-7 text-xs font-bold text-slate-700 outline-none hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <option value="Tất cả">Tất cả</option>
            <option value="Tháng này">Tháng này</option>
            <option value="Học kỳ này">Học kỳ này</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Donut & Legend side by side */}
      <div className="flex flex-row items-center justify-between gap-3 py-2 min-w-0">
        {/* Donut Canvas */}
        <div className="relative h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="label"
                innerRadius={42}
                outerRadius={66}
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
                  fontSize: '12px',
                  fontWeight: 700,
                }}
                formatter={(value, name) => [`${Number(value).toLocaleString('vi-VN')} câu`, name]}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-slate-400">Tổng</span>
            <span className="text-base font-black text-slate-900 leading-none my-0.5">
              {totalCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-[10px] font-bold text-slate-400">câu hỏi</span>
          </div>
        </div>

        {/* Legend List on Right */}
        <div className="flex-1 min-w-0 space-y-3 text-xs font-semibold">
          {chartData.map((item) => (
            <div key={item.status} className="flex items-center justify-between gap-1.5 text-xs">
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="h-2.5 w-2.5 shrink-0 rounded-xs" style={{ backgroundColor: item.color }} />
                <span className="text-slate-700 font-bold truncate">{item.label}</span>
              </span>
              <div className="text-right shrink-0 font-extrabold text-slate-900 whitespace-nowrap">
                {item.count.toLocaleString('vi-VN')}{' '}
                <span className="text-[10.5px] text-slate-400 font-semibold ml-0.5">({item.percent})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
