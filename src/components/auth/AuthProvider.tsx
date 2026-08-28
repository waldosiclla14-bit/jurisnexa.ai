'use client';

import { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { UserType } from '@/types';

interface User {
  id: string;
  email: string;
  full_name?: string;
  plan: string;
  queries_used: number;
  queries_limit: number;
  tipo_usuario?: UserType;
  colegiatura?: string;
  legal_areas?: string[];
  credential_issued_at?: string | null;
  credential_expires_at?: string | null;
  firm_id?: string | null;
  role_in_firm?: string | null;
  firm_name?: string | null;
  firm_plan?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string, tipoUsuario?: UserType) => Promise<void>;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'session' }),
      });
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signin', email, password }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setUser(data.user);
    router.push('/chat');
  };

  const signUp = async (email: string, password: string, fullName?: string, tipoUsuario?: UserType) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signup', email, password, fullName, tipoUsuario }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setUser(data.user);
    router.push('/chat');
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'google_login', redirectTo }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.url) {
      window.location.href = data.url;
    }
  };

  const signOut = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signout' }),
    });
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
