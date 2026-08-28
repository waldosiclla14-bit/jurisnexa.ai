'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { GoogleButton } from './GoogleButton';
import { UserType } from '@/types';

export function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState<UserType>('cliente');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (!email.trim()) {
      setError('El email es requerido');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await signUp(email.trim(), password, fullName.trim(), tipoUsuario);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <GoogleButton redirectTo="/chat" />
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-xs text-zinc-500">o regístrate con tu email</span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Nombre completo</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
          placeholder="Juan Pérez"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">¿Qué eres?</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTipoUsuario('cliente')}
            className={`px-3 py-3 rounded-lg border text-sm font-medium transition-colors ${
              tipoUsuario === 'cliente'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            Cliente / Ciudadano
          </button>
          <button
            type="button"
            onClick={() => setTipoUsuario('abogado')}
            className={`px-3 py-3 rounded-lg border text-sm font-medium transition-colors ${
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
            ? 'Responderé con análisis jurídico técnico, artículos y plazos procesales.'
            : 'Responderé en lenguaje sencillo: tus derechos, pasos a seguir y a dónde acudir.'}
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
          placeholder="tu@email.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Confirmar contraseña</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
      >
        {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
        </button>
      </form>
    </div>
  );
}
