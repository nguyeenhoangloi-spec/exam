'use client';

import React from 'react';
import { Download, Plus, Printer } from 'lucide-react';
import { Button } from '../ui';

interface TeacherHeaderProps {
  onAdd?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  isAdmin?: boolean;
}

export function TeacherHeader({
  onAdd,
  onExport,
  onPrint,
  isAdmin = true,
}: TeacherHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-[36px] tracking-tight text-[#0F172A]">
          Quản lý Giảng viên
        </h1>
        <p className="text-[15px] font-normal leading-[24px] text-[#64748B]">
          Quản lý danh mục cán bộ giảng dạy, học vị, khoa trực thuộc và phân công coi thi
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
            leftIcon={<Printer className="h-4 w-4 text-slate-500" />}
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
            Thêm Giảng viên
          </Button>
        )}
      </div>
    </div>
  );
}
