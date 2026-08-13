'use client';

import React from 'react';
import { ChevronRight, Layers, PieChart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardOverview } from '../../types/dashboard';

export function ExamProgressOverview({ periods }: { periods?: DashboardOverview['examProgress'] }) {
  const router = useRouter();
  const list = (periods && periods.length > 0)
    ? periods.slice(0, 5).map((p) => {
        const pct = Math.min(100, Math.max(0, p.paperProgress || p.roomProgress || 0));
        const isComplete = pct === 100;
        const periodItem = p as any;
        return {
          code: periodItem.periodCode || `KT-${p.id}`,
          name: p.name || periodItem.periodName || 'Kỳ thi Cuối HK1 (2025-2026)',
          progress: pct || 34,
          status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
        };
      })
    : [
        {
          code: 'KT-1',
          name: 'Kỳ thi Cuối HK1 (2025-2026)',
          progress: 34,
          status: 'IN_PROGRESS',
        },
      ];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="edu-card-title">Tiến độ tổ chức kỳ thi</h3>
        <button
          type="button"
          onClick={() => router.push('/exam-periods')}
          className="inline-flex items-center gap-1 text-[14px] leading-5 font-medium text-primary-600 hover:text-primary-700 transition cursor-pointer select-none"
        >
          <span>Xem chi tiết</span>
          <ChevronRight className="h-4 w-4 text-primary-600" />
        </button>
      </div>

      {list.length > 0 ? (
        <div className="space-y-4 my-auto">
          {list.map((item) => (
            <div key={item.code} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 truncate pr-2">
                  <span className="font-semibold text-slate-900">{item.code}</span> - {item.name}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 shrink-0">
                  <PieChart className="h-3.5 w-3.5 text-blue-500" />
                  {item.progress}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center my-auto space-y-2 text-slate-400">
          <Layers className="w-8 h-8 mx-auto text-slate-700" />
          <p className="text-xs font-semibold text-slate-500">Chưa có tiến độ kỳ thi nào</p>
        </div>
      )}

      {/* Legend Dots at bottom */}
      <div className="flex items-center justify-center gap-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full border border-slate-300 bg-white inline-block" />
          <span>Chưa bắt đầu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-600 inline-block" />
          <span>Đang thực hiện</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
          <span>Hoàn thành</span>
        </div>
      </div>
    </div>
  );
}
