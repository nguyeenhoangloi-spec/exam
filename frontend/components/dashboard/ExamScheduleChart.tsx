'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DashboardOverview } from '../../types/dashboard';
import { DashboardEmptyState } from './DashboardEmptyState';
import { ChevronDown } from 'lucide-react';

export function ExamScheduleChart({ data }: { data: DashboardOverview['examChart'] }) {
  const [filter, setFilter] = useState<'6m' | '12m' | 'year'>('6m');
  const hasData = data.some((item) => item.count > 0);

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Lịch thi theo tháng</h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Số lượng kỳ thi theo từng tháng</p>
        </div>

        {/* Time period filter controls */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('6m')}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition ${
              filter === '6m' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>6 tháng</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => setFilter('12m')}
            className={`rounded-lg px-2.5 py-1 transition ${
              filter === '12m' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            12 tháng
          </button>
          <button
            type="button"
            onClick={() => setFilter('year')}
            className={`rounded-lg px-2.5 py-1 transition ${
              filter === 'year' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Năm nay
          </button>
        </div>
      </div>

      {!hasData ? (
        <DashboardEmptyState message="Chưa có dữ liệu lịch thi theo tháng." />
      ) : (
        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 600 }}
                formatter={(value) => [`${value} kỳ thi`, 'Số lượng']}
              />
              <Bar dataKey="count" fill="#1e66f5" radius={[6, 6, 0, 0]} maxBarSize={38} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
