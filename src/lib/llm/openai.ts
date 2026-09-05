import { LLMProvider } from '@/types';
import { getDemoResponse, isDemoMode } from './demo';

export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
  }

  async *chat(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    options?: { maxTokens?: number; temperature?: number; topP?: number; frequencyPenalty?: number; presencePenalty?: number; fileData?: { name: string; type: string; size: number; base64: string } }
  ): AsyncGenerator<string> {
    if (!this.apiKey) {
      const response = getDemoResponse(messages);
      for (const char of response) {
        yield char;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: options?.maxTokens || 800,
        temperature: options?.temperature ?? 0.3,
        top_p: options?.topP ?? 0.9,
        frequency_penalty: options?.frequencyPenalty ?? 0.2,
        presence_penalty: options?.presencePenalty ?? 0.1,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error de OpenAI: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No se pudo obtener el stream de respuesta');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  }
}
