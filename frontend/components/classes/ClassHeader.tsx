'use client';

import React from 'react';
import { Download, Plus, Printer } from 'lucide-react';
import { Button } from '../ui/Button';

interface ClassHeaderProps {
  onAdd?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  isAdmin?: boolean;
}

export function ClassHeader({
  onAdd,
  onExport,
  onPrint,
  isAdmin = true,
}: ClassHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div className="space-y-1">
        <h1 className="text-[28px] font-semibold leading-[36px] text-[#0F172A] tracking-tight">
          Quản lý lớp học
        </h1>
        <p className="text-[15px] font-normal leading-[22px] text-[#64748B]">
          Quản lý danh mục các lớp sinh viên, khoa trực thuộc và số lượng sinh viên theo lớp
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
            Tạo lớp mới
          </Button>
        )}
      </div>
    </div>
  );
}
