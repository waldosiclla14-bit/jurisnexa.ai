import { describe, it, expect } from 'vitest';
import { shouldUseRAG } from '../index';

describe('shouldUseRAG', () => {
  it('returns true for queries with legal keywords', () => {
    expect(shouldUseRAG('¿Qué dice la ley sobre despido?')).toBe(true);
    expect(shouldUseRAG('Artículo 140 del Código Civil')).toBe(true);
    expect(shouldUseRAG('¿Cuándo prescribe la prescripción?')).toBe(true);
    expect(shouldUseRAG('Necesito un contrato')).toBe(true);
    expect(shouldUseRAG('Multa por infracción de tránsito')).toBe(true);
    expect(shouldUseRAG('Impuesto a la renta')).toBe(true);
    expect(shouldUseRAG('Divorcio por causal')).toBe(true);
    expect(shouldUseRAG('Pensión de alimentos')).toBe(true);
  });

  it('returns false for non-legal queries', () => {
    expect(shouldUseRAG('Hola, ¿cómo estás?')).toBe(false);
    expect(shouldUseRAG('¿Qué tiempo hace hoy?')).toBe(false);
    expect(shouldUseRAG('Cuéntame un chiste')).toBe(false);
    expect(shouldUseRAG('')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(shouldUseRAG('LEY')).toBe(true);
    expect(shouldUseRAG('Despido')).toBe(true);
    expect(shouldUseRAG('CONTRATO')).toBe(true);
  });
});
