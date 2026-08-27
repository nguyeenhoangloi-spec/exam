export default function ExamPapersLoading() {
  return (
    <div className="w-full px-6 py-6 space-y-5 bg-slate-50/50 dark:bg-slate-950/50 min-h-screen animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            </div>
            <div className="h-6 w-12 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Matrix Form Skeleton */}
      <div className="h-80 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4" />

      {/* Table Skeleton */}
      <div className="h-96 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4" />
    </div>
  );
}
