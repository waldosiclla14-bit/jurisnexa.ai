import { describe, it, expect } from 'vitest';
import { getSystemPromptWithLegalEngine } from '../legal-diagnosis';
import { LegalAnalysisResult } from '@/lib/engines/types';

function buildResult(overrides: Partial<LegalAnalysisResult> = {}): LegalAnalysisResult {
  return {
    mode: 'cliente',
    facts: { facts: [], parties: [], dates: [], amounts: [], keywords: [] },
    qualification: { primaryArea: null, areas: [], figure: null, figureLabel: null, summary: null, keywords: [] },
    verification: { claims: [], verifiedCount: 0, unverifiedCount: 0 },
    caseComparison: [],
    missingFacts: [],
    evidence: [],
    conflicts: [],
    temporal: { deadlines: [], applicableLawPeriod: null, notes: [] },
    risks: [],
    interview: { questions: [], askedCount: 0, exhausted: true },
    document: null,
    jurisprudence: { literatureSearched: false, sourcesSuggested: [], warning: '' },
    lawChanges: null,
    usurpation: { matched: false, suggestedArticle: null, detectionNote: '', reformNote: null },
    confidence: { score: 50, level: 'MEDIO', factors: [] },
    sources: [],
    contextString: '=== ANÁLISIS AUTOMATIZADO DE PRUEBA ===',
    diagnosisCapat0: '',
    diagnosisCapat1: '',
    diagnosisCapat2: '',
    ...overrides,
  };
}

describe('getSystemPromptWithLegalEngine — metodología LexChile', () => {
  it('incluye la metodología léxica chilena cuando el país es CHILE', () => {
    const prompt = getSystemPromptWithLegalEngine('CHILE', undefined, '', buildResult());
    expect(prompt).toContain('METODOLOGÍA LEXCHILE');
    expect(prompt).toContain('NO INVENTAR DERECHO');
    expect(prompt).toContain('JERARQUÍA DE FUENTES');
    expect(prompt).toContain('USURPACIÓN DE INMUEBLES');
    expect(prompt).toContain('INFORMACIÓN DESACTUALIZADA');
  });

  it('no incluye la metodología LexChile para Perú', () => {
    const prompt = getSystemPromptWithLegalEngine('PERU', undefined, '', buildResult());
    expect(prompt).not.toContain('METODOLOGÍA LEXCHILE');
    expect(prompt).not.toContain('NO INVENTAR DERECHO');
  });

  it('conserva el motor y las reglas del diagnóstico', () => {
    const prompt = getSystemPromptWithLegalEngine('CHILE', 'laboral', 'contexto de prueba', buildResult());
    expect(prompt).toContain('MOTOR AVANZADO DE ANÁLISIS JURÍDICO');
    expect(prompt).toContain('NO ALUCINES');
    expect(prompt).toContain('CLAIM → SOURCE');
    expect(prompt).toContain('CONTEXTO DOCUMENTAL ADICIONAL');
  });
});