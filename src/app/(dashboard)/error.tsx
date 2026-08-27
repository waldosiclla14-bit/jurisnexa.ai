'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold text-white mb-2">Error</h2>
        <p className="text-zinc-400 mb-4">
          {error.message || 'Ocurrió un error inesperado'}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
