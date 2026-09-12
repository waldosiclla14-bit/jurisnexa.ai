'use client';

import type { RiskItem } from '@/lib/legal/types';

const LEVEL_STYLE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

export function RiskCard({ risks }: { risks: RiskItem[] }) {
  if (!risks.length) return null;
  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-3 bg-white dark:bg-zinc-900">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Riesgos</h3>
      <div className="mt-3 space-y-2">
        {risks.map((r) => (
          <div key={r.id} className={`rounded-lg border p-3 ${LEVEL_STYLE[r.level] ?? LEVEL_STYLE.medium}`}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase">{r.level}</span>
              <span className="text-sm font-semibold">{r.title}</span>
            </div>
            <p className="mt-1 text-sm">{r.description}</p>
            <p className="mt-1 text-xs opacity-80">Motivo: {r.reason}</p>
            {r.mitigation && <p className="mt-1 text-xs font-medium">Mitigación: {r.mitigation}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
