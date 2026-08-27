import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/db/supabase';
import { listFirmCasos, createFirmCaso } from '@/lib/db/queries';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const VALID_ESTADOS = ['activo', 'pausado', 'archivado', 'perdido', 'ganado'];

function parseVencimiento(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

async function requireMember(request: NextRequest, firmId: string) {
  const cookieHeader = request.headers.get('cookie');
  const user = await getCurrentUser(cookieHeader);
  if (!isSupabaseConfigured() || !user) {
    return { error: 'No autenticado', status: 401 };
  }
  if (!user.firm_id || user.firm_id !== firmId) {
    return { error: 'No perteneces a este estudio', status: 403 };
  }
  return { user };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const auth = await requireMember(request, id);
    if ('error' in auth) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const casos = await listFirmCasos(id);
    return Response.json({ casos });
  } catch (error) {
    console.error('Get casos error:', error);
    const message = error instanceof Error ? error.message : 'Error al obtener casos';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const auth = await requireMember(request, id);
    if ('error' in auth) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const cliente = (body.cliente || '').trim();
    if (!cliente) {
      return Response.json({ error: 'El nombre del cliente es obligatorio' }, { status: 400 });
    }
    if (cliente.length > 120) {
      return Response.json({ error: 'El nombre del cliente es demasiado largo' }, { status: 400 });
    }

    const estado = VALID_ESTADOS.includes(body.estado) ? body.estado : 'activo';
    const rol = body.rol === undefined || body.rol === null || body.rol === ''
      ? null
      : Number(body.rol);

    const caso = await createFirmCaso({
      firmId: id,
      cliente,
      contraparte: typeof body.contraparte === 'string' ? body.contraparte : undefined,
      materia: typeof body.materia === 'string' ? body.materia : undefined,
      tribunal: typeof body.tribunal === 'string' ? body.tribunal : undefined,
      rol: Number.isFinite(rol) ? rol : null,
      estado,
      vencimiento: parseVencimiento(body.vencimiento),
      abogadoId: typeof body.abogadoId === 'string' && body.abogadoId ? body.abogadoId : null,
      notas: typeof body.notas === 'string' ? body.notas : undefined,
    });

    return Response.json({ caso, message: 'Caso creado correctamente' }, { status: 201 });
  } catch (error) {
    console.error('Create caso error:', error);
    const message = error instanceof Error ? error.message : 'Error al crear caso';
    return Response.json({ error: message }, { status: 500 });
  }
}