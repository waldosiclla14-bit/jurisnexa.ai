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
    if (method === 'POST') headers['Prefer'] = 'return=representation';
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

async function insertDocument(doc) {
  return supabaseQuery('legal_documents', 'POST', doc);
}

async function insertArticle(article) {
  return supabaseQuery('legal_articles', 'POST', article);
}

async function seedJurisprudencia() {
  console.log('⚖️  Sembrando jurisprudencia real verificada...\n');

  const peruId = await getCountryId('PERU');
  const laboralId = await getAreaId('laboral');
  const procesalId = await getAreaId('procesal');

  if (!peruId || !laboralId) {
    console.error('❌ Error: No se encontraron países o áreas legales. Ejecuta seed-db.js primero.');
    process.exit(1);
  }

  // ============================================================
  // DOCUMENTOS BASE (Jurisprudencia)
  // ============================================================

  const documents = [
    {
      title: 'Compilación de jurisprudencia del artículo 27 - Despido arbitrario',
      document_type: 'jurisprudencia',
      document_number: 'Compilación Art. 27 TC',
      country_id: peruId,
      legal_area_id: laboralId,
      status: 'VIGENTE',
      effective_date: '2025-05-29',
      source_url: 'https://lpderecho.pe/articulo-27-constitucion-proteccion-del-trabajador-frente-al-despido-arbitrario/',
      summary: 'Compilación de jurisprudencia del TC sobre protección del trabajador frente al despido arbitrario (Art. 27 Constitución). Incluye criterios sobre reposición vs indemnización, principio de progresividad laboral y daño moral adicional.',
    },
    {
      title: 'Casación Laboral N.° 5757-2023 Lima - Doctrina jurisprudencial sobre indemnización por despido',
      document_type: 'casacion_laboral',
      document_number: 'Cas. Lab. 5757-2023 Lima',
      country_id: peruId,
      legal_area_id: laboralId,
      status: 'VIGENTE',
      effective_date: '2025-09-04',
      source_url: 'https://img.lpderecho.pe/wp-content/uploads/2025/10/Casacion-Laboral-5757-2023-Lima-LPDerecho.pdf',
      summary: 'La Segunda Sala de Derecho Constitucional y Social Transitoria de la Corte Suprema establece diez reglas sobre indemnizaciones: despido nulo, incausado, fraudulento y arbitrario. El daño moral puede reclamarse adicionalmente a la indemnización tarifada.',
    },
    {
      title: 'Casación Laboral N.° 29553-2024 Loreto - Pérdida de confianza no es causa justa de despido',
      document_type: 'casacion_laboral',
      document_number: 'Cas. Lab. 29553-2024 Loreto',
      country_id: peruId,
      legal_area_id: laboralId,
      status: 'VIGENTE',
      effective_date: '2026-07-07',
      source_url: 'https://www.rsm.global/peru/es/news/perdida-de-confianza-e-indemnizacion-claves-de-la-casacion-ndeg-29553-2024-loreto',
      summary: 'La Cuarta Sala de la Corte Suprema establece que la pérdida de confianza no constituye por sí sola una causa justa de despido. El empleador debe sustentar el cese en causas legalmente previstas. Los trabajadores de confianza gozan de protección frente al despido arbitrario.',
    },
    {
      title: 'Casación 81-2021 - Competencia desleal como falta grave',
      document_type: 'casacion_laboral',
      document_number: 'Cas. Lab. 81-2021',
      country_id: peruId,
      legal_area_id: laboralId,
      status: 'VIGENTE',
      effective_date: '2025-05-22',
      source_url: 'https://lpderecho.pe/despido-arbitrario-criterios-configure-competencia-desleal-falta-grave-casacion-81-2021/',
      summary: 'La Corte Suprema establece los criterios para que la competencia desleal del trabajador se configure como falta grave justificativa de despido. Se requiere dolo, perjuicio al empleador y violación de deberes de lealtad.',
    },
    {
      title: 'Casación N.° 24905-2025 Piura - Límites de la casación laboral ante doble conforme',
      document_type: 'casacion_laboral',
      document_number: 'Cas. Lab. 24905-2025 Piura',
      country_id: peruId,
      legal_area_id: laboralId,
      status: 'VIGENTE',
      effective_date: '2026-03-01',
      source_url: 'https://prime.tirant.com/pe/actualidad-prime/corte-suprema-precisa-limites-de-la-casacion-laboral-ante-doble-conforme/',
      summary: 'La Corte Suprema declara improcedente el recurso de casación cuando existe doble conforme en instancias previas. Precisa los límites de la casación laboral ante la confirmación de sentencias.',
    },
    {
      title: 'Sentencia TC Exp. 04381-2024-PA/TC - Improcedencia de amparo por vía previa',
      document_type: 'sentencia_tc',
      document_number: 'Exp. 04381-2024-PA/TC',
      country_id: peruId,
      legal_area_id: procesalId,
      status: 'VIGENTE',
      effective_date: '2025-12-02',
      source_url: 'https://www.tc.gob.pe/jurisprudencia/2025/04381-2024-AA.pdf',
      summary: 'El TC declara improcedente la demanda de amparo por existencia de vía previa contencioso-administrativa. El trabajador debió agotar la vía ordinaria antes de acudir al proceso constitucional.',
    },
  ];

  const docIds = {};
  for (const doc of documents) {
    try {
      const result = await insertDocument(doc);
      const id = Array.isArray(result) ? result[0]?.id : result?.id;
      docIds[doc.document_number] = id;
      console.log(`✅ Documento: ${doc.document_number}`);
    } catch (e) {
      console.log(`⚠️  Documento ya existe o error: ${doc.document_number} — ${e.message?.substring(0, 80)}`);
    }
  }

  // ============================================================
  // ARTÍCULOS - Casación 5757-2023 (10 Reglas)
  // ============================================================

  const articles = [
    // Casación 5757-2023
    { docNumber: 'Cas. Lab. 5757-2023 Lima', number: 'Regla 1', content: 'ANTE UN DESPIDO NULO, INCAUSADO, FRAUDULENTO O ARBITRARIO, EL ACTOR PUEDE SOLICITAR TUTELA DE EFICACIA RESTITUTORIA (REPOSICIÓN) O TUTELA DE EFICACIA RESARCITORIA (INDEMNIZACIÓN TARIFADA), SEGÚN CORRESPONDA.' },
    { docNumber: 'Cas. Lab. 5757-2023 Lima', number: 'Regla 2', content: 'EL ARTÍCULO 40° DEL DECRETO SUPREMO N.° 003-97-TR REGULA QUE EL PAGO DE LAS REMUNERACIONES NO PERCIBIDAS SE DERIVAN DE UN DESPIDO NULO, FIGURA REGULADA EN EL ARTÍCULO 29° DEL MISMO CUERPO NORMATIVO.' },
    { docNumber: 'Cas. Lab. 5757-2023 Lima', number: 'Regla 3', content: 'LA CONSECUENCIA JURÍDICA, EN VIRTUD DE UN DESPIDO INJUSTIFICADO O ARBITRARIO, PREVISTA POR LEY, SE ENCUENTRA ESTIPULADA EN EL ARTÍCULO 34° DEL TEXTO ÚNICO ORDENADO DEL DECRETO SUPREMO N.° 003-97-TR.' },
    { docNumber: 'Cas. Lab. 5757-2023 Lima', number: 'Regla 4', content: 'EN VIRTUD DEL PRINCIPIO DE PROGRESIVIDAD LABORAL, EL MÁXIMO INTÉRPRETE DE LA CONSTITUCIÓN DISPUSO LA CREACIÓN DE NUEVAS MODALIDADES DE DESPIDO CUYA CONSECUENCIA TAMBIÉN ES LA DE REPONER AL TRABAJADOR EN SU CENTRO DE TRABAJO.' },
    { docNumber: 'Cas. Lab. 5757-2023 Lima', number: 'Regla 5', content: 'CORRESPONDE IMPONER LA CARGA DE PROBAR EL DAÑO MORAL INVOCADO. ANTE UN DESPIDO NULO, INCAUSADO, FRAUDULENTO O ARBITRARIO, EL DAÑO MORAL PUEDE SER RECLAMADO ADICIONALMENTE A LA INDEMNIZACIÓN TARIFADA.' },
    // Casación 29553-2024
    { docNumber: 'Cas. Lab. 29553-2024 Loreto', number: 'Criterio 1', content: 'LA PÉRDIDA DE CONFIANZA NO CONSTITUYE POR SÍ SOLA UNA CAUSA JUSTA DE DESPIDO PREVISTA EN LA LEGISLACIÓN LABORAL PERUANA. EL EMPLEADOR DEBE SUSTENTAR EL CESE EN ALGUNA DE LAS CAUSAS PREVISTAS EXPRESAMENTE POR LA LEY.' },
    { docNumber: 'Cas. Lab. 29553-2024 Loreto', number: 'Criterio 2', content: 'LA DECISIÓN EMPRESARIAL DEBE SUSTENTARSE EN HECHOS OBJETIVOS Y VERIFICABLES QUE PERMITAN DEMOSTRAR LA EXISTENCIA DE UNA FALTA O CAUSA LEGAL QUE JUSTIFIQUE LA EXTINCIÓN DEL VÍNCULO LABORAL.' },
    { docNumber: 'Cas. Lab. 29553-2024 Loreto', number: 'Criterio 3', content: 'LOS TRABAJADORES DE CONFIANZA TAMBIÉN GOZAN DE PROTECCIÓN FRENTE AL DESPIDO ARBITRARIO. SI BIEN OCUPAN CARGOS DE ESPECIAL RESPONSABILIDAD, ELLO NO IMPLICA LA PÉRDIDA DE LAS GARANTÍAS MÍNIMAS RECONOCIDAS POR LA LEGISLACIÓN LABORAL.' },
    { docNumber: 'Cas. Lab. 29553-2024 Loreto', number: 'Criterio 4', content: 'CUANDO EL EMPLEADOR NO ACREDITA UNA CAUSA JUSTA PREVISTA EN LA NORMATIVA LABORAL, EL CESE PUEDE SER CALIFICADO COMO DESPIDO ARBITRARIO, DANDO LUGAR AL PAGO DE LA INDEMNIZACIÓN CORRESPONDIENTE.' },
    { docNumber: 'Cas. Lab. 29553-2024 Loreto', number: 'Criterio 5', content: 'LAS EMPRESAS DEBEN REVISAR SUS PROCEDIMIENTOS DE DESVINCULACIÓN. ESTE CRITERIO REAFIRMA LA IMPORTANCIA DE DOCUMENTAR ADECUADAMENTE LOS HECHOS QUE MOTIVAN UN DESPIDO Y DE VERIFICAR QUE LA MEDIDA SE ENCUENTRE RESPALDADA POR UNA CAUSAL LEGAL.' },
    // TC Exp. 04381-2024
    { docNumber: 'Exp. 04381-2024-PA/TC', number: 'Fundamento 1', content: 'NO PROCEDEN LOS PROCESOS CONSTITUCIONALES CUANDO EL AGRAVIADO HAYA RECURRIDO PREVIAMENTE A OTRO PROCESO JUDICIAL PARA PEDIR TUTELA RESPECTO DE SU DERECHO CONSTITUCIONAL (ART. 7 INC. 3 NCPC).', areaId: procesalId },
    { docNumber: 'Exp. 04381-2024-PA/TC', number: 'Fundamento 2', content: 'EL ACTOR PREVIAMENTE HA INTERPUESTO UNA DEMANDA EN LA VÍA ORDINARIA CONTENCIOSO-ADMINISTRATIVA, POR LO QUE LA DEMANDA DE AMPARO DEBE SER DESESTIMADA CONFORME AL NUMERAL 3 DEL ARTÍCULO 7 DEL NUEVO CÓDIGO PROCESAL CONSTITUCIONAL.', areaId: procesalId },
  ];

  let articlesInserted = 0;
  for (const art of articles) {
    try {
      await insertArticle({
        document_id: docIds[art.docNumber],
        article_number: art.number,
        content: art.content,
      });
      articlesInserted++;
    } catch (e) {
      console.log(`⚠️  Artículo ya existe o error: ${art.number} — ${e.message?.substring(0, 80)}`);
    }
  }

  console.log(`\n✅ Jurisprudencia sembrada: ${Object.keys(docIds).length} documentos, ${articlesInserted} artículos/criterios`);
  console.log('🔗 Fuentes verificadas: tc.gob.pe, lpderecho.pe, rsm.global, tirant.com');
}

seedJurisprudencia().catch(console.error);
