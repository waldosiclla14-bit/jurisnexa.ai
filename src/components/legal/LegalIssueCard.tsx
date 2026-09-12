'use client';

import type { LegalIssueSection } from '@/lib/legal/types';

export function LegalIssueCard({ issue }: { issue: LegalIssueSection }) {
  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-3 bg-white dark:bg-zinc-900">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Problema jurídico</h3>
      <p className="mt-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">{issue.primaryIssue}</p>
      {issue.secondaryIssues && issue.secondaryIssues.length > 0 && (
        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          {issue.secondaryIssues.map((q, i) => <li key={i}>{q}</li>)}
        </ul>
      )}
      {issue.legalQuestions && issue.legalQuestions.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold text-zinc-400">Preguntas jurídicas</h4>
          <ul className="mt-1 list-disc pl-5 space-y-1 text-sm">
            {issue.legalQuestions.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
