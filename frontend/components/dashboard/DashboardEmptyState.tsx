import { Inbox } from 'lucide-react';

export function DashboardEmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center">
      <Inbox className="mb-2 h-7 w-7 text-slate-300" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
