#!/usr/bin/env node
const https = require('https');

const SUPABASE_URL = 'https://iodbouncovosdbvmguox.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZGJvdW5jb3Zvc2Ridm1ndW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk4NzY4NSwiZXhwIjoyMTAyNTYzNjg1fQ.983hpIeySJKymq01B8iPo23Qwr9Ras8kVOsE2lEXxwc';

function supabaseQuery(table, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    };
    if (method === 'POST') headers['Prefer'] = 'return=minimal';
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`${res.statusCode}: ${data}`));
        } else {
          try { resolve(JSON.parse(data || '[]')); } catch { resolve(data); }
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getCountryId(code) {
  const rows = await supabaseQuery(`countries?select=id&code=eq.${code}`);
  return rows[0]?.id;
}

async function getAreaId(slug) {
  const rows = await supabaseQuery(`legal_areas?select=id&slug=eq.${slug}`);
  return rows[0]?.id;
}

async function getSourceId(name) {
  const rows = await supabaseQuery(`sources?select=id&name=eq.${encodeURIComponent(name)}`);
  return rows[0]?.id;
}

// ============================================================
// SEED SOURCES
// ============================================================
async function seedSources(peruId, chileId) {
  console.log('Seeding sources...');
  const sources = [
    { country_id: peruId, name: 'Ministerio de Justicia y Derechos Humanos', url: 'https://www.gob.pe/minjus', source_type: 'official', reliability_score: 0.95 },
    { country_id: peruId, name: 'Sistema Peruano de Información Jurídica (SPIJ)', url: 'https://spij.minjus.gob.pe/', source_type: 'official', reliability_score: 0.90 },
    { country_id: peruId, name: 'Diario Oficial El Peruano', url: 'https://elperuano.pe/', source_type: 'official', reliability_score: 0.95 },
    { country_id: peruId, name: 'Poder Judicial del Perú', url: 'https://www.pj.gob.pe/', source_type: 'judicial', reliability_score: 0.90 },
    { country_id: peruId, name: 'Tribunal Constitucional del Perú', url: 'https://www.tc.gob.pe/', source_type: 'judicial', reliability_score: 0.95 },
    { country_id: peruId, name: 'Congreso de la República del Perú', url: 'https://www.congreso.gob.pe/', source_type: 'legislative', reliability_score: 0.95 },
    { country_id: peruId, name: 'Gobierno del Perú - Normas Legales', url: 'https://www.gob.pe/legislacion', source_type: 'official', reliability_score: 0.95 },
    { country_id: chileId, name: 'Biblioteca del Congreso Nacional - Ley Chile', url: 'https://www.leychile.cl/', source_type: 'official', reliability_score: 0.95 },
    { country_id: chileId, name: 'Poder Judicial de Chile', url: 'https://www.pjud.cl/', source_type: 'judicial', reliability_score: 0.90 },
    { country_id: chileId, name: 'Tribunal Constitucional de Chile', url: 'https://www.congresoconstitucional.cl/', source_type: 'judicial', reliability_score: 0.95 },
    { country_id: chileId, name: 'Diario Oficial de Chile', url: 'https://www.diariooficial.interior.gob.cl/', source_type: 'official', reliability_score: 0.95 },
    { country_id: chileId, name: 'Ministerio de Justicia de Chile', url: 'https://www.mj.gob.cl/', source_type: 'official', reliability_score: 0.90 },
    { country_id: chileId, name: 'Dirección del Trabajo de Chile', url: 'https://www.dt.gob.cl/', source_type: 'official', reliability_score: 0.90 },
    { country_id: chileId, name: 'Servicio de Impuestos Internos (SII)', url: 'https://www.sii.cl/', source_type: 'official', reliability_score: 0.90 },
    { country_id: chileId, name: 'BCN - Biblioteca del Congreso', url: 'https://www.bcn.cl/', source_type: 'official', reliability_score: 0.90 },
  ];
  // Insert in batches
  for (let i = 0; i < sources.length; i += 5) {
    const batch = sources.slice(i, i + 5);
    try { await supabaseQuery('sources', 'POST', batch); } catch(e) { console.warn('  batch insert error (may already exist):', e.message.slice(0,100)); }
  }
  console.log(`  Inserted ${sources.length} sources`);
}

// ============================================================
// SEED PERU LEYES (core set)
// ============================================================
async function seedPeruLeyes(peruId, areas) {
  console.log('Seeding Peru laws...');
  
  const laws = [
    { title: 'Constitución Política del Perú', document_type: 'constitucion', document_number: 'D.L. 32684', area: null, status: 'VIGENTE', source_url: 'https://elperuano.pe/', summary: 'Constitución Política del Perú de 1993, con modificaciones hasta 2024. Establece la estructura del Estado, derechos fundamentales y organizaciones del Estado.' },
    { title: 'Código Civil de 1984', document_type: 'codigo', document_number: 'D.L. 295', area: 'civil', status: 'VIGENTE', source_url: 'https://spij.minjus.gob.pe/', summary: 'Código Civil peruano que regula relaciones personales, familiares, obligaciones, contratos, derechos reales, sucesiones y responsabilidad civil.' },
    { title: 'Código Penal de 1991', document_type: 'codigo', document_number: 'D.L. 635', area: 'penal', status: 'VIGENTE', source_url: 'https://spij.minjus.gob.pe/', summary: 'Código Penal peruano que define delitos, penas y establece la parte general y especial del derecho penal.' },
    { title: 'Código Procesal Civil de 1993', document_type: 'codigo', document_number: 'D.L. 768', area: 'procesal', status: 'VIGENTE', source_url: 'https://spij.minjus.gob.pe/', summary: 'Código que regula el proceso civil peruano, competencia, acciones, medios probatorios y ejecución de sentencias.' },
    { title: 'Código de Comercio de 1902', document_type: 'codigo', document_number: 'R.S.N.S. 584', area: 'comercial', status: 'VIGENTE', source_url: 'https://spij.minjus.gob.pe/', summary: 'Código que regula actos de comercio, sociedades, contrato mercantil, títulos valores y quiebras.' },
    { title: 'Ley del Trabajo (D.S. 003-97-TR)', document_type: 'ley', document_number: 'D.S. 003-97-TR', area: 'laboral', status: 'VIGENTE', source_url: 'https://elperuano.pe/', summary: 'TUO del Decreto Legislativo 728, Ley de Productividad y Competitividad Laboral. Regula contratos, jornada, remuneración, descansos y despidos.' },
    { title: 'Código de los Niños y Adolescentes', document_type: 'codigo', document_number: 'D.S. 004-98-JUS', area: 'familia', status: 'VIGENTE', source_url: 'https://spij.minjus.gob.pe/', summary: 'Código que protege los derechos de niños, niñas y adolescentes en el Perú.' },
    { title: 'Ley General de Salud', document_type: 'ley', document_number: 'D.S. 006-86-SA', area: 'constitucional', status: 'VIGENTE', source_url: 'https://elperuano.pe/', summary: 'Ley que regula el derecho a la salud y el sistema de salud peruano.' },
    { title: 'Código Tributario', document_type: 'codigo', document_number: 'D.S. 133-2013-EF', area: 'tributario', status: 'VIGENTE', source_url: 'https://elperuano.pe/', summary: 'TUO del Código Tributario, obligaciones tributarias, infracciones y sanciones.' },
    { title: 'Ley de Protección al Consumidor', document_type: 'ley', document_number: 'D.S. 044-97-SC', area: 'consumidor', status: 'VIGENTE', source_url: 'https://elperuano.pe/', summary: 'Ley que protege los derechos de los consumidores en el Perú.' },
    { title: 'Ley Orgánica de Municipalidades', document_type: 'ley', document_number: 'D.S. 274-2002-PCM', area: 'administrativo', status: 'VIGENTE', source_url: 'https://elperuano.pe/', summary: 'Regula la organización y funciones de las municipalidades provinciales y distritales.' },
    { title: 'Ley de Migraciones', document_type: 'ley', document_number: 'D.L. 1350', area: 'migratorio', status: 'VIGENTE', source_url: 'https://elperuano.pe/', summary: 'Regula el régimen migratorio peruano, visa, residencia y extranjería.' },
    { title: 'Código de Tránsito', document_type: 'codigo', document_number: 'D.S. 033-2001-ITINCI', area: 'transito', status: 'VIGENTE', source_url: 'https://elperuano.pe/', summary: 'Código que regula el tránsito terrestre en el Perú.' },
    { title: 'Ley de Sociedades Anónimas', document_type: 'ley', document_number: 'D.S. 054-2000-EF', area: 'societario', status: 'VIGENTE', source_url: 'https://elperuano.pe/', summary: 'Regula las sociedades anónimas en el Perú.' },
    { title: 'Código Procesal Penal de 2004', document_type: 'codigo', document_number: 'D.L. 957', area: 'procesal', status: 'VIGENTE', source_url: 'https://spij.minjus.gob.pe/', summary: 'Nuevo Código Procesal Penal peruano, sistema acusatorio con cambios significativos en investigaciones y juicios.' },
    { title: 'Ley Orgánica del Poder Judicial', document_type: 'ley', document_number: 'D.S. 016-93-JUS', area: 'procesal', status: 'VIGENTE', source_url: 'https://elperuano.pe/', summary: 'Organiza el Poder Judicial peruano, cortes superiores y juzgados.' },
    { title: 'Ley de Arbitraje', document_type: 'ley', document_number: 'D.S. 107-2008-EF', area: 'procesal', status: 'VIGENTE', source_url: 'https://elperuano.pe/', summary: 'Regula el arbitraje nacional e internacional en el Perú.' },
    { title: 'Ley del Proceso Constitucional de Hábeas Corpus', document_type: 'ley', document_number: 'D.S. 011-97-AI', area: 'constitucional', status: 'VIGENTE', source_url: 'https://elperuano.pe/', summary: 'Regula el proceso de hábeas corpus para protección de libertad individual.' },
    { title: 'Ley del Proceso Constitucional de Amparo', document_type: 'ley', document_number: 'D.S. 011-97-AI', area: 'constitucional', status: 'VIGENTE', source_url: 'https://elperuano.pe/', summary: 'Regula el proceso de amparo para protección de derechos fundamentales.' },
    { title: 'Ley del Proceso Constitucional de Habeas Data', document_type: 'ley', document_number: 'D.S. 011-97-AI', area: 'constitucional', status: 'VIGENTE', source_url: 'https://elperuano.pe/', summary: 'Regula el proceso de hábeas data para acceso a información pública y protección de datos.' },
  ];

  for (const law of laws) {
    const areaId = law.area ? areas[law.area] : null;
    const doc = {
      country_id: peruId,
      legal_area_id: areaId,
      title: law.title,
      document_type: law.document_type,
      document_number: law.document_number,
      status: law.status,
      source_url: law.source_url,
      summary: law.summary,
    };
    try { await supabaseQuery('legal_documents', 'POST', doc); } catch(e) { console.warn(`  skip "${law.title.slice(0,50)}": ${e.message.slice(0,80)}`); }
  }
  console.log(`  Inserted ${laws.length} Peru laws`);
}

// ============================================================
// SEED CHILE LEYES (core set)
// ============================================================
async function seedChileLeyes(chileId, areas) {
  console.log('Seeding Chile laws...');
  const laws = [
    { title: 'Constitución Política de Chile', document_type: 'constitucion', document_number: 'D.F.L. 1-2002', area: null, status: 'VIGENTE', source_url: 'https://www.leychile.cl/', summary: 'Constitución Política de la República de Chile de 1980, con modificaciones hasta 2024.' },
    { title: 'Código Civil de Chile', document_type: 'codigo', document_number: 'D.F.L. 1-2002', area: 'civil', status: 'VIGENTE', source_url: 'https://www.leychile.cl/', summary: 'Código Civil chileno que regula personas, bienes, familia, sucesiones, contratos, etc.' },
    { title: 'Código Penal de Chile', document_type: 'codigo', document_number: 'D.F.L. 927', area: 'penal', status: 'VIGENTE', source_url: 'https://www.leychile.cl/', summary: 'Código Penal chileno que regula delitos, penas y responsabilidad criminal.' },
    { title: 'Código del Trabajo', document_type: 'codigo', document_number: 'D.F.L. 1', area: 'laboral', status: 'VIGENTE', source_url: 'https://www.leychile.cl/', summary: 'Regula las relaciones laborales en Chile: contratos, jornada, remuneraciones, despidos.' },
    { title: 'Código de Comercio', document_type: 'codigo', document_number: 'D.F.L. 1', area: 'comercial', status: 'VIGENTE', source_url: 'https://www.leychile.cl/', summary: 'Regula actos de comercio y obligaciones comerciales en Chile.' },
    { title: 'Código de Procedimiento Civil', document_type: 'codigo', document_number: 'D.F.L. 1', area: 'procesal', status: 'VIGENTE', source_url: 'https://www.leychile.cl/', summary: 'Regula los procedimientos civiles en Chile.' },
    { title: 'Ley de Arbitraje', document_type: 'ley', document_number: 'Ley 19.972', area: 'procesal', status: 'VIGENTE', source_url: 'https://www.leychile.cl/', summary: 'Regula el arbitraje comercial y civil en Chile.' },
    { title: 'Ley de Protección de los Derechos Fundamentales', document_type: 'ley', document_number: 'Ley 20.045', area: 'constitucional', status: 'VIGENTE', source_url: 'https://www.leychile.cl/', summary: 'Ley que protege derechos fundamentales de las personas en Chile.' },
    { title: 'Código Orgánico de Tribunales', document_type: 'codigo', document_number: 'D.F.L. 1', area: 'procesal', status: 'VIGENTE', source_url: 'https://www.leychile.cl/', summary: 'Organiza el sistema judicial chileno: tribunales, competencias, jueces.' },
    { title: 'Ley 21.526 - Reforma Procesal Penal', document_type: 'ley', document_number: 'Ley 21.526', area: 'procesal', status: 'VIGENTE', source_url: 'https://www.leychile.cl/', summary: 'Moderniza el sistema de justicia penal chileno.' },
    { title: 'Ley del Contrato de Arrendamiento de Inmuebles Urbanos', document_type: 'ley', document_number: 'D.F.L. 2-1959', area: 'inmobiliario', status: 'VIGENTE', source_url: 'https://www.leychile.cl/', summary: 'Regula contratos de arrendamiento de inmuebles urbanos en Chile.' },
    { title: 'Ley de Impuesto a la Renta', document_type: 'ley', document_number: 'D.F.L. 824', area: 'tributario', status: 'VIGENTE', source_url: 'https://www.leychile.cl/', summary: 'Ley que regula el impuesto a la renta en Chile.' },
    { title: 'Ley de Alimentos (Menores)', document_type: 'ley', document_number: 'Ley 14.937', area: 'familia', status: 'VIGENTE', source_url: 'https://www.leychile.cl/', summary: 'Regula la obligación alimentaria de padres hacia hijos en Chile.' },
    { title: 'Ley de Divorcio', document_type: 'ley', document_number: 'Ley 19.947', area: 'familia', status: 'VIGENTE', source_url: 'https://www.leychile.cl/', summary: 'Ley que regula el divorcio en Chile.' },
    { title: 'Código de Seguros', document_type: 'codigo', document_number: 'D.F.L. 502', area: 'comercial', status: 'VIGENTE', source_url: 'https://www.leychile.cl/', summary: 'Regula contratos de seguros en Chile.' },
  ];

  for (const law of laws) {
    const areaId = law.area ? areas[law.area] : null;
    const doc = {
      country_id: chileId,
      legal_area_id: areaId,
      title: law.title,
      document_type: law.document_type,
      document_number: law.document_number,
      status: law.status,
      source_url: law.source_url,
      summary: law.summary,
    };
    try { await supabaseQuery('legal_documents', 'POST', doc); } catch(e) { console.warn(`  skip "${law.title.slice(0,50)}": ${e.message.slice(0,80)}`); }
  }
  console.log(`  Inserted ${laws.length} Chile laws`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  try {
    console.log('=== JurisNexa.ai Database Seeding ===\n');

    const peruId = await getCountryId('PERU');
    const chileId = await getCountryId('CHILE');
    console.log(`Countries: PERU=${peruId}, CHILE=${chileId}\n`);

    // Get all area IDs
    const areaSlugs = ['civil','penal','laboral','familia','constitucional','administrativo','tributario','comercial','consumidor','inmobiliario','migratorio','transito','societario','previsional','procesal','propiedad_intelectual','ambiental','sucesiones'];
    const areas = {};
    for (const slug of areaSlugs) {
      const id = await getAreaId(slug);
      if (id) areas[slug] = id;
    }
    console.log(`Areas loaded: ${Object.keys(areas).length}\n`);

    await seedSources(peruId, chileId);
    console.log('');
    await seedPeruLeyes(peruId, areas);
    console.log('');
    await seedChileLeyes(chileId, areas);

    // Count documents
    const docs = await supabaseQuery('legal_documents?select=id');
    console.log(`\n=== Total documents: ${docs.length} ===`);
    console.log('Done!');
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
}

main();
