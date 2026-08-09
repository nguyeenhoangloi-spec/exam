'use client';

import React from 'react';
import { Download, Sparkles, Printer } from 'lucide-react';
import { Button } from '../ui/Button';

interface ExamPaperHeaderProps {
  onExportAll?: () => void;
  onPrintAll?: () => void;
  isAdmin?: boolean;
}

export function ExamPaperHeader({
  onExportAll,
  onPrintAll,
  isAdmin = true,
}: ExamPaperHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-[36px] text-[#0F172A] tracking-tight flex items-center gap-2">
          <span>Quản lý Đề thi & Ma trận đề</span>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[13px] font-semibold text-[#2563EB] border border-blue-200">
            Tự động sinh đề
          </span>
        </h1>
        <p className="text-[15px] font-normal leading-[22px] text-[#64748B]">
          Sinh đề thi ngẫu nhiên theo ma trận độ khó, phát hành, đảo đề thi và lưu trữ đề thi theo quy chuẩn
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {onExportAll && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onExportAll}
            leftIcon={<Download className="h-4 w-4" />}
            className="rounded-xl font-medium"
          >
            Xuất báo cáo
          </Button>
        )}

        {onPrintAll && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onPrintAll}
            leftIcon={<Printer className="h-4 w-4 text-[#64748B]" />}
            className="rounded-xl font-medium"
          >
            In danh sách đề
          </Button>
        )}
      </div>
    </div>
  );
}

