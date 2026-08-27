import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabase, isSupabaseConfigured } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      // Demo mode: return empty list
      return Response.json({ conversations: [] });
    }

    const user = await getCurrentUser();
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // If ID provided, return single conversation with messages
    if (conversationId) {
      let convQuery = supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId);

      if (user) {
        convQuery = convQuery.eq('user_id', user.id);
      } else {
        convQuery = convQuery.is('user_id', null);
      }

      const { data: conversation, error: convError } = await convQuery.single();
      if (convError) throw convError;

      // Fetch messages
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id, role, content, country, legal_area, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;

      return Response.json({ conversation, messages });
    }

    // List conversations
    let query = supabase
      .from('conversations')
      .select('id, title, country, legal_area, message_count, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.is('user_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;

    return Response.json({ conversations: data });
  } catch (error) {
    console.error('Conversations list error:', error);
    const message = error instanceof Error ? error.message : 'Error al listar conversaciones';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return Response.json({ error: 'Base de datos no configurada' }, { status: 503 });
    }

    const user = await getCurrentUser();
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return Response.json({ error: 'ID de conversación requerido' }, { status: 400 });
    }

    // Verify ownership
    let query = supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.is('user_id', null);
    }

    const { error } = await query;
    if (error) throw error;

    return Response.json({ success: true });
  } catch (error) {
    console.error('Conversation delete error:', error);
    const message = error instanceof Error ? error.message : 'Error al eliminar conversación';
    return Response.json({ error: message }, { status: 500 });
  }
}
