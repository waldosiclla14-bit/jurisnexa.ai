export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  category: string;
  tags: string[];
  readingTime: number;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'despido-injustificado-peru',
    title: 'Despido Injustificado en Perú: Tus Derechos y Cómo Actuar',
    description: 'Guía completa sobre las causas de despido injustificado en Perú, indemnización y procedimientos legales.',
    content: `
## ¿Qué es un despido injustificado?

En Perú, el despido se considera injustificado cuando el empleador termina la relación laboral sin una causa válida establecida en el artículo 23 del Decreto Supremo N° 003-97-TR (TUO del Decreto Legislativo N° 728).

### Causas justificadas de despido

Las únicas causas legalmente válidas son:

1. **Baja productividad o rendimiento** insatisfactorio
2. **Comisión de falta grave** (art. 24)
3. **Condena penal** por delito doloso
4. **Inhabilitación** del trabajador por más de 3 meses
5. **Fuerza mayor o caso fortuito** que impida el trabajo

### Indemnización por despido injustificado

Si el despido es declarado injustificado, el trabajador tiene derecho a:

- **Indemnización por despido**: 1.5 remuneraciones por año trabajado
- **Mínimo 1.5 remuneraciones** mensuales
- **Máximo 12 remuneraciones** mensuales
- **Compensación por beneficios sociales** (CTS, gratificaciones)

### Plazos para reclamar

- **30 días calendario** desde el despido para interponer demanda
- **Búscala laboral** o **Conciliación** obligatoria previa

### ¿Qué documentos necesitas?

- Contrato de trabajo
- Boletas de pago
- CTS
- Certificado de trabajo
- Comunicaciones con el empleador

## ¿Cómo actuar?

1. **No firmes** nada que indique renuncia voluntaria
2. **Recopila** todos tus documentos laborales
3. **Busca asesoría** legal especializada
4. **Presenta** tu demanda ante la autoridad de trabajo

> **Importante**: Esta información es de carácter general. Para casos específicos, consulta con un abogado laboralista.
    `,
    publishedAt: '2025-01-15',
    author: 'JurisNexa.ai',
    category: 'Laboral',
    tags: ['despido', 'Perú', 'laboral', 'indemnización', 'derechos'],
    readingTime: 5,
  },
  {
    slug: 'divorcio-chile-proceso',
    title: 'Divorcio en Chile: Proceso, Requisitos y Plazos',
    description: 'Todo lo que necesitas saber sobre el proceso de divorcio en Chile, tipos y documentación requerida.',
    content: `
## Tipos de divorcio en Chile

Chile reconoce tres formas de divorcio:

### 1. Divorcio de común acuerdo
- Ambos cónyuges están de acuerdo
- No requiere causal específica
- Proceso más rápido (3-6 meses)

### 2. Divorcio por causal objetiva
- Separación efectiva por más de 1 año
- No requiere culpa de ningún cónyuge

### 3. Divorcio por causal culpable
Uno de los cónyuges acredita:
- Conducta que hace intolerable la vida en común
- Ejemplo: adulterio, violencia, abandono

## Proceso de divorcio

### Paso 1: Reunir documentos
- Certificado de matrimonio
- Certificado de nacimiento de hijos
- Cédula de identidad
- Certificado de residencia

### Paso 2: Presentar demanda
- ante el Juzgado de Familia
- Pago de arancel judicial

### Paso 3: Audiencia de conciliación
- Intento obligatorio de conciliación
- Si no hay acuerdo, se continua

### Paso 4: Sentencia
- Plazo: 3-6 meses (acuerdo) o 1-2 años (culpable)

## Efectos del divorcio

- **Régimen patrimonial**: Se liquida sociedad conyugal
- **Pensión de alimentos**: Para hijos menores
- **Pensión compensatoria**: En casos justificados
- **Régimen de visitas**: Para hijos

## Costos aproximados

- Arancel judicial: $10.000 - $30.000 CLP
- Honorarios abogado: $500.000 - $2.000.000 CLP
- Otros gastos: $100.000 - $300.000 CLP

> **Nota**: Esta guía es informativa. Consulta con un abogado de familia para tu caso específico.
    `,
    publishedAt: '2025-01-10',
    author: 'JurisNexa.ai',
    category: 'Familia',
    tags: ['divorcio', 'Chile', 'familia', 'matrimonio', 'juzgado'],
    readingTime: 6,
  },
  {
    slug: 'contrato-laboral-peru-derechos',
    title: 'Contrato Laboral en Perú: Derechos y Obligaciones del Trabajador',
    description: 'Conoce tus derechos fundamentales como trabajador en Perú según la legislación vigente.',
    content: `
## Derechos fundamentales del trabajador

En Perú, los derechos laborales están protegidos por:

- **Constitución Política** (art. 24-29)
- **TUO del D.L. 728** (Ley de Productividad y Competitividad Laboral)
- **Convenios ONU ratificados**

### Derecho a la remuneración

- **Remuneración mínima vital**: S/ 1,025 (2025)
- **Pago oportano**: Máximo el último día hábil del mes
- **Descuento máximo**: 30% de la remuneración
- **No descuento por faltas injustificadas** de menos de 1 día

### Derecho a la jornada laboral

- **Jornada máxima**: 8 horas diarias / 48 horas semanales
- **Horas extras**: Máximo 4 horas diarias, doble remuneración
- **Descanso semanal**: Mínimo 24 horas consecutivas
- **Feriados**: 12 días al año (remunerados)

### Derecho a beneficios sociales

- **CTS**: 1 remuneración semestral
- **Gratificaciones**: 1 remuneración mensual (julio y diciembre)
- **Vacaciones**: 30 días calendario por año
- **Compensación por tiempo de servicios**

### Derecho a la seguridad social

- **EsSalud**: 9% de la remuneración (empleador)
- **ONP/AFP**: 10% + comisión (trabajador)
- **SCTR**: Seguro complementario de trabajo de riesgo

## Obligaciones del trabajador

- Cumplir el contrato de buena fe
- Realizar el trabajo convenido
- Guardar secreto industrial
- Restituir materiales al empleador
- No competir después del contrato (si se pactó)

## ¿Qué hacer si tus derechos son vulnerados?

1. **Documenta** la situación
2. **Comunica** al empleador por escrito
3. **Presenta** denuncia ante la Autoridad Administrativa de Trabajo
4. **Consulta** con un abogado laboralista
5. **Presenta** demanda si es necesario

> **Recuerda**: Estos derechos son irrenunciables. Ningún contrato puede eliminarlos.
    `,
    publishedAt: '2025-01-05',
    author: 'JurisNexa.ai',
    category: 'Laboral',
    tags: ['contrato', 'Perú', 'laboral', 'derechos', 'trabajador'],
    readingTime: 7,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug);
}

export function getBlogPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter(post => post.category === category);
}

export function getBlogPostsByTag(tag: string): BlogPost[] {
  return blogPosts.filter(post => post.tags.includes(tag));
}
