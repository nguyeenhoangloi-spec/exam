'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Button, DataActionsDropdown } from '../ui';

interface QuestionBankHeaderProps {
  onAdd: () => void;
  onImport: () => void;
  onAi?: () => void;
  onPrint?: () => void;
}

export function QuestionBankHeader({
  onAdd,
  onImport,
  onPrint,
}: QuestionBankHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      {/* Title & Subtitle */}
      <div className="space-y-0.5">
        <h1 className="text-type-page font-semibold leading-[36px] tracking-tight text-slate-900 dark:text-slate-100">
          Ngân hàng câu hỏi
        </h1>
        <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          Quản lý, tạo mới và tổ chức hệ thống câu hỏi cho kỳ thi
        </p>
      </div>

      {/* Right Action Buttons: 1 Action dropdown + 1 Primary Blue Filled */}
      <div className="flex items-center gap-2.5 shrink-0">
        {(onImport || onPrint) && (
          <DataActionsDropdown
            onImport={onImport}
            onPrint={onPrint}
          />
        )}

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onAdd}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Thêm câu hỏi
        </Button>
      </div>
    </div>
  );
}
