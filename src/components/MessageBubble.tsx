'use client';

import React, { useState, useMemo } from 'react';
import { Message } from '@/types';
import FeedbackForm from './FeedbackForm';
import { downloadPDF } from '@/lib/pdf';
import { ensureLegalStructure } from '@/lib/format/response-formatter';
import { parseMarkdownToStructure } from '@/lib/response/parser';
import { LegalResponse } from './legal/LegalResponse';
import { LegalMarkdownRenderer } from './LegalMarkdownRenderer';
import { StructuredLegalResponse } from './legal/StructuredLegalResponse';
import type { LegalResponse as LegalResponseType } from '@/lib/legal/types';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isDocumentDraft = !isUser && (
    message.content.includes('SEÑOR JUEZ') ||
    message.content.includes('SEÑOR/SEÑORA JUEZ') ||
    message.content.includes('FUENTES CONSULTADAS') ||
    message.content.includes('FUNDAMENTOS DE DERECHO')
  );

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const filename = `jurisnexa-${new Date().toISOString().split('T')[0]}.pdf`;
      await downloadPDF(message.content, filename);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const title = extractTitle(message.content);
      const res = await fetch('/api/documents/saved-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          documentType: message.metadata?.documentType || 'documento-legal',
          country: message.country || 'PERU',
          legalArea: message.legalArea || null,
          content: message.content,
          metadata: message.metadata || {},
        }),
      });
      const data = await res.json();
      if (data.draft || res.status === 503) {
        // Saved to Supabase or fallback to localStorage
        if (res.status === 503) {
          saveToLocalDrafts({
            id: crypto.randomUUID(),
            title,
            document_type: message.metadata?.documentType || 'documento-legal',
            country: message.country || 'PERU',
            legal_area: message.legalArea || null,
            content: message.content,
            created_at: new Date().toISOString(),
          });
        }
        setIsSaved(true);
      }
    } catch {
      // Fallback to localStorage
      saveToLocalDrafts({
        id: crypto.randomUUID(),
        title: extractTitle(message.content),
        document_type: message.metadata?.documentType || 'documento-legal',
        country: message.country || 'PERU',
        legal_area: message.legalArea || null,
        content: message.content,
        created_at: new Date().toISOString(),
      });
      setIsSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  const structuredResponse: LegalResponseType | undefined = (message.metadata?.structuredResponse as LegalResponseType | undefined) ?? undefined;

  const parsedData = useMemo(() => {
    try {
      return parseMarkdownToStructure(ensureLegalStructure(message.content), message.isStreaming ?? false);
    } catch {
      return null;
    }
  }, [message.content, message.isStreaming]);

    return (
    <div role="article" aria-label={isUser ? 'Tu mensaje' : 'Respuesta de JurisNexa'} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/30">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
      )}

      <div
        className={`rounded-2xl px-3.5 py-3.5 sm:px-5 sm:py-4 ${
          isUser
            ? 'max-w-[88%] sm:max-w-[75%] bg-emerald-600 text-white'
            : 'max-w-[96%] sm:max-w-[88%] border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-sm'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-[14px] leading-[1.65] sm:text-[15px]">{message.content}</p>
        ) : (
          <div className="max-w-none">
            {structuredResponse ? (
              <StructuredLegalResponse response={structuredResponse} />
            ) : parsedData && !isDocumentDraft ? (
              <LegalResponse data={parsedData} />
            ) : (
              <LegalMarkdownRenderer content={message.content} />
            )}
          </div>
        )}

        <div className={`mt-2 flex items-center gap-2 text-[10px] ${isUser ? 'text-emerald-200/60' : 'text-zinc-600'}`}>
          <span>{formatTime(message.timestamp)}</span>
          {message.country && (
            <>
              <span>·</span>
              <span>{message.country === 'PERU' ? '🇵🇪 Perú' : message.country === 'CHILE' ? '🇨🇱 Chile' : '🌎 Perú/Chile'}</span>
            </>
          )}
          {message.legalArea && (
            <>
              <span>·</span>
              <span className="capitalize">{message.legalArea}</span>
            </>
          )}
        </div>

        {!isUser && !message.isStreaming && (
          <SourcesBlock sources={message.metadata?.sources as { title: string; url: string | null }[] | undefined} confidenceScore={message.metadata?.confidenceScore as number | undefined} confidenceLevel={message.metadata?.confidenceLevel as string | undefined} ragUsed={message.metadata?.ragUsed as boolean | undefined} />
        )}

        {!isUser && !message.isStreaming && (
          <div className="mt-3 flex items-center gap-2">
            <FeedbackForm messageId={message.id} />
            {isDocumentDraft && (
              <>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[11px] text-zinc-400 transition-all hover:border-emerald-500/40 hover:text-emerald-400 disabled:opacity-50"
                >
                  {isDownloading ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  )}
                  Descargar PDF
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={isSaving || isSaved}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[11px] text-zinc-400 transition-all hover:border-emerald-500/40 hover:text-emerald-400 disabled:opacity-50"
                >
                  {isSaving ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  ) : isSaved ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                  )}
                  {isSaved ? 'Guardado' : 'Guardar borrador'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-800 ring-1 ring-zinc-700">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      )}
    </div>
  );
}

interface ChatSource {
  id?: string;
  title: string;
  url: string | null;
  similarity?: number;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function extractTitle(content: string): string {
  const lines = content.split('\n').filter(l => l.trim());
  for (const line of lines) {
    const cleaned = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
    if (cleaned.length > 5 && cleaned.length < 120) return cleaned;
  }
  return content.substring(0, 80).replace(/\n/g, ' ').trim();
}

function SourcesBlock({ sources, confidenceScore, confidenceLevel, ragUsed }: { sources?: ChatSource[] | undefined; confidenceScore?: number; confidenceLevel?: string; ragUsed?: boolean }) {
  if (!sources || sources.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Sin fuentes verificadas</p>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Conocimiento general
          </span>
          {confidenceLevel && (
            <span className="text-[11px] text-zinc-500">Confianza: {confidenceLevel} ({confidenceScore}/99)</span>
          )}
        </div>
        <p className="mt-2 text-[12px] leading-[1.5] text-zinc-400">Esta respuesta se basa en conocimiento general sobre legislación, no en fuentes documentales verificadas. Para mayor precisión, sube un documento o consulta directamente con un abogado.</p>
      </div>
    );
  }
  const displaySources = sources.slice(0, 8);
  const trust = (confidenceScore ?? 50);
  const trustColor = trust >= 70 ? 'emerald' : trust >= 40 ? 'amber' : 'red';
  const trustLabel = trust >= 70 ? 'ALTA' : trust >= 40 ? 'MEDIA' : 'BAJA';
  return (
    <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Fuentes verificadas · {sources.length}</p>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold leading-none text-${trustColor}-400`} style={{ backgroundColor: `rgba(16,185,129,0.1)` }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
          {trustLabel} confianza ({trust}/99)
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {displaySources.map((src, i) => (
          <div key={i} className="flex items-start gap-2.5 text-[13px] leading-[1.5] text-zinc-400 sm:text-sm">
            <span className="mt-0.5 flex-shrink-0 rounded bg-zinc-800 px-1 py-0.5 text-[10px] font-bold leading-none text-emerald-400">[{i + 1}]</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0 text-emerald-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            {src.url ? (
              <a href={src.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-emerald-400 hover:underline">{src.title}</a>
            ) : (
              <span>{src.title}</span>
            )}
          </div>
        ))}
      </div>
      {ragUsed !== false && (
        <p className="mt-2.5 text-[10px] text-zinc-500">Fuentes consultadas en tiempo real · Respuesta trazable y verificable</p>
      )}
    </div>
  );
}

function saveToLocalDrafts(draft: {
  id: string;
  title: string;
  document_type: string;
  country: string;
  legal_area: string | null;
  content: string;
  created_at: string;
}) {
  const STORAGE_KEY = 'jurisnexa-saved-drafts';
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.unshift(draft);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([draft]));
  }
}