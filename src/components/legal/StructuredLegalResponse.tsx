'use client';

import type { LegalResponse } from '@/lib/legal/types';
import { ExecutiveSummary } from './ExecutiveSummary';
import { FactsSection } from './FactsSection';
import { LegalIssueCard } from './LegalIssueCard';
import { LegalNormCard } from './LegalNormCard';
import { JurisprudenceCard } from './JurisprudenceCard';
import { ArgumentCard } from './ArgumentCard';
import { RiskCard } from './RiskCard';
import { StrategySection } from './StrategySection';
import { ConclusionSection } from './ConclusionSection';
import { SourcesSection } from './SourcesSection';
import { WarningBanner } from './WarningBanner';
import { ConfidenceBadge } from './ConfidenceBadge';
import { CopyResponseButton } from './CopyResponseButton';

export function StructuredLegalResponse({ response }: { response: LegalResponse }) {
  return (
    <div className="space-y-1 max-w-none">
      {response.warnings && <WarningBanner warnings={response.warnings} />}
      {response.executiveSummary && <ExecutiveSummary text={response.executiveSummary} />}
      {response.facts && <FactsSection facts={response.facts} />}
      {response.legalIssue && <LegalIssueCard issue={response.legalIssue} />}
      {response.applicableLaw && <LegalNormCard norms={response.applicableLaw} />}
      {response.jurisprudence && <JurisprudenceCard items={response.jurisprudence} />}
      {response.analysis && (
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-3 bg-white dark:bg-zinc-900">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Análisis jurídico</h3>
          <div className="mt-3 space-y-3">
            {response.analysis.sections.map((s) => (
              <div key={s.id} className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3">
                <h4 className="text-sm font-semibold">{s.title}</h4>
                {s.rule && <p className="mt-1 text-sm text-zinc-600">Regla: {s.rule}</p>}
                {s.application && <p className="mt-1 text-sm">{s.application}</p>}
                {s.reasoning && <ul className="mt-1 list-disc pl-5 text-sm space-y-1">{s.reasoning.map((r, i) => <li key={i}>{r}</li>)}</ul>}
              </div>
            ))}
          </div>
        </section>
      )}
      {response.argumentsFor && <ArgumentCard title="Argumentos a favor" items={response.argumentsFor} />}
      {response.argumentsAgainst && <ArgumentCard title="Argumentos en contra" items={response.argumentsAgainst} />}
      {response.risks && <RiskCard risks={response.risks} />}
      {response.strategy && <StrategySection strategy={response.strategy} />}
      {response.procedure && (
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-3 bg-white dark:bg-zinc-900">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Procedimiento</h3>
          <ol className="mt-3 list-decimal pl-5 space-y-1 text-sm">
            {response.procedure.steps.map((s) => <li key={s.order}>{s.action} — {s.reason}</li>)}
          </ol>
        </section>
      )}
      {response.conclusion && <ConclusionSection conclusion={response.conclusion} />}
      {response.confidence && <ConfidenceBadge confidence={response.confidence} />}
      <SourcesSection sources={response.sources} />
      <div className="flex gap-2 pt-2">
        <CopyResponseButton response={response} />
        <span className="text-xs text-zinc-400 self-center">v{response.version} · {response.metadata.schemaVersion}</span>
      </div>
    </div>
  );
}
