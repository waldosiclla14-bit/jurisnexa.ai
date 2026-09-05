import { LLMProvider } from '@/types';
import { getDemoResponse, isDemoMode } from './demo';

export class AnthropicProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
    this.model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
  }

  async *chat(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    options?: { maxTokens?: number; temperature?: number; topP?: number; frequencyPenalty?: number; presencePenalty?: number; fileData?: { name: string; type: string; size: number; base64: string } }
  ): AsyncGenerator<string> {
    if (!this.apiKey) {
      // Demo mode: return simulated response
      const response = getDemoResponse(messages);
      for (const char of response) {
        yield char;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return;
    }

    // Separate system message from conversation messages
    const systemMsg = messages.find((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.3,
        system: systemMsg?.content || '',
        messages: conversationMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error de Anthropic: ${response.status} - ${error}`);
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

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta') {
            const text = parsed.delta?.text;
            if (text) yield text;
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  }
}
