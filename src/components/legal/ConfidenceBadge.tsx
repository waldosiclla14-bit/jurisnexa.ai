'use client';

import type { ConfidenceInfo } from '@/lib/legal/types';

const LEVEL_STYLE: Record<string, string> = {
  high: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-zinc-100 text-zinc-600',
};

export function ConfidenceBadge({ confidence }: { confidence: ConfidenceInfo }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 mb-3">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${LEVEL_STYLE[confidence.level]}`}>Confianza {confidence.level.toUpperCase()}</span>
      </div>
      <ul className="mt-2 list-disc pl-5 text-xs space-y-1 text-zinc-600 dark:text-zinc-400">
        {confidence.reasons.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
      {confidence.missingEvidence && confidence.missingEvidence.length > 0 && (
        <p className="mt-2 text-xs text-amber-600">Falta: {confidence.missingEvidence.join('; ')}</p>
      )}
    </div>
  );
}
