import { v4 as uuidv4 } from 'uuid';
import type { LegalResponse, FactSection, SourceItem, Jurisdiction } from './types';
import type { LegalQueryType, QueryClassification } from './types';
import type { LegalResponseData } from '@/lib/response/types';
import type { Country } from '@/types';

function toFactSection(data: LegalResponseData): FactSection | undefined {
  if (data.legalIssue.items.length === 0 && data.analysis.items.length === 0) return undefined;
  return {
    userProvided: data.legalIssue.items.map((t, i) => ({ id: `fact-user-${i}`, text: t, certainty: 'reported_by_user' as const })),
    sourceSupported: [],
    inferred: data.analysis.items.slice(0, 2).map((t, i) => ({ id: `fact-inf-${i}`, text: t, certainty: 'inferred' as const })),
    disputed: [],
  };
}

function toSources(data: LegalResponseData, ragSources?: { id: string; title: string; url: string | null }[]): SourceItem[] {
  const fromData: SourceItem[] = data.sources.items.map((s, i) => ({
    id: `src-${i}`,
    title: s.title,
    type: s.url ? 'official' as const : 'secondary' as const,
    url: s.url ?? undefined,
    verified: s.status === 'VERIFICADA',
    citation: s.raw,
  }));
  if (ragSources?.length) {
    return [
      ...fromData,
      ...ragSources.map((r, i) => ({
        id: r.id || `rag-${i}`,
        title: r.title,
        type: 'official' as const,
        url: r.url ?? undefined,
        verified: true,
      })),
    ];
  }
  return fromData;
}

export function buildLegalResponseFromParsed(
  parsed: LegalResponseData,
  classification: QueryClassification,
  country: Country,
  ragSources?: { id: string; title: string; url: string | null }[]
): LegalResponse {
  const id = uuidv4();
  const jurisdiction: Jurisdiction | undefined = classification.country ? { country: classification.country } : country === 'CHILE' ? { country: 'CL' } : country === 'PERU' ? { country: 'PE' } : undefined;

  const applicableLaw = parsed.norms.items.map((n, i) => ({
    id: `norm-${i}`,
    country: n.jurisdiction,
    jurisdiction: n.jurisdiction,
    instrumentType: 'law' as const,
    name: n.title,
    article: n.article,
    title: n.title,
    text: n.raw,
    relevance: 'high' as const,
    status: n.status === 'VERIFICADA' ? ('vigente' as const) : n.status === 'NO_ENCONTRADA' ? ('unknown' as const) : ('unknown' as const),
    sourceId: `src-${i}`,
  }));

  const jurisprudence = parsed.jurisprudence.items.map((j, i) => ({
    id: `jur-${i}`,
    court: 'No especificado',
    holding: j,
    verified: false,
  }));

  const risks = parsed.risks.items.map((r, i) => ({
    id: `risk-${i}`,
    title: r.title,
    description: r.detail || r.title,
    level: r.level === 'CRITICO' ? ('critical' as const) : r.level === 'ALTO' ? ('high' as const) : r.level === 'MEDIO' ? ('medium' as const) : ('low' as const),
    reason: r.detail || 'Riesgo identificado',
    mitigation: r.mitigation ?? undefined,
  }));

  const analysis = parsed.analysis.items.length
    ? {
        sections: parsed.analysis.items.map((t, i) => ({
          id: `ana-${i}`,
          title: `Análisis ${i + 1}`,
          application: t,
          reasoning: [t],
        })),
      }
    : undefined;

  const sources = toSources(parsed, ragSources);
  const warnings: import('./types').WarningItem[] = parsed.warnings.items.map((w) => ({
    type: 'unverified_source' as const,
    message: w.text,
    severity: 'warning' as const,
  }));

  if (classification.country === undefined && !country) {
    warnings.push({ type: 'jurisdiction_ambiguity', message: 'Jurisdicción no especificada. El análisis puede variar según el país.', severity: 'warning' });
  }

  return {
    id,
    version: '1.0.0',
    queryType: classification.queryType,
    jurisdiction,
    title: parsed.conclusion.text.slice(0, 80) || 'Análisis jurídico',
    executiveSummary: parsed.conclusion.text || undefined,
    facts: toFactSection(parsed),
    legalIssue: parsed.legalIssue.items.length ? { primaryIssue: parsed.legalIssue.items[0], secondaryIssues: parsed.legalIssue.items.slice(1) } : undefined,
    applicableLaw: applicableLaw.length ? applicableLaw : undefined,
    jurisprudence: jurisprudence.length ? jurisprudence : undefined,
    analysis,
    argumentsFor: undefined,
    argumentsAgainst: undefined,
    risks: risks.length ? risks : undefined,
    strategy: parsed.actions.items.length
      ? {
          recommendedActions: parsed.actions.items.map((a, i) => ({ order: i + 1, action: a, reason: 'Acción recomendada', priority: 'medium' as const })),
          nextSteps: parsed.nextSteps.items,
        }
      : undefined,
    procedure: parsed.deadlines.items.length ? { steps: parsed.deadlines.items.map((d, i) => ({ order: i + 1, action: d, reason: 'Plazo legal', priority: 'high' as const })) } : undefined,
    conclusion: {
      answer: parsed.conclusion.text,
      keyPoints: parsed.analysis.items.slice(0, 3),
      limitations: warnings.map((w) => w.message),
      nextSteps: parsed.nextSteps.items,
    },
    sources,
    warnings: warnings.length ? warnings : undefined,
    confidence: parsed.confidence.items[0]
      ? {
          level: parsed.confidence.items[0].level === 'ALTO' ? 'high' : parsed.confidence.items[0].level === 'BAJO' ? 'low' : 'medium',
          reasons: parsed.confidence.items[0].factors ?? [],
        }
      : {
          level: sources.some((s) => s.verified) ? 'medium' : 'low',
          reasons: sources.some((s) => s.verified) ? ['Fuentes oficiales encontradas'] : ['Sin fuentes verificadas'],
          missingEvidence: ['Falta documentación adicional'],
        },
    metadata: {
      createdAt: new Date().toISOString(),
      schemaVersion: '1.0.0',
      promptVersion: 'legal-core-1.0.0',
      jurisdiction: jurisdiction?.country,
      sourceCount: sources.length,
      verifiedSourceCount: sources.filter((s) => s.verified).length,
    },
  };
}
