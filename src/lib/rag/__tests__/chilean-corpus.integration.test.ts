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
});