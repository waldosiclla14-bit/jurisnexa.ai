import { getSupabase } from './supabase';

// ============================================================
// Database operations for JurisNexa.ai
// ============================================================

// --- Countries ---
export async function getCountries() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function getCountryByCode(code: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('countries')
    .select('id')
    .eq('code', code)
    .single();
  if (error) throw error;
  return data;
}

// --- Legal Areas ---
export async function getLegalAreas() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('legal_areas')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function getLegalAreaBySlug(slug: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('legal_areas')
    .select('id')
    .eq('slug', slug)
    .single();
  if (error) throw error;
  return data;
}

// --- Sources ---
export async function getSources(countryCode?: string) {
  const supabase = getSupabase();
  let query = supabase
    .from('sources')
    .select('*, countries!inner(code)')
    .eq('is_active', true);
  
  if (countryCode) {
    query = query.eq('countries.code', countryCode);
  }
  
  const { data, error } = await query.order('reliability_score', { ascending: false });
  if (error) throw error;
  return data;
}

// --- Legal Documents ---
export async function getLegalDocuments(params: {
  countryCode?: string;
  areaSlug?: string;
  documentType?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = getSupabase();
  let query = supabase
    .from('legal_documents')
    .select('*, countries!inner(code), legal_areas!left(slug)', { count: 'exact' });

  if (params.countryCode) {
    query = query.eq('countries.code', params.countryCode);
  }
  if (params.areaSlug) {
    query = query.eq('legal_areas.slug', params.areaSlug);
  }
  if (params.documentType) {
    query = query.eq('document_type', params.documentType);
  }
  if (params.status) {
    query = query.eq('status', params.status);
  }

  const offset = params.offset || 0;
  const limit = params.limit || 20;

  const { data, error, count } = await query
    .order('effective_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { documents: data, total: count };
}

export async function searchDocuments(query: string, countryCode?: string, limit = 10) {
  const supabase = getSupabase();
  let dbQuery = supabase
    .from('legal_documents')
    .select('*, countries!inner(code)')
    .textSearch('title', query, { type: 'websearch' });

  if (countryCode) {
    dbQuery = dbQuery.eq('countries.code', countryCode);
  }

  const { data, error } = await dbQuery.limit(limit);
  if (error) throw error;
  return data;
}

// --- Legal Articles ---
export async function getArticlesByDocument(documentId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('legal_articles')
    .select('*')
    .eq('document_id', documentId)
    .order('article_number');
  if (error) throw error;
  return data;
}

export async function searchArticles(query: string, countryCode?: string, areaSlug?: string, limit = 10) {
  const supabase = getSupabase();
  let dbQuery = supabase
    .from('legal_articles')
    .select('*, legal_documents!inner(*, countries!inner(code), legal_areas!left(slug))')
    .textSearch('content', query, { type: 'websearch' });

  if (countryCode) {
    dbQuery = dbQuery.eq('legal_documents.countries.code', countryCode);
  }
  if (areaSlug) {
    dbQuery = dbQuery.eq('legal_documents.legal_areas.slug', areaSlug);
  }

  const { data, error } = await dbQuery.limit(limit);
  if (error) throw error;
  return data;
}

// --- Document Chunks (for RAG) ---
export async function insertChunks(chunks: {
  document_id?: string;
  article_id?: string;
  country_id: string;
  legal_area_id?: string;
  chunk_text: string;
  chunk_index: number;
  metadata?: Record<string, unknown>;
  embedding: number[];
  content_hash?: string;
}[]) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('document_chunks')
    .insert(chunks)
    .select();
  if (error) throw error;
  return data;
}

export async function searchChunksByEmbedding(
  embedding: number[],
  params: {
    countryCode?: string;
    areaSlug?: string;
    matchCount?: number;
    threshold?: number;
  } = {}
) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('search_chunks', {
    query_embedding: embedding,
    match_country: params.countryCode ? (await getCountryByCode(params.countryCode)).id : null,
    match_area: params.areaSlug ? (await getLegalAreaBySlug(params.areaSlug)).id : null,
    match_count: params.matchCount || 10,
    match_threshold: params.threshold || 0.5,
  });
  if (error) throw error;
  return data;
}

// --- Conversations ---
export async function createConversation(params: {
  userId?: string;
  title?: string;
  country: string;
  legalArea?: string;
}) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: params.userId || null,
      title: params.title || 'Nueva consulta',
      country: params.country,
      legal_area: params.legalArea || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateConversation(id: string, updates: { title?: string; message_count?: number }) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('conversations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- Messages ---
export async function insertMessage(params: {
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  country?: string;
  legalArea?: string;
  tokenCount?: number;
}) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: params.conversationId,
      role: params.role,
      content: params.content,
      country: params.country || null,
      legal_area: params.legalArea || null,
      token_count: params.tokenCount || 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getConversationMessages(conversationId: string, limit = 50) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data;
}

// --- Citations ---
export async function insertCitations(params: {
  messageId: string;
  documentId?: string;
  articleId?: string;
  normName: string;
  articleNumber?: string;
  country: string;
  sourceUrl?: string;
  sourceName: string;
  excerpt?: string;
}[]) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('citations')
    .insert(params.map(p => ({
      message_id: p.messageId,
      document_id: p.documentId || null,
      article_id: p.articleId || null,
      norm_name: p.normName,
      article_number: p.articleNumber || null,
      country: p.country,
      source_url: p.sourceUrl || null,
      source_name: p.sourceName,
      excerpt: p.excerpt || null,
    })))
    .select();
  if (error) throw error;
  return data;
}

// --- Token Usage ---
export async function logTokenUsage(params: {
  userId?: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  requestType?: string;
}) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('token_usage')
    .insert({
      user_id: params.userId || null,
      provider: params.provider,
      model: params.model,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      cost_usd: params.costUsd,
      request_type: params.requestType || null,
    });
  if (error) console.error('Error logging token usage:', error);
}

// --- Estudio: Casos ---
export interface FirmCaso {
  id: string;
  firm_id: string;
  cliente: string;
  contraparte: string | null;
  materia: string | null;
  tribunal: string | null;
  rol: number | null;
  estado: 'activo' | 'pausado' | 'archivado' | 'perdido' | 'ganado';
  vencimiento: string | null;
  abogado_id: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
  abogado?: { id: string; full_name: string | null; email: string } | null;
}

export async function listFirmCasos(firmId: string): Promise<FirmCaso[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('firm_casos')
    .select(`
      *,
      abogado:abogado_id (id, full_name, email)
    `)
    .eq('firm_id', firmId)
    .order('vencimiento', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data || []).map((c: Record<string, unknown>) => ({
    ...c,
    abogado: Array.isArray(c.abogado) ? c.abogado[0] ?? null : c.abogado ?? null,
  })) as FirmCaso[];
}

export async function createFirmCaso(params: {
  firmId: string;
  cliente: string;
  contraparte?: string;
  materia?: string;
  tribunal?: string;
  rol?: number | null;
  estado?: string;
  vencimiento?: string | null;
  abogadoId?: string | null;
  notas?: string;
}): Promise<FirmCaso> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('firm_casos')
    .insert({
      firm_id: params.firmId,
      cliente: params.cliente,
      contraparte: params.contraparte || null,
      materia: params.materia || null,
      tribunal: params.tribunal || null,
      rol: params.rol ?? null,
      estado: params.estado || 'activo',
      vencimiento: params.vencimiento || null,
      abogado_id: params.abogadoId || null,
      notas: params.notas || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as FirmCaso;
}

export async function updateFirmCaso(
  casoId: string,
  firmId: string,
  updates: Partial<{
    cliente: string;
    contraparte: string | null;
    materia: string | null;
    tribunal: string | null;
    rol: number | null;
    estado: string;
    vencimiento: string | null;
    abogadoId: string | null;
    notas: string | null;
  }>
): Promise<FirmCaso> {
  const supabase = getSupabase();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.cliente !== undefined) patch.cliente = updates.cliente;
  if (updates.contraparte !== undefined) patch.contraparte = updates.contraparte;
  if (updates.materia !== undefined) patch.materia = updates.materia;
  if (updates.tribunal !== undefined) patch.tribunal = updates.tribunal;
  if (updates.rol !== undefined) patch.rol = updates.rol;
  if (updates.estado !== undefined) patch.estado = updates.estado;
  if (updates.vencimiento !== undefined) patch.vencimiento = updates.vencimiento;
  if (updates.abogadoId !== undefined) patch.abogado_id = updates.abogadoId;
  if (updates.notas !== undefined) patch.notas = updates.notas;

  const { data, error } = await supabase
    .from('firm_casos')
    .update(patch)
    .eq('id', casoId)
    .eq('firm_id', firmId)
    .select()
    .single();
  if (error) throw error;
  return data as FirmCaso;
}

export async function deleteFirmCaso(casoId: string, firmId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('firm_casos')
    .delete()
    .eq('id', casoId)
    .eq('firm_id', firmId);
  if (error) throw error;
}
