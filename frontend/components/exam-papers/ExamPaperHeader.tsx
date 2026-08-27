'use client';

import React from 'react';
import { DataActionsDropdown } from '../ui';

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
      <div className="space-y-0.5">
        <h1 className="text-type-page font-semibold leading-[36px] text-slate-900 dark:text-slate-100 tracking-tight">
          Quản lý đề thi & ma trận đề
        </h1>
        <p className="text-type-body-sm font-normal leading-[22px] text-slate-500 dark:text-slate-400">
          Sinh đề thi ngẫu nhiên theo ma trận độ khó, phát hành, đảo đề thi và lưu trữ đề thi theo quy chuẩn
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {(onExportAll || onPrintAll) && (
          <DataActionsDropdown
            onExportAll={onExportAll}
            exportLabel="Xuất báo cáo"
            onPrintAll={onPrintAll}
            printLabel="In danh sách"
          />
        )}
      </div>
    </div>
  );
}
