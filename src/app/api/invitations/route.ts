import { NextRequest } from 'next/server';
import { getCurrentUser, getMyInvitations } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const user = await getCurrentUser(cookieHeader);

    if (!isSupabaseConfigured() || !user) {
      return Response.json({ invitations: [] });
    }

    const invitations = await getMyInvitations(user.email);
    return Response.json({ invitations });
  } catch (error) {
    console.error('Get invitations error:', error);
    const message = error instanceof Error ? error.message : 'Error al obtener invitaciones';
    return Response.json({ error: message }, { status: 500 });
  }
}