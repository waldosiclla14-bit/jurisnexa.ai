import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createLLMProvider, getProviderInfo, FallbackProvider } from '../provider';
import { LLMProvider } from '@/types';

const ENV_KEYS = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'NEXT_PUBLIC_GEMINI_API_KEY', 'LLM_PROVIDER'] as const;
const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  ENV_KEYS.forEach(k => {
    originalEnv[k] = process.env[k];
  });
});

afterEach(() => {
  ENV_KEYS.forEach(k => {
    const original = originalEnv[k];
    if (original === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = original;
    }
  });
});

function failingProvider(name: string): LLMProvider {
  return {
    async *chat() {
      throw new Error(`Falla ${name}`);
    },
  };
}

function workingProvider(name: string): LLMProvider {
  return {
    async *chat() {
      yield `respuesta de ${name}`;
    },
  };
}

describe('FallbackProvider', () => {
  it('usa el segundo proveedor si el primero falla antes de emitir contenido', async () => {
    const provider = new FallbackProvider([failingProvider('uno'), workingProvider('dos')]);
    const chunks: string[] = [];
    for await (const chunk of provider.chat([{ role: 'user' as const, content: 'hola' }])) {
      chunks.push(chunk);
    }
    expect(chunks.join('')).toBe('respuesta de dos');
  });

  it('propaga el error si un proveedor falla a mitad de un stream', async () => {
    const halfProvider: LLMProvider = {
      async *chat() {
        yield 'parcial';
        throw new Error('Falla a mitad');
      },
    };
    const provider = new FallbackProvider([halfProvider, workingProvider('tres')]);
    const chunks: string[] = [];
    let caught: unknown = null;
    try {
      for await (const chunk of provider.chat([{ role: 'user' as const, content: 'hola' }])) {
        chunks.push(chunk);
      }
    } catch (err) {
      caught = err;
    }
    expect(chunks.join('')).toBe('parcial');
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toContain('mitad');
  });

  it('lanza error si todos los proveedores fallan', async () => {
    const provider = new FallbackProvider([failingProvider('a'), failingProvider('b')]);
    await expect(async () => {
      for await (const chunk of provider.chat([{ role: 'user' as const, content: 'hola' }])) {
        void chunk;
      }
    }).rejects.toThrow('Falla b');
  });
});

describe('createLLMProvider / getProviderInfo', () => {
  it('usa el orden de prioridad de proveedores configurados', () => {
    process.env.ANTHROPIC_API_KEY = 'test-anthropic';
    process.env.GEMINI_API_KEY = 'test-gemini';
    delete process.env.OPENAI_API_KEY;
    const provider = createLLMProvider();
    expect(provider).toBeInstanceOf(FallbackProvider);
    expect(getProviderInfo().provider).toBe('anthropic');
  });

  it('respeta LLM_PROVIDER como preferencia primaria', () => {
    process.env.OPENAI_API_KEY = 'test-openai';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic';
    process.env.LLM_PROVIDER = 'anthropic';
    expect(getProviderInfo().provider).toBe('anthropic');
  });

  it('vuelve a modo demo (openai primario) sin ninguna API key', () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const provider = createLLMProvider();
    expect(provider).toBeInstanceOf(FallbackProvider);
    expect(getProviderInfo().provider).toBe('openai');
  });
});