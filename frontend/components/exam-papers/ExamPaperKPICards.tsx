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
      title: 'Tổng số đề thi',
      value: total,
      subtext: 'Danh mục đề thi',
      icon: FileText,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Đã phát hành',
      value: publishedCount,
      subtext: 'Sẵn sàng tổ chức thi',
      icon: Send,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      unit: ' đề',
    },
    {
      title: 'Bản nháp (Draft)',
      value: draftCount,
      subtext: 'Đang xem xét / kiểm tra',
      icon: Clock,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      unit: ' đề',
    },
    {
      title: 'Đã lưu trữ',
      value: archivedCount,
      subtext: 'Kho lưu trữ kho đề',
      icon: Archive,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      unit: ' đề',
    },
    {
      title: 'Tổng câu hỏi trong đề',
      value: totalQuestionsInPapers,
      subtext: 'Đã phân bổ vào ma trận',
      icon: HelpCircle,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
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
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[13px] font-semibold text-[#64748B] tracking-wider">
                  {item.title}
                </span>
                <p className="text-[32px] font-bold text-[#0F172A] leading-[38px]">
                  {item.value.toLocaleString('vi-VN')}
                  {item.unit || ''}
                </p>
              </div>

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.iconBg} transition-all duration-200 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600`}
              >
                <IconComponent className="h-5 w-5" />
              </div>
            </div>

            <span className="text-[13px] font-normal text-[#64748B] mt-2">
              {item.subtext}
            </span>
          </div>
        );
      })}
    </div>
  );
}
