import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import setJuridico from '../../../../data/evals/set-juridico.json';
import { LEGAL_AREAS, Country, LegalArea } from '@/types';
import { searchChileanLawsWithSources } from '@/lib/rag/chilean-law-search';
import { searchPeruvianLawsWithSources } from '@/lib/rag/peruvian-law-search';
import { analyzeLegalCase } from '@/lib/engines';
import { getSystemPromptWithRAG } from '@/lib/prompts/system';
import { getSystemPromptWithLegalEngine } from '@/lib/prompts/legal-diagnosis';
import { createLLMProvider } from '@/lib/llm/provider';
import { resolvePELaw, PE_KNOWLEDGE_BASE } from '@/lib/eval/pe-knowledge';

interface EvalScenario {
  id: string;
  country: Country;
  legal_area: LegalArea;
  mode: 'cliente' | 'abogado';
  query: string;
  expected_references: string[];
  expected_points: string[];
  forbidden: string[];
}

const scenarios = (setJuridico as { scenarios: EvalScenario[] }).scenarios;

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function containsAny(haystack: string, needles: string[]): boolean {
  const h = normalize(haystack);
  return needles.some((n) => n.trim().length > 0 && h.includes(normalize(n)));
}

function hasAnyLLMKey(): boolean {
  return Boolean(
    process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY
  );
}

const prevEnv = process.env.JURISNEXA_LEYES_DATA;
const dataDir = path.resolve(process.cwd(), 'data');

beforeAll(() => {
  process.env.JURISNEXA_LEYES_DATA = dataDir;
});

afterAll(() => {
  if (prevEnv === undefined) {
    delete process.env.JURISNEXA_LEYES_DATA;
  } else {
    process.env.JURISNEXA_LEYES_DATA = prevEnv;
  }
});

describe('set jurídico — integridad del dataset', () => {
  it('tiene escenarios de Perú y de Chile', () => {
    const countries = [...new Set(scenarios.map((s) => s.country))];
    expect(countries).toContain('PERU');
    expect(countries).toContain('CHILE');
  });

  it('tiene más de 10 escenarios con ids únicos', () => {
    expect(scenarios.length).toBeGreaterThan(10);
    const ids = new Set(scenarios.map((s) => s.id));
    expect(ids.size).toBe(scenarios.length);
  });

  it('cada escenario está completo y con área válida', () => {
    const areaValues = LEGAL_AREAS.map((a) => a.value);
    for (const s of scenarios) {
      expect(s.id, s.id).toBeTruthy();
      expect(s.query.trim().length).toBeGreaterThan(10);
      expect(areaValues).toContain(s.legal_area);
      expect(['cliente', 'abogado']).toContain(s.mode);
      expect(s.expected_references.length).toBeGreaterThan(0);
      expect(s.expected_points.length).toBeGreaterThan(0);
      expect(s.forbidden.length).toBeGreaterThan(0);
    }
  });
});

describe('set jurídico — Chile: recuperación determinística', () => {
  const chile = scenarios.filter((s) => s.country === 'CHILE');

  it.each(chile.map((s) => [s.id, s] as const))('%s', (_id, s) => {
    const res = searchChileanLawsWithSources(s.query, 5);
    expect(res.sources.length, `${s.id} no recuperó ninguna fuente`).toBeGreaterThan(0);
    const hit = res.sources.some((src) => containsAny(src.title, s.expected_references));
    expect(hit, `${s.id}: ninguna fuente citó ${s.expected_references.join(' | ')} → ${res.sources.map(x => x.title).join(' ; ')}`).toBe(true);
  });
});

describe('set jurídico — Perú: coherencia del conocimiento base', () => {
  const peru = scenarios.filter((s) => s.country === 'PERU');

  it('la base de conocimiento PE cubre cada referencia esperada', () => {
    for (const s of peru) {
      for (const ref of s.expected_references) {
        expect(resolvePELaw(ref), `${s.id}: '${ref}' no está en la base PE (${PE_KNOWLEDGE_BASE.map(l => l.title).join(' | ')})`).not.toBeNull();
      }
    }
  });

  it('la base PE está respaldada por leyes semilla reales', () => {
    const seededTitles = PE_KNOWLEDGE_BASE.filter((l) => l.seeded).map((l) => l.title);
    expect(seededTitles).toContain('Constitución Política del Perú');
    expect(seededTitles).toContain('Código Civil de 1984');
    expect(seededTitles).toContain('Código Penal de 1991');
  });

  it('ninguna referencia esperada es una ley del otro país', () => {
    const chileanLaws = ['código del trabajo', 'ley 19.947', 'ley 19.496', '18.046'];
    for (const s of peru) {
      const banned = chileanLaws.filter((l) => s.expected_references.some((r) => normalize(r).includes(l)));
      expect(banned, `${s.id}: usa ley chilena ${banned.join(' | ')}`).toEqual([]);
    }
  });
});

describe('set jurídico — Perú: recuperación determinística (corpus versionado pe)', () => {
  const peru = scenarios.filter((s) => s.country === 'PERU');

  it.each(peru.map((s) => [s.id, s] as const))('%s', (_id, s) => {
    const res = searchPeruvianLawsWithSources(s.query, 5);
    expect(res.sources.length, `${s.id} no recuperó ninguna fuente`).toBeGreaterThan(0);
    const hit = res.sources.some((src) => containsAny(src.title, s.expected_references));
    expect(hit, `${s.id}: ninguna fuente citó ${s.expected_references.join(' | ')} → ${res.sources.map(x => x.title).join(' ; ')}`).toBe(true);
  });
});

describe.skipIf(!hasAnyLLMKey())('set jurídico — respuesta LLM real (requiere API key)', () => {
  const sample = scenarios.filter((s) =>
    ['CL-PEN-01', 'CL-LAB-01', 'CL-CONS-01', 'PE-PEN-01', 'PE-CIV-01', 'PE-CONS-01'].includes(s.id)
  );

  async function gradeScenario(s: EvalScenario): Promise<{ text: string; structure: boolean; sources: boolean; points: boolean; forbidden: boolean }> {
    const ragContext =
      s.country === 'CHILE'
        ? searchChileanLawsWithSources(s.query, 5).contextString
        : searchPeruvianLawsWithSources(s.query, 5).contextString;

    let systemPrompt: string;
    if (s.country === 'CHILE') {
      const analysis = analyzeLegalCase({
        message: s.query,
        country: 'CHILE',
        legalArea: s.legal_area,
        tipoUsuario: s.mode,
      });
      systemPrompt = getSystemPromptWithLegalEngine(s.country, s.legal_area, ragContext, analysis);
    } else {
      systemPrompt = getSystemPromptWithRAG(s.country, s.legal_area, ragContext, s.mode);
    }

    const provider = createLLMProvider();
    let text = '';
    for await (const chunk of provider.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: s.query },
      ],
      { maxTokens: 1500, temperature: 0.2 }
    )) {
      text += chunk;
    }

    const structure = /^#{1,6}\s/m.test(text) || /(\*\*|^- |^\d+\.) /m.test(text);
    const sources = /\[\d+\]/.test(text) || /\[Fuente/i.test(text) || containsAny(text, s.expected_references);
    const points = s.expected_points.every((p) => containsAny(text, [p]));
    const forbidden = !containsAny(text, s.forbidden);

    return { text, structure, sources, points, forbidden };
  }

  it.each(sample.map((s) => [s.id, s] as const))('%s', async (_id, s) => {
    const score = await gradeScenario(s);
    const fails: string[] = [];
    if (!score.structure) fails.push('formato (sin encabezados/listas/negritas)');
    if (!score.sources) fails.push(`fuentes (no citó ${s.expected_references.join(' | ')} ni [n])`);
    if (!score.points) fails.push(`conceptos (faltan: ${s.expected_points.filter(p => !containsAny(score.text, [p])).join(' | ')})`);
    if (!score.forbidden) fails.push(`anti-alucinación (mencionó: ${s.forbidden.filter(p => containsAny(score.text, [p])).join(' | ')})`);
    expect(fails, `${s.id}: ${fails.join('; ')}`).toEqual([]);
  });
});