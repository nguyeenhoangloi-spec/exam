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
    { key: '', label: 'Tổng câu hỏi', count: counts.total || 0, icon: FileQuestion, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { key: 'PENDING', label: 'Chờ duyệt', count: counts.PENDING || 0, icon: Clock3, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { key: 'APPROVED', label: 'Đã duyệt', count: counts.APPROVED || 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { key: 'REJECTED', label: 'Từ chối', count: counts.REJECTED || 0, icon: XCircle, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { key: 'ARCHIVED', label: 'Kho lưu trữ', count: counts.ARCHIVED || 0, icon: Archive, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeStatus === item.key;
        return (
          <div
            key={item.key}
            onClick={() => onSelectStatus && onSelectStatus(item.key)}
            className={`group rounded-2xl border p-4 shadow-2xs cursor-pointer transition duration-150 ${
              isActive
                ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20 scale-[1.01]'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-[#64748B]">{item.label}</p>
                <p className="mt-1 text-[32px] font-bold text-[#0F172A] leading-[38px]">{item.count}</p>
              </div>
              <div className={`rounded-xl p-2.5 border ${item.color} transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            {item.key === 'ARCHIVED' && (
              <p className="mt-2 text-[13px] text-[#64748B] font-normal">Bấm vào để xem danh sách câu hỏi trong Kho lưu trữ</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
