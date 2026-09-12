'use client';

import type { ConclusionSection as ConclusionT } from '@/lib/legal/types';

export function ConclusionSection({ conclusion }: { conclusion: ConclusionT }) {
  return (
    <section className="rounded-xl border border-emerald-200 dark:border-emerald-800 p-4 mb-3 bg-emerald-50/50 dark:bg-emerald-950/20">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Conclusión</h3>
      <p className="mt-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">{conclusion.answer}</p>
      {conclusion.keyPoints.length > 0 && (
        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
          {conclusion.keyPoints.map((k, i) => <li key={i}>{k}</li>)}
        </ul>
      )}
      {conclusion.limitations.length > 0 && (
        <div className="mt-3 rounded bg-amber-50 dark:bg-amber-950/20 p-2">
          <h4 className="text-xs font-semibold text-amber-700">Limitaciones</h4>
          <ul className="mt-1 list-disc pl-5 text-xs space-y-1">
            {conclusion.limitations.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
