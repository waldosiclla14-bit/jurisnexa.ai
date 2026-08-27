'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Menú de usuario"
        className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
          {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm text-zinc-300 hidden sm:block">
          {user.full_name || user.email.split('@')[0]}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50" role="menu" aria-orientation="vertical">
            <div className="p-4 border-b border-zinc-700">
              <p className="text-sm text-white font-medium">{user.full_name || 'Usuario'}</p>
              <p className="text-xs text-zinc-400">{user.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  user.plan === 'pro' ? 'bg-emerald-600 text-white' :
                  user.plan === 'professional' ? 'bg-blue-600 text-white' :
                  user.plan === 'abogado' ? 'bg-amber-600 text-white' :
                  'bg-zinc-600 text-zinc-300'
                }`}>
                  {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                </span>
                <span className="text-xs text-zinc-400">
                  {user.queries_used}/{user.queries_limit} consultas
                </span>
              </div>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push('/chat');
                }}
                className="w-full text-left px-3 py-2 text-sm text-emerald-400 hover:bg-zinc-700 rounded-lg"
              >
                Ir al Chat
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  router.push('/historial');
                }}
                className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 rounded-lg"
              >
                Historial
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  router.push('/documentos');
                }}
                className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 rounded-lg"
              >
                Mis documentos
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  router.push('/perfil');
                }}
                className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 rounded-lg"
              >
                Perfil
              </button>
            </div>
            <div className="p-2 border-t border-zinc-700">
              <button
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-zinc-700 rounded-lg"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
