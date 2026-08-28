import { describe, it, expect } from 'vitest';
import { analyzeLegalCase } from '@/lib/engines';
import { getSystemPromptWithLegalEngine } from '@/lib/prompts/legal-diagnosis';
import { searchChileanLawsWithSources } from '@/lib/rag/chilean-law-search';

describe('flujo de chat — orden del prompt (validación)', () => {
  it('el prompt ensamblado para CHILE tiene el formato único en orden correcto (sin CAPA 1/2)', () => {
    const message = 'Estoy viviendo en una casona sin pagar arriendo desde hace 8 meses. El dueño me amenaza con denunciarme por usurpación. ¿Qué puedo hacer?';

    const analysis = analyzeLegalCase({
      message,
      country: 'CHILE',
      tipoUsuario: 'abogado',
      mode: 'abogado',
    });

    const chileanResult = searchChileanLawsWithSources(message, 8);

    const systemPrompt = getSystemPromptWithLegalEngine(
      'CHILE',
      undefined,
      chileanResult.contextString,
      analysis
    );

    const sections = systemPrompt.split('\n');

    const formatStart = sections.findIndex(l => l.includes('FORMATO DE RESPUESTA — DIAGNÓSTICO JURÍDICO PROFESIONAL'));
    expect(formatStart).toBeGreaterThan(-1);

    const orderChecks = [
      '## 1. Resumen ejecutivo',
      '## 2. Antecedentes del caso',
      '## 3. Calificación jurídica',
      '## 4. Normativa aplicable verificada',
      '## 5. Subsunción de los hechos en la norma',
      '## 6. Plazos de prescripción y vigencia',
      '## 7. Medios de prueba',
      '## 8. Argumentos de ambas partes',
      '## 9. Riesgos jurídicos',
      '## 10. Escenarios posibles',
      '## 11. Acciones recomendadas',
      '## 12. Información faltante',
      '## 13. Conclusión',
    ];

    let lastIdx = formatStart;
    for (const section of orderChecks) {
      const idx = sections.findIndex((l, i) => i > lastIdx && l.includes(section));
      expect(idx).toBeGreaterThan(lastIdx);
      lastIdx = idx;
    }

    expect(systemPrompt).toContain('CONCLUSIÓN JURÍDICA');
    expect(systemPrompt).toContain('FIGURA JURÍDICA');

    expect(systemPrompt).not.toContain('CAPA 1');
    expect(systemPrompt).not.toContain('CAPA 2');

    expect(analysis.qualification.figureLabel).toContain('Usurpación');
    expect(analysis.qualification.figureLabel).toContain('458');
    expect(analysis.qualification.figure).not.toMatch(/violencia/);
  });
});