import { NextRequest } from 'next/server';
import { createLLMProvider, getProviderInfo } from '@/lib/llm/provider';
import { getSystemPromptWithRAG } from '@/lib/prompts/system';
import { searchRelevantContext, shouldUseRAG } from '@/lib/rag';
import { isSupabaseConfigured, getSupabase } from '@/lib/db/supabase';
import { searchChileanLawsWithSources } from '@/lib/rag/chilean-law-search';
import { chatLimiter, rateLimitResponse } from '@/lib/rate-limit';
import { createConversation, insertMessage, updateConversation } from '@/lib/db/queries';
import { ChatRequest, Country, LegalArea, UserType } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import { analyzeLegalCase } from '@/lib/engines';
import { getSystemPromptWithLegalEngine } from '@/lib/prompts/legal-diagnosis';

async function resolveTipoUsuario(
  request: NextRequest,
  bodyTipo?: UserType
): Promise<UserType> {
  if (isSupabaseConfigured()) {
    try {
      const currentUser = await getCurrentUser(request.headers.get('cookie'));
      if (currentUser?.tipo_usuario === 'abogado' || currentUser?.tipo_usuario === 'cliente') {
        return currentUser.tipo_usuario;
      }
    } catch {
      // Sin sesión válida o error: usar fallback
    }
    return 'cliente';
  }
  return bodyTipo === 'abogado' ? 'abogado' : 'cliente';
}

export async function POST(request: NextRequest) {
  const { allowed, resetAt } = chatLimiter.check(request);
  if (!allowed) {
    return rateLimitResponse(resetAt);
  }

  try {
    const body: ChatRequest = await request.json();

    if (!body.message || body.message.trim().length === 0) {
      return Response.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 });
    }

    if (body.message.length > 5000) {
      return Response.json({ error: 'El mensaje es demasiado largo (máximo 5000 caracteres)' }, { status: 400 });
    }

    // Sanitize input: strip potential prompt injection patterns
    const sanitizedMessage = body.message
      .replace(/ignore (all |any )?(previous|prior|above) instructions/gi, '')
      .replace(/system prompt/gi, '')
      .replace(/<\|im_start\|>/gi, '')
      .replace(/<\|im_end\|>/gi, '')
      .trim();

    const country: Country = body.country || 'PERU';
    const legalArea: LegalArea | undefined = body.legalArea;
    const tipoUsuario = await resolveTipoUsuario(request, body.tipoUsuario);

    // RAG: search for relevant legal context if DB is configured
    let ragContext = '';
    let ragSources: { id: string; title: string; url: string | null; similarity: number }[] = [];

    if (isSupabaseConfigured() && shouldUseRAG(sanitizedMessage)) {
      try {
        const ragResult = await searchRelevantContext(sanitizedMessage, country, legalArea);
        ragContext = ragResult.contextString;
        ragSources = ragResult.chunks.map(c => {
          const title = c.article_number
            ? `${c.document_title} — Art. ${c.article_number}`
            : c.document_title;
          const url = (c.source_url && c.source_url.startsWith('http'))
            ? c.source_url
            : null;
          const id = c.article_number
            ? `${c.document_title}:${c.article_number}`
            : c.id || `${c.document_title}:general`;
          return { id, title, url, similarity: c.similarity };
        });
      } catch (ragError) {
        console.warn('RAG search failed, proceeding without context:', ragError);
      }
    }

    // Chilean law file-based search (works without Supabase, ONLY for Chile)
    if (country === 'CHILE' && shouldUseRAG(sanitizedMessage)) {
      try {
        const chileanResult = searchChileanLawsWithSources(sanitizedMessage, 8);
        if (chileanResult.contextString) {
          ragContext = ragContext ? ragContext + '\n\n' + chileanResult.contextString : chileanResult.contextString;
          ragSources = [...ragSources, ...chileanResult.sources];
        }
      } catch (clErr) {
        console.warn('Chilean law search failed:', clErr);
      }
    }

    // Conversation persistence (only when DB is configured)
    let conversationId = body.conversationId;
    if (isSupabaseConfigured()) {
      try {
        if (!conversationId) {
          // Create new conversation from first message
          const title = sanitizedMessage.length > 60
            ? sanitizedMessage.substring(0, 60) + '...'
            : sanitizedMessage;
          const conv = await createConversation({
            title,
            country,
            legalArea,
          });
          conversationId = conv.id;
        }

        // Save user message
        if (conversationId) {
          await insertMessage({
            conversationId,
            role: 'user',
            content: sanitizedMessage,
            country,
            legalArea,
          });
        }
      } catch (dbError) {
        console.warn('Conversation persistence failed:', dbError);
      }
    }

    // Fetch uploaded document content if documentId provided
    let documentContext = '';
    if (body.documentId && isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        const { data: doc } = await supabase
          .from('documents_uploaded')
          .select('original_text, filename')
          .eq('id', body.documentId)
          .single();
        if (doc?.original_text) {
          documentContext = `\n\n--- CONTEXTO DEL DOCUMENTO SUBIDO: ${doc.filename} ---\n${doc.original_text.substring(0, 8000)}\n--- FIN DEL DOCUMENTO ---\n`;
        }
      } catch (docErr) {
        console.warn('Could not fetch uploaded document:', docErr);
      }
    }

    // Motor avanzado de análisis jurídico (Chile): análisis estructurado sobre el corpus local
    const legalAnalysis = country === 'CHILE'
      ? analyzeLegalCase({
          message: sanitizedMessage,
          country,
          legalArea,
          tipoUsuario,
          history: body.history,
          documentText: documentContext || undefined,
          mode: tipoUsuario === 'abogado' ? 'abogado' : 'cliente',
        })
      : null;

    let systemPrompt: string;
    if (legalAnalysis) {
      systemPrompt = getSystemPromptWithLegalEngine(country, legalArea, ragContext + documentContext, legalAnalysis);
      ragSources = dedupeSources([
        ...ragSources,
        ...legalAnalysis.sources.map(s => ({
          id: `${s.identifier}:${s.articleNumber}`,
          title: `${s.title} — Art. ${s.articleNumber}`,
          url: s.url,
          similarity: 1,
        })),
      ]);
    } else {
      systemPrompt = getSystemPromptWithRAG(country, legalArea, ragContext + documentContext, tipoUsuario);
    }

    // Lista numerada de fuentes para citas inline [n] en la respuesta
    const sourceIndex = buildSourceIndex(ragSources);
    if (sourceIndex) {
      systemPrompt += `\n\n=== FUENTES NUMERADAS DISPONIBLES ===\n${sourceIndex}\n=== FIN DE FUENTES ===\n\nIMPORTANTE: cuando cites una norma de estas fuentes, agrega el número entre corchetes [n] justo después de la mención (ej.: "según el Código Penal [1]"). Cada afirmación con fuente debe llevar su [n] correspondiente.`;
    }

    const provider = createLLMProvider();
    const providerInfo = getProviderInfo();

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (body.history && body.history.length > 0) {
      const recentHistory = body.history.slice(-10);
      for (const msg of recentHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: sanitizedMessage });

    let assistantContent = '';

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          const metadata = JSON.stringify({
            provider: providerInfo.provider,
            model: providerInfo.model,
            country,
            legalArea,
            ragUsed: ragSources.length > 0,
            ragSourceCount: ragSources.length,
            conversationId: conversationId || null,
            confidenceScore: legalAnalysis?.confidence.score ?? null,
            confidenceLevel: legalAnalysis?.confidence.level ?? null,
            detectedFigure: legalAnalysis?.qualification.figureLabel ?? null,
            engineMode: legalAnalysis?.mode ?? null,
          });
          controller.enqueue(encoder.encode(`__META__${metadata}\n`));

          for await (const chunk of provider.chat(messages, {
            maxTokens: 4096,
            temperature: 0.3,
            fileData: body.fileData,
          })) {
            assistantContent += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          // Save assistant message and update conversation count
          if (isSupabaseConfigured() && conversationId) {
            try {
              await insertMessage({
                conversationId,
                role: 'assistant',
                content: assistantContent,
                country,
                legalArea,
              });
              // Increment message count directly instead of re-fetching all messages
              await updateConversation(conversationId, {
                message_count: assistantContent.length > 0 ? 1 : 0,
              } as never);
            } catch (saveError) {
              console.warn('Failed to save assistant message:', saveError);
            }
          }

          if (ragSources.length > 0) {
            const seen = new Set<string>();
            const uniqueSources = ragSources.filter(s => {
              const key = s.id || `${s.title}|||${s.url}`;
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
    console.error('Error en /api/chat:', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return Response.json({ error: message }, { status: 500 });
  }
}

function dedupeSources(sources: { id: string; title: string; url: string | null; similarity: number }[]) {
  const seen = new Set<string>();
  return sources.filter(s => {
    const key = s.id || `${s.title}|||${s.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildSourceIndex(sources: { id: string; title: string; url: string | null }[]): string {
  const seen = new Set<string>();
  const lines: string[] = [];
  sources.forEach(s => {
    const key = s.id || `${s.title}|||${s.url}`;
    if (seen.has(key)) return;
    seen.add(key);
    lines.push(`[${lines.length + 1}] ${s.title}${s.url ? ` — ${s.url}` : ''}`);
  });
  return lines.join('\n');
}
