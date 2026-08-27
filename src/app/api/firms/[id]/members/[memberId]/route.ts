import { NextRequest } from 'next/server';
import { getCurrentUser, removeFirmMember, updateFirmMemberRole } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/db/supabase';
import { FirmRole } from '@/types';

interface RouteContext {
  params: Promise<{ id: string; memberId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id, memberId } = await params;
    const cookieHeader = request.headers.get('cookie');
    const user = await getCurrentUser(cookieHeader);

    if (!isSupabaseConfigured() || !user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!user.firm_id || user.firm_id !== id) {
      return Response.json({ error: 'No perteneces a este estudio' }, { status: 403 });
    }

    if (memberId === user.id) {
      return Response.json({ error: 'No puedes removerte a ti mismo' }, { status: 400 });
    }

    const result = await removeFirmMember(id, user.id, memberId);
    return Response.json({ ...result, message: 'Miembro removido del estudio' });
  } catch (error) {
    console.error('Remove member error:', error);
    const message = error instanceof Error ? error.message : 'Error al remover miembro';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id, memberId } = await params;
    const cookieHeader = request.headers.get('cookie');
    const user = await getCurrentUser(cookieHeader);

    if (!isSupabaseConfigured() || !user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!user.firm_id || user.firm_id !== id) {
      return Response.json({ error: 'No perteneces a este estudio' }, { status: 403 });
    }

    const body = await request.json();
    const role = body.role as FirmRole;
    if (!['admin', 'partner', 'associate', 'intern'].includes(role)) {
      return Response.json({ error: 'Rol inválido' }, { status: 400 });
    }

    const result = await updateFirmMemberRole(id, user.id, memberId, role);
    return Response.json({ ...result, message: 'Rol actualizado correctamente' });
  } catch (error) {
    console.error('Update member role error:', error);
    const message = error instanceof Error ? error.message : 'Error al actualizar rol';
    return Response.json({ error: message }, { status: 500 });
  }
}