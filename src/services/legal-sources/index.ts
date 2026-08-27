import { Country } from '@/types';

export interface LegalSource {
  name: string;
  url: string;
  country: Country;
  type: 'official' | 'judicial' | 'legislative' | 'doctrinal';
  description: string;
}

export const LEGAL_SOURCES: LegalSource[] = [
  // ============================================================
  // PERÚ
  // ============================================================
  {
    name: 'Ministerio de Justicia y Derechos Humanos',
    url: 'https://www.gob.pe/minjus',
    country: 'PERU',
    type: 'official',
    description: 'Portal oficial del MINJUSDH del Perú. Normativa, servicios jurídicos y política legal.',
  },
  {
    name: 'Sistema Peruano de Información Jurídica (SPIJ)',
    url: 'https://spij.minjus.gob.pe/',
    country: 'PERU',
    type: 'official',
    description: 'Base de datos oficial con legislación peruana consolidada. Acceso libre a normas legales.',
  },
  {
    name: 'Diario Oficial El Peruano',
    url: 'https://elperuano.pe/',
    country: 'PERU',
    type: 'official',
    description: 'Diario oficial del gobierno del Perú. Publicación de normas legales y resoluciones.',
  },
  {
    name: 'Poder Judicial del Perú',
    url: 'https://www.pj.gob.pe/',
    country: 'PERU',
    type: 'judicial',
    description: 'Portal del Poder Judicial. Jurisprudencia, resoluciones y servicios judiciales.',
  },
  {
    name: 'Tribunal Constitucional del Perú',
    url: 'https://www.tc.gob.pe/',
    country: 'PERU',
    type: 'judicial',
    description: 'Sentencias y jurisprudencia constitucional del Perú.',
  },
  {
    name: 'Congreso de la República del Perú',
    url: 'https://www.congreso.gob.pe/',
    country: 'PERU',
    type: 'legislative',
    description: 'Proyectos de ley, normas aprobadas y debates parlamentarios.',
  },
  {
    name: 'Gobierno del Perú - Normas Legales',
    url: 'https://www.gob.pe/legislacion',
    country: 'PERU',
    type: 'official',
    description: 'Buscador oficial de normas legales del Perú.',
  },
  {
    name: 'SUNAT - Superintendencia Nacional de Aduanas',
    url: 'https://www.sunat.gob.pe/',
    country: 'PERU',
    type: 'official',
    description: 'Normativa tributaria y aduanera del Perú.',
  },
  {
    name: 'Ministerio de Trabajo del Perú',
    url: 'https://www.gob.pe/mtpe',
    country: 'PERU',
    type: 'official',
    description: 'Normativa laboral, decretos supremos y resoluciones ministeriales.',
  },

  // ============================================================
  // CHILE
  // ============================================================
  {
    name: 'Biblioteca del Congreso Nacional - Ley Chile',
    url: 'https://www.leychile.cl/',
    country: 'CHILE',
    type: 'official',
    description: 'Portal oficial de legislación chilena. Buscador de leyes, decretos y normativas.',
  },
  {
    name: 'Poder Judicial de Chile',
    url: 'https://www.pjud.cl/',
    country: 'CHILE',
    type: 'judicial',
    description: 'Portal del Poder Judicial de Chile. Sentencias y jurisprudencia.',
  },
  {
    name: 'Tribunal Constitucional de Chile',
    url: 'https://www.congresoconstitucional.cl/',
    country: 'CHILE',
    type: 'judicial',
    description: 'Jurisprudencia constitucional de Chile.',
  },
  {
    name: 'Diario Oficial de Chile',
    url: 'https://www.diariooficial.interior.gob.cl/',
    country: 'CHILE',
    type: 'official',
    description: 'Diario oficial del gobierno de Chile. Publicación de normas legales.',
  },
  {
    name: 'Ministerio de Justicia de Chile',
    url: 'https://www.mj.gob.cl/',
    country: 'CHILE',
    type: 'official',
    description: 'Portal del MINJUS de Chile. Normativa y servicios jurídicos.',
  },
  {
    name: 'Dirección del Trabajo de Chile',
    url: 'https://www.dt.gob.cl/',
    country: 'CHILE',
    type: 'official',
    description: 'Normativa laboral, dictámenes y resoluciones de la Dirección del Trabajo.',
  },
  {
    name: 'Servicio de Impuestos Internos (SII)',
    url: 'https://www.sii.cl/',
    country: 'CHILE',
    type: 'official',
    description: 'Normativa tributaria, impuestos y fiscalización del SII.',
  },
  {
    name: 'BCN - Biblioteca del Congreso',
    url: 'https://www.bcn.cl/',
    country: 'CHILE',
    type: 'official',
    description: 'Biblioteca del Congreso. Información legislativa y análisis.',
  },
  {
    name: 'Superintendencia de Banco y Entidades Financieras',
    url: 'https://www.sbif.cl/',
    country: 'CHILE',
    type: 'official',
    description: 'Regulación financiera y bancaria de Chile.',
  },
];

export function getSourcesByCountry(country: Country): LegalSource[] {
  return LEGAL_SOURCES.filter(s => s.country === country);
}

export function getSourcesByType(type: LegalSource['type']): LegalSource[] {
  return LEGAL_SOURCES.filter(s => s.type === type);
}

export function formatSourceReference(source: LegalSource): string {
  return `${source.name} - ${source.url}`;
}
