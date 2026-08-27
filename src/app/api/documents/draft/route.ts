import { NextRequest } from 'next/server';
import { createLLMProvider } from '@/lib/llm/provider';
import { getDocumentTypePrompt, DocumentType, DOCUMENT_TYPES } from '@/lib/prompts/drafting';
import { searchRelevantContext, shouldUseRAG } from '@/lib/rag';
import { isSupabaseConfigured } from '@/lib/db/supabase';
import { chatLimiter, rateLimitResponse } from '@/lib/rate-limit';
import { Country, LegalArea } from '@/types';

export async function GET() {
  return Response.json({ documentTypes: DOCUMENT_TYPES });
}

export async function POST(request: NextRequest) {
  const { allowed, resetAt } = chatLimiter.check(request);
  if (!allowed) {
    return rateLimitResponse(resetAt);
  }

  try {
    const body = await request.json();
    const { documentType, country, legalArea, facts, parties } = body as {
      documentType: DocumentType;
      country: Country;
      legalArea?: LegalArea;
      facts: string;
      parties?: {
        demandante?: { nombre: string; dni: string; domicilio: string };
        demandado?: { nombre: string; dni: string; domicilio: string };
      };
    };

    if (!documentType || !facts || facts.trim().length === 0) {
      return Response.json(
        { error: 'Se requiere tipo de documento y hechos del caso' },
        { status: 400 }
      );
    }

    const config = DOCUMENT_TYPES.find(d => d.id === documentType);
    if (!config) {
      return Response.json({ error: 'Tipo de documento no válido' }, { status: 400 });
    }

    let ragContext = '';
    if (isSupabaseConfigured() && shouldUseRAG(facts)) {
      try {
        const ragResult = await searchRelevantContext(facts, country, legalArea || config.area);
        ragContext = ragResult.contextString;
      } catch (ragError) {
        console.warn('RAG search failed for drafting:', ragError);
      }
    }

    const systemPrompt = getDocumentTypePrompt(documentType, country, ragContext);

    let userMessage = `SOLICITUD DE REDACCIÓN DE DOCUMENTO JURÍDICO:

Tipo de documento: ${config.label}
País: ${country === 'PERU' ? 'Perú' : 'Chile'}
Área jurídica: ${config.area}

HECHOS DEL CASO:
${facts}`;

    if (parties?.demandante) {
      userMessage += `\n\nDEMANDANTE/RECLAMANTE:
- Nombre: ${parties.demandante.nombre}
- DNI/RUT: ${parties.demandante.dni}
- Domicilio: ${parties.demandante.domicilio}`;
    }

    if (parties?.demandado) {
      userMessage += `\n\nDEMANDADO/RECLAMADO:
- Nombre: ${parties.demandado.nombre}
- DNI/RUT: ${parties.demandado.dni}
- Domicilio: ${parties.demandado.domicilio}`;
    }

    userMessage += `\n\nGenera el documento jurídico completo con todas las secciones requeridas, citando la normativa aplicable con formato verificable.`;

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
          const metadata = JSON.stringify({
            type: 'document-draft',
            documentType,
            country,
            area: config.area,
          });
          controller.enqueue(encoder.encode(`__META__${metadata}\n`));

          for await (const chunk of provider.chat(messages, {
            maxTokens: 8192,
            temperature: 0.2,
          })) {
            fullContent += chunk;
            controller.enqueue(encoder.encode(chunk));
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
    console.error('Error en /api/documents/draft:', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return Response.json({ error: message }, { status: 500 });
  }
}
