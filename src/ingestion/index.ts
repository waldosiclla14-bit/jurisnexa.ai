import { chunkLegalDocument, generateEmbeddings, computeContentHash } from '@/lib/embeddings';
import { getSupabase, isSupabaseConfigured } from '@/lib/db/supabase';
import { getCountryByCode, getLegalAreaBySlug, insertChunks } from '@/lib/db/queries';
import { Country } from '@/types';

export interface IngestionResult {
  success: boolean;
  chunksCreated: number;
  documentId?: string;
  error?: string;
}

export interface ParsedDocument {
  title: string;
  content: string;
  documentType: string;
  documentNumber?: string;
  country: string;
  legalArea?: string;
  effectiveDate?: string;
  sourceUrl?: string;
  sourceName?: string;
}

// ============================================================
// Main ingestion function
// ============================================================
export async function ingestDocument(doc: ParsedDocument): Promise<IngestionResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      chunksCreated: 0,
      error: 'Base de datos no configurada. Configura SUPABASE_URL y SUPABASE_ANON_KEY.',
    };
  }

  try {
    const supabase = getSupabase();

    // 1. Get or create country
    const country = await getCountryByCode(doc.country);
    if (!country) {
      return { success: false, chunksCreated: 0, error: `País no encontrado: ${doc.country}` };
    }

    // 2. Get legal area if provided
    let areaId: string | undefined;
    if (doc.legalArea) {
      const area = await getLegalAreaBySlug(doc.legalArea);
      areaId = area?.id;
    }

    // 3. Compute content hash for deduplication
    const contentHash = computeContentHash(doc.content);

    // 4. Check if document already exists with same hash
    const { data: existing } = await supabase
      .from('legal_documents')
      .select('id')
      .eq('content_hash', contentHash)
      .single();

    if (existing) {
      return {
        success: true,
        chunksCreated: 0,
        documentId: existing.id,
        error: 'Documento ya existe (hash duplicado)',
      };
    }

    // 5. Insert legal document
    const insertData: Record<string, unknown> = {
      country_id: country.id,
      title: doc.title,
      document_type: doc.documentType,
      status: 'VIGENTE',
      content_hash: contentHash,
      last_verified: new Date().toISOString(),
    };
    if (areaId) insertData.legal_area_id = areaId;
    if (doc.documentNumber) insertData.document_number = doc.documentNumber;
    if (doc.effectiveDate) {
      insertData.publication_date = doc.effectiveDate;
      insertData.effective_date = doc.effectiveDate;
    }
    if (doc.sourceUrl) insertData.source_url = doc.sourceUrl;

    const { data: document, error: docError } = await supabase
      .from('legal_documents')
      .insert(insertData)
      .select()
      .single();

    if (docError) throw docError;

    // 6. Parse and chunk the document
    const chunks = chunkLegalDocument(doc.content);

    if (chunks.length === 0) {
      return {
        success: true,
        chunksCreated: 0,
        documentId: document.id,
      };
    }

    // 7. Generate embeddings for all chunks
    const textsToEmbed = chunks.map((c: { content: string }) => c.content);
    const embeddings = await generateEmbeddings(textsToEmbed);

    // 8. Insert chunks with embeddings
    const chunkRecords = chunks.map((chunk: { content: string; section: string }, index: number) => ({
      document_id: document.id,
      country_id: country.id,
      ...(areaId ? { legal_area_id: areaId } : {}),
      chunk_text: chunk.content,
      chunk_index: index,
      metadata: {
        section: chunk.section,
        documentTitle: doc.title,
        documentNumber: doc.documentNumber,
      },
      embedding: embeddings[index],
      content_hash: computeContentHash(chunk.content),
    }));

    await insertChunks(chunkRecords);

    return {
      success: true,
      chunksCreated: chunks.length,
      documentId: document.id,
    };
  } catch (error) {
    console.error('Error en ingestion:', error);
    return {
      success: false,
      chunksCreated: 0,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// ============================================================
// PDF text extraction (basic - for server-side)
// ============================================================
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for pdf-parse
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extrayendo texto del PDF:', error);
    throw new Error('No se pudo extraer el texto del PDF');
  }
}

// ============================================================
// Text cleaning
// ============================================================
export function cleanLegalText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove page numbers
    .replace(/Pág(?:ina)?\.?\s*\d+/gi, '')
    // Remove headers/footers common in legal docs
    .replace(/^.*?EL PERUANO.*$/gm, '')
    .replace(/^.*?DIARIO OFICIAL.*$/gm, '')
    // Clean up common OCR artifacts
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    // Normalize quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Trim
    .trim();
}
