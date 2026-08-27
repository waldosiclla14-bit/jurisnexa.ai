import { describe, it, expect } from 'vitest';
import { chunkText, chunkLegalDocument, computeContentHash } from '../index';

describe('chunkText', () => {
  it('chunks short text into single chunk', () => {
    const shortText = 'Este es un texto corto para testing que tiene más de cincuenta caracteres para pasar el filtro.';
    const chunks = chunkText(shortText);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(shortText);
  });

  it('chunks long text into multiple chunks', () => {
    const longText = 'A'.repeat(2000);
    const chunks = chunkText(longText, 500, 100);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('respects maxChunkSize approximately', () => {
    const text = 'Palabra '.repeat(200);
    const chunks = chunkText(text, 500, 100);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(600);
    }
  });

  it('skips chunks shorter than 50 characters', () => {
    const text = 'A'.repeat(100);
    const chunks = chunkText(text, 200, 150);
    for (const chunk of chunks) {
      expect(chunk.length).toBeGreaterThanOrEqual(50);
    }
  });
});

describe('chunkLegalDocument', () => {
  it('detects articles and splits by them', () => {
    const text = `Artículo 1. Primera disposición.
    Este es el contenido del artículo primero.

    Artículo 2. Segunda disposición.
    Este es el contenido del artículo segundo.`;

    const chunks = chunkLegalDocument(text);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0].section).toContain('Artículo');
  });

  it('falls back to chunkText when no articles found', () => {
    const text = 'Este es un texto sin artículos. '.repeat(50);
    const chunks = chunkLegalDocument(text);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks[0].section).toContain('Fragmento');
  });

  it('handles Art. abbreviation', () => {
    const text = `Art. 10. Disposición décima.
    Contenido del artículo décimo.`;

    const chunks = chunkLegalDocument(text);
    expect(chunks.length).toBe(1);
    expect(chunks[0].section).toContain('10');
  });
});

describe('computeContentHash', () => {
  it('returns consistent hash for same input', () => {
    const text = 'Texto de prueba para hash';
    const hash1 = computeContentHash(text);
    const hash2 = computeContentHash(text);
    expect(hash1).toBe(hash2);
  });

  it('returns different hash for different input', () => {
    const hash1 = computeContentHash('Texto uno');
    const hash2 = computeContentHash('Texto dos');
    expect(hash1).not.toBe(hash2);
  });

  it('returns a string', () => {
    const hash = computeContentHash('test');
    expect(typeof hash).toBe('string');
  });

  it('handles empty string', () => {
    const hash = computeContentHash('');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });
});
