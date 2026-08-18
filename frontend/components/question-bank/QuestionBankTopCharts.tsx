'use client';

import React from 'react';
import { Database, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Question } from '../../types';

interface QuestionBankTopChartsProps {
  counts?: Record<string, number>;
  questions?: Question[];
  onAdd?: () => void;
  onImport?: () => void;
  onExport?: () => void;
}

export function QuestionBankTopCharts({
  counts = {},
  questions = [],
}: QuestionBankTopChartsProps) {
  const total = counts.total ?? questions.length ?? 0;
  const approved = counts.APPROVED ?? counts.approved ?? questions.filter((q) => q.status === 'APPROVED').length;
  const pending = counts.PENDING ?? counts.pending ?? questions.filter((q) => q.status === 'PENDING').length;
  const draft = counts.DRAFT ?? counts.draft ?? questions.filter((q) => q.status === 'DRAFT').length;
  const rejected = counts.REJECTED ?? counts.rejected ?? questions.filter((q) => q.status === 'REJECTED').length;

  const items = [
    {
      title: 'Tổng số câu hỏi',
      value: total,
      subtext: 'Trong ngân hàng câu hỏi',
      progressPercent: total > 0 ? 100 : 0,
      icon: Database,
    },
    {
      title: 'Đã phê duyệt',
      value: approved,
      subtext: 'Sẵn sàng dùng tạo đề thi',
      progressPercent: total > 0 ? Math.round((approved / total) * 100) : 0,
      icon: CheckCircle2,
    },
    {
      title: 'Chờ kiểm duyệt',
      value: pending,
      subtext: 'Cần phân công hoặc duyệt',
      progressPercent: total > 0 ? Math.round((pending / total) * 100) : 0,
      icon: Clock,
    },
    {
      title: 'Bản nháp & Từ chối',
      value: draft + rejected,
      subtext: 'Cần chỉnh sửa & cập nhật',
      progressPercent: total > 0 ? Math.round(((draft + rejected) / total) * 100) : 0,
      icon: AlertCircle,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.title}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 dark:hover:border-slate-700 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                  {item.title}
                </span>
                <div className="text-[32px] font-bold text-slate-900 dark:text-slate-100 leading-[38px] tracking-tight tabular-nums">
                  {item.value.toLocaleString('vi-VN')}
                </div>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                <IconComponent className="h-5 w-5 stroke-[2.2]" />
              </div>
            </div>

            {/* Thanh đo tiến độ tỷ lệ động nhỏ mảnh, tinh tế (Micro Progress Track) */}
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Math.max(item.progressPercent, 5), 100)}%` }}
              />
            </div>

            <div className="mt-2.5">
              <span
                title={item.subtext}
                className="text-[13px] font-normal text-slate-500 dark:text-slate-400 block truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"
              >
                {item.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
