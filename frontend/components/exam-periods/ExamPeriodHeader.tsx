'use client';

import React from 'react';
import { Download, Plus, Printer } from 'lucide-react';

import { Button } from '../ui';

interface ExamPeriodHeaderProps {
  onAdd?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  isAdmin?: boolean;
}

export function ExamPeriodHeader({
  onAdd,
  onExport,
  onPrint,
  isAdmin = true,
}: ExamPeriodHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div className="space-y-1">
        <h1 className="text-[28px] font-semibold leading-[36px] text-[#0F172A] tracking-tight">
          Quản lý kỳ thi
        </h1>
        <p className="text-[15px] font-normal leading-[22px] text-[#64748B]">
          Quản lý các kỳ thi, thời gian tổ chức, học kỳ và năm học trong hệ thống
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onExport}
          leftIcon={<Download className="h-4 w-4 text-[#64748B]" />}
        >
          Xuất Excel
        </Button>

        {onPrint && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onPrint}
            leftIcon={<Printer className="h-4 w-4 text-[#64748B]" />}
          >
            In Báo cáo
          </Button>
        )}

        {isAdmin && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onAdd}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Tạo kỳ thi
          </Button>
        )}
      </div>
    </div>
  );
}
