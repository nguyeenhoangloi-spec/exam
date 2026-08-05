import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export function DashboardErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-white p-10 text-center shadow-2xs animate-fade-in">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
        <AlertCircle className="h-6 w-6" />
      </span>
      <div>
        <h2 className="text-base font-bold text-slate-900">Không thể tải trang tổng quan</h2>
        <p className="mx-auto mt-1 max-w-lg text-xs font-medium text-slate-500">{message}</p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={onRetry}
        icon={<RefreshCw className="h-3.5 w-3.5" />}
      >
        Thử lại
      </Button>
    </div>
  );
}
