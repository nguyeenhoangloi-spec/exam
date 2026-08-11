'use client';

import React, { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DashboardOverview } from '../../types/dashboard';
import { Calendar } from 'lucide-react';
import { FilterSelect } from '../ui/FilterSelect';

export function ExamScheduleChart({ data }: { data?: DashboardOverview['examChart'] }) {
  const [timeFilter, setTimeFilter] = useState('7 ngày tới');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData: Array<{ label: string; count: number }> = data && data.length > 0
    ? data
    : [
        { label: '11/04/2026', count: 0 },
        { label: '12/04/2026', count: 3 },
        { label: '13/04/2026', count: 2 },
        { label: '14/04/2026', count: 18 },
        { label: '15/04/2026', count: 0 },
        { label: '16/04/2026', count: 1 },
        { label: '17/04/2026', count: 14 },
      ];

  const totalExams = chartData.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-2 h-full flex flex-col justify-between">
      {/* Header & Dropdown Filter */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h3 className="text-[17px] font-semibold text-slate-900">Lịch thi trong 7 ngày tới</h3>

        <FilterSelect
          size="sm"
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
        >
          <option value="7 ngày tới">7 ngày tới</option>
          <option value="14 ngày tới">14 ngày tới</option>
          <option value="30 ngày tới">30 ngày tới</option>
        </FilterSelect>
      </div>

      {/* Subheader badge */}
      <div className="flex items-center gap-2 pt-0.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
          <Calendar className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs font-semibold text-slate-900">{totalExams} kỳ thi sắp diễn ra</span>
      </div>

      {/* Y-axis label */}
      <div className="text-[11px] font-medium text-slate-400 pl-1">
        Số lượng
      </div>

      {/* Chart Canvas */}
      <div className="h-40 w-full min-w-0">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 15, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorExams" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              />
              <Tooltip
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
                formatter={(value) => [`${value} kỳ thi`, 'Số kỳ thi']}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorExams)"
                dot={{ r: 4, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full rounded-2xl bg-slate-100 animate-pulse" />
        )}
      </div>

      {/* Legend at bottom */}
      <div className="flex items-center justify-center border-t border-slate-100 pt-2 text-xs font-semibold text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-blue-600 inline-block" />
          <span>Số kỳ thi</span>
        </div>
      </div>
    </div>
  );
}
