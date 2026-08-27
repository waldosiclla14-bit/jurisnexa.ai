'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
      <h2 className="text-xl font-semibold text-white mb-6">Iniciar Sesión</h2>
      <LoginForm />
      <p className="mt-4 text-center text-sm text-zinc-400">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-emerald-400 hover:text-emerald-300">
          Registrarse
        </Link>
      </p>
    </div>
  );
}
