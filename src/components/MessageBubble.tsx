'use client';

import React, { useState } from 'react';
import { Message } from '@/types';
import FeedbackForm from './FeedbackForm';
import { downloadPDF } from '@/lib/pdf';

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

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    try {
      const filename = `jurisnexa-${new Date().toISOString().split('T')[0]}.pdf`;
      downloadPDF(message.content, filename);
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

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
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
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-emerald-600 text-white'
            : 'border border-zinc-800 bg-zinc-900/80 text-zinc-200'
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <LegalMarkdown content={message.content} sources={message.metadata?.sources as ChatSource[] | undefined} />
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
          <SourcesBlock sources={message.metadata?.sources as { title: string; url: string | null }[] | undefined} />
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

function LegalMarkdown({ content, sources }: { content: string; sources?: ChatSource[] | undefined }) {
  // Simple markdown parser for legal responses
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inTable = false;
  let tableRows: string[][] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table detection
    if (line.includes('|') && line.trim().startsWith('|')) {
      if (line.replace(/[|\-\s]/g, '').length === 0) {
        // Separator row, skip
        continue;
      }
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      if (!inTable) inTable = true;
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      // Flush table
      elements.push(renderTable(tableRows, key++));
      tableRows = [];
      inTable = false;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={key++} className="mt-5 mb-2 text-sm font-bold text-emerald-400 uppercase tracking-wide">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key++} className="mt-6 mb-3 text-base font-bold text-white">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={key++} className="mt-6 mb-3 text-lg font-bold text-white">
          {line.slice(2)}
        </h1>
      );
    }
    // Bold lines
    else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <p key={key++} className="mt-2 text-sm font-bold text-white">
          {line.slice(2, -2)}
        </p>
      );
    }
    // Bullet points
    else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const text = line.trim().slice(2);
      elements.push(
        <li key={key++} className="ml-4 text-sm text-zinc-300 list-disc">
          <ParsedInline text={text} sources={sources} />
        </li>
      );
    }
    // Numbered items
    else if (/^\d+\.\s/.test(line.trim())) {
      const text = line.trim().replace(/^\d+\.\s/, '');
      elements.push(
        <li key={key++} className="ml-4 text-sm text-zinc-300 list-decimal">
          <ParsedInline text={text} sources={sources} />
        </li>
      );
    }
    // Warning block
    else if (line.includes('NO ENCONTRÉ UNA FUENTE') || line.includes('Advertencia') || line.includes('⚠')) {
      elements.push(
        <div key={key++} className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="text-sm text-amber-300">
            <ParsedInline text={line} sources={sources} />
          </p>
        </div>
      );
    }
    // Empty lines
    else if (line.trim() === '') {
      // Skip
    }
    // Regular text
    else {
      elements.push(
        <p key={key++} className="text-sm leading-relaxed text-zinc-300">
          <ParsedInline text={line} sources={sources} />
        </p>
      );
    }
  }

  // Flush remaining table
  if (inTable && tableRows.length > 0) {
    elements.push(renderTable(tableRows, key++));
  }

  return <>{elements}</>;
}

function ParsedInline({ text, sources }: { text: string; sources?: ChatSource[] | undefined }) {
  // Parse bold, italic, inline code and citation refs [n]
  const parts: (string | React.ReactNode)[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Inline code
    const codeMatch = remaining.match(/`(.+?)`/);
    // Citation ref [n] or [n,m]
    const refMatch = remaining.match(/\[(\d+(?:\s*,\s*\d+)*)\]/);

    let firstMatch: { type: 'bold' | 'code' | 'ref'; index: number; match: RegExpMatchArray } | null = null;

    const candidates: { type: 'bold' | 'code' | 'ref'; index: number; match: RegExpMatchArray }[] = [];
    if (boldMatch) candidates.push({ type: 'bold', index: boldMatch.index ?? 0, match: boldMatch });
    if (codeMatch) candidates.push({ type: 'code', index: codeMatch.index ?? 0, match: codeMatch });
    if (refMatch) candidates.push({ type: 'ref', index: refMatch.index ?? 0, match: refMatch });

    if (candidates.length > 0) {
      candidates.sort((a, b) => a.index - b.index);
      firstMatch = candidates[0];
    }

    if (!firstMatch) {
      parts.push(remaining);
      break;
    }

    if (firstMatch.index > 0) {
      parts.push(remaining.slice(0, firstMatch.index));
    }

    if (firstMatch.type === 'bold') {
      parts.push(<strong key={key++} className="font-semibold text-white">{firstMatch.match[1]}</strong>);
    } else if (firstMatch.type === 'ref') {
      const nums = firstMatch.match[1].split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n) && n > 0);
      parts.push(
        <span key={key++} className="inline-flex gap-1 align-super">
          {nums.map((n, i) => (
            <CitationRef key={i} n={n} sources={sources} />
          ))}
        </span>
      );
    } else {
      parts.push(
        <code key={key++} className="rounded bg-zinc-800 px-1 py-0.5 text-xs text-emerald-300">
          {firstMatch.match[1]}
        </code>
      );
    }

    remaining = remaining.slice(firstMatch.index + firstMatch.match[0].length);
  }

  return <>{parts}</>;
}

function CitationRef({ n, sources }: { n: number; sources?: ChatSource[] | undefined }) {
  const source = sources && sources[n - 1];
  const inner = <span className="text-[10px] font-bold text-emerald-400">[{n}]</span>;
  if (!source?.url) return <span className="text-[10px] font-bold text-emerald-400/70">[{n}]</span>;
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      title={source.title}
      className="no-underline hover:underline"
    >
      {inner}
    </a>
  );
}

function renderTable(rows: string[][], key: number) {
  if (rows.length === 0) return null;
  const headers = rows[0];
  const body = rows.slice(1);

  return (
    <div key={key} className="my-3 overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-emerald-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-b border-zinc-800/50 last:border-0">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-zinc-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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

function SourcesBlock({ sources }: { sources: ChatSource[] | undefined }) {
  if (!sources || sources.length === 0) return null;
  const displaySources = sources.slice(0, 8);
  return (
    <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Fuentes consultadas ({sources.length} total)</p>
      <div className="flex flex-col gap-1.5">
        {displaySources.map((src, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
            <span className="mt-px flex-shrink-0 text-[10px] font-bold text-emerald-400">[{i + 1}]</span>
            {src.url ? (
              <a href={src.url} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">{src.title}</a>
            ) : (
              <span>{src.title}</span>
            )}
          </div>
        ))}
      </div>
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