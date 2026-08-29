'use client';

import React from 'react';
import { FileText, Send, Clock, Archive, HelpCircle } from 'lucide-react';
import { KPICards, KPICardItem } from '../KPICards';

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
  const items: KPICardItem[] = [
    {
      title: 'Tổng số đề thi',
      value: total,
      subtext: 'Danh mục đề thi',
      progressPercent: total > 0 ? 100 : 0,
      icon: FileText,
    },
    {
      title: 'Đã phát hành',
      value: publishedCount,
      subtext: 'Sẵn sàng tổ chức thi',
      progressPercent: total > 0 ? Math.round((publishedCount / total) * 100) : 100,
      icon: Send,
      unit: ' đề',
    },
    {
      title: 'Bản nháp (Draft)',
      value: draftCount,
      subtext: 'Đang xem xét / kiểm tra',
      progressPercent: total > 0 ? Math.round((draftCount / total) * 100) : 0,
      icon: Clock,
      unit: ' đề',
    },
    {
      title: 'Đã lưu trữ',
      value: archivedCount,
      subtext: 'Kho lưu trữ kho đề',
      progressPercent: total > 0 ? Math.round((archivedCount / total) * 100) : 0,
      icon: Archive,
      unit: ' đề',
    },
    {
      title: 'Tổng câu hỏi trong đề',
      value: totalQuestionsInPapers,
      subtext: 'Đã phân bổ vào ma trận',
      progressPercent: totalQuestionsInPapers > 0 ? 100 : 0,
      icon: HelpCircle,
      unit: ' câu',
    },
  ];

  return <KPICards items={items} columns={5} />;
}

