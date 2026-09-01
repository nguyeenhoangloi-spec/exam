export default function Loading() {
  return (
    <main className="w-full px-6 py-6 space-y-5 min-h-screen">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-4 w-80 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
        </div>
        <div className="flex gap-2.5">
          <div className="h-10 w-24 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-10 w-28 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
            <div className="h-4 w-24 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Shift banner skeleton */}
      <div className="flex items-center gap-3.5 py-0.5">
        <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
        <div className="space-y-1.5">
          <div className="h-5 w-64 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-3.5 w-48 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
        </div>
      </div>

      {/* Table/content skeleton */}
      <div className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 dark:bg-slate-900 p-6 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    </main>
  );
}
