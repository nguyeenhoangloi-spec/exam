'use client';

import React from 'react';
import { FileText, Send, Clock, Archive, HelpCircle } from 'lucide-react';

interface ExamPaperKPICardsProps {
  total: number;
  publishedCount: number;
  draftCount: number;
  archivedCount: number;
  totalQuestionsInPapers: number;
}

export function ExamPaperKPICards({
  total,
  publishedCount,
  draftCount,
  archivedCount,
  totalQuestionsInPapers,
}: ExamPaperKPICardsProps) {
  const items = [
    {
      title: 'Tổng số Đề thi',
      value: total,
      subtext: 'Danh mục đề thi',
      icon: FileText,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      title: 'Đã phát hành',
      value: publishedCount,
      subtext: 'Sẵn sàng tổ chức thi',
      icon: Send,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      unit: ' đề',
    },
    {
      title: 'Bản nháp (Draft)',
      value: draftCount,
      subtext: 'Đang xem xét / kiểm tra',
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      unit: ' đề',
    },
    {
      title: 'Đã lưu trữ',
      value: archivedCount,
      subtext: 'Kho lưu trữ kho đề',
      icon: Archive,
      iconBg: 'bg-slate-100 text-slate-600 border-slate-200',
      unit: ' đề',
    },
    {
      title: 'Tổng câu hỏi trong đề',
      value: totalQuestionsInPapers,
      subtext: 'Đã phân bổ vào ma trận',
      icon: HelpCircle,
      iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
      unit: ' câu',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.title}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {item.title}
                </span>
                <p className="text-2xl font-black text-slate-900 leading-tight">
                  {item.value.toLocaleString('vi-VN')}
                  {item.unit || ''}
                </p>
              </div>

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.iconBg} transition-transform group-hover:scale-110`}
              >
                <IconComponent className="h-5 w-5" />
              </div>
            </div>

            <span className="text-[10.5px] font-semibold text-slate-400 mt-2">
              {item.subtext}
            </span>
          </div>
        );
      })}
    </div>
  );
}
