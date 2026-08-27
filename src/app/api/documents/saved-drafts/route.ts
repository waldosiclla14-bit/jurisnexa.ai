import { NextRequest } from 'next/server';
import { isSupabaseConfigured, getSupabase } from '@/lib/db/supabase';
import { getCurrentUser } from '@/lib/auth';

interface DraftRecord {
  id: string;
  title: string;
  document_type: string;
  country: string;
  legal_area: string | null;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return Response.json({ drafts: [] });
    }

    const user = await getCurrentUser();
    const supabase = getSupabase();

    let query = supabase
      .from('saved_drafts')
      .select('id, title, document_type, country, legal_area, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.is('user_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;

    return Response.json({ drafts: data });
  } catch (error) {
    console.error('Saved drafts list error:', error);
    const message = error instanceof Error ? error.message : 'Error al listar borradores';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, documentType, country, legalArea, content, metadata } = body as {
      title: string;
      documentType: string;
      country: string;
      legalArea?: string;
      content: string;
      metadata?: Record<string, unknown>;
    };

    if (!title || !content || !documentType || !country) {
      return Response.json(
        { error: 'Faltan campos requeridos: title, documentType, country, content' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return Response.json({ error: 'Base de datos no configurada', hint: 'usa localStorage' }, { status: 503 });
    }

    const user = await getCurrentUser();
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('saved_drafts')
      .insert({
        user_id: user?.id || null,
        title,
        document_type: documentType,
        country,
        legal_area: legalArea || null,
        content,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({ draft: data });
  } catch (error) {
    console.error('Save draft error:', error);
    const message = error instanceof Error ? error.message : 'Error al guardar borrador';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');

    if (!draftId) {
      return Response.json({ error: 'ID de borrador requerido' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return Response.json({ error: 'Base de datos no configurada' }, { status: 503 });
    }

    const user = await getCurrentUser();
    const supabase = getSupabase();

    let query = supabase
      .from('saved_drafts')
      .delete()
      .eq('id', draftId);

    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.is('user_id', null);
    }

    const { error } = await query;
    if (error) throw error;

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete draft error:', error);
    const message = error instanceof Error ? error.message : 'Error al eliminar borrador';
    return Response.json({ error: message }, { status: 500 });
  }
}
