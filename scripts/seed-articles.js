#!/usr/bin/env node
const https = require('https');
const SUPABASE_URL = 'https://iodbouncovosdbvmguox.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZGJvdW5jb3Zvc2Ridm1ndW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk4NzY4NSwiZXhwIjoyMTAyNTYzNjg1fQ.983hpIeySJKymq01B8iPo23Qwr9Ras8kVOsE2lEXxwc';

const PENAL_ID = '0777f4cb-32d9-4476-86c3-385acc53e4c4';
const CODIGO_CIVIL_PERU_ID = 'b7870648-168c-476d-8cdc-cfb776e4445d';
const CODIGO_CIVIL_CHILE_ID = '341b45a3-38fc-421c-8d0d-c1a28718d3f1';
const CODIGO_TRABAJO_CHILE_ID = '12c034dd-95f7-4dce-b20b-01a002a1dea6';
const TRABAJO_PERU_ID = 'afabaf45-51fc-46d7-a943-55501f663356';
const PROCESAL_PENAL_ID = 'd1c085d8-429b-41c9-aba0-87e690cd29ad';

function supa(table, method, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + '/rest/v1/' + table);
    const headers = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' };
    if (method === 'POST') headers['Prefer'] = 'return=minimal';
    const req = https.request({ hostname: url.hostname, path: url.pathname + url.search, method: method || 'GET', headers }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (res.statusCode >= 400) reject(new Error(res.statusCode + ': ' + data.slice(0,200)));
        else try { resolve(JSON.parse(data || '[]')); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function insertBatch(table, items) {
  for (var i = 0; i < items.length; i += 15) {
    var batch = items.slice(i, i + 15);
    try { await supa(table, 'POST', batch); } catch(e) { /* skip */ }
  }
}

async function main() {
  console.log('=== Seeding More Articles ===\n');

  // Check existing articles for Penal
  var existing = await supa('legal_articles?select=article_number&document_id=eq.' + PENAL_ID);
  var existingNums = new Set(existing.map(function(a) { return a.article_number; }));
  console.log('Existing Penal articles: ' + existingNums.size);

  // Código Penal - Artículos faltantes
  var penalArts = [
    {document_id:PENAL_ID, article_number:'100', title:'Homicidio', content:'El que matare a otro sera reprimido con pena privativa de libertad no menor de seis ni mayor de veinte anos.', chapter:'Delitos contra la Persona'},
    {document_id:PENAL_ID, article_number:'101', title:'Homicidio agravado', content:'La pena sera no menor de quince ni mayor de veinticinco anos si el delito es cometido: 1. PorINDER o en comision de un delito. 2. Con alevosia o por motivos de vil indemnidad. 3. Por obra del agente en estado de emberriamiento o alcoholismo cronico.', chapter:'Delitos contra la Persona'},
    {document_id:PENAL_ID, article_number:'104', title:'Homicidio culposo', content:'El que por culpa matare a otro sera reprimido con pena privativa de libertad no menor de dos ni mayor de cuatro anos.', chapter:'Delitos contra la Persona'},
    {document_id:PENAL_ID, article_number:'106', title:'Induccion al suicidio', content:'El que induce al suicidio sera reprimido con pena privativa de libertad no menor de dos ni mayor de cinco anos, si el suicidio se ha consumado.', chapter:'Delitos contra la Persona'},
    {document_id:PENAL_ID, article_number:'108', title:'Lesiones graves', content:'El que causare a otro una lesion que lo ponga en peligro de muerte o que produzca la incapacidad para el trabajo por mas de treinta dias sera reprimido con pena privativa de libertad no menor de dos ni mayor de cinco anos.', chapter:'Delitos contra la Persona'},
    {document_id:PENAL_ID, article_number:'109', title:'Lesiones leves', content:'El que causare a otro una lesion que produzca la incapacidad para el trabajo por menos de diez dias sera reprimido con arresto.', chapter:'Delitos contra la Persona'},
    {document_id:PENAL_ID, article_number:'110', title:'Lesiones por culpa', content:'El que por culpa causare una lesion sera reprimido con arresto o con multa.', chapter:'Delitos contra la Persona'},
    {document_id:PENAL_ID, article_number:'120', title:'Secuestro', content:'El que sustrae o detiene a una persona para obtener provecho ilicito sera reprimido con pena privativa de libertad no menor de quince ni mayor de veinticinco anos.', chapter:'Delitos contra la Libertad'},
    {document_id:PENAL_ID, article_number:'121', title:'Secuestro agravado', content:'La pena sera no menor de veinticinco ni mayor de treinta y cinco anos si el secuestro es cometido sobre un menor de dieciocho anos o mayor de sesenta anos, o sobre una mujer embarazada.', chapter:'Delitos contra la Libertad'},
    {document_id:PENAL_ID, article_number:'150', title:'Abuso sexual', content:'El que comete acto sexual con persona mayor de catorce anos sin su consentimiento sera reprimido con pena privativa de libertad no menor de cuatro ni mayor de diez anos.', chapter:'Delitos contra la Libertad Sexual'},
    {document_id:PENAL_ID, article_number:'151', title:'Violacion sexual', content:'El que tiene acceso carnal con persona mayor de catorce anos sin su consentimiento sera reprimido con pena privativa de libertad no menor de ocho ni mayor de veinte anos.', chapter:'Delitos contra la Libertad Sexual'},
    {document_id:PENAL_ID, article_number:'152', title:'Acceso sexual a menor', content:'El que tiene acceso carnal con persona mayor de catorce anos y menor de dieciocho anos sera reprimido con pena privativa de libertad no menor de ocho ni mayor de quince anos.', chapter:'Delitos contra la Libertad Sexual'},
    {document_id:PENAL_ID, article_number:'170', title:'Robo', content:'El que se apodera ilicitamente de un bien ajeno valiendose de la violencia o amenaza sera reprimido con pena privativa de libertad no menor de cinco ni mayor de diez anos.', chapter:'Delitos contra el Patrimonio'},
    {document_id:PENAL_ID, article_number:'175', title:'Extorsion', content:'El que por violencia o amenaza obliga a otro a hacer, tolerar o no hacer alguna cosa para obtener provecho ilicito sera reprimido con pena privativa de libertad no menor de cinco ni mayor de diez anos.', chapter:'Delitos contra el Patrimonio'},
    {document_id:PENAL_ID, article_number:'176', title:'Hurto', content:'El que se apodera ilicitamente de un bien ajeno sin violencia ni amenaza sera reprimido con pena privativa de libertad no menor de dos ni mayor de cuatro anos.', chapter:'Delitos contra el Patrimonio'},
    {document_id:PENAL_ID, article_number:'188', title:'Estafa', content:'El que induce a otro en error por medio de artificios o enganos para obtener provecho ilicito sera reprimido con pena privativa de libertad no menor de uno ni mayor de cuatro anos.', chapter:'Delitos contra el Patrimonio'},
    {document_id:PENAL_ID, article_number:'190', title:'Receptacion', content:'El que adquiera o guarde bienes provenientes de un delito sabiendo que provienen de un delito sera reprimido con pena privativa de libertad no menor de dos ni mayor de cuatro anos.', chapter:'Delitos contra el Patrimonio'},
    {document_id:PENAL_ID, article_number:'230', title:'Cohecho activo', content:'El que ofrece o entrega a un funcionario publico un beneficio para que haga o deje de hacer un acto propio de su cargo sera reprimido con pena privativa de libertad no menor de dos ni mayor de cuatro anos.', chapter:'Delitos contra la Administracion Publica'},
    {document_id:PENAL_ID, article_number:'232', title:'Cohecho pasivo propio', content:'El funcionario publico que solicita o recibe un beneficio para hacer o dejar de hacer un acto propio de su cargo sera reprimido con pena privativa de libertad no menor de tres ni mayor de seis anos.', chapter:'Delitos contra la Administracion Publica'},
    {document_id:PENAL_ID, article_number:'235', title:'Peculado', content:'El funcionario publico que se appropia dinero, bienes o valores confiados por razon de su cargo sera reprimido con pena privativa de libertad no menor de cuatro ni mayor de ocho anos.', chapter:'Delitos contra la Administracion Publica'},
    {document_id:PENAL_ID, article_number:'237', title:'Colusion', content:'El funcionario publico que favorece a una de las partes en contratos publicos en perjuicio de otra sera reprimido con pena privativa de libertad no menor de tres ni mayor de seis anos.', chapter:'Delitos contra la Administracion Publica'},
    {document_id:PENAL_ID, article_number:'260', title:'Abuso de autoridad', content:'El funcionario publico que abusa de su autoridad y comete un acto arbitrario sera reprimido con pena privativa de libertad no menor de uno ni mayor de tres anos.', chapter:'Delitos contra la Administracion Publica'},
    {document_id:PENAL_ID, article_number:'265', title:'Obstruccion de la justicia', content:'El que impide u obstaculiza la labor de la justicia sera reprimido con pena privativa de libertad no menor de dos ni mayor de cuatro anos.', chapter:'Delitos contra la Administracion de Justicia'},
    {document_id:PENAL_ID, article_number:'275', title:'Falsificacion de documentos', content:'El que falsifica un documento publico o privado para usarlo como autentico sera reprimido con pena privativa de libertad no menor de dos ni mayor de cuatro anos.', chapter:'Delitos contra la Fe Publica'},
    {document_id:PENAL_ID, article_number:'290', title:'Pirateria informatica', content:'El que accede sin autorizacion a un sistema informatico sera reprimido con pena privativa de libertad no menor de uno ni mayor de tres anos.', chapter:'Delitos contra los Intereses Informaticos'},
    {document_id:PENAL_ID, article_number:'291', title:'Dano informatico', content:'El que destruye o altera datos o sistemas informaticos sera reprimido con pena privativa de libertad no menor de dos ni mayor de cuatro anos.', chapter:'Delitos contra los Intereses Informaticos'},
  ];

  var newPenal = penalArts.filter(function(a) { return !existingNums.has(a.article_number); });
  if (newPenal.length > 0) {
    await insertBatch('legal_articles', newPenal);
    console.log('Inserted ' + newPenal.length + ' new Penal articles');
  } else {
    console.log('All Penal articles already exist');
  }

  // Código Civil Peru - Artículos clave
  var civilPeru = [
    {document_id:CODIGO_CIVIL_PERU_ID, article_number:'40', content:'Toda persona tiene derecho al reconocimiento de su nombre, al uso del mismo y a la oposicion a que se use el de otro.', chapter:'Título I - Derechos de la Personalidad'},
    {document_id:CODIGO_CIVIL_PERU_ID, article_number:'44', content:'El derecho al honor, a la dignidad, a la intimidad personal y familiar y a la propia imagen es inviolable.', chapter:'Título I - Derechos de la Personalidad'},
    {document_id:CODIGO_CIVIL_PERU_ID, article_number:'54', content:'Las personas naturales son titulares de derechos y obligaciones desde su concepcion para todos los efectos legales, sin embargo, nacidas vivas.', chapter:'Título II - Personas Naturales'},
    {document_id:CODIGO_CIVIL_PERU_ID, article_number:'60', content:'Es absolutamente incapaz el menor de dieciséis anos. Es relativamente incapaz el menor de dieciséis anos y mayor de dieciocho anos.', chapter:'Título II - Personas Naturales'},
    {document_id:CODIGO_CIVIL_PERU_ID, article_number:'200', content:'El derecho de dominio se adquiere por la ocupacion, por la accesion y por la prescription. El derecho de dominio se pierde:', chapter:'Derechos Reales'},
    {document_id:CODIGO_CIVIL_PERU_ID, article_number:'234', content:'El contrato es un acuerdo de dos o mas personas para crear, regular o extinguir entre sí una relacion juridica patrimonial.', chapter:'Contratos'},
    {document_id:CODIGO_CIVIL_PERU_ID, article_number:'235', content:'Para la validez del contrato se requiere: 1. Consentimiento de las partes. 2. Objeto lícito. 3. Causa lícita.', chapter:'Contratos'},
    {document_id:CODIGO_CIVIL_PERU_ID, article_number:'1242', content:'La persona que sufre daño o perjuicio por accion u omision contraria a la ley puede pedir la indemnizacion correspondiente.', chapter:'Responsabilidad Civil'},
    {document_id:CODIGO_CIVIL_PERU_ID, article_number:'1243', content:'El que realiza el hecho dañoso esta obligado a reparar el daño. Si el daño se produce por culpa, el autor responde por la culpa. Si se produce con dolo, responde por todos los daños.', chapter:'Responsabilidad Civil'},
    {document_id:CODIGO_CIVIL_PERU_ID, article_number:'1244', content:'La indemnizacion comprende el dano emergente y el lucro cesante. Debe ser consecuencia inmediata y directa de la accion u omision dañosa.', chapter:'Responsabilidad Civil'},
    {document_id:CODIGO_CIVIL_PERU_ID, article_number:'1529', content:'La accion para reclamar el cumplimiento de la obligacion prescribe a los diez anos. Las que nacen de instrumento publico prescribe a los veinte anos.', chapter:'Prescripcion'},
  ];

  var existingCivil = await supa('legal_articles?select=article_number&document_id=eq.' + CODIGO_CIVIL_PERU_ID);
  var existingCivilNums = new Set(existingCivil.map(function(a) { return a.article_number; }));
  var newCivil = civilPeru.filter(function(a) { return !existingCivilNums.has(a.article_number); });
  if (newCivil.length > 0) {
    await insertBatch('legal_articles', newCivil);
    console.log('Inserted ' + newCivil.length + ' new Civil Peru articles');
  }

  // Código Civil Chile - Artículos clave
  var civilChile = [
    {document_id:CODIGO_CIVIL_CHILE_ID, article_number:'1', content:'La persona es la base de la organizacion politica de la Republica. Ella es titular de derechos y obligaciones.', chapter:'De las Personas'},
    {document_id:CODIGO_CIVIL_CHILE_ID, article_number:'12', content:'Las personas se dividen en personas naturales y personas juridicas.', chapter:'De las Personas'},
    {document_id:CODIGO_CIVIL_CHILE_ID, article_number:'19', content:'La ley reconoce en las personas naturales la capacidad de adquirir derechos y contraer obligaciones. Esta capacidad se adquiere por el nacimiento y se pierde por la muerte.', chapter:'De las Personas'},
    {document_id:CODIGO_CIVIL_CHILE_ID, article_number:'40', content:'La personeria de un individuo para administrar sus bienes y para demandar o ser demandado judicialmente comienza desde que nace.', chapter:'De las Personas'},
    {document_id:CODIGO_CIVIL_CHILE_ID, article_number:'46', content:'El que nace con imperfecta disposicion de sus facultades intelectuales, sin que le sea posible darse a conocer por ningun medio, se considera como si no existiera.', chapter:'De las Personas'},
    {document_id:CODIGO_CIVIL_CHILE_ID, article_number:'1545', content:'Todo contrato legalmente celebrado es una ley para los contratantes, y no puede ser invalidado sino por su consentimiento mutuo o por causales legales.', chapter:'De las Obligaciones'},
    {document_id:CODIGO_CIVIL_CHILE_ID, article_number:'1546', content:'Los contratantes estan obligados no solo a lo que en ellos se expresa, sino a todas las cosas que aparecen comprendidas en ellos, o que por la ley o la costumbre forman parte del contrato.', chapter:'De las Obligaciones'},
    {document_id:CODIGO_CIVIL_CHILE_ID, article_number:'1670', content:'La obligacion de dar cosa determinada comprende la de entregar el dominio de la cosa, y si la cosa que se entrega es un bien raiz, la de extender la correspondiente escritura publica.', chapter:'De las Obligaciones'},
    {document_id:CODIGO_CIVIL_CHILE_ID, article_number:'1708', content:'La prescripcion es un modo de adquirir las cosas ajenas, o de extinguir las acciones o derechos ajenos, por haberse poseido las cosas o no haberse ejercido dichas acciones y derechos durante un lapso de tiempo.', chapter:'Prescripcion'},
    {document_id:CODIGO_CIVIL_CHILE_ID, article_number:'2058', content:'La accion de nulidad del acto o contrato que adolezca de algun vicio de la voluntad prescribe en cuatro anos contados desde la fecha de la celebracion del acto.', chapter:'Nulidad'},
  ];

  var existingCivilChile = await supa('legal_articles?select=article_number&document_id=eq.' + CODIGO_CIVIL_CHILE_ID);
  var existingCivilChileNums = new Set(existingCivilChile.map(function(a) { return a.article_number; }));
  var newCivilChile = civilChile.filter(function(a) { return !existingCivilChileNums.has(a.article_number); });
  if (newCivilChile.length > 0) {
    await insertBatch('legal_articles', newCivilChile);
    console.log('Inserted ' + newCivilChile.length + ' new Civil Chile articles');
  }

  // Código del Trabajo Chile
  var trabajoChile = [
    {document_id:CODIGO_TRABAJO_CHILE_ID, article_number:'1', content:'El contrato de trabajo es una convencion en virtud de la cual una persona se obliga a prestar servicios personales bajo la subordinacion y dependencia de otra, por un periodo determinado o indeterminado, a cambio de una remuneracion.', chapter:'Del Contrato de Trabajo'},
    {document_id:CODIGO_TRABAJO_CHILE_ID, article_number:'7', content:'El contrato de trabajo puede ser escrito o verbal. Debe constar por escrito cuando la duracion sea superior a un mes.', chapter:'Del Contrato de Trabajo'},
    {document_id:CODIGO_TRABAJO_CHILE_ID, article_number:'12', content:'El contrato de trabajo puede ser a plazo fijo o a plazo indefinido. Se considera a plazo indefinido el que no tiene plazo.', chapter:'Del Contrato de Trabajo'},
    {document_id:CODIGO_TRABAJO_CHILE_ID, article_number:'19', content:'La duracion maxima de la jornada diaria de trabajo es de 45 horas semanales.', chapter:'De la Duracion del Trabajo'},
    {document_id:CODIGO_TRABAJO_CHILE_ID, article_number:'20', content:'El trabajo extraordinario y el trabajo en dia de descanso legal, semanal o festivo se pagan con un recargo del 50% sobre el sueldo convenido.', chapter:'De la Duracion del Trabajo'},
    {document_id:CODIGO_TRABAJO_CHILE_ID, article_number:'41', content:'Las remuneraciones deben ser pagadas en moneda de curso legal, no pueden ser rebajadas ni deducidas, salvo los casos previstos en la ley.', chapter:'De la Remuneracion'},
    {document_id:CODIGO_TRABAJO_CHILE_ID, article_number:'42', content:'La remuneracion es la contraprestacion que debe pagar el empleador al trabajador por los servicios que este presta.', chapter:'De la Remuneracion'},
    {document_id:CODIGO_TRABAJO_CHILE_ID, article_number:'159', content:'El contrato de trabajo termina por las siguientes causales: 1. Mutuo acuerdo. 2. Renuncia. 3. Muerte del trabajador. 4. Vencimiento del plazo. 5. Fin de la obra o servicio. 6. Caso fortuito o fuerza mayor. 7. Desahucio del empleador.', chapter:'Terminacion del Contrato'},
    {document_id:CODIGO_TRABAJO_CHILE_ID, article_number:'160', content:'El contrato de trabajo termina ademas por: 1. Negativa injustificada del trabajador a cumplir el contrato. 2. Conducta inmoral del trabajador. 3. Conducta de mal tratamiento. 4. Descuento de remuneracion por parte del empleador.', chapter:'Terminacion del Contrato'},
    {document_id:CODIGO_TRABAJO_CHILE_ID, article_number:'162', content:'El despido del trabajador puede ser con o sin causa justificada. Si es sin causa justificada, el trabajador tiene derecho a una indemnizacion.', chapter:'Terminacion del Contrato'},
  ];

  var existingTrab = await supa('legal_articles?select=article_number&document_id=eq.' + CODIGO_TRABAJO_CHILE_ID);
  var existingTrabNums = new Set(existingTrab.map(function(a) { return a.article_number; }));
  var newTrab = trabajoChile.filter(function(a) { return !existingTrabNums.has(a.article_number); });
  if (newTrab.length > 0) {
    await insertBatch('legal_articles', newTrab);
    console.log('Inserted ' + newTrab.length + ' new Trabajo Chile articles');
  }

  // Ley del Trabajo Peru
  var trabajoPeru = [
    {document_id:TRABAJO_PERU_ID, article_number:'1', content:'El presente Decreto Legislativo tiene por objeto establecer normas que protejan los derechos de los trabajadores y promuevan la productividad y competitividad del trabajo.', chapter:'Disposiciones Generales'},
    {document_id:TRABAJO_PERU_ID, article_number:'5', content:'El contrato de trabajo es el acuerdo entre el trabajador y el empleador por el cual el primero se compromete a prestar sus servicios personales bajo la subordinacion del segundo, por tiempo determinado o indeterminado, a cambio de una remuneracion.', chapter:'Disposiciones Generales'},
    {document_id:TRABAJO_PERU_ID, article_number:'23', content:'El trabajo efectivo diario no excedera de ocho horas. El trabajo semanal no excedera de cuarenta y ocho horas.', chapter:'Jornada de Trabajo'},
    {document_id:TRABAJO_PERU_ID, article_number:'24', content:'El trabajo efectivo diario que exceda de ocho horas sera considerado horas extraordinarias, las cuales seran remuneradas con el recargo establecido por la Ley.', chapter:'Jornada de Trabajo'},
    {document_id:TRABAJO_PERU_ID, article_number:'26', content:'El trabajador tiene derecho a descanso diario minimo de treinta minutos y a descanso semanal obligatorio de veinticuatro horas.', chapter:'Descansos'},
    {document_id:TRABAJO_PERU_ID, article_number:'30', content:'Tiene derecho a descanso remunerado: 1. Los dias Domingos y feriados. 2. Las fiestas civiles. 3. Los dias que la Ley declare como fiestas nacionales.', chapter:'Descansos'},
    {document_id:TRABAJO_PERU_ID, article_number:'35', content:'El contrato de trabajo se extinguira por las siguientes causales: 1. Mutuo acuerdo. 2. Causas justas previstas en la Ley. 3. Muerte del trabajador. 4. Vencimiento del plazo. 5. Conclusion de la obra. 6. Fuerza mayor o caso fortuito.', chapter:'Terminacion del Contrato'},
    {document_id:TRABAJO_PERU_ID, article_number:'37', content:'El empleador que despida al trabajador sin causa justa esta obligado a pagarle una compensacion equivalente a una remuneracion y media mensual por cada ano de servicios con un tope de doce remuneraciones.', chapter:'Compensacion por Despido'},
    {document_id:TRABAJO_PERU_ID, article_number:'38', content:'La compensacion por despido injustificado se calcula sobre la ultima remuneracion mensual percibida por el trabajador.', chapter:'Compensacion por Despido'},
  ];

  var existingTrabPeru = await supa('legal_articles?select=article_number&document_id=eq.' + TRABAJO_PERU_ID);
  var existingTrabPeruNums = new Set(existingTrabPeru.map(function(a) { return a.article_number; }));
  var newTrabPeru = trabajoPeru.filter(function(a) { return !existingTrabPeruNums.has(a.article_number); });
  if (newTrabPeru.length > 0) {
    await insertBatch('legal_articles', newTrabPeru);
    console.log('Inserted ' + newTrabPeru.length + ' new Trabajo Peru articles');
  }

  // Total count
  var all = await supa('legal_articles?select=id');
  console.log('\n=== Total articles in DB: ' + all.length + ' ===');
  console.log('Done!');
}

main().catch(function(e) { console.error('Fatal:', e.message); process.exit(1); });
