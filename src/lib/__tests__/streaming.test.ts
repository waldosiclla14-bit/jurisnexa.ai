import { describe, it, expect } from 'vitest';
import { createStreamAccumulator } from '../streaming';

describe('createStreamAccumulator', () => {
  it('conserva los saltos de linea cuando los chunks cortan a mitad de palabra', () => {
    const lines: string[] = [];
    const acc = createStreamAccumulator(l => lines.push(l));

    acc.push('### T');
    acc.push('itulo\n- item 1\n- it');
    acc.push('em 2\n');
    acc.flush();

    expect(lines).toEqual(['### Titulo', '- item 1', '- item 2']);
  });

  it('no pierde la ultima linea sin salto final al hacer flush', () => {
    const lines: string[] = [];
    const acc = createStreamAccumulator(l => lines.push(l));

    acc.push('Linea 1\nLinea 2');
    acc.flush();

    expect(lines).toEqual(['Linea 1', 'Linea 2']);
  });

  it('cada push entrega solo las lineas completas', () => {
    const lines: string[] = [];
    const acc = createStreamAccumulator(l => lines.push(l));

    acc.push('a\nb');
    expect(lines).toEqual(['a']);

    acc.push('\nc\n');
    expect(lines).toEqual(['a', 'b', 'c']);
  });

  it('conserva la secuencia exacta --- luego ### (reproduce bug de pegado)', () => {
    const lines: string[] = [];
    const acc = createStreamAccumulator(l => lines.push(l));

    acc.push('---\n');
    acc.push('### Título\n');
    acc.flush();

    expect(lines).toEqual(['---', '### Título']);
  });
});