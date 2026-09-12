'use client';

import type { FactSection } from '@/lib/legal/types';

export function FactsSection({ facts }: { facts: FactSection }) {
  const hasFacts = facts.userProvided.length || facts.sourceSupported.length || facts.inferred.length || facts.disputed.length;
  if (!hasFacts) return null;
  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-3 bg-white dark:bg-zinc-900">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Hechos</h3>
      <div className="mt-3 space-y-3">
        {facts.userProvided.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-zinc-400">Según lo indicado por el usuario</h4>
            <ul className="mt-1 list-disc pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              {facts.userProvided.map((f) => <li key={f.id}>{f.text}</li>)}
            </ul>
          </div>
        )}
        {facts.sourceSupported.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-emerald-600">Hecho respaldado por fuente</h4>
            <ul className="mt-1 list-disc pl-5 space-y-1 text-sm">
              {facts.sourceSupported.map((f) => <li key={f.id}>{f.text}</li>)}
            </ul>
          </div>
        )}
        {facts.inferred.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-amber-600">Inferencia</h4>
            <ul className="mt-1 list-disc pl-5 space-y-1 text-sm">
              {facts.inferred.map((f) => <li key={f.id}>{f.text}</li>)}
            </ul>
          </div>
        )}
        {facts.disputed.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-red-600">Punto controvertido</h4>
            <ul className="mt-1 list-disc pl-5 space-y-1 text-sm">
              {facts.disputed.map((f) => <li key={f.id}>{f.text}</li>)}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
