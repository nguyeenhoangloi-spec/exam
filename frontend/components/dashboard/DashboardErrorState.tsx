import { AlertCircle, RefreshCw } from 'lucide-react';

export function DashboardErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
      <AlertCircle className="mx-auto mb-3 h-10 w-10 text-rose-500" />
      <h2 className="font-semibold text-slate-800">Không thể tải Dashboard</h2>
      <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
      >
        <RefreshCw className="h-4 w-4" />
        Thử lại
      </button>
    </div>
  );
}
