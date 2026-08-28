import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ficha TÃ©cnica de la IA | JurisNexa.ai',
  description: 'Arquitectura del asistente jurÃ­dico de JurisNexa.ai: modelo, RAG hÃ­brido, fuente de normativas, embeddings, vector database y pipeline anti-alucinaciÃ³n.',
  alternates: {
    canonical: '/ia',
  },
};


const sections = [
  {
    title: 'Modelo de lenguaje',
    content: [
      'JurisNexa es una arquitectura multi-proveedor (multi-LLM). El proveedor activo se selecciona por entorno (LLM_PROVIDER) entre:',
      'â€¢ OpenAI: gpt-4o-mini (por defecto)',
      'â€¢ Anthropic: Claude Sonnet 4 (2025-05-14)',
      'â€¢ Google: Gemini 3.6 Flash',
      'El modelo solo redacta la respuesta final; nunca decide quÃ© norma citar por su cuenta.',
    ],
  },
  {
    title: 'Tipo de RAG y recuperaciÃ³n',
    content: [
      'RAG hÃ­brido de dos vÃ­as que se ejecuta en paralelo:',
      '1. RecuperaciÃ³n vectorial por similitud semÃ¡ntica sobre document_chunks en Supabase/pgvector, filtrada por paÃ­s y Ã¡rea legal (RPC search_chunks, umbral de similitud 0.5).',
      '2. RecuperaciÃ³n lÃ©xica determinista sobre el corpus local en Markdown (bÃºsqueda por keywords con sinÃ³nimos, tildes y prefijos), con prioridad por artÃ­culo explÃ­citamente solicitado.',
      'El contexto recuperado alimenta al modelo junto con el anÃ¡lisis estructurado del motor. Si no hay contexto relevante, el modelo debe decir que no sabe.',
    ],
  },
  {
    title: 'Fuente de las normativas',
    content: [
      'â€¢ Chile: corpus curado descargado de la Biblioteca del Congreso Nacional de Chile (LeyChile, leychile.cl). 3.050 normas en Markdown, cada una con su metadata (identificador CL-xxxx, tÃ­tulo, rango, estado de vigencia) y enlaces oficiales por artÃ­culo (idNorma).',
      'â€¢ PerÃº: documentos semilla con artÃ­culos clave de normas oficiales (p. ej. CÃ³digo Civil, CÃ³digo del Trabajo) cargados en la base, con su paÃ­s y Ã¡rea legal.',
      'Toda respuesta judicial/legislativa cita la URL oficial del artÃ­culo (LeyChile) que la respalda.',
    ],
  },
  {
    title: 'Embeddings y vector database',
    content: [
      'â€¢ Modelo de embeddings: Google gemini-embedding-001 (3072 dimensiones), con taskType RETRIEVAL_DOCUMENT para documentos y RETRIEVAL_QUERY para consultas.',
      'â€¢ Batch de 20 textos por llamada (lÃ­mite de la API) con reintento ante rate limit (429).',
      'â€¢ Vector database: Supabase Postgres con extensiÃ³n pgvector y funciÃ³n search_chunks.',
      'â€¢ Chunking de documentos legales por artÃ­culo (regex de cabeceras), con chunking genÃ©rico de ~1000 caracteres solapados 200 y corte por lÃ­mite de oraciÃ³n para el resto del contenido.',
    ],
  },
  {
    title: 'Pipeline anti-alucinaciÃ³n',
    content: [
      'Cada consulta pasa antes de responder por un motor determinista (sin LLM) que produce un anÃ¡lisis estructurado:',
      '1. CalificaciÃ³n legal: extracciÃ³n de hechos, fechas y figuras (despido, usurpaciÃ³n, prescripciÃ³n).',
      '2. VerificaciÃ³n de normas contra el corpus local: cada referencia se valida contra la ley y el artÃ­culo reales (estado: VIGENTE/derogada).',
      '3. Guard de alucinaciones: cualquier norma que no existe en el corpus se marca NO VERIFICADA y se prohÃ­be afirmar su contenido o vigencia.',
      '4. AnÃ¡lisis temporal: plazos de prescripciÃ³n con su artÃ­culo verificable.',
      '5. Puntaje de confianza legal (0-99): se penaliza la confianza cuando faltan normas verificadas, fechas o figura jurÃ­dica. Confianza ALTA/MEDIA/BAJA.',
      '6. Reglas de redacciÃ³n: no citar sin fuente, no inventar artÃ­culos, no afirmar vigencia sin verificar, recomendar abogado.',
      'La salida del modelo estÃ¡ restringida por estas capas: puede redactar el resumen, pero las citas concretas provienen del motor.',
    ],
  },
  {
    title: 'Trazabilidad de fuentes',
    content: [
      'Cada respuesta incluye la lista de fuentes usadas (tÃ­tulo de la norma, nÃºmero de artÃ­culo y enlace oficial). Los chunks recuperados conservan su metadata de origen (source, tÃ­tulo, paÃ­s, Ã¡rea) y se muestran inline en la respuesta del chat.',
    ],
  },
];

export default function FichaTecnicaPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <LandingHeader activePage="/ia" />

      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-bold text-white mb-4">Ficha tÃ©cnica de la IA</h1>
        <p className="text-zinc-400 mb-10 text-lg">
          CÃ³mo funciona el asistente jurÃ­dico de JurisNexa por dentro: arquitectura, fuentes y controles contra la alucinaciÃ³n.
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
            Esta ficha se actualiza cuando cambia la arquitectura. JurisNexa publica su pipeline porque la confianza de un servicio jurÃ­dico depende de que sus fuentes sean verificables.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}