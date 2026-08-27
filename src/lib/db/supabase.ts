import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase no está configurado. Configura SUPABASE_URL y SUPABASE_ANON_KEY en .env.local');
    // Return a mock that won't crash but will fail gracefully
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseKey && supabaseUrl !== 'https://placeholder.supabase.co';
}
