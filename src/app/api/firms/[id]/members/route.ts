import { NextRequest } from 'next/server';
import { getCurrentUser, getFirmMembers, inviteFirmMember } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/db/supabase';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: NextRequest, { params }: RouteContext) {
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

    const members = await getFirmMembers(id, user.id);
    return Response.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    const message = error instanceof Error ? error.message : 'Error al obtener miembros';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
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
    const email = (body.email || '').trim().toLowerCase();
    if (!VALID_EMAIL.test(email)) {
      return Response.json({ error: 'Correo electrónico inválido' }, { status: 400 });
    }

    const role = body.role || 'associate';

    const invitation = await inviteFirmMember({
      firmId: id,
      adminUserId: user.id,
      email,
      role,
    });

    return Response.json(
      { invitation, message: `Invitación enviada a ${email}. El enlace caduca en 7 días.` },
      { status: 201 }
    );
  } catch (error) {
    console.error('Invite member error:', error);
    const message = error instanceof Error ? error.message : 'Error al invitar miembro';
    return Response.json({ error: message }, { status: 500 });
  }
}