import { LegalAnalysisInput, LegalAnalysisResult, RuleSource, ConfidenceScore } from './types';
import { extractFacts } from './facts';
import { legalQualificationEngine } from './qualification';
import { legislationVerificationEngine } from './verification';
import { usurpationAnalysisEngine } from './usurpation';
import { temporalLawEngine } from './temporal';
import { caseComparisonEngine, evidenceAssessmentEngine, legalConflictEngine, legalRiskEngine, missingFactsEngine, adaptiveLegalInterview } from './reasoning';
import { lawChangeDetector, jurisprudenceEngine, legalDocumentAnalyzer } from './changes';

function confidence(verifiedClaims: number, noVerifiedClaims: number, hasFigure: boolean, hasLaw: boolean, factsCount: number, nationalCorpus: boolean): ConfidenceScore {
  let score = 30;
  const factors: ConfidenceScore['factors'] = [];
  if (nationalCorpus) {
    score += 25;
    factors.push({ name: 'corpus-chileno', impact: 25, label: 'Corpus legal chileno local disponible' });
  }
  if (verifiedClaims > 0 && noVerifiedClaims === 0) {
    score += 20;
    factors.push({ name: 'normas-verificadas', impact: 20, label: 'Todas las normas citadas fueron verificadas' });
  } else if (verifiedClaims > 0) {
    score += 10;
    factors.push({ name: 'normas-verificadas', impact: 10, label: 'Parte de las normas citadas fueron verificadas' });
  } else if (noVerifiedClaims > 0) {
    score -= 10;
    factors.push({ name: 'normas-no-verificadas', impact: -10, label: 'Hay normas citadas no verificadas' });
  }
  if (hasFigure) {
    score += 10;
    factors.push({ name: 'figura-detectada', impact: 10, label: 'Se identificó una figura jurídica' });
  }
  if (factsCount >= 2) {
    score += 10;
    factors.push({ name: 'hechos', impact: 10, label: 'Hechos suficientes' });
  }
  if (!hasLaw && !hasFigure) {
    score -= 20;
    factors.push({ name: 'sin-contexto', impact: -20, label: 'No se identificó norma ni figura' });
  }
  const final = Math.max(0, Math.min(99, score));
  const level: ConfidenceScore['level'] = final >= 75 ? 'ALTO' : final >= 50 ? 'MEDIO' : final >= 25 ? 'BAJO' : 'MUY BAJO';
  return { score: final, level, factors };
}

function allSources(result: Partial<LegalAnalysisResult>): RuleSource[] {
  const seen = new Map<string, RuleSource>();
  const push = (src: RuleSource | null | undefined) => {
    if (!src) return;
    const key = `${src.identifier}|${src.articleNumber}`;
    if (!seen.has(key)) seen.set(key, src);
  };

  if (result.verification) {
    for (const c of result.verification.claims) {
      push(c.foundArticle);
    }
  }
  return [...seen.values()];
}

export function analyzeLegalCase(input: LegalAnalysisInput): LegalAnalysisResult {
  const mode = input.mode || (input.tipoUsuario === 'abogado' ? 'abogado' : 'cliente');
  const nationalCorpus = input.country === 'CHILE';

  const facts = extractFacts(input.message);
  const qualification = legalQualificationEngine.qualify(input.message, facts);
  const verification = nationalCorpus
    ? legislationVerificationEngine.verify(input.message)
    : { claims: [], verifiedCount: 0, unverifiedCount: 0 };

  const usurpation = usurpationAnalysisEngine.analyze(input.message);
  const temporal = temporalLawEngine.analyze(qualification, facts);
  const caseComparison = caseComparisonEngine.compare(qualification, facts, input.message);
  const evidence = evidenceAssessmentEngine.assess(input.message, qualification);
  const conflicts = legalConflictEngine.conflicts(qualification, input.message);
  const risks = legalRiskEngine.risks(qualification, facts);
  const missingFacts = missingFactsEngine.missing(qualification, facts);
  const interview = adaptiveLegalInterview.build(0, qualification, missingFacts);
  const lawChanges = nationalCorpus ? lawChangeDetector.detect(input.message) : null;
  const jurisprudence = jurisprudenceEngine.analyze(input.message);
  const document = input.documentText ? legalDocumentAnalyzer.analyze(input.documentText) : null;

  const sources = allSources({ verification });

  if (usurpation.matched) {
    for (const r of usurpation.rules) if (r.source) sources.push(r.source);
    for (const p of usurpation.proceduralNotes) if (p.source) sources.push(p.source);
  }

  const confidenceScore = confidence(
    verification.verifiedCount,
    verification.unverifiedCount,
    qualification.figure != null,
    qualification.primaryArea != null || verification.verifiedCount > 0,
    facts.facts.length,
    nationalCorpus
  );

  const contextString = buildContextString({
    facts,
    qualification,
    verification,
    usurpation,
    temporal,
    caseComparison,
    evidence,
    conflicts,
    risks,
    missingFacts,
    lawChanges,
    jurisprudence,
    document,
    mode,
    nationalCorpus,
  });

  return {
    mode,
    facts,
    qualification,
    verification,
    caseComparison,
    missingFacts,
    evidence,
    conflicts,
    temporal,
    risks,
    interview,
    document,
    jurisprudence,
    lawChanges,
    usurpation: {
      matched: usurpation.matched,
      suggestedArticle: usurpation.suggestedArticle,
      detectionNote: usurpation.detectionNote,
      reformNote: usurpation.reformNote ?? null,
    },
    confidence: confidenceScore,
    sources,
    contextString,
    diagnosisCapat0: buildCapaCliente(qualification, risks, missingFacts),
    diagnosisCapat1: buildCapaAbogado(contextString),
    diagnosisCapat2: '',
  };
}

function buildContextString(data: {
  facts: ReturnType<typeof extractFacts>;
  qualification: ReturnType<typeof legalQualificationEngine.qualify>;
  verification: ReturnType<typeof legislationVerificationEngine.verify>;
  usurpation: ReturnType<typeof usurpationAnalysisEngine.analyze>;
  temporal: ReturnType<typeof temporalLawEngine.analyze>;
  caseComparison: ReturnType<typeof caseComparisonEngine.compare>;
  evidence: ReturnType<typeof evidenceAssessmentEngine.assess>;
  conflicts: ReturnType<typeof legalConflictEngine.conflicts>;
  risks: ReturnType<typeof legalRiskEngine.risks>;
  missingFacts: ReturnType<typeof missingFactsEngine.missing>;
  lawChanges: ReturnType<typeof lawChangeDetector.detect> | null;
  jurisprudence: ReturnType<typeof jurisprudenceEngine.analyze>;
  document: ReturnType<typeof legalDocumentAnalyzer.analyze> | null;
  mode: string;
  nationalCorpus: boolean;
}): string {
  const sb: string[] = [];
  sb.push('=== ANÁLISIS JURÍDICO AUTOMÁTICO (motor local) ===');

  if (!data.nationalCorpus) {
    sb.push('NOTA: este despliegue no cuenta con corpus chileno local. Toda norma debe citarse solo si el usuario la menciona explícitamente y con advertencia de verificación.');
    sb.push('');
  }

  sb.push('--- Área detectada ---');
  sb.push(`Área principal: ${data.qualification.primaryArea || 'No identificada'}`);
  if (data.qualification.areas.length) {
    sb.push(`Áreas candidatas: ${data.qualification.areas.map(a => `${a.area} (${Math.round(a.score)})`).join(', ')}`);
  }
  sb.push(`Figura jurídica: ${data.qualification.figureLabel || 'No identificada'}`);
  if (data.qualification.summary) sb.push(`Resumen figura: ${data.qualification.summary}`);

  sb.push('');
  sb.push('--- Hechos extraídos ---');
  sb.push(`Fechas: ${data.facts.dates.join(', ') || 'no hay'}`);
  sb.push(`Partes: ${data.facts.parties.join(', ') || 'no hay'}`);
  sb.push(`Montos: ${data.facts.amounts.map(a => a.label).join(', ') || 'no hay'}`);

  sb.push('');
  sb.push('--- Verificación de normas (cada afirmación CLAIM → SOURCE) ---');
  if (!data.verification.claims.length) {
    sb.push('No se detectaron referencias legales explícitas en el mensaje. No inventar normas.');
  }
  for (const c of data.verification.claims) {
    sb.push(`[${c.verified ? 'VERIFICADO' : 'NO VERIFICADO'}] ${c.claim}`);
    if (c.foundLaw) sb.push(`  → Ley: ${c.foundLaw.title} (${c.foundLaw.identifier}, ${c.foundLaw.url})`);
    if (c.foundArticle) sb.push(`  → Art.: ${c.foundArticle.articleNumber} ${truncate(c.foundArticle.content.replace(/\s+/g, ' '), 300)}`);
    if (c.note) sb.push(`  → Nota: ${c.note}`);
  }

  if (data.usurpation.matched) {
    sb.push('');
    sb.push('--- Motor de usurpación activado ---');
    sb.push(data.usurpation.detectionNote);
    if (data.usurpation.reformNote) sb.push(data.usurpation.reformNote);
    sb.push(`Artículo sugerido: ${data.usurpation.suggestedArticle}`);
    for (const r of data.usurpation.rules) {
      sb.push(`• ${r.name} (Art. ${r.article} CP) — ${r.pena}${r.source ? ` — ${truncate(r.source.content.replace(/\s+/g, ' '), 250)}` : ' [sin texto]'}`);
    }
    sb.push('Notas procesales (CPP):');
    for (const p of data.usurpation.proceduralNotes) {
      sb.push(`• ${p.title} (Art. ${p.article} CPP): ${p.text}`);
    }
  }

  sb.push('');
  sb.push('--- Plazos y temporalidad ---');
  for (const d of data.temporal.deadlines) {
    const state = d.applicable ? 'APLICA' : 'no aplica';
    sb.push(`• [${state}] ${d.title}`);
    for (const ref of d.references) {
      sb.push(`    Fuente: ${ref.title} Art. ${ref.articleNumber} — ${truncate(ref.content.replace(/\s+/g, ' '), 220)}`);
    }
    if (d.observation) sb.push(`    Observación: ${d.observation}`);
  }
  for (const n of data.temporal.notes) sb.push(`NOTA: ${n}`);

  sb.push('');
  sb.push('--- Elementos del caso (presencia) ---');
  for (const i of data.caseComparison) {
    sb.push(`- ${i.legalElement}: ${i.present ? 'presente' : 'ausente'} — ${i.detail}`);
  }

  sb.push('');
  sb.push('--- Medios de prueba ---');
  for (const e of data.evidence) {
    sb.push(`- ${e.probanza}: ${e.mentioned ? 'mencionado' : 'no mencionado'} (${e.note})`);
  }

  sb.push('');
  sb.push('--- Conflictos advertidos ---');
  if (!data.conflicts.length) sb.push('No se advirtieron conflictos normativos evidentes.');
  for (const c of data.conflicts) sb.push(`- [${c.type}] ${c.title}: ${c.detail}`);

  sb.push('');
  sb.push('--- Riesgos ---');
  for (const r of data.risks) sb.push(`- [${r.level}] ${r.title}: ${r.detail} ${r.mitigation ? `— Mitigación: ${r.mitigation}` : ''}`);

  sb.push('');
  sb.push('--- Hechos que faltan ---');
  for (let i = 0; i < data.missingFacts.length; i++) {
    sb.push(`- P${i + 1}: ${data.missingFacts[i].question} (${data.missingFacts[i].rationale})`);
  }

  if (data.lawChanges && data.lawChanges.detectedChanges.length) {
    sb.push('');
    sb.push('--- Cambios legislativos detectados ---');
    sb.push(data.lawChanges.summary);
    for (const ch of data.lawChanges.detectedChanges) {
      sb.push(`• ${ch.law} Art. ${ch.article} [${ch.changeType}] — ${ch.summary}`);
      if (ch.beforeText) sb.push(`  Antes: ${ch.beforeText}`);
      if (ch.afterText) sb.push(`  Ahora: ${ch.afterText}`);
      sb.push(`  ${ch.url}`);
    }
  }

  sb.push('');
  sb.push('--- Jurisprudencia ---');
  sb.push(data.jurisprudence.warning);
  for (const s of data.jurisprudence.sourcesSuggested) sb.push(`- Sugerencia: ${s}`);
  for (const m of data.jurisprudence.matchedRefs) sb.push(`- Fuente: ${m.title} ${m.url}`);

  if (data.document && (data.document.docType || data.document.segments.length)) {
    sb.push('');
    sb.push('--- Documento analizado ---');
    sb.push(`Tipo: ${data.document.docType || 'No identificado'}`);
    sb.push(`Partes: ${data.document.extractedParties.join(', ') || 'no hay'}`);
    sb.push(`Fechas: ${data.document.extractedDates.join(', ') || 'no hay'}`);
    sb.push(`Montos: ${data.document.extractedAmounts.join(', ') || 'no hay'}`);
    for (const seg of data.document.segments.slice(0, 3)) sb.push(`- ${truncate(seg.replace(/\s+/g, ' '), 300)}`);
  }

  sb.push('');
  sb.push('=== FIN DEL ANÁLISIS AUTOMÁTICO ===');

  return sb.join('\n');
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.substring(0, n) + '…' : s;
}

function buildCapaCliente(
  qualification: { figureLabel: string | null; primaryArea: string | null; summary: string | null },
  risks: ReturnType<typeof legalRiskEngine.risks>,
  missingFacts: ReturnType<typeof missingFactsEngine.missing>
): string {
  return [
    '# Qué entendí',
    'Resume aquí con tus palabras qué le ocurre al usuario, solo con lo que él indicó.',
    '',
    '# Situación en resumen',
    qualification.figureLabel ? `Parece tratar de: **${qualification.figureLabel}**.` : 'No se identificó con certeza el tema legal; pregunta para entender mejor.',
    qualification.summary ? `En simple: ${qualification.summary}` : '',
    '',
    '# Riesgos importantes',
    ...risks.filter(r => r.level === 'CRITICO' || r.level === 'ALTO').map(r => `- **${r.title}**: ${r.detail} ${r.mitigation ? `Haz: ${r.mitigation}` : ''}`),
    '',
    '# Información que necesito de ti',
    ...missingFacts.slice(0, 3).map((f, i) => `${i + 1}. ${f.question}`),
  ].filter(Boolean).join('\n');
}

function buildCapaAbogado(contextString: string): string {
  return [
    '# Diagnóstico jurídico (abogado)',
    'Analiza este caso con el formato profesional requerido, fundamentando cada afirmación en CLAIM → SOURCE.',
    '',
    contextString,
  ].join('\n');
}

export function analyzeLegalQuery(input: LegalAnalysisInput): LegalAnalysisResult {
  return analyzeLegalCase(input);
}