import Link from 'next/link';
import { AuthProvider } from '@/components/auth/AuthProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-950">
        <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/chat" className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">JurisNexa</span>
              <span className="text-emerald-400">.ai</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/chat" className="text-zinc-400 hover:text-white transition-colors">Chat</Link>
              <Link href="/historial" className="text-zinc-400 hover:text-white transition-colors">Historial</Link>
              <Link href="/borradores" className="text-zinc-400 hover:text-white transition-colors">Borradores</Link>
              <Link href="/estudio" className="text-zinc-400 hover:text-white transition-colors">Estudio</Link>
              <Link href="/citas" className="text-zinc-400 hover:text-white transition-colors">Citas</Link>
              <Link href="/plazos" className="text-zinc-400 hover:text-white transition-colors">Plazos</Link>
              <Link href="/leyes-chile" className="text-zinc-400 hover:text-white transition-colors">Leyes CL</Link>
              <Link href="/documentos" className="text-zinc-400 hover:text-white transition-colors">Documentos</Link>
              <Link href="/perfil" className="text-zinc-400 hover:text-white transition-colors">Perfil</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
