import { describe, it, expect } from 'vitest';
import { getDemoResponse, isDemoMode } from '../demo';

describe('getDemoResponse', () => {
  it('returns Peru-specific response for Peru queries', () => {
    const messages = [{ role: 'user', content: '¿Qué es un contrato en Perú?' }];
    const response = getDemoResponse(messages, 'PERU');
    expect(response).toContain('Peruano');
    expect(response).toContain('legislación peruana');
  });

  it('returns Chile-specific response for Chile queries', () => {
    const messages = [{ role: 'user', content: '¿Qué es un contrato en Chile?' }];
    const response = getDemoResponse(messages, 'CHILE');
    expect(response).toContain('Chile');
    expect(response).toContain('legislación chilena');
  });

  it('returns laboral Peru response for laboral queries', () => {
    const messages = [{ role: 'user', content: '¿Qué dice sobre despido?' }];
    const response = getDemoResponse(messages, 'PERU');
    expect(response).toContain('Consulta Laboral');
    expect(response).toContain('D.S. 003-97-TR');
  });

  it('returns laboral Chile response for laboral queries', () => {
    const messages = [{ role: 'user', content: '¿Qué dice sobre despido?' }];
    const response = getDemoResponse(messages, 'CHILE');
    expect(response).toContain('Consulta Laboral');
    expect(response).toContain('Código del Trabajo');
  });

  it('returns default response for generic queries', () => {
    const messages = [{ role: 'user', content: 'Hola' }];
    const response = getDemoResponse(messages);
    expect(response).toContain('JurisNexa.ai');
  });

  it('country parameter takes priority over keyword detection', () => {
    const messages = [{ role: 'user', content: 'Ley chilena sobre contrato' }];
    const response = getDemoResponse(messages, 'PERU');
    expect(response).toContain('Peruano');
  });
});

describe('isDemoMode', () => {
  it('returns true when no API keys are set', () => {
    const originalOpenai = process.env.OPENAI_API_KEY;
    const originalAnthropic = process.env.ANTHROPIC_API_KEY;
    const originalGemini = process.env.GEMINI_API_KEY;
    
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
    
    expect(isDemoMode()).toBe(true);
    
    process.env.OPENAI_API_KEY = originalOpenai;
    process.env.ANTHROPIC_API_KEY = originalAnthropic;
    process.env.GEMINI_API_KEY = originalGemini;
  });
});
