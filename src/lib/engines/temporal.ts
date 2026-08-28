import { findArticleByIdentifier, findLawByIdentifier } from '@/lib/rag/chilean-law-search';
import { TemporalAnalysis, DeadlineItem, RuleSource, LegalQualification, ExtractedFacts } from './types';

function sourceFor(identifier: string, article: string): RuleSource | null {
  const law = findLawByIdentifier(identifier);
  const art = findArticleByIdentifier(identifier, article);
  if (!law || !art) return null;
  return {
    identifier,
    title: law.title,
    rankLabel: law.rankLabel,
    articleNumber: art.number,
    articleTitle: art.title,
    content: art.text.substring(0, 1200),
    url: `https://www.leychile.cl/Navegar?idNorma=${identifier.replace('CL-', '')}`,
  };
}

export class TemporalLawEngine {
  analyze(qualification: LegalQualification, facts: ExtractedFacts): TemporalAnalysis {
    const deadlines: DeadlineItem[] = [];

    const isLaboral = qualification.primaryArea === 'laboral' || Boolean(qualification.figure?.includes('despido'));
    const isCivil = qualification.primaryArea === 'civil' || qualification.figure === 'incumplimiento-contractual' || qualification.figure === 'compraventa-daniada';
    const isPenal = qualification.primaryArea === 'penal';
    const isFamiliar = qualification.primaryArea === 'familia';

    deadlines.push(deadlineFrom(
      'Prescripción de derechos laborales',
      isLaboral,
      'CL-207436',
      '510',
      'Acciones nacidas del Código del Trabajo prescriben en 2 años desde que son exigibles; las acciones por actos y contratos de ese código, en 6 meses desde la terminación de los servicios.',
      'Aplica si la consulta se refiere a un despido, finiquito u otra acción laboral.',
    ));

    deadlines.push(deadlineFrom(
      'Prescripción de acciones civiles',
      isCivil,
      'CL-172986',
      '2515',
      'Acciones ejecutivas: 3 años; acciones ordinarias: 5 años. La acción ejecutiva se convierte en ordinaria por 3 años, durando luego solo 2 más.',
      'Aplica a cobros, incumplimientos contractuales y responsabilidad civil.',
    ));

    deadlines.push(deadlineFrom(
      'Prescripción de la acción penal (derecho penal)',
      isPenal,
      'CL-1984',
      '94',
      'La acción penal prescribe siguiendo las reglas del artículo 94 del Código Penal según la pena del delito (generalmente el máximo de la pena, con límites).',
      'Los plazos exactos dependen de la pena asignada al delito concreto. Usar el Art. 94 CP como referencia general.',
    ));

    deadlines.push(deadlineFrom(
      'Alimentos y familia',
      isFamiliar,
      'CL-172986',
      '2513',
      'La acción para pedir alimentos no prescribe mientras exista la necesidad y el vínculo, salvo cuotas devengadas (reglas generales de prescripción Civil).',
      'En pensión de alimentos las cuotas atrasadas sí prescriben; el derecho a pedir alimentos vigentes permanece.',
    ));

    const notes: string[] = [];
    if (facts.dates.length > 0) {
      notes.push(`Fechas detectadas en la consulta: ${facts.dates.join(', ')}. Contrastar contra los plazos de prescripción aplicables.`);
    }
    if (isLaboral) {
      notes.push('Materia laboral: los derechos laborales prescriben en 2 años desde que la acción es exigible, y las acciones derivadas del contrato de trabajo en 6 meses desde la terminación de los servicios (Art. 510 Código del Trabajo).');
    }
    if (isPenal) {
      notes.push('En materia penal, verificar además los plazos de investigación y las reglas de prescripción intermedia del Art. 94 CP.');
    }
    if (isCivil) {
      notes.push('Materia civil: prescripción ordinaria de 5 años y ejecutiva de 3 años (Art. 2515 Código Civil). El plazo se cuenta desde que la obligación se hace exigible.');
    }

    const applicableOnes = deadlines.filter(d => d.applicable);
    const applicableLawPeriod = applicableOnes.length > 0 ? applicableOnes.map(d => d.title).join('; ') : null;

    return { deadlines, applicableLawPeriod, notes };
  }
}

function deadlineFrom(
  title: string,
  applicable: boolean,
  identifier: string,
  article: string,
  observation: string | null,
  obsIfNot: string
): DeadlineItem {
  const src = sourceFor(identifier, article);
  const refs = src ? [src] : [];
  const deadline: DeadlineItem = {
    title,
    applicable,
    references: refs,
    observation: applicable ? observation : obsIfNot,
  };
  return deadline;
}

export const temporalLawEngine = new TemporalLawEngine();