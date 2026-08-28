import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import { analyzeLegalCase } from '@/lib/engines';
import { extractFacts } from '@/lib/engines/facts';
import { legalQualificationEngine } from '@/lib/engines/qualification';
import { legislationVerificationEngine } from '@/lib/engines/verification';
import { usurpationAnalysisEngine } from '@/lib/engines/usurpation';
import { temporalLawEngine } from '@/lib/engines/temporal';

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

describe('LegalQualificationEngine', () => {
  it('detecta la figura de usurpación en un relato de ocupación', () => {
    const q = legalQualificationEngine.qualify('un grupo entró a la fuerza a mi casa y la ocupa desde ayer', extractFacts('un grupo entró a la fuerza a mi casa y la ocupa desde ayer'));
    expect(q.figure).toMatch(/usurpacion/i);
  });

  it('no asume violencia ni daño en una ocupación sin esos marcadores', () => {
    const q = legalQualificationEngine.qualify('estoy viviendo en una casa sin pagar arriendo, el dueño me amenaza con denunciarme por usurpación', extractFacts('estoy viviendo en una casa sin pagar arriendo'));
    expect(q.figure).toBe('usurpacion-simple');
    expect(q.figureLabel).toContain('458');
    expect(q.figure).not.toMatch(/violencia/);
  });

  it('detecta la figura de despido cuando hay señales laborales', () => {
    const q = legalQualificationEngine.qualify('el empleador me despidió injustificadamente después de 5 años', extractFacts('me despidieron injustificadamente'));
    expect(q.figure).toMatch(/despido/i);
  });
});

describe('UsurpationAnalysisEngine', () => {
  it('detecta contexto de usurpación por señales léxicas', () => {
    const s = usurpationAnalysisEngine.analyze('usurpación: ocuparon mi propiedad inmueble');
    expect(s.matched).toBe(true);
    expect(s.rules.length).toBeGreaterThan(0);
  });

  it('menciona la Ley 21.633 como reforma', () => {
    const s = usurpationAnalysisEngine.analyze('ocuparon mi propiedad');
    expect(s.reformNote).toContain('21.633');
  });
});

describe('LegislationVerificationEngine', () => {
  it('verifica el Art. 457 CP como VIGENTE y con fragmento', () => {
    const v = legislationVerificationEngine.verify('artículo 457 del código penal');
    expect(v.claims.length).toBeGreaterThan(0);
    const claim = v.claims[0];
    expect(claim.verified).toBe(true);
    expect(claim.foundArticle).not.toBeNull();
    expect(claim.foundArticle?.articleNumber).toBe('457');
    expect(claim.foundArticle?.content).toBeTruthy();
  });

  it('marca como NO VERIFICADA una ley inexistente', () => {
    const v = legislationVerificationEngine.verify('Ley 999999 de inexistencia inventada');
    expect(v.claims.length).toBeGreaterThan(0);
    const claim = v.claims.find(c => !c.verified);
    expect(claim).toBeDefined();
    expect(claim?.foundLaw).toBeNull();
  });

  it('verifica la prescripción del Código Civil Art. 2515', () => {
    const v = legislationVerificationEngine.verify('artículo 2515 del código civil');
    expect(v.claims.length).toBeGreaterThan(0);
    const claim = v.claims[0];
    expect(claim.verified).toBe(true);
    expect(claim.foundArticle?.articleNumber).toBe('2515');
  });
});

describe('TemporalLawEngine', () => {
  it('arroja plazos con referencias normativas verificadas', () => {
    const q = legalQualificationEngine.qualify('me deben dinero por un préstamo personal', extractFacts('me deben dinero'));
    const t = temporalLawEngine.analyze(q, extractFacts('me deben dinero'));
    expect(t.deadlines.length).toBeGreaterThan(0);
    expect(t.deadlines[0].references.length).toBeGreaterThan(0);
  });

  it('incluye nota sobre la prescripción laboral', () => {
    const q = legalQualificationEngine.qualify('reclamo mis horas extra no pagadas en el trabajo', extractFacts('horas extra'));
    const t = temporalLawEngine.analyze(q, extractFacts('horas extra'));
    expect(t.notes.some(n => /laboral|trabajo/i.test(n))).toBe(true);
  });
});

describe('analyzeLegalCase (orquestador completo)', () => {
  it('produce un resultado estructurado para un caso de usurpación', () => {
    const r = analyzeLegalCase({
      message: 'usurpación: un grupo desconocido entró con violencia a mi propiedad inmueble y la dañó',
      country: 'CHILE',
      legalArea: 'penal',
      tipoUsuario: 'cliente',
      mode: 'cliente',
    });
    expect(r.usurpation.matched).toBe(true);
    expect(r.confidence.score).toBeGreaterThan(0);
    expect(r.contextString).toContain('ANÁLISIS JURÍDICO AUTOMÁTICO');
    expect(r.diagnosisCapat0.length).toBeGreaterThan(0);
    expect(r.sources.length).toBeGreaterThan(0);
    expect(r.usurpation.suggestedArticle).toBe('457');
  });

  it('penaliza la confianza cuando no hay contexto', () => {
    const r = analyzeLegalCase({
      message: 'hola',
      country: 'CHILE',
      legalArea: undefined,
      tipoUsuario: 'cliente',
      mode: 'cliente',
    });
    expect(r.confidence.level).toBe('BAJO');
    expect(r.confidence.score).toBeLessThan(50);
  });
});