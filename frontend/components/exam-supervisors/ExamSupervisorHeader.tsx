'use client';

import React from 'react';
import { Download, Printer, Wand2, Plus } from 'lucide-react';
import { Button } from '../ui/Button';

interface ExamSupervisorHeaderProps {
  onAdd: () => void;
  onAutoAssign: () => void;
  onExport: () => void;
  onPrint: () => void;
  isAdmin?: boolean;
  autoLoading?: boolean;
}

export function ExamSupervisorHeader({
  onAdd,
  onAutoAssign,
  onExport,
  onPrint,
  isAdmin = true,
  autoLoading = false,
}: ExamSupervisorHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-semibold text-slate-900 dark:text-slate-100 leading-[36px] tracking-tight">
          Quản lý & Phân công Giám thị
        </h1>
        <p className="text-[14.5px] text-slate-500 dark:text-slate-400 mt-1">
          Theo dõi trạng thái xác nhận, phê duyệt yêu cầu đổi ca và phân công cán bộ coi thi
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onExport}
          leftIcon={<Download className="h-4 w-4" />}
        >
          Xuất Excel
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onPrint}
          leftIcon={<Printer className="h-4 w-4" />}
        >
          In Báo Cáo
        </Button>

        {isAdmin && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onAutoAssign}
              disabled={autoLoading}
            >
              {autoLoading ? 'Đang xếp...' : 'Tự Động Phân Công'}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onAdd}
              leftIcon={<Plus className="h-4 w-4 stroke-[2.5]" />}
            >
              Thêm Phân Công
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
