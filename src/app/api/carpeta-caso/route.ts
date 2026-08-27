import { NextRequest } from 'next/server';
import { createLLMProvider } from '@/lib/llm/provider';
import { searchRelevantContext, shouldUseRAG } from '@/lib/rag';
import { isSupabaseConfigured } from '@/lib/db/supabase';
import { searchChileanLawsWithSources } from '@/lib/rag/chilean-law-search';
import { chatLimiter, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const { allowed, resetAt } = chatLimiter.check(request);
  if (!allowed) {
    return rateLimitResponse(resetAt);
  }

  try {
    const body = await request.json();
    const { facts, documents, matter } = body as {
      facts: string;
      documents?: string[];
      matter?: string;
    };

    if (!facts || facts.trim().length === 0) {
      return Response.json(
        { error: 'Se requieren los hechos del caso para generar la carpeta' },
        { status: 400 }
      );
    }

    let ragContext = '';
    let ragSources: { title: string; url: string | null; similarity: number }[] = [];

    if (isSupabaseConfigured() && shouldUseRAG(facts)) {
      try {
        const ragResult = await searchRelevantContext(facts, 'CHILE');
        ragContext = ragResult.contextString;
        ragSources = ragResult.chunks.map(c => {
          const title = c.article_number
            ? `${c.document_title} — Art. ${c.article_number}`
            : c.document_title;
          const url = (c.source_url && c.source_url.startsWith('http'))
            ? c.source_url
            : null;
          return { title, url, similarity: c.similarity };
        });
      } catch (ragError) {
        console.warn('RAG search failed for case analysis:', ragError);
      }
    }

    // Also search local Chilean law files for additional context
    if (shouldUseRAG(facts)) {
      try {
        const chileanResult = searchChileanLawsWithSources(facts, 8);
        if (chileanResult.contextString) {
          ragContext = ragContext ? ragContext + '\n\n' + chileanResult.contextString : chileanResult.contextString;
          ragSources = [...ragSources, ...chileanResult.sources];
        }
      } catch (clErr) {
        console.warn('Chilean law search failed:', clErr);
      }
    }

    const systemPrompt = `ERES: "LEXCHILE-CARPETA" - Un asistente jurídico chileno experto dual.
Tu misión es transformar el relato del cliente en una CARPETA DE CASO pre-armada, útil, válida y lista para que un abogado chileno actúe en la Oficina Judicial Virtual (OJV).

JURISDICCIÓN EXCLUSIVA: Chile.
FUENTES: BCN LeyChile.cl (260k normas), Buscador PJUD (1.5M sentencias).
NUNCA cites leyes extranjeras.

REGLAS ANTI-ALUCINACIÓN:
1. Si no estás 100% seguro del artículo: "Verificar vigencia en Ley Chile BCN".
2. Nunca inventes Roles. Usa "Rol N° XXX-AAAA" solo si viene del Buscador PJUD.
3. Anonimiza RUTs: 12.345.678-9 -> XX.XXX.XXX-9 (Ley 19.628).
4. Español chileno formal. UF, UTM, CLP, Juzgado, OJV, Clave Única.

DISCLAIMER OBLIGATORIO: "Este informe es informativo y pre-armado por IA. No constituye patrocinio legal y debe ser validado por abogado habilitado con firma electrónica avanzada para ingreso en OJV según Acta 37-2016 y 71-2016 Corte Suprema."

Genera SIEMPRE este JSON estructurado:

{
  "id_caso": "UUID gener",
  "materia": "laboral | civil | familia | penal | administrativo",
  "tribunal_competente": "Nombre exacto del juzgado",
  "viabilidad_preliminar": {"score": 0-100, "fundamento": "Basado en jurisprudencia PJUD..."},
  "relato_cronologico": [{"fecha": "YYYY-MM-DD", "hecho": "...", "prueba_asociada": "..."}],
  "hechos_controvertidos": ["..."],
  "normativa_aplicable": [{"ley": "...", "articulo": "Art XXX", "texto_vigente_bcn": "...", "url_leychile": "https://www.leychile.cl/..."}],
  "jurisprudencia_relevante": [{"rol": "Rol N° XXX-AAAA", "resumen": "...", "a_favor": true, "url": "pjud.cl"}],
  "checklist_prueba": {"presente": [...], "faltante_critico": [...]},
  "riesgos_y_alertas": ["..."],
  "borrador_escrito_ojv": {"tipo": "...", "formato": "Compatible OJV - PDF/A con firma Clave Única", "cuerpo": "Texto completo de la demanda..."},
  "proximos_pasos_abogado": ["1. ...", "2. ..."],
  "estimacion_monetaria": {"rango": "$X - $Y CLP", "base_calculo": "Art XXX CT..."}
}

${ragContext ? `\n\nCONTEXTO DOCUMENTAL RECUPERADO:\n${ragContext}` : ''}`;

    const userMessage = `CASO PARA ANÁLISIS:

HECHOS DEL CASO:
${facts}

${documents && documents.length > 0 ? `DOCUMENTOS ADJUNTOS:\n${documents.join('\n')}` : ''}

${matter ? `MATERIA DECLARADA: ${matter}` : ''}

Genera la CARPETA DE CASO COMPLETA con JSON estructurado. Incluye fundamentación normativa con Art. exactos de Código + URLs de Ley Chile BCN when available.`;

    const provider = createLLMProvider();
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage },
    ];

    let fullContent = '';

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          controller.enqueue(encoder.encode('__META__{"type":"carpeta-caso","country":"CHILE"}\n'));

          for await (const chunk of provider.chat(messages, {
            maxTokens: 8192,
            temperature: 0.1,
          })) {
            fullContent += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          if (ragSources.length > 0) {
            const seen = new Set<string>();
            const uniqueSources = ragSources.filter(s => {
              const key = `${s.title}|||${s.url}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            const sourcesData = JSON.stringify({ sources: uniqueSources });
            controller.enqueue(encoder.encode(`\n__SOURCES__${sourcesData}\n`));
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
    console.error('Error en /api/carpeta-caso:', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return Response.json({ error: message }, { status: 500 });
  }
}
