export interface PELawRef {
  id: string;
  title: string;
  area: string;
  official: string;
  sourceUrl: string;
  seeded: boolean;
}

const SS: PELawRef[] = [
  { id: 'PE-CONST-1993', title: 'Constitución Política del Perú', area: 'constitucional', official: 'Constitución Política del Perú de 1993', sourceUrl: 'https://spij.minjus.gob.pe/', seeded: true },
  { id: 'PE-CC-1984', title: 'Código Civil de 1984', area: 'civil', official: 'Decreto Legislativo N° 295', sourceUrl: 'https://spij.minjus.gob.pe/', seeded: true },
  { id: 'PE-CP-1991', title: 'Código Penal de 1991', area: 'penal', official: 'Decreto Legislativo N° 635', sourceUrl: 'https://spij.minjus.gob.pe/', seeded: true },
  { id: 'PE-DS-003-97-TR', title: 'D.S. 003-97-TR', area: 'laboral', official: 'TUO del Decreto Legislativo N° 728 — Ley de Productividad y Competitividad Laboral', sourceUrl: 'https://www.mintra.gob.pe/', seeded: false },
  { id: 'PE-DL-774', title: 'Ley del Impuesto a la Renta', area: 'tributario', official: 'TUO del Decreto Legislativo N° 774', sourceUrl: 'https://www.gob.pe/sunat', seeded: false },
  { id: 'PE-L29571', title: 'Código de Protección y Defensa del Consumidor', area: 'consumidor', official: 'Ley N° 29571', sourceUrl: 'https://www.gob.pe/indecopi', seeded: false },
  { id: 'PE-L29497', title: 'Ley 29497', area: 'laboral', official: 'Nueva Ley Procesal del Trabajo', sourceUrl: 'https://spij.minjus.gob.pe/', seeded: false },
  { id: 'PE-L27337', title: 'Código de los Niños y Adolescentes', area: 'familia', official: 'Ley N° 27337', sourceUrl: 'https://www.gob.pe/mimp', seeded: false },
];

export const PE_KNOWLEDGE_BASE: ReadonlyArray<PELawRef> = SS;

export function resolvePELaw(titleOrFragment: string): PELawRef | null {
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const needle = norm(titleOrFragment);
  const digits = (s: string) => norm(s).match(/\d{2,}/g) ?? [];
  const needleDigits = digits(needle);
  return (
    SS.find(
      (l) =>
        norm(l.title).includes(needle) || needle.includes(norm(l.title)) || norm(l.official).includes(needle)
    ) ??
    SS.find((l) => {
      const lawDigits = [...digits(l.title), ...digits(l.official)];
      return needleDigits.length > 0 && needleDigits.some((d) => lawDigits.includes(d));
    }) ??
    null
  );
}