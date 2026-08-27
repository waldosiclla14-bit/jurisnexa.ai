import { getSupabase, isSupabaseConfigured } from '../db/supabase';
import { LegalArea } from '@/types';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  plan: string;
  queries_used: number;
  queries_limit: number;
  
  // Credenciales abogado
  colegiatura?: string;              // N° de registro/colegiatura profesional
  legal_areas?: LegalArea[];         // Especialidades jurídicas seleccionadas
  credential_issued_at?: string | null;     // Fecha emisión (ISO string) o null
  credential_expires_at?: string | null;    // Fecha expiración (ISO string) o null
}

const DEMO_COOKIE = 'jurisnexa_demo_session';
const DEMO_USERS_KEY = 'jurisnexa_demo_users';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(salt + password).digest('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const verify = createHash('sha256').update(salt + password).digest('hex');
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verify, 'hex'));
}

function getDemoUsers(): Record<string, { password: string; user: AuthUser }> {
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), '.jurisnexa_demo_users.json');
      if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch { /* ignore */ }
    return {};
  }
  const raw = localStorage.getItem(DEMO_USERS_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function saveDemoUsers(users: Record<string, { password: string; user: AuthUser }>) {
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), '.jurisnexa_demo_users.json');
      fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
    } catch { /* ignore */ }
    return;
  }
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
}

function getDemoUserFromEmail(email: string): AuthUser | null {
  const users = getDemoUsers();
  return users[email]?.user ?? null;
}

function setDemoCookie(email: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `${DEMO_COOKIE}=${encodeURIComponent(email)}; path=/; max-age=86400; SameSite=Lax`;
  }
}

function clearDemoCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = `${DEMO_COOKIE}=; path=/; max-age=0`;
  }
}

function getDemoEmailFromCookie(): string | null {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp(`${DEMO_COOKIE}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : null;
  }
  // Server-side: parse from cookie header (done in API route)
  return null;
}

function getDemoEmailFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${DEMO_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export { getDemoEmailFromCookieHeader };

export async function signUp(email: string, password: string, fullName?: string) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName || '' } },
    });
    if (error) throw error;
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName || null,
          plan: 'free',
          queries_used: 0,
          queries_limit: 10,
          colegiatura: '',
          legal_areas: [],
          credential_issued_at: null,
          credential_expires_at: null,
        });
      if (profileError) console.error('Error creating user profile:', profileError);
    }
    return {
      user: {
        id: data.user!.id,
        email: data.user!.email!,
        full_name: fullName || '',
        plan: 'free',
        queries_used: 0,
        queries_limit: 10,
        colegiatura: '',
        legal_areas: [],
        credential_issued_at: null,
        credential_expires_at: null,
      } as AuthUser,
      session: data.session,
    };
  }

  // Demo mode
  const users = getDemoUsers();
  if (users[email]) {
    throw new Error('Ya existe una cuenta con este email');
  }
  const newUser: AuthUser = {
    id: crypto.randomUUID(),
    email,
    full_name: fullName || '',
    plan: 'free',
    queries_used: 0,
    queries_limit: 10,
    colegiatura: '',
    legal_areas: [],
    credential_issued_at: null,
    credential_expires_at: null,
  };
  users[email] = { password: hashPassword(password), user: newUser };
  saveDemoUsers(users);
  setDemoCookie(email);
  return { user: newUser, session: null };
}

export async function signIn(email: string, password: string) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const profile = await getUserProfile(data.user!.id);
    return {
      user: {
        id: data.user!.id,
        email: data.user!.email!,
        full_name: profile?.full_name || data.user!.user_metadata?.full_name || '',
        plan: profile?.plan || 'free',
        queries_used: profile?.queries_used || 0,
        queries_limit: profile?.queries_limit || 10,
        colegiatura: profile?.colegiatura || '',
        legal_areas: profile?.legal_areas || [],
        credential_issued_at: profile?.credential_issued_at || null,
        credential_expires_at: profile?.credential_expires_at || null,
      } as AuthUser,
      session: data.session,
    };
  }

  // Demo mode — add abogado plan support
  const users = getDemoUsers();
  const entry = users[email];
  if (!entry || !verifyPassword(password, entry.password)) {
    throw new Error('Email o contraseña incorrectos');
  }
  // Upgrade existing demo users to abogado plan if needed
  if (entry.user.plan === 'free' && entry.user.queries_limit === 10) {
    entry.user.plan = 'abogado';
    entry.user.queries_limit = 50;
  }
  setDemoCookie(email);
  return { user: entry.user, session: null };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return;
  }
  clearDemoCookie();
}

export async function getCurrentUser(cookieHeader?: string | null) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    const profile = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    return {
      id: user.id,
      email: user.email!,
      full_name: profile.data?.full_name || user.user_metadata?.full_name,
      plan: profile.data?.plan || 'free',
      queries_used: profile.data?.queries_used || 0,
      queries_limit: profile.data?.queries_limit || 10,
      colegiatura: profile.data?.colegiatura || '',
      legal_areas: profile.data?.legal_areas || [],
      credential_issued_at: profile.data?.credential_issued_at || null,
      credential_expires_at: profile.data?.credential_expires_at || null,
    } as AuthUser;
  }

  // Demo mode: read from cookie
  const email = cookieHeader
    ? getDemoEmailFromCookieHeader(cookieHeader)
    : getDemoEmailFromCookie();
  if (!email) return null;
  return getDemoUserFromEmail(email);
}

export async function getUserProfile(userId: string) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  }
  // Demo mode: find by iterating (small dataset)
  const users = getDemoUsers();
  for (const entry of Object.values(users)) {
    if (entry.user.id === userId) return entry.user;
  }
  return null;
}

export async function updateUserProfile(userId: string, updates: {
  full_name?: string;
  plan?: string;
  colegiatura?: string;
  legal_areas?: LegalArea[];
  credential_issued_at?: string;
  credential_expires_at?: string;
}) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  // Demo mode
  const users = getDemoUsers();
  for (const [email, entry] of Object.entries(users)) {
    if (entry.user.id === userId) {
      const updated = { ...entry.user, ...updates };
      users[email].user = updated;
      saveDemoUsers(users);
      return updated;
    }
  }
  throw new Error('Usuario no encontrado');
}

export async function incrementQueryCount(userId: string) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { error } = await supabase.rpc('increment_query_count' as never, {
      user_id_input: userId,
    } as never);
    if (error) {
      const { data: user } = await supabase
        .from('users')
        .select('queries_used')
        .eq('id', userId)
        .single();
      if (user) {
        await supabase
          .from('users')
          .update({ queries_used: user.queries_used + 1 })
          .eq('id', userId);
      }
    }
    return;
  }
  // Demo mode
  const users = getDemoUsers();
  for (const [email, entry] of Object.entries(users)) {
    if (entry.user.id === userId) {
      users[email].user.queries_used += 1;
      saveDemoUsers(users);
      return;
    }
  }
}