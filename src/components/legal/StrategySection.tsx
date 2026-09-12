'use client';

import type { StrategySection as StrategyT } from '@/lib/legal/types';

export function StrategySection({ strategy }: { strategy: StrategyT }) {
  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-3 bg-white dark:bg-zinc-900">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Estrategia</h3>
      {strategy.objective && <p className="mt-2 text-sm font-medium">{strategy.objective}</p>}
      <ol className="mt-3 list-decimal pl-5 space-y-2">
        {strategy.recommendedActions.map((a) => (
          <li key={a.order} className="text-sm">
            <span className="font-medium">{a.action}</span>
            <span className="text-zinc-500"> — {a.reason}</span>
            <span className={`ml-2 text-xs px-1 py-0.5 rounded ${a.priority === 'high' ? 'bg-red-100 text-red-600' : a.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-zinc-100 text-zinc-600'}`}>{a.priority}</span>
          </li>
        ))}
      </ol>
      {strategy.evidenceToCollect && strategy.evidenceToCollect.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold text-zinc-400">Pruebas por recabar</h4>
          <ul className="mt-1 list-disc pl-5 text-sm space-y-1">
            {strategy.evidenceToCollect.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
