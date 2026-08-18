import React from 'react';
import { Archive, CheckCircle2, Clock3, FileQuestion, XCircle } from 'lucide-react';

export function QuestionStatistics({
  counts,
  activeStatus,
  onSelectStatus,
}: {
  counts: Record<string, number>;
  activeStatus?: string;
  onSelectStatus?: (status: string) => void;
}) {
  const items = [
    { key: '', label: 'Tổng câu hỏi', subtext: 'Toàn bộ ngân hàng câu hỏi', count: counts.total || 0, icon: FileQuestion, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { key: 'PENDING', label: 'Chờ duyệt', subtext: 'Cần thẩm định & phê duyệt', count: counts.PENDING || 0, icon: Clock3, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { key: 'APPROVED', label: 'Đã duyệt', subtext: 'Sẵn sàng dùng tạo đề thi', count: counts.APPROVED || 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { key: 'REJECTED', label: 'Từ chối', subtext: 'Cần chỉnh sửa hoặc bổ sung', count: counts.REJECTED || 0, icon: XCircle, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { key: 'ARCHIVED', label: 'Kho lưu trữ', subtext: 'Câu hỏi đã đóng lưu trữ', count: counts.ARCHIVED || 0, icon: Archive, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  ];

  return (
    <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeStatus === item.key;
        return (
          <div
            key={item.key}
            role="button"
            tabIndex={0}
            onClick={() => onSelectStatus && onSelectStatus(item.key)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelectStatus?.(item.key);
              }
            }}
            className={`group flex flex-col justify-between rounded-2xl border p-4 shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md ${
              isActive
                ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20'
                : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-3 w-full">
              <div className="space-y-1 min-w-0">
                <span className="text-[13px] font-semibold text-slate-500 block truncate tracking-normal">{item.label}</span>
                <div className="text-[32px] font-semibold text-slate-900 leading-[38px] tracking-tight tabular-nums">{item.count}</div>
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.color} transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600`}>
                <Icon className="h-5 w-5 stroke-[2]" />
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100/80 w-full">
              <span className="text-[13px] font-normal text-slate-500 block truncate">{item.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
