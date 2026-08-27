'use client';

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-screen items-center justify-center bg-zinc-950">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold text-white mb-2">Error en el Chat</h2>
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
