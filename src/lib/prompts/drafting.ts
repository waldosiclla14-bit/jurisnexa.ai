import { Country, LegalArea } from '@/types';

export type DocumentType =
  | 'demanda-civil'
  | 'demanda-laboral'
  | 'demanda-penal-querella'
  | 'contestacion-demanda'
  | 'recurso-apelacion'
  | 'recurso-nulidad'
  | 'demanda-familiar'
  | 'contrato-locacion'
  | 'contrato-trabajo'
  | 'carta-reclamo'
  | 'informe-juridico'
  | 'consultoria-legal'
  | 'carpeta-caso'
  | 'demanda-ojv';

export interface DocumentTypeConfig {
  id: DocumentType;
  label: string;
  description: string;
  area: LegalArea;
  countries: Country[];
}

export const DOCUMENT_TYPES: DocumentTypeConfig[] = [
  {
    id: 'demanda-civil',
    label: 'Demanda Civil',
    description: 'Demanda para reclamaciones patrimoniales, daños y perjuicios, incumplimiento contractual',
    area: 'civil',
    countries: ['PERU', 'CHILE', 'BOTH'],
  },
  {
    id: 'demanda-laboral',
    label: 'Demanda Laboral',
    description: 'Despido, beneficios sociales, compensación por tiempo de servicios',
    area: 'laboral',
    countries: ['PERU', 'CHILE', 'BOTH'],
  },
  {
    id: 'demanda-penal-querella',
    label: 'Querella / Acción Penal',
    description: 'Querella por delitos contra la honra, estafa, injurias',
    area: 'penal',
    countries: ['PERU', 'CHILE', 'BOTH'],
  },
  {
    id: 'contestacion-demanda',
    label: 'Contestación de Demanda',
    description: 'Respuesta formal a una demanda recibida',
    area: 'procesal',
    countries: ['PERU', 'CHILE', 'BOTH'],
  },
  {
    id: 'recurso-apelacion',
    label: 'Recurso de Apelación',
    description: 'Impugnación de resoluciones judiciales ante tribunal superior',
    area: 'procesal',
    countries: ['PERU', 'CHILE', 'BOTH'],
  },
  {
    id: 'recurso-nulidad',
    label: 'Recurso de Nulidad',
    description: 'Impugnación por infracción normativa o errónea aplicación de la ley',
    area: 'procesal',
    countries: ['PERU'],
  },
  {
    id: 'demanda-familiar',
    label: 'Demanda Familiar',
    description: 'Pensión de alimentos, divorcio, tenencia, régimen de visitas',
    area: 'familia',
    countries: ['PERU', 'CHILE', 'BOTH'],
  },
  {
    id: 'contrato-locacion',
    label: 'Contrato de Locación',
    description: 'Contrato de arrendamiento de inmuebles',
    area: 'civil',
    countries: ['PERU', 'CHILE', 'BOTH'],
  },
  {
    id: 'contrato-trabajo',
    label: 'Contrato de Trabajo',
    description: 'Contrato laboral a plazo determinado e indeterminado',
    area: 'laboral',
    countries: ['PERU', 'CHILE', 'BOTH'],
  },
  {
    id: 'carta-reclamo',
    label: 'Carta de Reclamo',
    description: 'Reclamo extrajudicial ante empresas, entidades o personas',
    area: 'civil',
    countries: ['PERU', 'CHILE', 'BOTH'],
  },
  {
    id: 'informe-juridico',
    label: 'Informe Jurídico',
    description: 'Análisis técnico-jurídico de un caso o situación',
    area: 'otro',
    countries: ['PERU', 'CHILE', 'BOTH'],
  },
  {
    id: 'consultoria-legal',
    label: 'Consultoría Legal',
    description: 'Opinión legal sobre un tema específico con fundamentación',
    area: 'otro',
    countries: ['PERU', 'CHILE', 'BOTH'],
  },
  {
    id: 'carpeta-caso',
    label: 'Carpeta de Caso (OJV)',
    description: 'Carpeta pre-armada para abogado: JSON estructurado + resumen + borrador para Oficina Judicial Virtual',
    area: 'procesal',
    countries: ['CHILE'],
  },
  {
    id: 'demanda-ojv',
    label: 'Demanda OJV (Formato Chile)',
    description: 'Demanda compatible con Oficina Judicial Virtual de Chile, formato PDF/A con firma Clave Única',
    area: 'procesal',
    countries: ['CHILE'],
  },
];

export function getDocumentTypePrompt(
  docType: DocumentType,
  country: Country,
  ragContext: string
): string {
  const config = DOCUMENT_TYPES.find(d => d.id === docType);
  if (!config) return '';

  const countryLabel = country === 'PERU' ? 'peruano' : country === 'CHILE' ? 'chileno' : 'peruano y chileno';

  const baseInstructions = `
INSTRUCCIONES ESPECÍFICAS PARA REDACCIÓN DE DOCUMENTOS JURÍDICOS:

IMPORTANTE: Genera un documento jurídico COMPLETO, LISTO PARA SER PRESENTADO. No des explicaciones sobre cómo redactar. REDACTA EL DOCUMENTO DIRECTAMENTE.

REGLAS OBLIGATORIAS:
1. Usa formato formal de correspondencia judicial/institucional
2. Incluye: encabezado, datos de las partes, fundamentos de derecho, hechos, petitorio/fundamentos
3. Cita TODA la normativa aplicable con: nombre exacto, número, artículo, numeral, inciso
4. Cada cita debe ser VERIFICABLE - no inventes números de artículos
5. Incluye sección de "Fuentes Consultadas" al final con enlaces a fuentes oficiales cuando existan
6. Adapta el formato al sistema procesal ${countryLabel}
7. Usa lenguaje jurídico formal pero claro
8. Incluye la advertencia legal al final

FORMATO DE CITAS OBLIGATORIO:
Para cada norma citada usa este formato:
[Norma] [Número] - [Artículo/Artículos] - [País] - [Estado de vigencia]
Ejemplo: "Código Civil Peruano - Artículo 1322 - Perú - VIGENTE"
Ejemplo: "Constitución Política del Perú - Artículo 2, inciso 24 - Perú - VIGENTE"
Ejemplo: "Código del Trabajo Chileno - Artículo 162 - Chile - VIGENTE"

SECCIONES DEL DOCUMENTO:
1. ENCABEZADO: Juzgado/Tribunal, vía procedimental, expediente (si se conoce)
2. DEMANDANTE/RECLAMANTE: Datos completos (nombre, DNI/RUT, domicilio)
3. DEMANDADO/RECLAMADO: Datos completos (nombre, DNI/RUT, domicilio)
4. HECHOS: Narración cronológica y precisa de los hechos
5. FUNDAMENTOS DE DERECHO: Normativa aplicable citada correctamente
6. PETITORIO/PRETENSIONES: Qué se pide al juez/tribunal
7. MEDIOS PROBATORIOS: Documentos que se adjuntan
8. FIRMA Y DATOS DEL ABOGADO
9. FUENTES CONSULTADAS: Lista de normas y fuentes oficiales utilizadas
10. ADVERTENCIA: "El presente documento es un borrador generado con asistencia de IA. Requiere revisión y adaptación por un abogado antes de su presentación oficial."
`;

  const ragSection = ragContext
    ? `\n\nCONTEXTO DOCUMENTAL RECUPERADO (usa estas fuentes como base para las citas):\n${ragContext}\n\nPrioriza las fuentes del contexto para fundamentar el documento.`
    : '';

  const specificInstructions = getSpecificInstructions(docType, country);

  return `${baseInstructions}
${specificInstructions}
${ragSection}`;
}

function getSpecificInstructions(docType: DocumentType, country: Country): string {
  const peruInstructions: Record<string, string> = {
    'demanda-civil': `
SISTEMA PROCESAL PERUANO:
- Vía procedimental: Proceso de Conocimiento (CPC, Art. 475-486) o Abreviado (Art. 487-494) según cuantía
- Juzgado: Civil competente por domicilio del demandado
- Plazo de contestación: 30 días hábiles (Art. 478 CPC)
- Anexos obligatorios: poder, documento de identidad, minuta, medios probatorios
- Código Civil: Arts. 1321-1362 sobre obligaciones y contratos`,

    'demanda-laboral': `
SISTEMA PROCESAL LABORAL PERUANO:
- Vía procedimental: Proceso Único Laboral (D.S. 003-97-JUS, TUO del D.S. 003-97-JUS)
- Competencia: Juzgado de Paz Letrado o Juzgado de Trabajo según monto
- Plazo: 3 años para despido nulo, 2 años para despido incausado
- Cálculo de beneficios: CTS, vacaciones, gratificaciones (D.S. 005-2002-TR)
- Indemnización: 1.5 sueldos por año (Art. 1344 CC)`,

    'demanda-penal-querella': `
SISTEMA PROCESAL PENAL PERUANO:
- Vía: Proceso Penal inmediato o por querella (NCPP, Art. 259-265)
- Querellante: Ofendido o persona autorizada por ley
- Plazo: 3 meses desde conocimiento del delito (Art. 257 NCPP)
- Delitos: contra la honra (Art. 130-132 CP), estafa (Art. 196-197 CP), hurto (Art. 185 CP)`,

    'contestacion-demanda': `
CONTESTACIÓN PERUANA (CPC):
- Plazo: 30 días hábiles (Art. 478 CPC)
- Debe contestar: cada hecho, ofrecer medios probatorios, proponer excepciones
- Excepciones previas: incompetencia, cosa juzgada, prescripción (Art. 446-457 CPC)
- Reconvención: solo en proceso de conocimiento (Art. 445 CPC)`,

    'recurso-apelacion': `
APELACIÓN PERUANA (CPC):
- Plazo: 5 días hábiles para apelar (Art. 365 CPC)
- Fundamentación: debe indicar la parte de la resolución impugnada
- Efecto: devolutivo (no suspensivo) salvo casos especiales
- Tribunal: Sala Civil competente de la Corte Superior`,

    'recurso-nulidad': `
NULIDAD PERUANA (CPC):
- Plazo: 10 días hábiles (Art. 387 CPC)
- Casos: infracción normativa, errónea aplicación de norma sustantiva
- Tribunal: Corte Suprema (Sala de Derecho Constitucional o Social según materia)`,

    'demanda-familiar': `
PROCESO FAMILIAR PERUANO (Código de los Niños y Adolescentes, Ley 27337):
- Alimentos: Juzgado de Paz Letrado, proceso urgente (D.L. 1049)
- Divorcio: Juzgado de Familia, causal o incausado (Art. 480-484 CPC)
- Tenencia: Interés superior del niño (Art. IX Título Preliminar CNA)
- Régimen de visitas: Art. 114 CNA`,

    'contrato-locacion': `
CONTRATO DE LOCACIÓN PERUANO:
- Marco legal: Código Civil, Arts. 1653-1679
- Registro: Obligatorio si supera 6 meses (Art. 1669 CC)
- Garantía: Máximo 2 meses de renta (Art. 1667 CC)
- Desalojo: Solo por vía judicial (Art. 1675 CC)`,

    'contrato-trabajo': `
CONTRATO LABORAL PERUANO:
- Forma: Escrita obligatoria (Art. 4 TUO DL 728)
- Plazo: Máximo 5 años continuos (Art. 77 TUO DL 728)
- Beneficios: CTS, vacaciones, gratificaciones
- Despido: Causa justa (Art. 23 TUO DL 728)`,

    'carta-reclamo': `
CARTA DE RECLAMO PERUANA:
- Marco: Ley 29571 - Ley del Consumidor (INDECOPI)
- Plazo: 12 meses desde adquisición del bien/servicio
- Canales: Libro de reclamaciones, carta, vía digital
- Plazo de respuesta: Máximo 30 días calendario`,

    'informe-juridico': `
INFORME JURÍDICO PERUANO:
- Estructura: Antecedentes, problema jurídico, análisis, conclusiones, recomendaciones
- Fundamentación: Toda conclusión debe respaldarse con norma específica
- Fuentes: Legislación vigente, jurisprudencia, doctrina`,

    'consultoria-legal': `
CONSULTORÍA LEGAL PERUANA:
- Opinión fundamentada con normas específicas
- Incluir: antecedentes, análisis, opinión, alternativas, recomendaciones
- Disclaimer: "La presente consultoría no constituye asesoría legal directa"`,
  };

  const chileInstructions: Record<string, string> = {
    'demanda-civil': `
SISTEMA PROCESAL CHILENO:
- Vía procedimental: Juicio ordinario (Art. 170 CPC) o juicio sumario (Art. 680 CPC)
- Juzgado de Letras competente por cuantía y territorio
- Plazo de contestación: 15 días (juicio ordinario, Art. 318 CPC)
- Código Civil: Arts. 1437-1703 sobre obligaciones`,

    'demanda-laboral': `
SISTEMA PROCESAL LABORAL CHILENO:
- Código del Trabajo (D.F.L. 1-2002)
- Competencia: Juzgado de Letras del Trabajo
- Despido: Art. 160-168 CT, indemnización Art. 168-172
- Prescripción: 2 años para acción laboral (Art. 510 CT)`,

    'demanda-penal-querella': `
SISTEMA PROCESAL PENAL CHILENO:
- CPP (D.L. 957): juicio simplificado o abreviado
- Querellante: Art. 110-116 CPP
- Acción penal: pública, excepto delitos de querella (Art. 53 CPP)`,

    'contestacion-demanda': `
CONTESTACIÓN CHILENA (CPC):
- Plazo: 15 días (juicio ordinario, Art. 318 CPC)
- Excepciones: Art. 464 CPC (incompetencia, cosa juzgada, prescripción)
- Contestación: Art. 319-321 CPC`,

    'recurso-apelacion': `
APELACIÓN CHILENA (CPC):
- Plazo: 5 días para apelar (Art. 202 CPC)
- Efecto: suspensivo en juicio ordinario
- Tribunal: Corte de Apelaciones correspondiente`,

    'demanda-familiar': `
PROCESO FAMILIAR CHILENO:
- Código Civil: Arts. 320-342 sobre alimentos
- Ley 19.968: Tribunales de Familia
- Divorcio: Art. 54-56 CC (causal o incausado)
- Protección integral (Art. 3 CC)`,

    'contrato-locacion': `
CONTRATO DE ARRENDAMIENTO CHILENO:
- Código Civil: Arts. 1915-1978
- Depósito: Art. 1953 CC (máximo 1 mes de renta)
- Desahucio: Art. 1977-1978 CC`,

    'contrato-trabajo': `
CONTRATO LABORAL CHILENO:
- Código del Trabajo (D.F.L. 1-2002)
- Indefinido: Art. 159 CT
- Plazo fijo: Art. 159 CT (máximo 2 años)
- Finiquito: Art. 168-177 CT`,

    'carta-reclamo': `
CARTA DE RECLAMO CHILENA:
- Ley 19.496: Ley del Consumidor
- SERNAC: recurso ante organismo administrativo
- Plazo: 4 meses para reclamo ante SERNAC
- Respuesta: 10 días hábiles del reclamante`,

    'informe-juridico': `
INFORME JURÍDICO CHILENO:
- Estructura: Antecedentes, base legal, análisis, conclusiones
- Fundamentación: Código Civil, leyes especiales, jurisprudencia`,

    'consultoria-legal': `
CONSULTORÍA LEGAL CHILENA:
- Opinión con fundamentos normativos chilenos
- Incluir análisis de riesgos y alternativas`,

    'carpeta-caso': `
CARPETA DE CASO PARA OJV - CHILE (LEXCHILE-CARPERTA):

IDENTIDAD Y LEY APLICABLE:
- Jurisdicción EXCLUSIVA: Chile.
- Derecho aplicable: Constitución Política de 1980, Códigos de la República (Ley Chile BCN).
- NUNCA cites leyes de España, México, Argentina o Colombia.
- Si no encuentras norma chilena: "No hay norma aplicable en Ley Chile BCN".
- Fecha de corte: 2026. Considera Ley 21.334, Ley 21.120, Ley 21.180, Ley 21.595.

FUENTES DE VERDAD OBLIGATORIAS:
1. API BCN LeyChile.cl - https://www.leychile.cl / https://datos.bcn.cl (260k+ normas)
2. Buscador Jurisprudencial PJUD - https://juris.pjud.cl (1.5M sentencias)
3. Diario Oficial, Dictámenes Dirección del Trabajo, TDLC, Tribunal Constitucional

OUTPUT OBLIGATORIO - Genera SIEMPRE este JSON estructurado + Resumen Markdown:

## JSON DE CARPETA:
{
  "id_caso": "UUID",
  "materia": "laboral | civil | familia | penal | administrativo",
  "tribunal_competente": "Ej: 1° Juzgado de Letras del Trabajo de Santiago",
  "viabilidad_preliminar": {"score": 0-100, "fundamento": "Basado en jurisprudencia PJUD..."},
  "relato_cronologico": [{"fecha": "YYYY-MM-DD", "hecho": "...", "prueba_asociada": "doc_001.pdf"}],
  "hechos_controvertidos": ["..."],
  "normativa_aplicable": [{"ley": "Código del Trabajo", "articulo": "Art 168", "texto_vigente_bcn": "...", "url_leychile": "https://www.leychile.cl/..."}],
  "jurisprudencia_relevante": [{"rol": "Rol N° XXX-AAAA", "resumen": "...", "a_favor": true, "url": "pjud.cl"}],
  "checklist_prueba": {"presente": ["contrato.pdf"], "faltante_critico": ["carta despido", "liquidaciones 3 meses"]},
  "riesgos_y_alertas": ["Plazo 60 días vence el...", "Falta firma electrónica avanzada"],
  "borrador_escrito_ojv": {"tipo": "...", "formato": "Compatible OJV - PDF/A con firma Clave Única", "cuerpo": "..."},
  "proximos_pasos_abogado": ["1. Solicitar...", "2. Subir a OJV..."],
  "estimacion_monetaria": {"rango": "$X - $Y CLP", "base_calculo": "Art 163 CT..."}
}

REGLAS ANTI-ALUCINACIÓN:
1. Si no estás seguro del artículo: "Verificar vigencia en Ley Chile BCN".
2. Nunca inventes Roles. Usa "Rol N° XXX-AAAA" solo si viene del Buscador PJUD.
3. No das asesoría como abogado. Incluir disclaimer.
4. Anonimiza RUTs: 12.345.678-9 -> XX.XXX.XXX-9 (Ley 19.628).
5. Español chileno formal. UF, UTM, CLP, Juzgado, OJV, Clave Única.`,

    'demanda-ojv': `
DEMANDA PARA OFICINA JUDICIAL VIRTUAL (OJV) - CHILE:

FORMATO OBLIGATORIO:
- Compatible con www.ojv.pjud.cl
- Ingreso vía Clave Única (Ley 21.180 transformación digital)
- Acta 37-2016 y 71-2016 Corte Suprema

ESTRUCTURA DE LA DEMANDA:
1. ENCABEZADO: "S.J.L. de [materia] de [comuna]"
2. ROL (si se conoce): RIT oRol de la causa
3. DEMANDANTE: Nombre, RUT (anonimizado), domicilio
4. DEMANDADO: Nombre, RUT, domicilio
5. MATERIA: Tipo de acción (laboral, civil, familia, etc.)
6. HECHOS: Narración cronológica con fechas
7. DERECHO: Fundamentación normativa con Art. de Código + BCN URL
8. PETITORIO: Qué se pide al tribunal
9. MEDIOS PROBATORIOS: Documentos adjuntos
10. FIRMA: Abogado con registro en PCAS

REGLAS:
- Cita TODA la normativa con Art. exacto + URL Ley Chile BCN
- Plazos fatales: 60 días despido (Art 168 CT), 6 meses prescripción
- Disclaimer: "Este informe es informativo y pre-armado por IA. No constituye patrocinio legal y debe ser validado por abogado habilitado con firma electrónica avanzada para ingreso en OJV según Acta 37-2016 y 71-2016 Corte Suprema."`,
  };

  const instructions = country === 'CHILE' ? chileInstructions : peruInstructions;
  return instructions[docType] || '';
}
