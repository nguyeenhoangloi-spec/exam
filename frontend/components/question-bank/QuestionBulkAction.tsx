'use client';

import React from 'react';
import { CheckCircle2, XCircle, Archive, Trash2, RotateCcw, Send } from 'lucide-react';
import { BulkActionDock, BulkActionButton } from '@/components/common/BulkActionDock';

interface QuestionBulkActionProps {
  totalCount: number;
  selectedCount: number;
  allSelected: boolean;
  canSubmit?: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  canRestore?: boolean;
  canArchive?: boolean;
  canDelete?: boolean;
  onToggleAll: () => void;
  onAction: (action: string) => void;
  onClear: () => void;
}

export function QuestionBulkAction({
  totalCount,
  selectedCount,
  allSelected,
  canSubmit = false,
  canApprove = false,
  canReject = false,
  canRestore = false,
  canArchive = false,
  canDelete = false,
  onToggleAll,
  onAction,
  onClear,
}: QuestionBulkActionProps) {
  const isSubmitPrimary = !canApprove && canSubmit;
  const isRestorePrimary = !canApprove && !canSubmit && canRestore;

  return (
    <BulkActionDock
      selectedCount={selectedCount}
      totalCount={totalCount}
      allSelected={allSelected}
      onToggleAll={onToggleAll}
      onClear={onClear}
    >
      {canApprove && (
        <BulkActionButton
          onClick={() => onAction('APPROVE')}
          variant="primary"
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Duyệt"
        />
      )}
      {canSubmit && (
        <BulkActionButton
          onClick={() => onAction('SUBMIT')}
          variant={isSubmitPrimary ? 'primary' : 'secondary'}
          icon={<Send className={`h-4 w-4 ${isSubmitPrimary ? '' : 'text-slate-400'}`} />}
          label="Gửi duyệt"
        />
      )}
      {canRestore && (
        <BulkActionButton
          onClick={() => onAction('RESTORE')}
          variant={isRestorePrimary ? 'primary' : 'secondary'}
          icon={<RotateCcw className={`h-4 w-4 ${isRestorePrimary ? '' : 'text-slate-400'}`} />}
          label="Khôi phục"
        />
      )}
      {canReject && (
        <BulkActionButton
          onClick={() => onAction('REJECT')}
          variant="warning"
          icon={<XCircle className="h-4 w-4" />}
          label="Từ chối"
        />
      )}
      {canArchive && (
        <BulkActionButton
          onClick={() => onAction('ARCHIVE')}
          variant="secondary"
          icon={<Archive className="h-4 w-4 text-slate-400" />}
          label="Lưu trữ"
        />
      )}
      {canDelete && (
        <BulkActionButton
          onClick={() => onAction('DELETE')}
          variant="danger"
          icon={<Trash2 className="h-4 w-4" />}
          label="Xóa"
        />
      )}
    </BulkActionDock>
  );
}
