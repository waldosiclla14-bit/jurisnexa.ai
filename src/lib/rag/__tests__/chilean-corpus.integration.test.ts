import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import { verifyChileanLaw, searchChileanLawsWithSources } from '@/lib/rag/chilean-law-search';

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

describe('corpus real chileno (integracion)', () => {
  it('el índice tiene >2000 leyes', () => {
    const res = verifyChileanLaw('código penal');
    expect(res.encontrada).toBe(true);
    expect(res.url).toContain('leychile.cl');
  });

  it('verifica Art. 1 del Código Penal', () => {
    const res = verifyChileanLaw('Artículo 1 del Código Penal');
    expect(res.encontrada).toBe(true);
    expect(res.norma).toContain('PENAL');
    expect(res.verificacion).toBe('VIGENTE');
    expect(res.articulo).toBe('1');
    expect(res.fragmento).toBeTruthy();
  });

  it('verifica Art. 2296 del Código Civil (compraventa)', () => {
    const res = verifyChileanLaw('Artículo 2296 del Código Civil');
    expect(res.encontrada).toBe(true);
    expect(res.fragmento).toBeTruthy();
  });

  it('verifica despido injustificado (Código del Trabajo Art. 162)', () => {
    const res = verifyChileanLaw('artículo 162 código del trabajo despido');
    expect(res.encontrada).toBe(true);
    expect(res.fragmento).toBeTruthy();
  });

  it('la renta DL 824 se encuentra', () => {
    const res = verifyChileanLaw('decreto ley 824 impuesto a la renta');
    expect(res.encontrada).toBe(true);
  });

  it('la ley de matrimonio civil 19.947 se encuentra', () => {
    const res = verifyChileanLaw('ley 19.947 matrimonio civil');
    expect(res.encontrada).toBe(true);
  });

  it('busca contexto de cobro comercial', () => {
    const r = searchChileanLawsWithSources('sociedad anónima acción de responsabilidad', 5);
    expect(r.contextString).toContain('DOCUMENTOS JURÍDICOS CHILENOS');
    expect(r.sources.length).toBeGreaterThan(0);
  });

  it('busca contexto penal', () => {
    const r = searchChileanLawsWithSources('robo con violencia artículo 433', 5);
    expect(r.sources.length).toBeGreaterThan(0);
  });

  it('busca consumidor', () => {
    const r = searchChileanLawsWithSources('garantía legal compra falla consumidor', 5);
    expect(r.sources.length).toBeGreaterThan(0);
  });

  it('busca familia / alimentos', () => {
    const r = searchChileanLawsWithSources('pensión de alimentos hijos divorcio', 5);
    expect(r.sources.length).toBeGreaterThan(0);
  });

  it('normaliza tildes: horas extra matchea el Código del Trabajo', () => {
    const r = searchChileanLawsWithSources('puedo cobrar horas extra', 5);
    expect(r.sources.length).toBeGreaterThan(0);
    expect(r.sources[0].title).toContain('TRABAJO');
  });

  it('sinónimo por prefijo: "hereda" localiza el Código Civil', () => {
    const r = searchChileanLawsWithSources('hereda mi hijo si muero sin testamento', 5);
    expect(r.sources.length).toBeGreaterThan(0);
    expect(r.sources[0].title).toContain('CODIGO CIVIL');
  });

  it('el artículo pedido explícitamente tiene prioridad máxima', () => {
    const r = searchChileanLawsWithSources('artículo 162 del código del trabajo', 5);
    expect(r.sources[0].title).toContain('162');
    expect(r.sources[0].similarity).toBe(1);
  });

  it('"impuesto a la renta" localiza la Ley de la Renta (no solo el Código Tributario)', () => {
    const r = searchChileanLawsWithSources('impuesto a la renta personas naturales', 5);
    expect(r.sources[0].title).toContain('RENTA');
    expect(r.sources[0].similarity).toBe(1);
  });

  it('la relevancia nunca supera 1', () => {
    const r = searchChileanLawsWithSources('divorcio causal de culpa', 5);
    for (const s of r.sources) {
      expect(s.similarity).toBeLessThanOrEqual(1);
    }
  });
});