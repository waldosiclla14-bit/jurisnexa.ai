import { generateEmbedding } from '../embeddings';
import { searchChunksByEmbedding } from '../db/queries';
import { Country, LegalArea } from '@/types';

export interface RAGResult {
  chunks: {
    id: string;
    chunk_text: string;
    document_title: string;
    document_number: string | null;
    article_number: string | null;
    country_code: string;
    area_name: string | null;
    source_url: string | null;
    status: string;
    similarity: number;
  }[];
  contextString: string;
}

export async function searchRelevantContext(
  query: string,
  country: Country,
  legalArea?: LegalArea,
  matchCount = 8
): Promise<RAGResult> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Map Country type to country code
    const countryCode = country === 'BOTH' ? undefined : country;
    const areaSlug = legalArea || undefined;

    // Search for relevant chunks
    const chunks = await searchChunksByEmbedding(queryEmbedding, {
      countryCode,
      areaSlug,
      matchCount,
      threshold: 0.4,
    });

    // Build context string for the LLM
    const contextString = buildContextString(chunks);

    return {
      chunks: chunks || [],
      contextString,
    };
  } catch (error) {
    console.error('Error en búsqueda RAG:', error);
    return {
      chunks: [],
      contextString: '',
    };
  }
}

function buildContextString(chunks: RAGResult['chunks']): string {
  if (!chunks || chunks.length === 0) {
    return '';
  }

  const sections = chunks.map((chunk, index) => {
    const parts = [
      `[Fuente ${index + 1}] ${chunk.document_title}`,
    ];

    if (chunk.document_number) {
      parts.push(`Número: ${chunk.document_number}`);
    }
    if (chunk.article_number) {
      parts.push(`Artículo: ${chunk.article_number}`);
    }
    parts.push(`País: ${chunk.country_code}`);
    if (chunk.area_name) {
      parts.push(`Área: ${chunk.area_name}`);
    }
    parts.push(`Estado: ${chunk.status}`);
    if (chunk.source_url) {
      parts.push(`Fuente oficial: ${chunk.source_url}`);
    }
    parts.push(`Similitud: ${(chunk.similarity * 100).toFixed(1)}%`);
    parts.push('');
    parts.push(chunk.chunk_text);

    return parts.join('\n');
  });

  return `=== DOCUMENTOS JURÍDICOS RECUPERADOS ===\n\n${sections.join('\n\n---\n\n')}\n\n=== FIN DE DOCUMENTOS ===`;
}

export function shouldUseRAG(query: string): boolean {
  const legalKeywords = [
    'ley', 'decreto', 'artículo', 'norma', 'código', 'reglamento',
    'constitución', 'sentencia', 'resolución', 'tribunal', 'juzgado',
    'derecho', 'obligación', 'contrato', 'despido', 'indemnización',
    'prescripción', 'divorcio', 'pensión', 'alimentos', 'herencia',
    'multa', 'sanción', 'recurso', 'apelación', 'casación',
    'impuesto', 'renta', 'iva', 'boleta', 'factura',
    'trabajo', 'jornada', 'vacaciones', 'beneficios', 'compensación',
    'sociedad', 'empresa', 'directorio', 'estatuto', 'junta',
    'propiedad', 'posesión', 'usucapión', 'hipoteca', 'gravamen',
    'migración', 'visado', 'permiso', 'residencia', 'ciudadanía',
    'transito', 'infracción', 'licencia', 'multa', 'accidente',
    'consumidor', 'garantía', 'devolución', 'reclamo', 'defensa',
  ];

  const lowerQuery = query.toLowerCase();
  return legalKeywords.some(keyword => lowerQuery.includes(keyword));
}
