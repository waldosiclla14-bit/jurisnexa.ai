import { LLMProvider, LLMProviderType } from '@/types';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';

const PROVIDER_PRIORITY: LLMProviderType[] = ['openai', 'anthropic', 'google'];

function hasApiKey(type: LLMProviderType): boolean {
  switch (type) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    case 'google':
      return !!process.env.GEMINI_API_KEY || !!process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    default:
      return false;
  }
}

function instantiate(type: LLMProviderType): LLMProvider {
  switch (type) {
    case 'openai':
      return new OpenAIProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'google':
      return new GeminiProvider();
    default:
      return new OpenAIProvider();
  }
}

function configuredProviders(): LLMProviderType[] {
  return PROVIDER_PRIORITY.filter(hasApiKey);
}

function buildCandidateOrder(preferred?: LLMProviderType): LLMProviderType[] {
  const configured = configuredProviders();
  // Sin ninguna API key: modo demo (OpenAI sin key devuelve respuesta simulada)
  if (configured.length === 0) return ['openai'];

  const primary = preferred || (process.env.LLM_PROVIDER as LLMProviderType | undefined);
  const ordered: LLMProviderType[] = [];
  if (primary && configured.includes(primary)) ordered.push(primary);
  for (const type of PROVIDER_PRIORITY) {
    if (!ordered.includes(type) && configured.includes(type)) ordered.push(type);
  }
  return ordered;
}

/**
 * Intenta cada proveedor en orden. Si uno falla antes de emitir el primer
 * fragmento, salta al siguiente. Si falla a mitad de un stream, propaga el
 * error (no se puede cambiar de modelo sin romper la respuesta parcial).
 */
export class FallbackProvider implements LLMProvider {
  private providers: LLMProvider[];

  constructor(providers: LLMProvider[]) {
    this.providers = providers;
  }

  async *chat(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    options?: { maxTokens?: number; temperature?: number; topP?: number; frequencyPenalty?: number; presencePenalty?: number; fileData?: { name: string; type: string; size: number; base64: string } }
  ): AsyncGenerator<string> {
    let lastError: unknown = null;
    for (const provider of this.providers) {
      let streamStarted = false;
      try {
        for await (const chunk of provider.chat(messages, options)) {
          streamStarted = true;
          yield chunk;
        }
        return;
      } catch (err) {
        lastError = err;
        if (streamStarted) {
          throw err;
        }
        console.warn(`[LLM] proveedor ${provider.constructor.name} no disponible, probando siguiente:`, err instanceof Error ? err.message : err);
      }
    }
    throw lastError instanceof Error ? lastError : new Error('No hay ningún proveedor LLM disponible');
  }
}

export function createLLMProvider(providerType?: LLMProviderType): LLMProvider {
  const order = buildCandidateOrder(providerType);
  const providers = order.map(instantiate);
  return new FallbackProvider(providers);
}

export function getProviderInfo(): { provider: string; model: string } {
  const candidates = buildCandidateOrder();
  const type = (candidates[0] || 'openai') as LLMProviderType;
  const models: Record<string, string> = {
    openai: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    anthropic: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    google: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  };
  return {
    provider: type,
    model: models[type] || models.openai,
  };
}