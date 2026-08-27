import { NextRequest } from 'next/server';
import { getCurrentUser, acceptInvitation } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/db/supabase';

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params;
    const cookieHeader = request.headers.get('cookie');
    const user = await getCurrentUser(cookieHeader);

    if (!isSupabaseConfigured() || !user) {
      return Response.json(
        { error: 'Debes iniciar sesión para aceptar la invitación' },
        { status: 401 }
      );
    }

    const result = await acceptInvitation(token, user.id);
    return Response.json({ ...result, message: '¡Bienvenido al estudio jurídico!' });
  } catch (error) {
    console.error('Accept invitation error:', error);
    const message = error instanceof Error ? error.message : 'Error al aceptar invitación';
    return Response.json({ error: message }, { status: 500 });
  }
}