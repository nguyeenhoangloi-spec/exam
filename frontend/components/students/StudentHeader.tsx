'use client';

import React from 'react';
import { Download, Plus, Printer, FileSpreadsheet } from 'lucide-react';
import { Button } from '../ui';

interface StudentHeaderProps {
  onAdd?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  onImport?: () => void;
  isAdmin?: boolean;
}

export function StudentHeader({
  onAdd,
  onExport,
  onPrint,
  onImport,
  isAdmin = true,
}: StudentHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-[36px] tracking-tight text-[#0F172A]">
          Quản lý Sinh viên
        </h1>
        <p className="text-[15px] font-normal leading-[24px] text-[#64748B]">
          Quản lý danh sách sinh viên chính quy, phân lớp và điều kiện dự thi
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onExport}
          leftIcon={<FileSpreadsheet className="h-4 w-4 text-[#15803D]" />}
        >
          Xuất Excel
        </Button>

        {onPrint && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onPrint}
            leftIcon={<Printer className="h-4 w-4 text-slate-500" />}
          >
            In Báo cáo
          </Button>
        )}

        {isAdmin && onImport && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onImport}
            leftIcon={<FileSpreadsheet className="h-4 w-4 text-slate-500" />}
          >
            Nhập Excel
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
            Thêm Sinh viên
          </Button>
        )}
      </div>
    </div>
  );
}
