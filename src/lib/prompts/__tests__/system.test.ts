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

describe('getSystemPromptWithRAG - modo cliente', () => {
  it('usa el rol de asistente jurídico migratorio', () => {
    const prompt = getSystemPromptWithRAG('PERU', undefined, '', 'cliente');
    expect(prompt).toContain('JurisNexa');
    expect(prompt).toContain('derecho migratorio');
  });

  it('tiene estructura de plantilla con saludo y respuesta rápida', () => {
    const prompt = getSystemPromptWithRAG('PERU', undefined, '', 'cliente');
    expect(prompt).toContain('Saludo contextual');
    expect(prompt).toContain('Respuesta rápida');
  });

  it('incluye normativa aplicable y fuentes', () => {
    const prompt = getSystemPromptWithRAG('PERU', undefined, '', 'cliente');
    expect(prompt).toContain('Normativa aplicable');
    expect(prompt).toContain('Fuentes');
  });

  it('advierte que no sustituye a un abogado', () => {
    const prompt = getSystemPromptWithRAG('PERU', undefined, '', 'cliente');
    expect(prompt).toContain('no constituye asesoría legal profesional');
  });
});
