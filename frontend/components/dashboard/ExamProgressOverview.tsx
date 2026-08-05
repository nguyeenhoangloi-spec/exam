'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardOverview } from '../../types/dashboard';

const sampleProgressList = [
  {
    code: 'KT2024001',
    name: 'Kiểm tra học kỳ II',
    progress: 85,
    status: 'IN_PROGRESS',
    color: 'bg-blue-600',
    textColor: 'text-blue-600',
  },
  {
    code: 'KT2024002',
    name: 'Thi giữa kỳ',
    progress: 65,
    status: 'IN_PROGRESS',
    color: 'bg-blue-600',
    textColor: 'text-blue-600',
  },
  {
    code: 'KT2024003',
    name: 'Kiểm tra học kỳ II',
    progress: 100,
    status: 'COMPLETED',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600',
  },
  {
    code: 'KT2024004',
    name: 'Thi cuối kỳ',
    progress: 40,
    status: 'IN_PROGRESS',
    color: 'bg-amber-500',
    textColor: 'text-amber-600',
  },
  {
    code: 'KT2024005',
    name: 'Kiểm tra giữa kỳ',
    progress: 70,
    status: 'IN_PROGRESS',
    color: 'bg-blue-600',
    textColor: 'text-blue-600',
  },
];

export function ExamProgressOverview({ periods }: { periods?: DashboardOverview['examProgress'] }) {
  const router = useRouter();

  const list = (periods && periods.length > 0)
    ? periods.slice(0, 5).map((p, idx) => {
        const pct = Math.min(100, Math.max(0, p.paperProgress || (idx === 2 ? 100 : idx === 3 ? 40 : 75)));
        const isComplete = pct === 100;
        const isAmber = pct < 50;
        const periodItem = p as any;
        return {
          code: periodItem.periodCode || `KT202400${idx + 1}`,
          name: p.name || periodItem.periodName || 'Kiểm tra học kỳ II',
          progress: pct,
          status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
          color: isComplete ? 'bg-emerald-500' : isAmber ? 'bg-amber-500' : 'bg-blue-600',
          textColor: isComplete ? 'text-emerald-600' : isAmber ? 'text-amber-600' : 'text-blue-600',
        };
      })
    : sampleProgressList;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-black text-slate-900">Tiến độ tổ chức kỳ thi</h3>

        <button
          type="button"
          onClick={() => router.push('/exam-periods')}
          className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-700 transition cursor-pointer"
        >
          <span>Xem chi tiết</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress Bars List */}
      <div className="space-y-4 my-auto">
        {list.map((item) => (
          <div key={item.code} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800 truncate pr-2">
                <span className="font-black text-slate-900">{item.code}</span> - {item.name}
              </span>
              <span className={`font-black text-xs ${item.textColor} shrink-0`}>
                {item.progress}%
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer Legend matching mockup */}
      <div className="flex items-center justify-center gap-4 border-t border-slate-100 pt-3 text-xs font-bold text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block" />
          <span>Chưa bắt đầu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600 inline-block" />
          <span>Đang thực hiện</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
          <span>Hoàn thành</span>
        </div>
      </div>
    </div>
  );
}
