'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';

export function AcceptInvitation({ token }: { token: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAccept = async () => {
    setAccepting(true);
    setResult(null);
    try {
      const res = await fetch(`/api/invitations/${token}`, { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult({ type: 'success', text: '¡Bienvenido al estudio jurídico! Serás redirigido a tu panel.' });
      setTimeout(() => {
        router.push('/estudio');
        router.refresh();
      }, 1500);
    } catch (err) {
      setResult({ type: 'error', text: err instanceof Error ? err.message : 'Error al aceptar la invitación' });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-zinc-400">Cargando sesión...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12 space-y-4">
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
          <p className="text-zinc-300 mb-2">Tienes una invitación pendiente para unirte a un estudio jurídico.</p>
          <p className="text-zinc-500 text-sm mb-4">Inicia sesión con el correo al que recibiste la invitación para aceptarla.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
        <h1 className="text-xl font-bold text-white mb-2">🏛️ Invitación a estudio jurídico</h1>
        <p className="text-sm text-zinc-400 mb-6">
          Se te ha invitado a formar parte de un estudio jurídico de JurisNexa.
          Al aceptar, tu cuenta se vinculará al estudio y compartirás su plan de consultas.
        </p>

        {result && (
          <p className={`text-sm p-3 rounded mb-4 ${
            result.type === 'success' ? 'text-emerald-400 bg-emerald-900/30' : 'text-red-400 bg-red-900/30'
          }`}>
            {result.text}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
          >
            {accepting ? 'Aceptando...' : 'Aceptar invitación'}
          </button>
          <button
            onClick={() => router.push('/chat')}
            disabled={accepting}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg"
          >
            Ir al chat
          </button>
        </div>
      </div>
    </div>
  );
}