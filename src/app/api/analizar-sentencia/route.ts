import { NextRequest } from 'next/server';
import { createLLMProvider, getProviderInfo } from '@/lib/llm/provider';
import { searchRelevantContext, shouldUseRAG } from '@/lib/rag';
import { searchChileanLaws } from '@/lib/rag/chilean-law-search';
import { isSupabaseConfigured } from '@/lib/db/supabase';
import { chatLimiter, rateLimitResponse } from '@/lib/rate-limit';
import { Country, LegalArea } from '@/types';

const SYSTEM_PROMPT = `Eres un analista jurídico experto en sentencias y resoluciones de los sistemas judiciales de Perú y Chile.

Tu tarea es producir un ANÁLISIS ESTRUCTURADO del texto de una sentencia, resolución o fallo que el usuario pega. Usa exclusivamente ese texto; no inventes hechos, partes, roles ni fundamentos que no estén en el texto.

Estructura TODA tu respuesta en Markdown con estas secciones exactas:

### 📌 Resumen Ejecutivo
3-5 líneas con la decisión central, la materia y el resultado.

### ⚖️ Identificación del Proceso
- Tribunal / órgano (si consta)
- Rol / expediente / RIT o N° de resolución (si consta; si no, indica "no especificado")
- Fecha de la resolución (si consta)
- Materia o fuero

### 👥 Partes
- Demandante / recurrente
- Demandado / recurrido
- Rol de cada parte (si consta)

### 📄 Hechos Relevantes
Cronología de los hechos que el fallo tiene por acreditados, en viñetas.

### 🧭 Ratio Decidendi
- Decisión concreta adoptada (acoger, rechazar, fundado, parcialmente...)
- Fundamentos centrales de la decisión
- Planteamientos o argumentos que el tribunal descarta y por qué

### ⚖️ Derecho Aplicable
- Normas citadas por el tribunal (con artículo cuando conste)
- Si el texto las cita con precisión, indícalas; si no constan, dilo.
- NO inventes artículos. Si el fallo no cita una norma, escribe "no constan en el texto analizado".

### ⚠️ Riesgos y Alertas
- Plazos que podrían correr desde esta resolución (recursos, cumplimiento)
- Puntos débiles o lagunas del texto que el abogado deba revisar
- Datos faltantes o ambiguos

### 📎 Verificación
- Advertencia: el análisis se basa únicamente en el texto proporcionado; confirma siempre contra la resolución oficial y el expediente.
- Indica si alguna afirmación del fallo no puede verificarse con los datos dados.

REGLAS:
1. Trabaja SOLO con el texto recibido. Si el texto está truncado o ilegible, dilo.
2. Anonimiza datos personales sensibles que repitas (RUT/DNI completos).
3. Sé riguroso y sobrio; un abogado usará tu análisis como punto de partida, no como veredicto.`;

export async function POST(request: NextRequest) {
  const { allowed, resetAt } = chatLimiter.check(request);
  if (!allowed) {
    return rateLimitResponse(resetAt);
  }

  try {
    const body = await request.json();
    const texto = typeof body.texto === 'string' ? body.texto.trim() : '';
    const country: Country = body.country === 'CHILE' ? 'CHILE' : body.country === 'BOTH' ? 'BOTH' : 'PERU';
    const legalArea: LegalArea | undefined = body.legalArea;

    if (!texto) {
      return Response.json({ error: 'Pega el texto de la sentencia o resolución a analizar' }, { status: 400 });
    }
    if (texto.length > 20000) {
      return Response.json({ error: 'El texto es demasiado largo (máximo 20.000 caracteres). Analiza la sentencia por partes.' }, { status: 400 });
    }

    let ragContext = '';
    let sources: { title: string; url: string | null; similarity: number }[] = [];

    if (isSupabaseConfigured() && shouldUseRAG(texto)) {
      try {
        const rag = await searchRelevantContext(texto, country === 'CHILE' ? 'CHILE' : country === 'BOTH' ? 'BOTH' : 'PERU', legalArea, 6);
        ragContext = rag.contextString;
        sources = rag.chunks.map(c => ({
          title: c.article_number ? `${c.document_title} — Art. ${c.article_number}` : c.document_title,
          url: c.source_url && c.source_url.startsWith('http') ? c.source_url : null,
          similarity: c.similarity,
        }));
      } catch (err) {
        console.warn('RAG failed in sentencia analysis:', err);
      }
    }

    if (country === 'CHILE') {
      try {
        const clContext = searchChileanLaws(texto, 4);
        if (clContext) ragContext = ragContext ? ragContext + '\n\n' + clContext : clContext;
      } catch { /* ignore */ }
    }

    const contextPart = ragContext
      ? `\n\nContexto normativo recuperado para verificar las normas que el fallo pudiera citar (útil solo si coincide):\n${ragContext}\n`
      : '';

    const userMessage = `Analiza la siguiente resolución/sentencia\n${contextPart}\n--- TEXTO DE LA RESOLUCIÓN ---\n${texto}\n--- FIN DEL TEXTO ---`;

    const provider = createLLMProvider();
    const providerInfo = getProviderInfo();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const metadata = JSON.stringify({
            provider: providerInfo.provider,
            model: providerInfo.model,
            type: 'analisis-sentencia',
            country,
            legalArea: legalArea || null,
          });
          controller.enqueue(encoder.encode(`__META__${metadata}\n`));

          for await (const chunk of provider.chat([{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userMessage }], {
            maxTokens: 4096,
            temperature: 0.2,
          })) {
            controller.enqueue(encoder.encode(chunk));
          }

          if (sources.length > 0) {
            const seen = new Set<string>();
            const uniqueSources = sources.filter(s => {
              const key = `${s.title}|||${s.url}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            controller.enqueue(encoder.encode(`\n__SOURCES__${JSON.stringify({ sources: uniqueSources })}\n`));
          }

          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          controller.enqueue(encoder.encode(`\n\n__ERROR__${errorMessage}`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error en /api/analizar-sentencia:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}