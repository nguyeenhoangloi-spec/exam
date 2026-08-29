'use client';

import React from 'react';
import { Database, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Question } from '../../types';
import { KPICards, KPICardItem } from '../KPICards';

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

  const items: KPICardItem[] = [
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

  return <KPICards items={items} columns={4} />;
}

