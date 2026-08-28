import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageBubble from '@/components/MessageBubble';

const sampleContent = `## 1. Resumen ejecutivo

Podrías enfrentar un procedimiento de **usurpación** [1] según el Código Penal.

- Fuente verificada: Código Penal, Art. 457 [1]
- Requiere violencia o intimidación

## 2. Antecedentes del caso

1. Ocupas un inmueble desde hace meses.
2. No pagas arriendo.
3. El dueño exige la restitución.

### Advertencia

Este análisis es orientativo.

## 13. Conclusión

Nivel de confianza: 85/99`;

const message = {
  id: 'm1',
  role: 'assistant' as const,
  content: sampleContent,
  timestamp: new Date('2026-01-01T12:00:00'),
  country: 'CHILE' as const,
};

describe('MessageBubble — legibilidad del markdown', () => {
  it('agrupa viñetas en una lista <ul>', () => {
    render(<MessageBubble message={message} />);
    const uls = document.querySelectorAll('ul');
    expect(uls.length).toBe(1);
    expect(uls[0].querySelectorAll('li').length).toBe(2);
    expect(screen.getByText(/Fuente verificada/)).toBeInTheDocument();
  });

  it('agrupa ítems numerados en una lista <ol>', () => {
    render(<MessageBubble message={message} />);
    const ols = document.querySelectorAll('ol');
    expect(ols.length).toBe(1);
    expect(ols[0].querySelectorAll('li').length).toBe(3);
  });

  it('renderiza encabezados ## con su Jerarquía visual', () => {
    render(<MessageBubble message={message} />);
    const h2s = document.querySelectorAll('h2');
    expect(h2s.length).toBe(3);
    expect(h2s[0].textContent).toContain('Resumen ejecutivo');
    expect(h2s[1].textContent).toContain('Antecedentes');
    expect(h2s[2].textContent).toContain('Conclusión');
  });

  it('no pinta las viñetas como texto plano de párrafo', () => {
    render(<MessageBubble message={message} />);
    const paragraphs = document.querySelectorAll('p');
    const hasBareDash = Array.from(paragraphs).some(p => p.textContent?.trim().startsWith('- '));
    const hasBareNumber = Array.from(paragraphs).some(p => /^\d+\.\s/.test(p.textContent?.trim() ?? ''));
    expect(hasBareDash).toBe(false);
    expect(hasBareNumber).toBe(false);
  });

  it('conserva las citas numeradas [n] como referencias', () => {
    render(<MessageBubble message={message} />);
    expect(screen.getAllByText(/[1]/).length).toBeGreaterThan(0);
  });
});