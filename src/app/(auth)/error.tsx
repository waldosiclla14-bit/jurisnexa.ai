'use client';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center">
      <h2 className="text-xl font-bold text-white mb-2">Error de Autenticación</h2>
      <p className="text-zinc-400 mb-4">
        {error.message || 'Ocurrió un error al procesar tu solicitud'}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
