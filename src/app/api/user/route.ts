import { NextRequest } from 'next/server';
import { getCurrentUser, updateUserProfile } from '@/lib/auth';
import { getSupabase, isSupabaseConfigured } from '@/lib/db/supabase';
import { LegalArea, UserType } from '@/types';

const VALID_TIPO_USUARIO = ['cliente', 'abogado'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'usage') {
      return handleTokenUsage(request);
    }

    // Default: return user profile
    if (!isSupabaseConfigured()) {
      const cookieHeader = request.headers.get('cookie');
      const user = await getCurrentUser(cookieHeader);
      if (user) return Response.json({ user });
      return Response.json({
        user: {
          id: 'demo-user',
          email: 'demo@jurisnexa.ai',
          full_name: 'Usuario Demo',
          plan: 'free',
          queries_used: 0,
          queries_limit: 10,
        },
      });
    }

    const cookieHeader = request.headers.get('cookie');
    const user = await getCurrentUser(cookieHeader);
    if (!user) {
      return Response.json({ user: null });
    }
    return Response.json({ user });
  } catch (error) {
    console.error('User profile error:', error);
    const message = error instanceof Error ? error.message : 'Error al obtener perfil';
    return Response.json({ error: message }, { status: 500 });
  }
}

async function handleTokenUsage(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const user = await getCurrentUser(cookieHeader);

    if (!isSupabaseConfigured()) {
      // Demo mode: return mock usage data
      return Response.json({
        usage: [],
        totals: { inputTokens: 0, outputTokens: 0, totalCost: 0, requests: 0 },
        period: '30 días',
      });
    }

    if (!user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('token_usage')
      .select('provider, model, input_tokens, output_tokens, cost_usd, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totals = (data || []).reduce(
      (acc, row) => ({
        inputTokens: acc.inputTokens + row.input_tokens,
        outputTokens: acc.outputTokens + row.output_tokens,
        totalCost: acc.totalCost + row.cost_usd,
        requests: acc.requests + 1,
      }),
      { inputTokens: 0, outputTokens: 0, totalCost: 0, requests: 0 }
    );

    return Response.json({ usage: data, totals, period: `${days} días` });
  } catch (error) {
    console.error('Token usage error:', error);
    const message = error instanceof Error ? error.message : 'Error al obtener uso de tokens';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');

    if (!isSupabaseConfigured()) {
      // Demo mode: accept updates locally
      const user = await getCurrentUser(cookieHeader);
      if (!user) {
        return Response.json({ error: 'No autenticado' }, { status: 401 });
      }
      const body = await request.json();
      const updates: { full_name?: string; plan?: string; tipo_usuario?: UserType; colegiatura?: string; legal_areas?: LegalArea[] } = {};
      if (body.fullName !== undefined) updates.full_name = body.fullName;
      if (body.plan !== undefined) updates.plan = body.plan;
      if (body.tipoUsuario !== undefined) {
        if (!VALID_TIPO_USUARIO.includes(body.tipoUsuario)) {
          return Response.json({ error: 'Tipo de usuario no válido' }, { status: 400 });
        }
        updates.tipo_usuario = body.tipoUsuario as UserType;
      }
      if (body.colegiatura !== undefined) updates.colegiatura = body.colegiatura;
      if (body.legal_areas !== undefined) updates.legal_areas = body.legal_areas;
      const updatedUser = await updateUserProfile(user.id, updates);
      return Response.json({ user: updatedUser });
    }

    const user = await getCurrentUser(cookieHeader);
    if (!user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const updates: { full_name?: string; plan?: string; tipo_usuario?: UserType; colegiatura?: string; legal_areas?: LegalArea[] } = {};
    if (body.fullName !== undefined) updates.full_name = body.fullName;
    if (body.plan !== undefined) updates.plan = body.plan;
    if (body.tipoUsuario !== undefined) {
      if (!VALID_TIPO_USUARIO.includes(body.tipoUsuario)) {
        return Response.json({ error: 'Tipo de usuario no válido' }, { status: 400 });
      }
      updates.tipo_usuario = body.tipoUsuario as UserType;
    }
    if (body.colegiatura !== undefined) updates.colegiatura = body.colegiatura;
    if (body.legal_areas !== undefined) updates.legal_areas = body.legal_areas;

    const updatedUser = await updateUserProfile(user.id, updates);
    return Response.json({ user: updatedUser });
  } catch (error) {
    console.error('User update error:', error);
    const message = error instanceof Error ? error.message : 'Error al actualizar perfil';
    return Response.json({ error: message }, { status: 500 });
  }
}
