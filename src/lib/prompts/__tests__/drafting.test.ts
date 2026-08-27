import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getDocumentTypePrompt, ESCRITO_CHECKLISTS } from '../drafting';
import { verifyChileanLaw } from '@/lib/rag/chilean-law-search';

describe('checklist de escritos', () => {
  it('todos los tipos incluyen sección de checklist de requisitos formales', () => {
    const types: Parameters<typeof getDocumentTypePrompt>[0][] = [
      'demanda-civil',
      'demanda-laboral',
      'demanda-penal-querella',
      'contestacion-demanda',
      'recurso-apelacion',
      'recurso-nulidad',
      'demanda-familiar',
      'contrato-locacion',
      'contrato-trabajo',
      'carta-reclamo',
      'informe-juridico',
      'consultoria-legal',
      'demanda-ojv',
    ];
    for (const t of types) {
      const prompt = getDocumentTypePrompt(t, 'PERU', '');
      expect(prompt).toContain('CHECKLIST DE REQUISITOS FORMALES');
    }
  });

  it('el checklist demanda-civil incluye verificación de la vía procedimental', () => {
    const resp = ESCRITO_CHECKLISTS['demanda-civil'];
    expect(resp.some(i => /vía procedimental/i.test(i.item))).toBe(true);
  });

  it('cada checklist es no vacío', () => {
    for (const [key, items] of Object.entries(ESCRITO_CHECKLISTS)) {
      expect(items.length, `checklist vacío para ${key}`).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('verifyChileanLaw', () => {
  const prevEnv = process.env.JURISNEXA_LEYES_DATA;
  let dataDir = '';

  beforeAll(() => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jurisnexa-leyes-'));
    fs.mkdirSync(path.join(dataDir, 'leyes', 'cl'), { recursive: true });

    const index = [
      {
        identifier: 'CL-207436',
        title: 'Código del Trabajo',
        rank: 'decreto_con_fuerza_de_ley',
        rankLabel: 'DFL',
        publication_date: '2003-01-16',
        status: 'Vigente',
        source: 'Ley Chile',
        department: 'Trabajo y Previsión Social',
        official_number: '1',
      },
      {
        identifier: 'CL-999999',
        title: 'Ley de Arriendos Antigua',
        rank: 'ley',
        rankLabel: 'Ley',
        publication_date: '1940-01-01',
        status: 'Derogada',
        source: 'Ley Chile',
        department: 'Justicia',
        official_number: '123',
      },
    ];
    fs.writeFileSync(path.join(dataDir, 'leyes-index.json'), JSON.stringify(index));

    const md = [
      '---',
      'identifier: CL-207436',
      'title: Código del Trabajo',
      'status: Vigente',
      '---',
      '',
      '##### Artículo 162',
      'El contrato de trabajo termina por despido con causa justificada...',
    ].join('\n');
    fs.writeFileSync(path.join(dataDir, 'leyes', 'cl', 'CL-207436.md'), md);

    const md2 = [
      '---',
      'identifier: CL-999999',
      'title: Ley de Arriendos Antigua',
      'status: Derogada',
      '---',
      '',
      '##### Artículo 1',
      'Norma derogada de prueba.',
    ].join('\n');
    fs.writeFileSync(path.join(dataDir, 'leyes', 'cl', 'CL-999999.md'), md2);

    process.env.JURISNEXA_LEYES_DATA = dataDir;
  });

  afterAll(() => {
    if (prevEnv === undefined) {
      delete process.env.JURISNEXA_LEYES_DATA;
    } else {
      process.env.JURISNEXA_LEYES_DATA = prevEnv;
    }
    try {
      fs.rmSync(dataDir, { recursive: true, force: true });
    } catch { /* ignore */ }
  });

  it('identifica el Código del Trabajo y su estado', () => {
    const res = verifyChileanLaw('Artículo 162 del Código del Trabajo');
    expect(res.encontrada).toBe(true);
    expect(res.norma?.toLowerCase()).toContain('trabajo');
    expect(res.verificacion).toBe('VIGENTE');
    expect(res.articulo).toMatch(/^162/);
    expect(res.url).toContain('leychile.cl');
    expect(res.fragmento).toBeTruthy();
  });

  it('mapea una ley derogada', () => {
    const res = verifyChileanLaw('Ley de Arriendos Antigua artículo 1');
    expect(res.encontrada).toBe(true);
    expect(res.verificacion).toBe('DEROGADA');
  });

  it('devuelve DESCONOCIDA cuando no hay coincidencia de ley', () => {
    const res = verifyChileanLaw('zzzzqqqq no existe esta ley');
    expect(res.encontrada).toBe(false);
    expect(res.verificacion).toBe('DESCONOCIDA');
  });

  it('devuelve DESCONOCIDA si no hay índice disponible', () => {
    delete process.env.JURISNEXA_LEYES_DATA;
    try {
      const dataDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'jurisnexa-leyes-vacio-'));
      process.env.JURISNEXA_LEYES_DATA = dataDir2;
      const res = verifyChileanLaw('artículo 1 del código civil');
      expect(res.encontrada).toBe(false);
      expect(res.verificacion).toBe('DESCONOCIDA');
      try { fs.rmSync(dataDir2, { recursive: true, force: true }); } catch { /* ignore */ }
    } finally {
      process.env.JURISNEXA_LEYES_DATA = dataDir;
    }
  });
});