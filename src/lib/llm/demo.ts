import { Country, LegalArea } from '@/types';

const DEMO_RESPONSES: Record<string, string> = {
  default: `Soy JurisNexa.ai, un asistente jurídico especializado en legislación peruana y chilena. 

**En modo demo** — para obtener respuestas completas con análisis legal real, configura tu \`OPENAI_API_KEY\` en \`.env.local\`.

Mientras tanto, puedo orientarte sobre:
- Áreas del derecho que cubro
- Estructura de consultas útiles
- Cómo funciona el sistema RAG con legislación

¿En qué puedo ayudarte?`,
  
  peru: `**JurisNexa.ai — Derecho Peruano (Demo)**

Para consultas sobre legislación peruana, el sistema está diseñado para:
1. Buscar artículos relevantes en nuestra base de datos (20+ leyes, 30+ artículos)
2. Aplicar un prompt especializado con contexto RAG
3. Generar análisis fundamentado

*Nota: La búsqueda RAG requiere Supabase configurado.*`,

  chile: `**JurisNexa.ai — Derecho Chileno (Demo)**

Para consultas sobre legislación chilena, el sistema cubre:
- Constitución Política
- Código Civil y Penal
- Leyes laborales y más

*Configura OPENAI_API_KEY y Supabase para respuestas completas.*`,
  
  laboral_peru: `**Consulta Laboral — Perú (Demo)**

En el derecho peruano laboral, los despidos están regulados por:
- **D.S. 003-97-TR** (TUO del D.Leg. 728) — Ley de Productividad y Competitividad Laboral
- **Art. 31**: Procedimiento de despido por falta grave
- **Art. 34**: Indemnización por despido arbitrario
- **Art. 38**: Casos de despido nulo

*Para un análisis completo con artículos específicos, configura Supabase con las leyes semilla.*`,
  
  laboral_chile: `**Consulta Laboral — Chile (Demo)**

En el derecho chileno laboral, los despidos están regulados por:
- **Código del Trabajo** — Libro II
- **Art. 161**: Causales de terminación del contrato
- **Art. 162**: Indemnización por años de servicio
- **Art. 168**: Despido injustificado

*Configura Supabase con las leyes chilenas para respuestas con fuentes verificadas.*`,
};

export function getDemoResponse(
  messages: { role: string; content: string }[],
  country?: Country,
  legalArea?: LegalArea
): string {
  const userMessage = messages.find(m => m.role === 'user')?.content || '';
  
  // Priority: use explicit country parameter, then detect from user message
  const isPeru = country === 'PERU' || userMessage.toLowerCase().includes('perú') || userMessage.toLowerCase().includes('peruano');
  const isChile = country === 'CHILE' || userMessage.toLowerCase().includes('chile') || userMessage.toLowerCase().includes('chileno');
  
  // Detect laboral queries
  const isLaboral = userMessage.toLowerCase().includes('despido') || 
                    userMessage.toLowerCase().includes('laboral') ||
                    userMessage.toLowerCase().includes('trabajo') ||
                    userMessage.toLowerCase().includes('empleador') ||
                    userMessage.toLowerCase().includes('contrato de trabajo');
  
  if (isPeru) {
    return isLaboral ? DEMO_RESPONSES.laboral_peru : DEMO_RESPONSES.peru;
  }
  if (isChile) {
    return isLaboral ? DEMO_RESPONSES.laboral_chile : DEMO_RESPONSES.chile;
  }
  
  // Customize based on keywords
  const lowerMessage = userMessage.toLowerCase();
  if (lowerMessage.includes('constitución') || lowerMessage.includes('derechos')) {
    return `**Consulta constitucional (Demo)**\n\nEn el derecho peruano, los derechos fundamentales están en el Art. 2° de la Constitución de 1993.\n\n*El sistema RAG recuperará artículos específicos cuando esté configurado.*`;
  }
  
  return DEMO_RESPONSES.default;
}

export function isDemoMode(): boolean {
  return !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY && !process.env.NEXT_PUBLIC_GEMINI_API_KEY;
}
