'use client';

import React, { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts';
import { DashboardOverview } from '../../types/dashboard';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const mock7Days = [
  { label: '17/05', count: 12 },
  { label: '18/05', count: 18 },
  { label: '19/05', count: 15 },
  { label: '20/05', count: 20 },
  { label: '21/05', count: 17 },
  { label: '22/05', count: 14 },
  { label: '23/05', count: 8 },
];

export function ExamScheduleChart({ data }: { data?: DashboardOverview['examChart'] }) {
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState('7 ngày qua');

  const chartData = (data && data.length > 0 && data.some((x) => x.count > 0)) ? data : mock7Days;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3 h-full flex flex-col justify-between">
      {/* Header & Filter */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-sm font-black text-slate-900">Số ca thi theo ngày</h3>

        <div className="relative">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 pr-7 text-xs font-bold text-slate-700 outline-none hover:bg-slate-100 transition cursor-pointer"
          >
            <option value="7 ngày qua">7 ngày qua</option>
            <option value="30 ngày qua">30 ngày qua</option>
            <option value="Theo kỳ">Theo kỳ</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-56 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                fontSize: '12px',
                fontWeight: 700,
              }}
              formatter={(value) => [`${value} ca thi`, 'Số ca thi']}
            />
            <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={28}>
              <LabelList dataKey="count" position="top" style={{ fill: '#1e293b', fontSize: '11px', fontWeight: '800' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Link */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <span className="h-2.5 w-2.5 rounded-xs bg-blue-600 inline-block" />
          <span>Số ca thi</span>
        </div>

        <button
          type="button"
          onClick={() => router.push('/exam-schedules')}
          className="inline-flex items-center gap-1 font-extrabold text-blue-600 hover:text-blue-700 transition cursor-pointer"
        >
          <span>Xem chi tiết</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
