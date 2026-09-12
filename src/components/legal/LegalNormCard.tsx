'use client';

import type { LegalNorm } from '@/lib/legal/types';

const STATUS_LABEL: Record<string, string> = {
  vigente: 'VIGENTE',
  derogada: 'DEROGADA',
  modificada: 'MODIFICADA',
  unknown: 'Estado de vigencia no verificado',
};

export function LegalNormCard({ norms }: { norms: LegalNorm[] }) {
  if (!norms.length) return null;
  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-3 bg-white dark:bg-zinc-900">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Normativa aplicable</h3>
      <div className="mt-3 space-y-2">
        {norms.map((n) => (
          <div key={n.id} className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-emerald-600">{n.name}</span>
              {n.article && <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">Art. {n.article}</span>}
              {n.country && <span className="text-xs font-medium text-zinc-500">{n.country}</span>}
            </div>
            {n.text && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{n.text}</p>}
            <div className="mt-1 flex gap-2 text-xs">
              <span className={`px-1.5 py-0.5 rounded font-medium ${n.status === 'vigente' ? 'bg-emerald-100 text-emerald-700' : n.status === 'unknown' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600'}`}>
                {STATUS_LABEL[n.status ?? 'unknown']}
              </span>
              {n.relevance && <span className="text-zinc-400">Relevancia: {n.relevance}</span>}
            </div>
            {n.notes && <p className="mt-1 text-xs text-zinc-500">{n.notes}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
