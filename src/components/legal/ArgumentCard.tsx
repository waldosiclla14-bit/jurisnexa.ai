'use client';

import type { ArgumentItem } from '@/lib/legal/types';

export function ArgumentCard({ title, items }: { title: string; items: ArgumentItem[] }) {
  if (!items.length) return null;
  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-3 bg-white dark:bg-zinc-900">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      <div className="mt-3 space-y-3">
        {items.map((a) => (
          <div key={a.id} className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{a.title}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${a.strength === 'strong' ? 'bg-emerald-100 text-emerald-700' : a.strength === 'moderate' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-200 text-zinc-600'}`}>{a.strength}</span>
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{a.argument}</p>
            {a.vulnerabilities && a.vulnerabilities.length > 0 && (
              <p className="mt-1 text-xs text-amber-600">Vulnerabilidad: {a.vulnerabilities.join('; ')}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
