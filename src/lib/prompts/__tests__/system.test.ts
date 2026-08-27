import { describe, it, expect } from 'vitest';
import { getSystemPrompt, getSystemPromptWithRAG } from '../system';

describe('getSystemPrompt', () => {
  it('includes Peru-specific context for PERU', () => {
    const prompt = getSystemPrompt('PERU');
    expect(prompt).toContain('legislación de Perú');
    expect(prompt).toContain('NO menciones legislación chilena');
  });

  it('includes Chile-specific context for CHILE', () => {
    const prompt = getSystemPrompt('CHILE');
    expect(prompt).toContain('legislación de Chile');
    expect(prompt).toContain('NO menciones legislación peruana');
  });

  it('includes both countries for BOTH', () => {
    const prompt = getSystemPrompt('BOTH');
    expect(prompt).toContain('Perú y Chile por separado');
  });

  it('includes legal area when provided', () => {
    const prompt = getSystemPrompt('PERU', 'laboral');
    expect(prompt).toContain('área jurídica');
  });

  it('includes mandatory disclaimer', () => {
    const prompt = getSystemPrompt('PERU');
    expect(prompt).toContain('no sustituye el asesoramiento de un abogado');
  });

  it('includes structured response format', () => {
    const prompt = getSystemPrompt('PERU');
    expect(prompt).toContain('### Resumen');
    expect(prompt).toContain('### Análisis jurídico');
    expect(prompt).toContain('### Normas aplicables');
    expect(prompt).toContain('### Fuentes');
  });
});

describe('getSystemPromptWithRAG', () => {
  it('includes RAG context when provided', () => {
    const ragContext = 'Artículo 1351 del Código Civil: El contrato es el acuerdo...';
    const prompt = getSystemPromptWithRAG('PERU', undefined, ragContext);
    expect(prompt).toContain('CONTEXTO DOCUMENTAL RECUPERADO');
    expect(prompt).toContain('Artículo 1351');
  });

  it('includes no-documents message when RAG context is empty', () => {
    const prompt = getSystemPromptWithRAG('PERU', undefined, '');
    expect(prompt).toContain('No hay documentos jurídicos disponibles');
  });
});
