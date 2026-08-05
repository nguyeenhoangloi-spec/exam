'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardOverview } from '../../types/dashboard';
import { DashboardEmptyState } from './DashboardEmptyState';

const settings = {
  DRAFT: { label: 'Bản nháp / Đã xếp lịch', color: '#2563eb' },
  PENDING: { label: 'Đang diễn ra', color: '#10b981' },
  APPROVED: { label: 'Đã hoàn thành', color: '#f59e0b' },
  REJECTED: { label: 'Đã hủy', color: '#ef4444' },
  ARCHIVED: { label: 'Sắp diễn ra', color: '#06b6d4' },
};

export function QuestionStatusChart({ data }: { data: DashboardOverview['questionStatus'] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
      <div>
        <h2 className="text-base font-bold text-slate-900">Trạng thái ca thi</h2>
        <p className="text-xs font-medium text-slate-500 mt-0.5">Tổng số ca thi: <strong className="text-slate-800">{total}</strong></p>
      </div>

      {!total ? (
        <div className="py-6"><DashboardEmptyState message="Chưa có dữ liệu ca thi." /></div>
      ) : (
        <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row xl:flex-row">
          {/* Donut chart with centered total label */}
          <div className="relative h-48 w-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={52}
                  outerRadius={76}
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.map((item) => (
                    <Cell key={item.status} fill={settings[item.status]?.color || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                  formatter={(value, _name, item) => [
                    `${value} ca thi`,
                    settings[item.payload.status as keyof typeof settings]?.label || item.payload.status,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-900">{total}</span>
              <span className="text-[11px] font-semibold text-slate-400">Tổng ca thi</span>
            </div>
          </div>

          {/* Legend Items list on right */}
          <div className="w-full flex-1 space-y-2 text-xs">
            {data.map((item) => (
              <div key={item.status} className="flex items-center justify-between gap-3 p-1 rounded-lg hover:bg-slate-50 transition">
                <span className="flex min-w-0 items-center gap-2 font-medium text-slate-600">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: settings[item.status]?.color || '#94a3b8' }} />
                  <span className="truncate">{settings[item.status]?.label || item.status}</span>
                </span>
                <strong className="font-bold text-slate-900">{item.count}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
