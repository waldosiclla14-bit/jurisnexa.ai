import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/db/supabase';
import { updateFirmCaso, deleteFirmCaso } from '@/lib/db/queries';

interface RouteContext {
  params: Promise<{ id: string; casoId: string }>;
}

const VALID_ESTADOS = ['activo', 'pausado', 'archivado', 'perdido', 'ganado'];

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id, casoId } = await params;
    const cookieHeader = request.headers.get('cookie');
    const user = await getCurrentUser(cookieHeader);

    if (!isSupabaseConfigured() || !user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!user.firm_id || user.firm_id !== id) {
      return Response.json({ error: 'No perteneces a este estudio' }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    const textField = (key: string, max: number) => {
      if (body[key] === undefined) return;
      if (typeof body[key] !== 'string') throw new Error(`El campo ${key} debe ser texto`);
      if (body[key].trim().length > max) throw new Error(`El campo ${key} es demasiado largo`);
      updates[key] = body[key].trim() || null;
    };

    textField('cliente', 120);
    textField('contraparte', 120);
    textField('materia', 60);
    textField('tribunal', 120);
    textField('notas', 2000);

    if (body.estado !== undefined) {
      if (!VALID_ESTADOS.includes(body.estado)) throw new Error('Estado de caso inválido');
      updates.estado = body.estado;
    }

    if (body.vencimiento !== undefined) {
      if (body.vencimiento === null || body.vencimiento === '') {
        updates.vencimiento = null;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(body.vencimiento)) {
        updates.vencimiento = body.vencimiento;
      } else {
        throw new Error('Fecha de vencimiento inválida');
      }
    }

    if (body.rol !== undefined) {
      const rol = body.rol === null || body.rol === '' ? null : Number(body.rol);
      updates.rol = rol !== null && Number.isFinite(rol) ? rol : null;
    }

    if (body.abogadoId !== undefined) {
      updates.abogado_id = typeof body.abogadoId === 'string' && body.abogadoId ? body.abogadoId : null;
    }

    const caso = await updateFirmCaso(casoId, id, updates as never);
    return Response.json({ caso, message: 'Caso actualizado correctamente' });
  } catch (error) {
    console.error('Update caso error:', error);
    const message = error instanceof Error ? error.message : 'Error al actualizar caso';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id, casoId } = await params;
    const cookieHeader = request.headers.get('cookie');
    const user = await getCurrentUser(cookieHeader);

    if (!isSupabaseConfigured() || !user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!user.firm_id || user.firm_id !== id) {
      return Response.json({ error: 'No perteneces a este estudio' }, { status: 403 });
    }
    if (user.role_in_firm !== 'admin') {
      return Response.json({ error: 'Solo el administrador puede eliminar casos' }, { status: 403 });
    }

    await deleteFirmCaso(casoId, id);
    return Response.json({ message: 'Caso eliminado correctamente' });
  } catch (error) {
    console.error('Delete caso error:', error);
    const message = error instanceof Error ? error.message : 'Error al eliminar caso';
    return Response.json({ error: message }, { status: 500 });
  }
}