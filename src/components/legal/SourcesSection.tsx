'use client';

import type { SourceItem } from '@/lib/legal/types';

const TYPE_LABEL: Record<string, string> = {
  official: 'Oficial',
  legislation: 'Legislación',
  jurisprudence: 'Jurisprudencia',
  government: 'Gobierno',
  academic: 'Académica',
  secondary: 'Secundaria',
  user_document: 'Documento usuario',
};

export function SourcesSection({ sources }: { sources: SourceItem[] }) {
  if (!sources.length) return null;
  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-3 bg-white dark:bg-zinc-900">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Fuentes · {sources.length}</h3>
      <div className="mt-3 space-y-2">
        {sources.map((s) => (
          <div key={s.id} className="flex items-start justify-between gap-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3">
            <div>
              <p className="text-sm font-medium">{s.title}</p>
              <p className="text-xs text-zinc-500">{TYPE_LABEL[s.type]}{s.authority ? ` · ${s.authority}` : ''}{s.citation ? ` · ${s.citation}` : ''}</p>
              {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">Ver fuente →</a>}
            </div>
            <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${s.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{s.verified ? 'Verificada' : 'No verificada'}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
