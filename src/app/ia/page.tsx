import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ficha Técnica de la IA | JurisNexa.ai',
  description: 'Arquitectura del asistente jurídico de JurisNexa.ai: modelo, RAG híbrido, fuente de normativas, embeddings, vector database y pipeline anti-alucinación.',
  alternates: {
    canonical: '/ia',
  },
};


const sections = [
  {
    title: 'Modelo de lenguaje',
    content: [
      'JurisNexa es una arquitectura multi-proveedor (multi-LLM). El proveedor activo se selecciona por entorno (LLM_PROVIDER) entre:',
      '• OpenAI: gpt-4o-mini (por defecto)',
      '• Anthropic: Claude Sonnet 4 (2025-05-14)',
      '• Google: Gemini 3.6 Flash',
      'El modelo solo redacta la respuesta final; nunca decide qué norma citar por su cuenta.',
    ],
  },
  {
    title: 'Tipo de RAG y recuperación',
    content: [
      'RAG híbrido de dos vías que se ejecuta en paralelo:',
      '1. Recuperación vectorial por similitud semántica sobre document_chunks en Supabase/pgvector, filtrada por país y área legal (RPC search_chunks, umbral de similitud 0.5).',
      '2. Recuperación léxica determinista sobre el corpus local en Markdown (búsqueda por keywords con sinónimos, tildes y prefijos), con prioridad por artículo explícitamente solicitado.',
      'El contexto recuperado alimenta al modelo junto con el análisis estructurado del motor. Si no hay contexto relevante, el modelo debe decir que no sabe.',
    ],
  },
  {
    title: 'Fuente de las normativas',
    content: [
      '• Chile: corpus curado descargado de la Biblioteca del Congreso Nacional de Chile (LeyChile, leychile.cl). 3.050 normas en Markdown, cada una con su metadata (identificador CL-xxxx, título, rango, estado de vigencia) y enlaces oficiales por artículo (idNorma).',
      '• Perú: documentos semilla con artículos clave de normas oficiales (p. ej. Código Civil, Código del Trabajo) cargados en la base, con su país y área legal.',
      'Toda respuesta judicial/legislativa cita la URL oficial del artículo (LeyChile) que la respalda.',
    ],
  },
  {
    title: 'Embeddings y vector database',
    content: [
      '• Modelo de embeddings: Google gemini-embedding-001 (3072 dimensiones), con taskType RETRIEVAL_DOCUMENT para documentos y RETRIEVAL_QUERY para consultas.',
      '• Batch de 20 textos por llamada (límite de la API) con reintento ante rate limit (429).',
      '• Vector database: Supabase Postgres con extensión pgvector y función search_chunks.',
      '• Chunking de documentos legales por artículo (regex de cabeceras), con chunking genérico de ~1000 caracteres solapados 200 y corte por límite de oración para el resto del contenido.',
    ],
  },
  {
    title: 'Pipeline anti-alucinación',
    content: [
      'Cada consulta pasa antes de responder por un motor determinista (sin LLM) que produce un análisis estructurado:',
      '1. Calificación legal: extracción de hechos, fechas y figuras (despido, usurpación, prescripción).',
      '2. Verificación de normas contra el corpus local: cada referencia se valida contra la ley y el artículo reales (estado: VIGENTE/derogada).',
      '3. Guard de alucinaciones: cualquier norma que no existe en el corpus se marca NO VERIFICADA y se prohíbe afirmar su contenido o vigencia.',
      '4. Análisis temporal: plazos de prescripción con su artículo verificable.',
      '5. Puntaje de confianza legal (0-99): se penaliza la confianza cuando faltan normas verificadas, fechas o figura jurídica. Confianza ALTA/MEDIA/BAJA.',
      '6. Reglas de redacción: no citar sin fuente, no inventar artículos, no afirmar vigencia sin verificar, recomendar abogado.',
      'La salida del modelo está restringida por estas capas: puede redactar el resumen, pero las citas concretas provienen del motor.',
    ],
  },
  {
    title: 'Trazabilidad de fuentes',
    content: [
      'Cada respuesta incluye la lista de fuentes usadas (título de la norma, número de artículo y enlace oficial). Los chunks recuperados conservan su metadata de origen (source, título, país, área) y se muestran inline en la respuesta del chat.',
    ],
  },
];

export default function FichaTecnicaPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <LandingHeader activePage="/ia" />

      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-bold text-white mb-4">Ficha técnica de la IA</h1>
        <p className="text-zinc-400 mb-10 text-lg">
          Cómo funciona el asistente jurídico de JurisNexa por dentro: arquitectura, fuentes y controles contra la alucinación.
        </p>

        <div className="space-y-10">
          {sections.map(section => (
            <section key={section.title} className="p-6 bg-zinc-800/40 border border-zinc-700/60 rounded-xl">
              <h2 className="text-xl font-semibold text-white mb-4">{section.title}</h2>
              <div className="space-y-2 text-zinc-400 text-sm leading-relaxed">
                {section.content.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">Transparencia</h3>
          <p className="text-zinc-400 text-sm">
            Esta ficha se actualiza cuando cambia la arquitectura. JurisNexa publica su pipeline porque la confianza de un servicio jurídico depende de que sus fuentes sean verificables.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}