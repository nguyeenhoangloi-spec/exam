'use client';

import React from 'react';
import { Upload, Plus } from 'lucide-react';
import { Button } from '../ui';

interface QuestionBankHeaderProps {
  onAdd: () => void;
  onImport: () => void;
  onAi?: () => void;
  onPrint?: () => void;
}

export function QuestionBankHeader({
  onAdd,
  onImport,
}: QuestionBankHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-1">
      {/* Title & Subtitle */}
      <div className="space-y-1">
        <h1 className="text-[28px] font-semibold leading-[36px] tracking-tight text-[#0F172A] dark:text-slate-100">
          Ngân hàng câu hỏi
        </h1>
        <p className="text-[15px] font-normal leading-[24px] text-[#64748B] dark:text-slate-400">
          Quản lý, tạo mới và tổ chức hệ thống câu hỏi cho kỳ thi
        </p>
      </div>

      {/* Right Action Buttons: 1 Primary Blue Filled + Secondary Buttons */}
      <div className="flex items-center gap-2.5 shrink-0">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onImport}
          leftIcon={<Upload className="h-4 w-4 text-slate-500" />}
        >
          Nhập dữ liệu
        </Button>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onAdd}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Thêm câu hỏi mới
        </Button>
      </div>
    </div>
  );
}
