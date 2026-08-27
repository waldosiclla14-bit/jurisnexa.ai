'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { TokenUsageDisplay } from '@/components/dashboard/TokenUsageDisplay';
import { UserType } from '@/types';

function ProfileEditor({ user, onSaved }: { user: { id: string; full_name?: string; email: string; plan: string; tipo_usuario?: UserType }; onSaved: () => Promise<void> }) {
  const [fullName, setFullName] = useState(user.full_name || '');
  const [tipoUsuario, setTipoUsuario] = useState<UserType>(user.tipo_usuario || 'cliente');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: fullName.trim(), tipoUsuario }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessage('Perfil actualizado');
      await onSaved();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
        <h3 className="text-sm font-medium text-white mb-4">Información personal</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Nombre completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-500 text-sm cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Plan</label>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                user.plan === 'pro' ? 'bg-emerald-600 text-white' :
                user.plan === 'professional' ? 'bg-blue-600 text-white' :
                'bg-zinc-700 text-zinc-300'
              }`}>
                {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
              </span>
              <a href="/precios" className="text-xs text-emerald-400 hover:text-emerald-300">
                Mejorar plan
              </a>
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Tipo de usuario (cómo te responde la IA)</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipoUsuario('cliente')}
                className={`px-3 py-2 text-sm rounded-lg border font-medium transition-colors ${
                  tipoUsuario === 'cliente'
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                Cliente
              </button>
              <button
                type="button"
                onClick={() => setTipoUsuario('abogado')}
                className={`px-3 py-2 text-sm rounded-lg border font-medium transition-colors ${
                  tipoUsuario === 'abogado'
                    ? 'bg-amber-600 border-amber-500 text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                Abogado
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {tipoUsuario === 'abogado'
                ? 'Respuestas técnicas con artículos, plazos y estrategia.'
                : 'Respuestas en lenguaje sencillo: derechos, pasos y a dónde acudir.'}
            </p>
          </div>
          {message && (
            <p className={`text-sm ${message.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
              {message}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={saving || (fullName.trim() === (user.full_name || '') && tipoUsuario === (user.tipo_usuario || 'cliente'))}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <TokenUsageDisplay />
    </div>
  );
}

export default function PerfilPage() {
  const { user, refreshUser } = useAuth();

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
      <ProfileEditor key={user.id} user={user} onSaved={refreshUser} />
    </div>
  );
}