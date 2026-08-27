'use client';

import React from 'react';
import { Clock, Send } from 'lucide-react';
import { BulkActionDock, BulkActionButton } from '@/components/common/BulkActionDock';

interface ProctorBulkActionProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onExtend: () => void;
  onBroadcast?: () => void;
  onClear: () => void;
}

export function ProctorBulkAction({
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  onExtend,
  onBroadcast,
  onClear,
}: ProctorBulkActionProps) {
  return (
    <BulkActionDock
      selectedCount={selectedCount}
      totalCount={totalCount}
      allSelected={allSelected}
      onToggleAll={onToggleAll}
      onClear={onClear}
    >
      <BulkActionButton
        onClick={onExtend}
        variant="primary"
        icon={<Clock className="h-4 w-4" />}
        label="Gia hạn thời gian"
      />
      {onBroadcast && (
        <BulkActionButton
          onClick={onBroadcast}
          variant="secondary"
          icon={<Send className="h-4 w-4 text-slate-400" />}
          label="Gửi thông báo"
        />
      )}
    </BulkActionDock>
  );
}
