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

  it('renderiza divisores --- como <hr> en vez de párrafo', () => {
    render(
      <MessageBubble
        message={{
          ...message,
          content: 'Texto antes\n\n---\n\nTexto después',
        }}
      />
    );
    expect(document.querySelectorAll('hr').length).toBe(1);
    expect(screen.queryByText('---')).not.toBeInTheDocument();
  });

  it('detecta el encabezado con negrita pegada ##**Título**', () => {
    render(
      <MessageBubble
        message={{
          ...message,
          content: '##**Resumen de tu caso**\n\nTexto del cuerpo.',
        }}
      />
    );
    const h2s = document.querySelectorAll('h2');
    expect(h2s.length).toBe(1);
    expect(h2s[0].textContent).toContain('Resumen de tu caso');
  });

  it('renderiza una tabla sin pipe inicial', () => {
    render(
      <MessageBubble
        message={{
          ...message,
          content: 'Plazo | Fuente | Observación\n1 año | CP 457 | Vigente\n2 años | CP 458 | Derogado',
        }}
      />
    );
    const tables = document.querySelectorAll('table');
    expect(tables.length).toBe(1);
    expect(tables[0].querySelectorAll('tr').length).toBe(3);
  });

  it('no confunde un texto con un solo | con una tabla', () => {
    render(
      <MessageBubble
        message={{
          ...message,
          content: 'El plazo según el art. 1 | el art. 2 no está claro.',
        }}
      />
    );
    expect(document.querySelectorAll('table').length).toBe(0);
    expect(screen.getByText(/plazo según/)).toBeInTheDocument();
  });

  it('separa el divisor pegado al encabezado ---### Título', () => {
    render(
      <MessageBubble
        message={{
          ...message,
          content: 'Introducción\n---### Análisis jurídico\nTexto',
        }}
      />
    );
    expect(document.querySelectorAll('hr').length).toBe(1);
    expect(screen.queryByText('---### Análisis jurídico')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 }).textContent).toContain('Análisis jurídico');
  });

  it('separa encabezados pegados al final de un párrafo', () => {
    render(
      <MessageBubble
        message={{
          ...message,
          content: 'Texto de cierre del párrafo## Conclusión\nDetalle.',
        }}
      />
    );
    const h2s = document.querySelectorAll('h2');
    expect(h2s.length).toBe(1);
    expect(h2s[0].textContent).toContain('Conclusión');
  });
});