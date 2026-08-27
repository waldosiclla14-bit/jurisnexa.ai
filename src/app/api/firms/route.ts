import { NextRequest } from 'next/server';
import { getCurrentUser, createLawFirm, getMyFirm } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const user = await getCurrentUser(cookieHeader);

    if (!isSupabaseConfigured()) {
      return Response.json({ firm: null });
    }

    if (!user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    const result = await getMyFirm(user);
    if (!result) {
      return Response.json({ firm: null });
    }

    return Response.json(result);
  } catch (error) {
    console.error('Get firm error:', error);
    const message = error instanceof Error ? error.message : 'Error al obtener el estudio';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const user = await getCurrentUser(cookieHeader);

    if (!isSupabaseConfigured()) {
      return Response.json(
        { error: 'Para crear un estudio jurídico se requiere una cuenta conectada. Contacta a soporte@jurisnexa.ai' },
        { status: 400 }
      );
    }

    if (!user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 3) {
      return Response.json({ error: 'El nombre del estudio es obligatorio (mínimo 3 caracteres)' }, { status: 400 });
    }

    const firm = await createLawFirm({
      name: body.name.trim(),
      ruc: body.ruc?.trim() || undefined,
      rut: body.rut?.trim() || undefined,
      address: body.address?.trim() || undefined,
      phone: body.phone?.trim() || undefined,
      email: body.email?.trim() || undefined,
      website: body.website?.trim() || undefined,
      description: body.description?.trim() || undefined,
      userId: user.id,
      userEmail: user.email,
    });

    return Response.json({ firm, message: 'Estudio jurídico creado correctamente' }, { status: 201 });
  } catch (error) {
    console.error('Create firm error:', error);
    const message = error instanceof Error ? error.message : 'Error al crear el estudio';
    return Response.json({ error: message }, { status: 500 });
  }
}