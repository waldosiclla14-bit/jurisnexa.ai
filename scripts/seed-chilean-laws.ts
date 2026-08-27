import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabase = createClient(
  envVars.SUPABASE_URL || '',
  envVars.SUPABASE_SERVICE_KEY || envVars.SUPABASE_ANON_KEY || ''
);

const genAI = new GoogleGenerativeAI(envVars.GEMINI_API_KEY || '');
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

const LEGALIZE_CL_DIR = path.join(process.env.TEMP || '', 'legalize-cl', 'cl');

// Chilean ministry -> legal area mapping
const MINISTRY_AREA_MAP: Record<string, string> = {
  'MINISTERIO DE JUSTICIA': 'civil',
  'MINISTERIO DEL TRABAJO': 'laboral',
  'MINISTERIO DE HACIENDA': 'tributario',
  'MINISTERIO DEL INTERIOR': 'constitucional',
  'MINISTERIO DE ECONOMIA': 'comercial',
  'MINISTERIO DE EDUCACION': 'constitucional',
  'MINISTERIO DE SALUD': 'constitucional',
  'MINISTERIO DEL TRABAJO Y PREVISION SOCIAL': 'laboral',
  'MINISTERIO DE VIVIENDA': 'inmobiliario',
  'MINISTERIO DE OBRAS PUBLICAS': 'administrativo',
  'MINISTERIO DE TRANSPORTES': 'transito',
  'MINISTERIO DEL MEDIO AMBIENTE': 'ambiental',
  'MINISTERIO DE AGRICULTURA': 'ambiental',
  'MINISTERIO DE DEFENSA': 'administrativo',
  'MINISTERIO DE RELACIONES EXTERIORES': 'constitucional',
  'MINISTERIO DE ECONOMIA, FOMENTO Y TURISMO': 'comercial',
  'MINISTERIO DE ECONOMIA Y REACTIVACION': 'comercial',
};

// Title keyword -> legal area mapping
const TITLE_KEYWORD_MAP: Array<[string, string]> = [
  ['CODIGO PENAL', 'penal'],
  ['PENAL', 'penal'],
  ['CODIGO CIVIL', 'civil'],
  ['CIVIL', 'civil'],
  ['TRABAJO', 'laboral'],
  ['LABORAL', 'laboral'],
  ['REMUNERACION', 'laboral'],
  ['JORNADA', 'laboral'],
  ['DESPIDO', 'laboral'],
  ['CONTRATO DE TRABAJO', 'laboral'],
  ['FAMILIA', 'familia'],
  ['MATRIMONIO', 'familia'],
  ['DIVORCIO', 'familia'],
  ['ALIMENTOS', 'familia'],
  ['ADOPCION', 'familia'],
  ['TRIBUTARIO', 'tributario'],
  ['TRIBUTARIA', 'tributario'],
  ['IMPUESTO', 'tributario'],
  ['IVA', 'tributario'],
  ['RENTA', 'tributario'],
  ['COMERCIAL', 'comercial'],
  ['COMERCIO', 'comercial'],
  ['SOCIEDAD', 'societario'],
  ['SOCIEDADES', 'societario'],
  ['CONSTITUCION', 'constitucional'],
  ['CONSTITUCIONAL', 'constitucional'],
  ['DERECHOS FUNDAMENTALES', 'constitucional'],
  ['LIBERTAD', 'constitucional'],
  ['ADMINISTRATIV', 'administrativo'],
  ['FUNCIONARIO', 'administrativo'],
  ['SERVICIO PUBLICO', 'administrativo'],
  ['CONSUMIDOR', 'consumidor'],
  ['PROTECCION', 'consumidor'],
  ['INMOBILIARI', 'inmobiliario'],
  ['VIVIENDA', 'inmobiliario'],
  ['PROPIEDAD', 'inmobiliario'],
  ['MIGRATORI', 'migratorio'],
  ['EXTRANJERI', 'migratorio'],
  ['TRANSITO', 'transito'],
  ['VEHICUL', 'transito'],
  ['PROPIEDAD INTELECTUAL', 'propiedad_intelectual'],
  ['PATENTE', 'propiedad_intelectual'],
  ['MARCAS', 'propiedad_intelectual'],
  ['AMBIENTAL', 'ambiental'],
  ['MEDIO AMBIENTE', 'ambiental'],
  ['PROCESAL', 'procesal'],
  ['JUICIO', 'procesal'],
  ['PREVISIO', 'previsional'],
  ['PENSION', 'previsional'],
  ['AFP', 'previsional'],
  ['SUCESION', 'sucesiones'],
  ['HERENCIA', 'sucesiones'],
  ['TESTAMENTO', 'sucesiones'],
];

function classifyLegalArea(title: string, department: string, content: string): string {
  // First try ministry-based classification
  const deptUpper = (department || '').toUpperCase();
  for (const [ministry, area] of Object.entries(MINISTRY_AREA_MAP)) {
    if (deptUpper.includes(ministry)) return area;
  }

  // Then try title keyword matching
  const titleUpper = (title || '').toUpperCase();
  for (const [keyword, area] of TITLE_KEYWORD_MAP) {
    if (titleUpper.includes(keyword)) return area;
  }

  // Finally try content (first 500 chars)
  const contentUpper = (content || '').substring(0, 500).toUpperCase();
  for (const [keyword, area] of TITLE_KEYWORD_MAP) {
    if (contentUpper.includes(keyword)) return area;
  }

  return 'civil'; // default
}

function parseFrontmatter(content: string): { metadata: Record<string, string>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { metadata: {}, body: content };

  const metadata: Record<string, string> = {};
  match[1].split(/\r?\n/).forEach(line => {
    const m = line.match(/^([^:]+):\s*"?([^"]*)"?\s*$/);
    if (m) metadata[m[1].trim()] = m[2].trim();
  });

  return { metadata, body: match[2].trim() };
}

function chunkText(text: string, maxLen = 1500): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > maxLen && current.length > 50) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += '\n\n' + para;
    }
  }
  if (current.trim().length > 50) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text.substring(0, maxLen)];
}

let requestCount = 0;

async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.replace(/\n/g, ' ').trim().substring(0, 2000);
  const result = await embeddingModel.embedContent(cleanText);
  requestCount++;
  return result.embedding.values;
}

function computeHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Prioritized files: major codes and important laws
const PRIORITY_KEYWORDS = [
  'CODIGO CIVIL', 'CODIGO PENAL', 'CODIGO DEL TRABAJO', 'CODIGO DE COMERCIO',
  'CODIGO DE PROCEDIMIENTO', 'CODIGO TRIBUTARIO', 'CODIGO SANITARIO',
  'CODIGO DEL AGUA', 'CODIGO MINERO', 'CODIGO DE AGUAS',
  'CONSTITUCION', 'LEY DE ARRENDAMIENTO', 'LEY DE QUIEBRAS',
  'LEY DE BANCOS', 'LEY GENERAL DE BANCOS', 'LEY DE IMPUESTO',
  'DFL', 'DF 1', 'LEY ORGANICA', 'LEY DE PROCESO',
  'PROTECCION DE DATOS', 'HABEAS DATA', 'LEY DE CONSUMIDOR',
  'CODIGO DE BUENAS PRACTICAS', 'LEY DE INSOLVENCIA',
];

async function main() {
  console.log('=== Ingestion de Leyes Chilenas (legalize-cl) ===');
  console.log(`Directorio: ${LEGALIZE_CL_DIR}`);

  if (!fs.existsSync(LEGALIZE_CL_DIR)) {
    console.error('Directorio legalize-cl no encontrado. Ejecuta primero: git clone https://github.com/legalize-dev/legalize-cl.git');
    process.exit(1);
  }

  // Get Chile country ID
  const { data: chile } = await supabase.from('countries').select('id').eq('code', 'CHILE').single();
  if (!chile) { console.error('País CHILE no encontrado en DB'); process.exit(1); }
  const chileId = chile.id;

  // Get all legal area IDs
  const { data: areas } = await supabase.from('legal_areas').select('id, slug');
  const areaMap = new Map((areas || []).map(a => [a.slug, a.id]));

  // Get existing document numbers to skip duplicates
  const { data: existingDocs } = await supabase
    .from('legal_documents')
    .select('document_number')
    .eq('country_id', chileId);
  const existingNumbers = new Set((existingDocs || []).map(d => d.document_number));

  // Read all files
  const files = fs.readdirSync(LEGALIZE_CL_DIR).filter(f => f.endsWith('.md'));
  console.log(`Total archivos: ${files.length}`);
  console.log(`Ya existentes en DB: ${existingNumbers.size}`);

  // Classify and prioritize
  const classified: Array<{
    file: string;
    title: string;
    identifier: string;
    officialNumber: string;
    pubDate: string;
    status: string;
    sourceUrl: string;
    department: string;
    area: string;
    body: string;
    isPriority: boolean;
  }> = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(LEGALIZE_CL_DIR, file), 'utf-8');
    const { metadata, body } = parseFrontmatter(content);

    const title = metadata.title || file.replace('.md', '');
    const identifier = metadata.identifier || file.replace('.md', '');
    const officialNumber = metadata.official_number || identifier;
    const pubDate = metadata.publication_date || '';
    const status = metadata.status === 'in_force' ? 'VIGENTE' : 'MODIFICADO';
    const sourceUrl = metadata.source || `https://www.bcn.cl/leychile/navegar?idNorma=${identifier.replace('CL-', '')}`;
    const department = metadata.department || '';

    if (body.length < 20) continue; // skip empty laws

    const area = classifyLegalArea(title, department, body);
    const isPriority = PRIORITY_KEYWORDS.some(kw => title.toUpperCase().includes(kw));

    classified.push({
      file, title, identifier, officialNumber, pubDate, status,
      sourceUrl, department, area, body, isPriority,
    });
  }

  // Sort: priority first, then by date
  classified.sort((a, b) => {
    if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
    return b.pubDate.localeCompare(a.pubDate);
  });

  console.log(`Leyes clasificadas: ${classified.length}`);
  console.log(`Leyes prioritarias: ${classified.filter(c => c.isPriority).length}`);

  // Process in batches
  const BATCH_SIZE = 20;
  let totalInserted = 0;
  let totalChunksInserted = 0;
  const MAX_DOCS = 500; // Process up to 500 most important laws

  const toProcess = classified.slice(0, MAX_DOCS);
  console.log(`\nProcesando ${toProcess.length} leyes (max ${MAX_DOCS})...`);

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);
    console.log(`\n--- Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toProcess.length / BATCH_SIZE)} ---`);

    for (const item of batch) {
      if (existingNumbers.has(item.officialNumber)) {
        continue; // skip duplicates
      }

      try {
        // Insert document
        const { data: doc, error: docError } = await supabase
          .from('legal_documents')
          .insert({
            country_id: chileId,
            legal_area_id: areaMap.get(item.area) || null,
            title: item.title,
            document_type: 'ley',
            document_number: item.officialNumber,
            status: item.status,
            source_url: item.sourceUrl,
            summary: item.body.substring(0, 1000),
            publication_date: item.pubDate || null,
          })
          .select('id')
          .single();

        if (docError) {
          console.error(`  Error inserting ${item.officialNumber}: ${docError.message}`);
          continue;
        }

        totalInserted++;

        // Generate chunks and embeddings for priority documents
        if (item.isPriority && item.body.length > 100) {
          const chunks = chunkText(item.body);

          for (let ci = 0; ci < Math.min(chunks.length, 5); ci++) { // max 5 chunks per doc
            try {
              const embedding = await generateEmbedding(chunks[ci]);
              await supabase.from('document_chunks').insert({
                document_id: doc.id,
                country_id: chileId,
                legal_area_id: areaMap.get(item.area) || null,
                chunk_text: chunks[ci],
                chunk_index: ci,
                embedding,
                content_hash: computeHash(chunks[ci]),
                metadata: JSON.stringify({
                  identifier: item.identifier,
                  source: 'legalize-cl',
                  official_number: item.officialNumber,
                  publication_date: item.pubDate,
                }),
              });
              totalChunksInserted++;
              await new Promise(r => setTimeout(r, 700)); // rate limit
            } catch (err: any) {
              if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
                console.log('  Rate limited, waiting 60s...');
                await new Promise(r => setTimeout(r, 60000));
              } else {
                console.error(`  Error embedding chunk ${ci}: ${err.message}`);
              }
            }
          }
        }

        if (totalInserted % 10 === 0) {
          console.log(`  Insertados: ${totalInserted} | Chunks: ${totalChunksInserted} | API calls: ${requestCount}`);
        }
      } catch (err: any) {
        console.error(`  Error processing ${item.file}: ${err.message}`);
      }
    }
  }

  // Final count
  const { count: finalDocCount } = await supabase
    .from('legal_documents')
    .select('*', { count: 'exact', head: true })
    .eq('country_id', chileId);

  const { count: finalChunkCount } = await supabase
    .from('document_chunks')
    .select('*', { count: 'exact', head: true })
    .eq('country_id', chileId);

  console.log(`\n=== COMPLETADO ===`);
  console.log(`Documentos chilenos insertados: ${totalInserted}`);
  console.log(`Chunks con embeddings: ${totalChunksInserted}`);
  console.log(`Total documentos Chile en DB: ${finalDocCount}`);
  console.log(`Total chunks Chile en DB: ${finalChunkCount}`);
  console.log(`API calls Gemini: ${requestCount}`);
}

main().catch(console.error);
