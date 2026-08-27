import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabase, isSupabaseConfigured } from '@/lib/db/supabase';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { messageId, rating, comment } = body;

    if (!messageId) {
      return Response.json({ error: 'ID de mensaje requerido' }, { status: 400 });
    }

    // Demo mode: just accept and return success
    if (!isSupabaseConfigured()) {
      return Response.json({ success: true, demo: true });
    }

    // Normalize rating: 'positive' -> 5, 'negative' -> 1, or use numeric value
    let numericRating: number | null = null;
    if (rating === 'positive') numericRating = 5;
    else if (rating === 'negative') numericRating = 1;
    else if (typeof rating === 'number') numericRating = Math.min(5, Math.max(1, rating));

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        message_id: messageId,
        user_id: user?.id || null,
        rating: numericRating,
        comment: comment || null,
        feedback_type: numericRating === 5 ? 'positive' : numericRating === 1 ? 'negative' : 'general',
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({ success: true, feedback: data });
  } catch (error) {
    console.error('Feedback error:', error);
    const message = error instanceof Error ? error.message : 'Error al enviar feedback';
    return Response.json({ error: message }, { status: 500 });
  }
}
