import { AuthProvider } from '@/components/auth/AuthProvider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">JurisNexa.ai</h1>
            <p className="text-zinc-400 mt-2">Asistente Jurídico Inteligente</p>
          </div>
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}
