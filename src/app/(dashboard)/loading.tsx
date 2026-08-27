export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-zinc-800 rounded w-48 mb-6" />
      <div className="space-y-4">
        <div className="h-4 bg-zinc-800 rounded w-full" />
        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="h-4 bg-zinc-800 rounded w-1/2" />
      </div>
    </div>
  );
}
