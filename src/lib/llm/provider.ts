import { LLMProvider, LLMProviderType } from '@/types';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';

export function createLLMProvider(providerType?: LLMProviderType): LLMProvider {
  const type = providerType || getProviderType();

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

function getProviderType(): LLMProviderType {
  const provider = process.env.LLM_PROVIDER || 'openai';
  return provider as LLMProviderType;
}

export function getProviderInfo(): { provider: string; model: string } {
  const type = process.env.LLM_PROVIDER || 'openai';
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
