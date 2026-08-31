import { describe, it, expect } from 'vitest';
import { ensureLegalStructure } from '../response-formatter';

describe('ensureLegalStructure', () => {
  it('antepone Resumen si no hay encabezados y es largo', () => {
    const long = Array(20).fill('Este es un párrafo largo sobre derecho civil que debe ser ordenado.').join(' ');
    const out = ensureLegalStructure(long);
    expect(out.startsWith('### Resumen')).toBe(true);
    expect(out.split('\n\n').length).toBeGreaterThan(1);
  });

  it('no toca respuestas ya ordenadas', () => {
    const md = '### Resumen\n\nTexto corto.\n\n### Análisis\n\n- punto 1\n- punto 2';
    expect(ensureLegalStructure(md)).toBe(md);
  });

  it('trocea parrafo muy largo en varios', () => {
    const para = 'Primera oración. '.repeat(40) + 'Última oración.';
    const out = ensureLegalStructure(`### Título\n\n${para}`);
    const paras = out.split('\n\n').filter(p => !p.startsWith('#'));
    expect(paras.length).toBeGreaterThan(1);
    for (const p of paras) expect(p.length).toBeLessThan(600);
  });

  it('normaliza listas pegadas 1. ', () => {
    const txt = 'Texto previo 1. Primer punto 2. Segundo punto';
    const out = ensureLegalStructure(txt);
    expect(out).toContain('\n1. Primer');
  });
});