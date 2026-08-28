import { getSupabase, isSupabaseConfigured } from '../db/supabase';
import { LegalArea, FirmRole, LawFirm, FirmMembership, UserType } from '@/types';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  plan: string;
  queries_used: number;
  queries_limit: number;

  // Tipo de usuario: orienta cómo responde la IA
  tipo_usuario?: UserType;

  // Credenciales abogado
  colegiatura?: string;              // N° de registro/colegiatura profesional
  legal_areas?: LegalArea[];         // Especialidades jurídicas seleccionadas
  credential_issued_at?: string | null;     // Fecha emisión (ISO string) o null
  credential_expires_at?: string | null;    // Fecha expiración (ISO string) o null

  // Estudio jurídico
  firm_id?: string | null;
  role_in_firm?: FirmRole | null;
  firm_name?: string | null;
  firm_plan?: string | null;
}

const DEMO_COOKIE = 'jurisnexa_demo_session';
const DEMO_USERS_KEY = 'jurisnexa_demo_users';

export { DEMO_COOKIE };

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

export async function attachFirmInfo(user: AuthUser): Promise<AuthUser> {
  if (!isSupabaseConfigured() || !user.id) return user;
  const supabase = getSupabase();

  // Buscar membresía activa
  const { data: membership } = await supabase
    .from('firm_memberships')
    .select('firm_id, role, law_firms!inner(id, name, plan)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!membership) return user;

  const firmRaw = membership.law_firms as unknown;
  const firm = Array.isArray(firmRaw)
    ? (firmRaw[0] as { id: string; name: string; plan: string })
    : (firmRaw as { id: string; name: string; plan: string });

  return {
    ...user,
    firm_id: membership.firm_id,
    role_in_firm: membership.role as FirmRole,
    firm_name: firm?.name,
    firm_plan: firm?.plan,
  };
}

export async function signUp(email: string, password: string, fullName?: string, tipoUsuario?: UserType) {
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
          tipo_usuario: tipoUsuario || 'cliente',
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
        tipo_usuario: tipoUsuario || 'cliente',
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
    tipo_usuario: tipoUsuario || 'cliente',
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
    const user = await attachFirmInfo({
      id: data.user!.id,
      email: data.user!.email!,
      full_name: profile?.full_name || data.user!.user_metadata?.full_name || '',
      plan: profile?.plan || 'free',
      queries_used: profile?.queries_used || 0,
      queries_limit: profile?.queries_limit || 10,
      tipo_usuario: profile?.tipo_usuario || 'cliente',
      colegiatura: profile?.colegiatura || '',
      legal_areas: profile?.legal_areas || [],
      credential_issued_at: profile?.credential_issued_at || null,
      credential_expires_at: profile?.credential_expires_at || null,
    } as AuthUser);
    return {
      user,
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

export async function signInWithGoogle(redirectTo: string) {
  if (!isSupabaseConfigured()) {
    throw new Error('Google Login requiere Supabase configurado. Contacta a soporte.');
  }
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw error;
  return { url: data.url };
}

export async function handleGoogleCallback(code: string, redirectTo?: string | null) {
  if (!isSupabaseConfigured()) {
    throw new Error('Google Login requiere Supabase configurado. Contacta a soporte.');
  }
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  const sbUser = data.user;
  if (!sbUser?.email) throw new Error('No se pudo obtener el correo de tu cuenta de Google');

  const profile = await supabase
    .from('users')
    .select('*')
    .eq('id', sbUser.id)
    .maybeSingle();

  let plan = 'free';
  let queries_used = 0;
  let queries_limit = 10;
  let tipo_usuario: UserType = 'cliente';
  let colegiatura = '';
  let legal_areas: LegalArea[] = [];
  let credential_issued_at: string | null = null;
  let credential_expires_at: string | null = null;
  let fullName = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || '';

  if (profile.data) {
    plan = profile.data.plan || 'free';
    queries_used = profile.data.queries_used || 0;
    queries_limit = profile.data.queries_limit || 10;
    tipo_usuario = profile.data.tipo_usuario || 'cliente';
    colegiatura = profile.data.colegiatura || '';
    legal_areas = profile.data.legal_areas || [];
    credential_issued_at = profile.data.credential_issued_at || null;
    credential_expires_at = profile.data.credential_expires_at || null;
    fullName = profile.data.full_name || fullName;
  } else {
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: sbUser.id,
        email: sbUser.email,
        full_name: fullName || null,
        plan: 'free',
        queries_used: 0,
        queries_limit: 10,
        tipo_usuario: 'cliente',
        colegiatura: '',
        legal_areas: [],
        credential_issued_at: null,
        credential_expires_at: null,
      });
    if (profileError) console.error('Error creating Google user profile:', profileError);
  }

  const user = await attachFirmInfo({
    id: sbUser.id,
    email: sbUser.email,
    full_name: fullName,
    plan,
    queries_used,
    queries_limit,
    tipo_usuario,
    colegiatura,
    legal_areas,
    credential_issued_at,
    credential_expires_at,
  } as AuthUser);

  return {
    user,
    session: data.session,
    redirectTo: redirectTo || '/chat',
  };
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
    if (!error && user) {
      const profile = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      return await attachFirmInfo({
        id: user.id,
        email: user.email!,
        full_name: profile.data?.full_name || user.user_metadata?.full_name,
        plan: profile.data?.plan || 'free',
        queries_used: profile.data?.queries_used || 0,
        queries_limit: profile.data?.queries_limit || 10,
        tipo_usuario: profile.data?.tipo_usuario || 'cliente',
        colegiatura: profile.data?.colegiatura || '',
        legal_areas: profile.data?.legal_areas || [],
        credential_issued_at: profile.data?.credential_issued_at || null,
        credential_expires_at: profile.data?.credential_expires_at || null,
      } as AuthUser);
    }

    // Fallback: sesión iniciada vía Google OAuth (cookie demo set por /auth/callback)
    const email = cookieHeader
      ? getDemoEmailFromCookieHeader(cookieHeader)
      : getDemoEmailFromCookie();
    if (email) {
      const { data: byEmail } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (byEmail) {
        return await attachFirmInfo({
          id: byEmail.id,
          email: byEmail.email,
          full_name: byEmail.full_name,
          plan: byEmail.plan || 'free',
          queries_used: byEmail.queries_used || 0,
          queries_limit: byEmail.queries_limit || 10,
          tipo_usuario: byEmail.tipo_usuario || 'cliente',
          colegiatura: byEmail.colegiatura || '',
          legal_areas: byEmail.legal_areas || [],
          credential_issued_at: byEmail.credential_issued_at || null,
          credential_expires_at: byEmail.credential_expires_at || null,
        } as AuthUser);
      }
    }
    return null;
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
  tipo_usuario?: UserType;
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

// ============================================================
// Estudios Jurídicos (Law Firms)
// ============================================================

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

function generateToken(): string {
  return randomBytes(24).toString('hex');
}

export async function createLawFirm(params: {
  name: string;
  ruc?: string;
  rut?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  userId: string;
  userEmail: string;
}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Los estudios jurídicos requieren una cuenta en la nube. Contacta a soporte.');
  }
  const supabase = getSupabase();
  const slug = slugify(params.name);

  // Crear el estudio
  const { data: firm, error: firmError } = await supabase
    .from('law_firms')
    .insert({
      name: params.name,
      slug,
      ruc: params.ruc || null,
      rut: params.rut || null,
      address: params.address || null,
      phone: params.phone || null,
      email: params.email || params.userEmail,
      website: params.website || null,
      description: params.description || null,
      plan: 'professional',
      queries_used: 0,
      queries_limit: 500,
      credential_issued_at: new Date().toISOString(),
      credential_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
    })
    .select()
    .single();

  if (firmError) {
    if (firmError.message?.includes('duplicate') || firmError.message?.includes('slug')) {
      throw new Error('Ya existe un estudio con ese nombre. Elige otro nombre o contacto a soporte.');
    }
    throw firmError;
  }

  // Crear membresía admin
  const { error: memError } = await supabase
    .from('firm_memberships')
    .insert({
      user_id: params.userId,
      firm_id: firm.id,
      role: 'admin',
      invited_by: params.userId,
      joined_at: new Date().toISOString(),
      is_active: true,
    });

  if (memError) throw memError;

  // Actualizar el plan del usuario a 'professional'
  await supabase
    .from('users')
    .update({ plan: 'professional', queries_limit: 500, updated_at: new Date().toISOString() })
    .eq('id', params.userId);

  return firm as LawFirm;
}

export async function getMyFirm(user: AuthUser): Promise<{
  firm: LawFirm;
  members: FirmMembership[];
  pendingInvitations: {
    id: string;
    invited_email: string;
    role: FirmRole;
    token: string;
    expires_at: string;
    created_at: string;
  }[];
  isAdmin: boolean;
} | null> {
  if (!isSupabaseConfigured() || !user.firm_id || !user.id) return null;
  const supabase = getSupabase();

  const { data: firm, error: firmError } = await supabase
    .from('law_firms')
    .select('*')
    .eq('id', user.firm_id)
    .single();
  if (firmError) throw firmError;

  const { data: members, error: memError } = await supabase
    .from('firm_memberships')
    .select(`
      id, user_id, firm_id, role, invited_by, joined_at, is_active,
      users!firm_memberships_user_id_fkey (id, email, full_name, colegiatura, legal_areas)
    `)
    .eq('firm_id', user.firm_id)
    .eq('is_active', true)
    .order('joined_at');
  if (memError) throw memError;

  const { data: invitations, error: invError } = await supabase
    .from('firm_invitations')
    .select('id, invited_email, role, token, expires_at, created_at')
    .eq('firm_id', user.firm_id)
    .eq('accepted', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (invError) throw invError;

  return {
    firm: firm as LawFirm,
    members: (members || []).map(m => ({
      ...m,
      user: Array.isArray(m.users) ? m.users[0] : m.users,
    })),
    pendingInvitations: (invitations || []).map(i => ({
      id: i.id,
      invited_email: i.invited_email,
      role: i.role as FirmRole,
      token: i.token,
      expires_at: i.expires_at,
      created_at: i.created_at,
    })),
    isAdmin: user.role_in_firm === 'admin',
  };
}

export async function updateLawFirm(
  firmId: string,
  adminUserId: string,
  updates: { name?: string; address?: string; phone?: string; website?: string; description?: string; logo_url?: string }
) {
  if (!isSupabaseConfigured()) throw new Error('Requiere cuenta en la nube');
  const supabase = getSupabase();

  // Verificar que el usuario es admin
  const { data: membership, error: memError } = await supabase
    .from('firm_memberships')
    .select('role')
    .eq('user_id', adminUserId)
    .eq('firm_id', firmId)
    .eq('is_active', true)
    .single();
  if (memError) throw memError;
  if (membership.role !== 'admin') {
    throw new Error('Solo el administrador del estudio puede modificar estos datos');
  }

  const payload: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from('law_firms')
    .update(payload)
    .eq('id', firmId)
    .select()
    .single();
  if (error) throw error;
  return data as LawFirm;
}

export async function inviteFirmMember(params: {
  firmId: string;
  adminUserId: string;
  email: string;
  role: string;
  expiresInDays?: number;
}) {
  if (!isSupabaseConfigured()) throw new Error('Requiere cuenta en la nube');
  const supabase = getSupabase();

  // Verificar admin
  const { data: membership, error: memError } = await supabase
    .from('firm_memberships')
    .select('role')
    .eq('user_id', params.adminUserId)
    .eq('firm_id', params.firmId)
    .eq('is_active', true)
    .single();
  if (memError) throw memError;
  if (membership.role !== 'admin') {
    throw new Error('Solo el administrador puede invitar miembros');
  }

  const normalizedEmail = params.email.trim().toLowerCase();
  const expiresInDays = params.expiresInDays || 7;
  const token = generateToken();

  const { data, error } = await supabase
    .from('firm_invitations')
    .insert({
      firm_id: params.firmId,
      invited_email: normalizedEmail,
      invited_by: params.adminUserId,
      role: (['admin', 'partner', 'associate', 'intern'].includes(params.role) ? params.role : 'associate') as FirmRole,
      token,
      expires_at: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
      accepted: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getFirmMembers(firmId: string, userId: string) {
  if (!isSupabaseConfigured()) throw new Error('Requiere cuenta en la nube');
  const supabase = getSupabase();

  // Verificar que el usuario pertenece al estudio
  const { data: membership } = await supabase
    .from('firm_memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('firm_id', firmId)
    .eq('is_active', true)
    .single();
  if (!membership) throw new Error('No perteneces a este estudio');

  const { data, error } = await supabase
    .from('firm_memberships')
    .select(`
      id, user_id, firm_id, role, invited_by, joined_at, is_active,
      users!firm_memberships_user_id_fkey (id, email, full_name, colegiatura, legal_areas)
    `)
    .eq('firm_id', firmId)
    .eq('is_active', true)
    .order('joined_at');
  if (error) throw error;

  return (data || []).map(m => ({ ...m, user: Array.isArray(m.users) ? m.users[0] : m.users }));
}

export async function removeFirmMember(firmId: string, adminUserId: string, memberUserId: string) {
  if (!isSupabaseConfigured()) throw new Error('Requiere cuenta en la nube');
  const supabase = getSupabase();

  // Verificar admin
  const { data: membership, error: memError } = await supabase
    .from('firm_memberships')
    .select('role')
    .eq('user_id', adminUserId)
    .eq('firm_id', firmId)
    .eq('is_active', true)
    .single();
  if (memError) throw memError;
  if (membership.role !== 'admin') {
    throw new Error('Solo el administrador puede remover miembros');
  }

  // No permitir remover otro admin
  const { data: target } = await supabase
    .from('firm_memberships')
    .select('role')
    .eq('user_id', memberUserId)
    .eq('firm_id', firmId)
    .single();
  if (target?.role === 'admin') {
    throw new Error('No puedes remover a otro administrador. Cambia su rol primero.');
  }

  const { error } = await supabase
    .from('firm_memberships')
    .update({ is_active: false })
    .eq('user_id', memberUserId)
    .eq('firm_id', firmId);
  if (error) throw error;

  // Liberar el plan del miembro removido
  await supabase
    .from('users')
    .update({ plan: 'free', queries_limit: 10, updated_at: new Date().toISOString() })
    .eq('id', memberUserId);

  return { success: true };
}

export async function updateFirmMemberRole(firmId: string, adminUserId: string, memberUserId: string, newRole: FirmRole) {
  if (!isSupabaseConfigured()) throw new Error('Requiere cuenta en la nube');
  const supabase = getSupabase();

  const { data: membership, error: memError } = await supabase
    .from('firm_memberships')
    .select('role')
    .eq('user_id', adminUserId)
    .eq('firm_id', firmId)
    .eq('is_active', true)
    .single();
  if (memError) throw memError;
  if (membership.role !== 'admin') {
    throw new Error('Solo el administrador puede cambiar roles');
  }

  const { error } = await supabase
    .from('firm_memberships')
    .update({ role: newRole })
    .eq('user_id', memberUserId)
    .eq('firm_id', firmId);
  if (error) throw error;
  return { success: true };
}

export async function getMyInvitations(email: string) {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('firm_invitations')
    .select(`
      id, firm_id, invited_email, invited_by, role, token, expires_at, accepted, created_at,
      law_firms!firm_invitations_firm_id_fkey (id, name, slug)
    `)
    .eq('invited_email', email.toLowerCase())
    .eq('accepted', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map(inv => ({
    ...inv,
    firm: inv.law_firms,
  }));
}

export async function acceptInvitation(token: string, userId: string, userEmail?: string) {
  if (!isSupabaseConfigured()) throw new Error('Requiere cuenta en la nube');
  const supabase = getSupabase();

  // Obtener el correo del usuario actual si no se pasa
  let email = userEmail;
  if (!email) {
    const { data: profile } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
    email = profile?.email;
  }
  if (!email) throw new Error('No se pudo verificar tu correo. Vuelve a iniciar sesión.');

  const { data: invitation, error: invError } = await supabase
    .from('firm_invitations')
    .select('*')
    .eq('token', token)
    .eq('accepted', false)
    .single();
  if (invError) throw new Error('Invitación no válida o ya fue utilizada');

  // La invitación está vinculada a un correo específico
  if (invitation.invited_email.toLowerCase() !== email.toLowerCase()) {
    throw new Error('Esta invitación fue enviada a otro correo. Usa el correo con el que se te invitó.');
  }

  if (new Date(invitation.expires_at) < new Date()) {
    throw new Error('Esta invitación ha expirado');
  }

  // Ya es miembro activo de este estudio
  const { data: existing } = await supabase
    .from('firm_memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('firm_id', invitation.firm_id)
    .eq('is_active', true)
    .maybeSingle();
  if (existing) {
    throw new Error('Ya eres miembro activo de este estudio');
  }

  // Marcar invitación como aceptada
  await supabase
    .from('firm_invitations')
    .update({ accepted: true })
    .eq('id', invitation.id);

  // Crear membresía (upsert por si fue miembro antes: reactiva la membresía)
  const { error: memError } = await supabase
    .from('firm_memberships')
    .upsert({
      user_id: userId,
      firm_id: invitation.firm_id,
      role: invitation.role,
      invited_by: invitation.invited_by,
      joined_at: new Date().toISOString(),
      is_active: true,
    }, { onConflict: 'user_id,firm_id' });
  if (memError) throw memError;

  // Actualizar plan del usuario al plan del estudio
  const { data: firm } = await supabase
    .from('law_firms')
    .select('plan, queries_limit')
    .eq('id', invitation.firm_id)
    .single();

  await supabase
    .from('users')
    .update({
      plan: firm?.plan || 'professional',
      queries_used: 0,
      queries_limit: firm?.queries_limit || 500,
      firm_id: invitation.firm_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  return { success: true };
}