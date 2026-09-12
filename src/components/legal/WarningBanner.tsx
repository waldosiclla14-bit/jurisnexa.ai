'use client';

import type { WarningItem } from '@/lib/legal/types';

const SEVERITY_STYLE: Record<string, string> = {
  info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300',
  warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300',
  critical: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300',
};

export function WarningBanner({ warnings }: { warnings: WarningItem[] }) {
  if (!warnings.length) return null;
  return (
    <div className="space-y-2 mb-3">
      {warnings.map((w, i) => (
        <div key={i} className={`rounded-lg border p-3 text-sm ${SEVERITY_STYLE[w.severity] ?? SEVERITY_STYLE.warning}`}>
          <span className="font-semibold">{w.type.replaceAll('_', ' ')}: </span>{w.message}
        </div>
      ))}
    </div>
  );
}
