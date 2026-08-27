import { LLMProvider } from '@/types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDemoResponse } from './demo';

export interface GeminiFileData {
  name: string;
  type: string;
  size: number;
  base64: string;
}

export class GeminiProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  }

  async *chat(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    options?: { maxTokens?: number; temperature?: number; fileData?: GeminiFileData }
  ): AsyncGenerator<string> {
    if (!this.apiKey) {
      const response = getDemoResponse(messages);
      for (const char of response) {
        yield char;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return;
    }

    const genAI = new GoogleGenerativeAI(this.apiKey);
    
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const model = genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: systemMessage,
      generationConfig: {
        maxOutputTokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.3,
      },
    });

    const history = conversationMessages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    
    const lastUserMessage = conversationMessages[conversationMessages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== 'user') return;

    // Build message parts - text + optional file
    const parts: (string | { inlineData: { mimeType: string; data: string } })[] = [
      lastUserMessage.content,
    ];

    if (options?.fileData) {
      parts.push({
        inlineData: {
          mimeType: options.fileData.type,
          data: options.fileData.base64,
        },
      });
    }

    let retries = 3;
    while (retries > 0) {
      try {
        const result = await chat.sendMessageStream(parts);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) yield text;
        }
        return;
      } catch (err: unknown) {
        retries--;
        const errMsg = err instanceof Error ? err.message : String(err);
        
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('rate')) {
          if (retries > 0) {
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          yield `\n\n**Limite de Gemini alcanzado** -- La API gratuita permite ~10 peticiones/minuto. Espera 1-2 minutos y vuelve a intentar.`;
          return;
        }
        
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        yield `\n\n**Error de Gemini:** ${errMsg}`;
        return;
      }
    }
  }
}
