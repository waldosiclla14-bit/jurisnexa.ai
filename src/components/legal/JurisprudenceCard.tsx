'use client';

import type { JurisprudenceItem } from '@/lib/legal/types';

export function JurisprudenceCard({ items }: { items: JurisprudenceItem[] }) {
  if (!items.length) return null;
  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-3 bg-white dark:bg-zinc-900">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Jurisprudencia</h3>
      <div className="mt-3 space-y-3">
        {items.map((j) => (
          <div key={j.id} className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{j.court}</span>
              {j.caseNumber && <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{j.caseNumber}</span>}
              <span className={`text-xs px-1.5 py-0.5 rounded ${j.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{j.verified ? 'Verificada' : 'No verificada'}</span>
            </div>
            {j.holding && <p className="mt-1 text-sm font-medium">{j.holding}</p>}
            {j.legalRule && <p className="mt-1 text-sm text-zinc-600">Regla: {j.legalRule}</p>}
            {j.applicationToCase && <p className="mt-1 text-sm text-zinc-600">Aplicación: {j.applicationToCase}</p>}
            {j.date && <p className="text-xs text-zinc-400">{j.date}{j.country ? ` · ${j.country}` : ''}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
