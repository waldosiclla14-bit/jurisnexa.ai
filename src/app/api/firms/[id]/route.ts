import { NextRequest } from 'next/server';
import { getCurrentUser, getMyFirm, updateLawFirm } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/db/supabase';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const cookieHeader = request.headers.get('cookie');
    const user = await getCurrentUser(cookieHeader);

    if (!isSupabaseConfigured() || !user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    const result = await getMyFirm(user);
    if (!result || result.firm.id !== id) {
      return Response.json({ error: 'No perteneces a este estudio' }, { status: 403 });
    }

    return Response.json(result);
  } catch (error) {
    console.error('Get firm detail error:', error);
    const message = error instanceof Error ? error.message : 'Error al obtener el estudio';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const cookieHeader = request.headers.get('cookie');
    const user = await getCurrentUser(cookieHeader);

    if (!isSupabaseConfigured() || !user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!user.firm_id || user.firm_id !== id) {
      return Response.json({ error: 'No perteneces a este estudio' }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, string> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.address !== undefined) updates.address = body.address;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.website !== undefined) updates.website = body.website;
    if (body.description !== undefined) updates.description = body.description;
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url;

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    const firm = await updateLawFirm(id, user.id, updates);
    return Response.json({ firm, message: 'Estudio actualizado correctamente' });
  } catch (error) {
    console.error('Update firm error:', error);
    const message = error instanceof Error ? error.message : 'Error al actualizar el estudio';
    return Response.json({ error: message }, { status: 500 });
  }
}