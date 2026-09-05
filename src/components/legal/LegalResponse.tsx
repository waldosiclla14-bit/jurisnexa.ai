'use client';

import { LegalResponseData, SectionStatus } from '@/lib/response/types';

function StatusDot({ status }: { status: SectionStatus }) {
  if (status !== 'streaming') return null;
  return <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-2" />;
}

function CardShell({ title, status, children }: { title: string; status: SectionStatus; children: React.ReactNode }) {
  if (status === 'empty') return null;
  return (
    <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 mb-3 bg-white dark:bg-neutral-900">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 flex items-center">
        {title}
        <StatusDot status={status} />
      </h3>
      <div className="mt-2 text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-100">{children}</div>
    </section>
  );
}

function ConclusionCard({ text, status }: { text: string; status: SectionStatus }) {
  if (status === 'empty') return null;
  return (
    <section className="rounded-xl border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-4 mb-4">
      <p className="text-[15px] leading-relaxed font-medium text-neutral-900 dark:text-neutral-50">
        {text}
        <StatusDot status={status} />
      </p>
    </section>
  );
}

function ListCard({ title, items, status, numbered = false }: { title: string; items: string[]; status: SectionStatus; numbered?: boolean }) {
  const Tag = numbered ? 'ol' : 'ul';
  return (
    <CardShell title={title} status={status}>
      <Tag className={numbered ? 'list-decimal pl-5 space-y-1' : 'list-disc pl-5 space-y-1'}>
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </Tag>
    </CardShell>
  );
}

function LawCard({ laws, status }: { laws: { raw: string; code?: string; article?: string; jurisdiction?: string }[]; status: SectionStatus }) {
  return (
    <CardShell title="Normas aplicables" status={status}>
      <div className="flex flex-col gap-2">
        {laws.map((law, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 px-3 py-2">
            {law.jurisdiction && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 shrink-0">{law.jurisdiction}</span>
            )}
            <span className="text-sm">{law.code ? `${law.code}${law.article ? ` — Art. ${law.article}` : ''}` : law.raw}</span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

const STATUS_STYLE: Record<string, string> = {
  VERIFICADA: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  NO_ENCONTRADA: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  PENDIENTE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

function SourceList({ sources, status }: { sources: { title: string; url?: string; status: string }[]; status: SectionStatus }) {
  return (
    <CardShell title={`Fuentes consultadas (${sources.length})`} status={status}>
      <div className="flex flex-col gap-2">
        {sources.map((s, i) => (
          <a key={i} href={s.url ?? undefined} target={s.url ? '_blank' : undefined} rel={s.url ? 'noopener noreferrer' : undefined} className="flex items-center justify-between gap-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
            <span className="text-sm truncate">{s.title}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${STATUS_STYLE[s.status] || ''}`}>{s.status.replace('_', ' ')}</span>
          </a>
        ))}
      </div>
    </CardShell>
  );
}

function DisclaimerBanner() {
  return (
    <div className="mt-4 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
      Esta información es de carácter general y no sustituye el asesoramiento de un abogado. El resultado no está garantizado y debe ser validado por un profesional habilitado.
    </div>
  );
}

export function LegalResponse({ data }: { data: LegalResponseData }) {
  return (
    <div>
      <ConclusionCard text={data.conclusion.text} status={data.conclusion.status} />
      <ListCard title="Análisis jurídico" items={data.analysis.items} status={data.analysis.status} numbered />
      {data.norms.status !== 'empty' && <LawCard laws={data.norms.items} status={data.norms.status} />}
      <ListCard title="Riesgos" items={data.risks.items.map(r => r.title)} status={data.risks.status} />
      <ListCard title="Posibles acciones" items={data.actions.items} status={data.actions.status} numbered />
      <ListCard title="Plazos" items={data.deadlines.items} status={data.deadlines.status} />
      {data.sources.status !== 'empty' && <SourceList sources={data.sources.items} status={data.sources.status} />}
      {data.warnings.status !== 'empty' && (
        <CardShell title="Advertencias" status={data.warnings.status}>
          <ul className="list-disc pl-5 space-y-1">
            {data.warnings.items.map((w, i) => <li key={i}>{w.text}</li>)}
          </ul>
        </CardShell>
      )}
      {data.disclaimer.status !== 'empty' && data.disclaimer.items.length > 0 && (
        <div className="mt-4 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
          {data.disclaimer.items.join(' ')}
        </div>
      )}
      <DisclaimerBanner />
    </div>
  );
}
