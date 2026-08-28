import { LegalArea } from '@/types';

interface AreaLexicon {
  area: LegalArea;
  labels: string[];
  terms: string[];
  weight: number;
}

export const AREA_LEXICON: AreaLexicon[] = [
  {
    area: 'laboral',
    labels: ['laboral', 'trabajo', 'previsional laboral'],
    terms: [
      'trabajador', 'trabajo', 'despido', 'finiquito', 'horas extra', 'horas extraordinarias',
      'sueldo', 'salario', 'remuneracion', 'jornada', 'vacaciones', 'feriado', 'indemnizacion',
      'contrato de trabajo', 'cotizacion', 'licencia medica', 'fuero', 'relacion laboral',
      'subordinacion', 'empleador', 'contratista', 'empleo', 'sindicato', 'negociacion colectiva',
    ],
    weight: 2.0,
  },
  {
    area: 'penal',
    labels: ['penal', 'criminal', 'delito'],
    terms: [
      'delito', 'hurto', 'robo', 'estafa', 'homicidio', 'asesinato', 'lesiones', 'amenaza',
      'usurpacion', 'ocupacion ilegal', 'inmueble ocupado', 'invasiones',
      'flagrancia', 'querella', 'denuncia penal', 'presidio', 'carabineros', 'pdi',
      'ministerio publico', 'fiscalia', 'abigeato', 'receptacion', 'secuestro', 'violencia',
      'multa penal', 'imputado', 'victima', 'penalidad', 'indulto', 'prision preventiva',
      'control de identidad', 'detencion',
    ],
    weight: 2.0,
  },
  {
    area: 'civil',
    labels: ['civil', 'derecho civil'],
    terms: [
      'contrato', 'compraventa', 'arrendamiento', 'arriendo', 'obligacion', 'responsabilidad contractual',
      'indemnizacion de perjuicios', 'prescripcion', 'propiedad', 'posesion', 'usucapion',
      'danos', 'incumplimiento', 'obligaciones', 'obligado', 'deudor', 'acreedor', 'comodato',
      'prestamo', 'mutuo', 'servidumbre',
    ],
    weight: 1.8,
  },
  {
    area: 'familia',
    labels: ['familia', 'derecho de familia'],
    terms: [
      'divorcio', 'matrimonio', 'alimentos', 'tenencia', 'cuidado personal', 'visitas',
      'pension de alimentos', 'hijos', 'acuerdo de union civil', 'nulidad matrimonial',
      'separacion', 'violencia intrafamiliar', 'proteccion del menor', 'adopcion',
    ],
    weight: 2.0,
  },
  {
    area: 'sucesiones',
    labels: ['sucesiones', 'herencia'],
    terms: [
      'herencia', 'sucesion', 'testamento', 'legitima', 'heredero', 'legatario', 'donacion',
      'albacea', 'porcion conyugal', 'nudo propietario', 'usufructo',
    ],
    weight: 1.8,
  },
  {
    area: 'tributario',
    labels: ['tributario', 'impuesto', 'renta'],
    terms: [
      'impuesto', 'renta', 'iva', 'boleta', 'factura', 'tributacion', 'sii', 'declaracion de renta',
      'impuesto a la renta', 'impuesto global complementario', 'rectificatoria', 'giro',
      'inicio de actividades',
    ],
    weight: 2.0,
  },
  {
    area: 'comercial',
    labels: ['comercial', 'societario', 'empresa'],
    terms: [
      'sociedad', 'empresa', 'directorio', 'accionista', 'quiebra', 'liquidacion', 'reorganizacion',
      'contrato comercial', 'pagaré', 'cheque', 'letra de cambio', 'franquicia', 'comercial',
      'marca', 'patente comercial',
    ],
    weight: 1.6,
  },
  {
    area: 'consumidor',
    labels: ['consumidor', 'proteccion al consumidor'],
    terms: [
      'consumidor', 'garantia', 'devolucion', 'proveedor', 'publicidad', 'sernac', 'boleta',
      'producto defectuoso', 'reclamo', 'soporte tecnico', 'garantia legal', 'garantia convencional',
    ],
    weight: 1.8,
  },
  {
    area: 'inmobiliario',
    labels: ['inmobiliario', 'propiedad raiz'],
    terms: [
      'inmueble', 'propiedad', 'hipoteca', 'arriendo', 'conservador de bienes raices',
      'matricula', 'compraventa de inmueble', 'promesa de compraventa', 'urbanizacion', 'subdivision',
    ],
    weight: 1.6,
  },
  {
    area: 'procesal',
    labels: ['procesal', 'procedimiento'],
    terms: [
      'demanda', 'juicio', 'recurso', 'apelacion', 'nulidad', 'tribunal', 'juzgado',
      'causa', 'expediente', 'notificacion', 'plazo procesal', 'primer comparendo',
      'audiencia', 'sentencia', 'oficina judicial virtual', 'corte suprema', 'juzgado de garantia',
      'tribunal oral en lo penal', 'juicio oral',
    ],
    weight: 1.5,
  },
  {
    area: 'migratorio',
    labels: ['migratorio', 'migración'],
    terms: [
      'visa', 'residencia', 'migracion', 'ciudadania', 'permiso de permanencia',
      'permanencia definitiva', 'visado', 'extranjero', 'temporaria', 'refugiado',
    ],
    weight: 1.8,
  },
  {
    area: 'transito',
    labels: ['tránsito', 'transito'],
    terms: [
      'transito', 'accidente de transito', 'multa de transito', 'licencia de conducir',
      'infraccion', 'suspension de licencia', 'choque', ' vehiculo motorizado', 'placa patente',
    ],
    weight: 1.6,
  },
  {
    area: 'previsional',
    labels: ['previsional', 'pensiones'],
    terms: [
      'pension', 'afp', 'jubilacion', 'cotizacion previsional', 'prevision', 'pension de vejez',
      'pension de invalidez', 'superintendencia de pensiones', 'ahorro previsional',
    ],
    weight: 1.8,
  },
  {
    area: 'ambiental',
    labels: ['ambiental', 'medio ambiente'],
    terms: [
      'medio ambiente', 'contaminacion', 'evaluacion ambiental', 'impacto ambiental', 'sma',
      'residuos', 'aguas', 'ruido', 'emision',
    ],
    weight: 1.5,
  },
  {
    area: 'constitucional',
    labels: ['constitucional', 'derechos fundamentales'],
    terms: [
      'constitucion', 'derechos fundamentales', 'recurso de proteccion', 'amparo',
      'igualdad ante la ley', 'debido proceso', 'libertad personal', 'garantias constitucionales',
    ],
    weight: 1.5,
  },
  {
    area: 'administrativo',
    labels: ['administrativo', 'administración pública'],
    terms: [
      'municipalidad', 'permiso', 'patente', 'sancion administrativa', 'funcionario publico',
      'administracion publica', 'silenci, admin', 'acto administrativo', 'concesion', 'licitacion',
    ],
    weight: 1.4,
  },
];

interface FigurePattern {
  figure: string;
  figureLabel: string;
  area: LegalArea;
  patterns: RegExp[];
  keywords: string[];
  summary: string;
}

export const FIGURE_PATTERNS: FigurePattern[] = [
  {
    figure: 'usurpacion-violencia',
    figureLabel: 'Usurpación con violencia o intimidación (Art. 457 CP)',
    area: 'penal',
    patterns: [/ocupar?/, /usurpar?/, /invad/, /toma de inmueble/],
    keywords: ['usurpacion', 'ocupacion', 'invasion', 'toma', 'inmueble', 'sitiado', 'okupa', 'ocupante'],
    summary: 'Ocupación total o parcial de un inmueble con violencia o intimidación en las personas.',
  },
  {
    figure: 'usurpacion-dano',
    figureLabel: 'Usurpación con daño (Art. 457 bis CP)',
    area: 'penal',
    patterns: [/ocupar.*da[ñn]o/, /usurpar.*da[ñn]o/],
    keywords: ['usurpacion', 'ocupacion', 'dano', 'destruccion', 'cerradura', 'rejas'],
    summary: 'Ocupación de inmueble sin violencia a las personas pero causando daño en las cosas.',
  },
  {
    figure: 'usurpacion-simple',
    figureLabel: 'Usurpación sin violencia ni daño (Art. 458 CP)',
    area: 'penal',
    patterns: [/ocupar/, /usurpar/],
    keywords: ['ocupacion', 'usurpacion', 'inmueble', 'posesion'],
    summary: 'Ocupación de inmueble sin violencia ni daño, sancionada con pena menor.',
  },
  {
    figure: 'despido-injustificado',
    figureLabel: 'Despido laboral',
    area: 'laboral',
    patterns: [/despid/, /finiquito/, /indemnizaci[oó]n por/],
    keywords: ['despido', 'finiquito', 'indemnizacion', 'cesantia'],
    summary: 'Término de la relación laboral por decisión del empleador.',
  },
  {
    figure: 'divorcio',
    figureLabel: 'Divorcio',
    area: 'familia',
    patterns: [/divorci/, /causal de divorcio/],
    keywords: ['divorcio', 'matrimonio', 'separacion'],
    summary: 'Disolución del vínculo matrimonial por las causales de la Ley de Matrimonio Civil.',
  },
  {
    figure: 'alimentos',
    figureLabel: 'Pensión de alimentos',
    area: 'familia',
    patterns: [/alimento/, /pensi[oó]n de alimento/],
    keywords: ['alimentos', 'pension de alimentos', 'hijos', 'cuidado personal'],
    summary: 'Obligación de proporcionar alimentos a los hijos u otros parientes.',
  },
  {
    figure: 'herencia-intestada',
    figureLabel: 'Sucesión por causa de muerte',
    area: 'sucesiones',
    patterns: [/hereda/, /sucesi[oó]n/, /testamento/, /muero sin/],
    keywords: ['herencia', 'sucesion', 'testamento', 'heredero'],
    summary: 'Distribución de los bienes de una persona fallecida.',
  },
  {
    figure: 'incumplimiento-contractual',
    figureLabel: 'Incumplimiento contractual',
    area: 'civil',
    patterns: [/incumpli/, /no me pago/, /incumplimiento de contrato/],
    keywords: ['incumplimiento', 'contrato', 'perjuicios', 'indemnizacion'],
    summary: 'Falta de cumplimiento de las obligaciones pactadas en un contrato.',
  },
  {
    figure: 'compraventa-daniada',
    figureLabel: 'Compraventa / vicios',
    area: 'civil',
    patterns: [/compraventa/, /compr[eé]/, /vend/, /propiedad/],
    keywords: ['compraventa', 'vendedor', 'comprador', 'cosa'],
    summary: 'Contrato de compraventa y sus vicios.',
  },
  {
    figure: 'garantia-legal',
    figureLabel: 'Garantía legal de productos',
    area: 'consumidor',
    patterns: [/garant[ií]a/, /devoluci[oó]n/, /producto defectuoso/],
    keywords: ['garantia', 'devolucion', 'producto', 'consumidor'],
    summary: 'Derechos del consumidor frente a productos defectuosos.',
  },
  {
    figure: 'robo-hurto',
    figureLabel: 'Robo o hurto',
    area: 'penal',
    patterns: [/roba/, /hurt/, /robo/, /hurto/],
    keywords: ['robo', 'hurto', 'apoderamiento', 'cosa ajena'],
    summary: 'Apoderamiento de cosa ajena con o sin violencia.',
  },
  {
    figure: 'estafa',
    figureLabel: 'Estafa',
    area: 'penal',
    patterns: [/estafa/, /enga[nñ]o/, /defraudaci[oó]n/],
    keywords: ['estafa', 'engaño', 'defraudacion', 'perjuicio'],
    summary: 'Obtención de provecho mediante engaño que provoca error y perjuicio.',
  },
  {
    figure: 'prescripcion',
    figureLabel: 'Prescripción',
    area: 'civil',
    patterns: [/prescri/, /plazo para cobrar/, /plazo para demandar/],
    keywords: ['prescripcion', 'plazo', 'caducidad', 'cobrar'],
    summary: 'Extinción de derechos y acciones por el transcurso del tiempo.',
  },
];