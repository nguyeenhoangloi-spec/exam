export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 rounded-2xl bg-white" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-28 rounded-2xl bg-white" />)}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="h-80 rounded-2xl bg-white xl:col-span-8" />
        <div className="h-80 rounded-2xl bg-white xl:col-span-4" />
        <div className="h-96 rounded-2xl bg-white xl:col-span-7" />
        <div className="h-96 rounded-2xl bg-white xl:col-span-5" />
      </div>
    </div>
  );
}
