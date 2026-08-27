import { NextRequest } from 'next/server';
import { verifyChileanLaw, NoneVigencia } from '@/lib/rag/chilean-law-search';
import { searchRelevantContext } from '@/lib/rag';
import { isSupabaseConfigured } from '@/lib/db/supabase';
import { chatLimiter, rateLimitResponse } from '@/lib/rate-limit';

const VALID_COUNTRIES = ['PERU', 'CHILE', 'BOTH'] as const;
type ValidCountry = (typeof VALID_COUNTRIES)[number];

function mapPeruEstado(status?: string | null): NoneVigencia {
  if (!status) return 'DESCONOCIDA';
  const r = status.toLowerCase();
  if (r.includes('vigente')) return 'VIGENTE';
  if (r.includes('derog') || r.includes('abrog')) return 'DEROGADA';
  if (r.includes('modif')) return 'MODIFICADA';
  if (r.includes('suspend')) return 'SUSPENDIDA';
  return 'DESCONOCIDA';
}

export async function POST(request: NextRequest) {
  const { allowed, resetAt } = chatLimiter.check(request);
  if (!allowed) {
    return rateLimitResponse(resetAt);
  }

  try {
    const body = await request.json();
    const texto = typeof body.texto === 'string' ? body.texto.trim() : '';
    const countryRaw = typeof body.country === 'string' ? body.country.toUpperCase() : 'PERU';
    const country: ValidCountry = VALID_COUNTRIES.includes(countryRaw as ValidCountry)
      ? (countryRaw as ValidCountry)
      : 'PERU';

    if (!texto || texto.length < 4) {
      return Response.json({ error: 'Escribe la norma que quieres verificar, por ejemplo: "Artículo 1322 del Código Civil"' }, { status: 400 });
    }
    if (texto.length > 500) {
      return Response.json({ error: 'La consulta es demasiado larga (máximo 500 caracteres)' }, { status: 400 });
    }

    const resultados: {
      country: ValidCountry;
      encontrada: boolean;
      verificacion: NoneVigencia;
      norma?: string;
      tipo?: string;
      articulo?: string | null;
      url?: string | null;
      fragmento?: string;
      nota?: string;
    }[] = [];

    if (country === 'CHILE' || country === 'BOTH') {
      const chile = verifyChileanLaw(texto);
      resultados.push({ country: 'CHILE', ...chile });
    }

    if (country === 'PERU' || country === 'BOTH') {
      if (isSupabaseConfigured()) {
        try {
          const rag = await searchRelevantContext(texto, 'PERU', undefined, 4);
          const best = rag.chunks[0];
          if (best) {
            const url = best.source_url && best.source_url.startsWith('http') ? best.source_url : null;
            resultados.push({
              country: 'PERU',
              encontrada: true,
              verificacion: mapPeruEstado(best.status),
              norma: best.document_title,
              articulo: best.article_number || null,
              url,
              fragmento: best.chunk_text?.substring(0, 1400),
              nota: best.status ? undefined : 'La norma apareció en el RAG, pero el estado de vigencia no está registrado en la fuente indexada.',
            });
          } else {
            resultados.push({
              country: 'PERU',
              encontrada: false,
              verificacion: 'DESCONOCIDA',
              nota: 'No se encontró la norma en la base de datos jurídica indexada.',
            });
          }
        } catch (err) {
          console.warn('Peru validation search failed:', err);
          resultados.push({
            country: 'PERU',
            encontrada: false,
            verificacion: 'DESCONOCIDA',
            nota: 'No fue posible consultar la base de datos jurídica de Perú.',
          });
        }
      } else {
        resultados.push({
          country: 'PERU',
          encontrada: false,
          verificacion: 'DESCONOCIDA',
          nota: 'La base de datos jurídica no está disponible en este despliegue.',
        });
      }
    }

    return Response.json({ consulta: texto, resultados });
  } catch (error) {
    console.error('Error en /api/validar-norma:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}