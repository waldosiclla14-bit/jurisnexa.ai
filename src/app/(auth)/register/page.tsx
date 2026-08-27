'use client';

import { RegisterForm } from '@/components/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
      <h2 className="text-xl font-semibold text-white mb-6">Crear Cuenta</h2>
      <RegisterForm />
      <p className="mt-4 text-center text-sm text-zinc-400">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-emerald-400 hover:text-emerald-300">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
