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

  it('separa ---### pegado al texto y heading text junto al párrafo', () => {
    const txt = '*Nota: No hay fuentes.*---### ResumenSi en Chile la Comisión rechazó tu solicitud.---### Análisis jurídicoEn Chile el refugio se rige por la Ley 20.430.';
    const out = ensureLegalStructure(txt);
    expect(out).toContain('### Nota');
    expect(out).toContain('### Resumen');
    expect(out).toContain('### Análisis jurídico');
    expect(out).toContain('Si en Chile');
    expect(out).toContain('En Chile el refugio');
    expect(out).toMatch(/### Resumen\n\nSi en Chile/);
    expect(out).toMatch(/### Análisis jurídico\n\nEn Chile/);
  });
});