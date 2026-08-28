import { findArticleByIdentifier, findLawByIdentifier, normalize } from '@/lib/rag/chilean-law-search';
import { RuleSource } from './types';

const PENAL = 'CL-1984';
const CPP = 'CL-176595';
const LEY_21633 = 'CL-1198283';

interface PenalRule {
  article: string;
  name: string;
  cuando: string;
  pena: string;
  elements: string[];
}

const USURPATION_RULES: PenalRule[] = [
  {
    article: '457',
    name: 'Usurpación con violencia o intimidación',
    cuando: 'Ocupación total o parcial de un inmueble, o usurpación de un derecho real, con violencia o intimidación en las personas',
    pena: 'Presidio menor en su grado medio a máximo',
    elements: ['violencia o intimidación en las personas', 'ocupación total o parcial', 'inmueble', 'usurpación de derecho real'],
  },
  {
    article: '457 bis',
    name: 'Usurpación con daño',
    cuando: 'Ocupación sin violencia a las personas, pero con daño en las cosas',
    pena: 'Escalonada según el daño: presidio menor grado medio a mínimo',
    elements: ['daño en las cosas', 'sin violencia o intimidación en las personas', 'importe del daño'],
  },
  {
    article: '458',
    name: 'Usurpación sin violencia ni daño',
    cuando: 'Ocupación sin violencia y sin daño',
    pena: 'Presidio menor en su grado mínimo o multa de 6 a 10 UTM',
    elements: ['sin violencia', 'sin daño', 'circunstancias del tribunal'],
  },
  {
    article: '458 bis',
    name: 'Agravantes de la ocupación',
    cuando: 'Ocupación en lugar habitado, obstaculizando combate de incendios, o interrumpiendo servicios públicos',
    pena: 'Máximo o grado máximo de las penas anteriores',
    elements: ['lugar habitado o destinado a la habitación', 'obstaculizar actione incendio', 'servicios públicos o domiciliarios'],
  },
  {
    article: '462 bis',
    name: 'Alteración de términos o límites',
    cuando: 'Destruir o alterar términos o límites de un inmueble para posibilitar una posesión, o instalar demarcaciones sin título',
    pena: 'Multa de 6 a 10 UTM',
    elements: ['alteración de límites', 'ánimo de posibilitar posesión', 'instalación de demarcaciones'],
  },
];

export interface UsurpationScenario {
  matched: boolean;
  rules: {
    article: string;
    name: string;
    pena: string;
    source: RuleSource | null;
    mentioned: boolean;
  }[];
  suggestedArticle: string | null;
  proceduralNotes: {
    title: string;
    article: string;
    law: string;
    source: RuleSource | null;
    text: string;
  }[];
  detectionNote: string;
  reformNote: string | null;
}

function buildSource(identifier: string, article: string): RuleSource | null {
  const law = findLawByIdentifier(identifier);
  const articleObj = findArticleByIdentifier(identifier, article);
  if (!law || !articleObj) return null;
  return {
    identifier,
    title: law.title,
    rankLabel: law.rankLabel,
    articleNumber: articleObj.number,
    articleTitle: articleObj.title,
    content: articleObj.text,
    url: `https://www.leychile.cl/Navegar?idNorma=${identifier.replace('CL-', '')}`,
  };
}

export class UsurpationAnalysisEngine {
  analyze(message: string): UsurpationScenario {
    const norm = normalize(message);

    const occupationSignals = [
      'usurp', 'ocupac', 'invad', 'toma de', 'okupa', 'okupas', 'inmueble', 'terreno',
      'propiedad', 'sitiado', 'cerradura', 'rejas', 'toma ilegal', 'desalojo', 'ocupante',
      'posesion', 'intrusos', 'cambio de cerradura',
    ];
    const matched = occupationSignals.some(s => norm.includes(s));

    let suggested: string | null = null;
    if (norm.includes('violencia') || norm.includes('intimidacion')) {
      suggested = '457';
    } else if (norm.includes('dano') || norm.includes('daños') || norm.includes('destruccion') || norm.includes('cerradura')) {
      suggested = '457 bis';
    } else if (norm.includes('desalojo') || norm.includes('auxilio de la fuerza publica')) {
      suggested = '157 ter';
    } else if (norm.includes('limites') || norm.includes('demarcacion') || norm.includes('bandera') || norm.includes('estaca')) {
      suggested = '462 bis';
    } else {
      suggested = '458';
    }

    const rules = USURPATION_RULES.map(r => ({
      article: r.article,
      name: r.name,
      pena: r.pena,
      source: buildSource(PENAL, r.article),
      mentioned: norm.includes('457') || norm.normalize('NFD').includes(r.name.toLowerCase()),
    }));

    const proceduralNotes = [
      {
        title: 'Detención por flagrancia en ocupación',
        article: '134',
        law: 'Código Procesal Penal',
        source: buildSource(CPP, '134'),
        text: 'La policía siempre podrá detener al imputado que estuviere cometiendo alguno de los delitos de ocupación (Arts. 457, 457 bis, 458 y 458 bis CP) mientras se hallare en alguna de las hipótesis del Art. 130.',
      },
      {
        title: 'Desalojo cautelar (medida cautelar real especial)',
        article: '157 ter',
        law: 'Código Procesal Penal',
        source: buildSource(CPP, '157 ter'),
        text: 'El Ministerio Público o la víctima pueden solicitar al juez el desalojo de los ocupantes ilegales con auxilio de la fuerza pública, acreditando la inscripción del inmueble.',
      },
      {
        title: 'Privación de la detención indebida',
        article: '130',
        law: 'Código Procesal Penal',
        source: buildSource(CPP, '130'),
        text: 'Define las situaciones de flagrancia aplicables a la ocupación ilegal.',
      },
    ];

    const ley21633 = findLawByIdentifier(LEY_21633);
    const reformNote = ley21633
      ? `Modificada por la Ley N.º 21.633 (${ley21633.title}): agrega el Art. 457 bis, sustituye el inciso primero del Art. 457 y agrega el Art. 458 bis, incorporando nuevos grados de pena según daño y circunstancias (${ley21633.source}).`
      : null;

    return {
      matched,
      rules,
      suggestedArticle: matched ? suggested : null,
      proceduralNotes,
      detectionNote: matched
        ? 'La consulta describe una posible ocupación ilegal de inmueble. Se activó el motor de análisis de usurpación con las normas del Código Penal vigente incluidas las modificaciones de la Ley N.º 21.633.'
        : 'La consulta no parece referirse a una ocupación ilegal de inmueble. Motor de usurpación inactivo.',
      reformNote,
    };
  }
}

export const usurpationAnalysisEngine = new UsurpationAnalysisEngine();