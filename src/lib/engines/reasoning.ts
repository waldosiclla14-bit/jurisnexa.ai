import { LegalQualification, ExtractedFacts, CaseComparisonItem, MissingFact, EvidenceItem, LegalConflictItem, RiskItem, AdaptiveInterviewResult, InterviewQuestion } from './types';

function caseElement(legalElement: string, present: boolean, detail: string): CaseComparisonItem {
  return { legalElement, present, detail };
}

export class CaseComparisonEngine {
  compare(qualification: LegalQualification, facts: ExtractedFacts, message: string): CaseComparisonItem[] {
    const norm = message.toLowerCase();
    const items: CaseComparisonItem[] = [];

    if (qualification.figure?.includes('usurpacion')) {
      items.push(caseElement('Ocupación total o parcial del inmueble', /ocupar|ocupac|invad|toma de/.test(norm), '¿La persona ocupó el inmueble? Entrar o permanecer sin título.'));
      items.push(caseElement('Titularidad o posesión legítima del afectado', /mi propiedad|mi casa|mi departamento|mi terreno|poseo|propietario|titulado/.test(norm), '¿Quién es el titular o poseedor legítimo del bien?'));
      items.push(caseElement('Violencia o intimidación en las personas', /violencia|intimidacion|amenaz|golpe/.test(norm), 'Relevante para distinguir Art. 457 (violencia) de 457 bis/458.'));
      items.push(caseElement('Fecha de la ocupación', /hace \d|el \d|ayer|fecha/.test(norm), 'La antigüedad de la ocupación es clave (flagrancia limitada a 12h; desalojo cautelar).'));
      items.push(caseElement('Inscripción del inmueble a nombre del afectado', /inscri|conservador|título|dominio/.test(norm), 'Necesaria para la medida cautelar real del Art. 157 ter CPP.'));
      return items;
    }

    if (qualification.figure === 'despido-injustificado') {
      items.push(caseElement('Existencia de relación laboral', /trabaj|empleo|contrato de trabajo/.test(norm), 'Elemento de la relación de subordinación y dependencia.'));
      items.push(caseElement('Forma del despido (escrito / causal invocada)', /cart[aá]|aviso|notific|despid/.test(norm), 'Procedencia de la comunicación del despido.'));
      items.push(caseElement('Antigüedad y cotizaciones', /a[ñn]os|meses|fecha|vencid/.test(norm), 'Determina el cálculo de la indemnización.'));
      items.push(caseElement('Causal invocada (justificada o injustificada)', /justificad|injustificad|necesidades|falta|vulnera/.test(norm), 'Determina si aplican recargos del Art. 168 CT.'));
      return items;
    }

    if (qualification.figure === 'alimentos') {
      items.push(caseElement('Vínculo con el obligado', /hij|padre|madre|espos|conviviente/.test(norm), 'Requisito para exigir alimentos.'));
      items.push(caseElement('Capacidad económica de quien pide y del obligado', /ingreso|sueldo|trabaj|sin empleo/.test(norm), 'Prueba de la necesidad y la capacidad.'));
      items.push(caseElement('Necesidad del alimentario', /necesit|sin recursos|enfermedad|menor/.test(norm), 'Base del monto de la pensión.'));
      return items;
    }

    if (qualification.figure === 'herencia-intestada') {
      items.push(caseElement('Parentesco con el causante', /padre|madre|hij|conyug|espos|herman/.test(norm), 'Define el orden de sucesión intestada.'));
      items.push(caseElement('Existencia o no de testamento', /testament|sin testament|hereda/.test(norm), 'Cambia las reglas aplicables.'));
      items.push(caseElement('Personas involucradas con derechos', /hijos?|otro/.test(norm), 'Puede haber otros legitimarios.'));
      return items;
    }

    items.push(caseElement('Hechos relatados por el usuario', facts.parties.length > 0, 'Relato de lo ocurrido'));
    items.push(caseElement('Fechas de los hechos', facts.dates.length > 0, 'Necesarias para plazos y vigencia'));
    items.push(caseElement('Documentación disponible', /contrato|boleta|factura|correo|carta|escrito|título|inscripc/.test(norm), 'Prueba fundamental'));
    items.push(caseElement('Intervención de terceros o contraparte', facts.parties.length > 1, 'Otros sujetos relevantes'));
    items.push(caseElement('Procedimientos iniciados', /demanda|juicio|denuncia|querella|tribunal|causa/.test(norm), 'Existencia de litigio previo'));

    return items;
  }
}

export const caseComparisonEngine = new CaseComparisonEngine();

export class MissingFactsEngine {
  missing(qualification: LegalQualification, facts: ExtractedFacts): MissingFact[] {
    const priorities: MissingFact[] = [];

    if (!facts.dates.length) {
      priorities.push({ question: '¿Cuándo ocurrieron los hechos?', kind: 'fecha', priority: 10, rationale: 'Toda la vigencia de normas y plazos de prescripción dependen de la fecha.' });
    }
    if (!facts.parties.length) {
      priorities.push({ question: '¿Quiénes intervienen y en qué calidad (cliente, contraparte, tercero)?', kind: 'persona', priority: 9, rationale: 'Identificar a los sujetos del caso.' });
    }
    if (qualification.figure?.includes('usurpacion')) {
      priorities.push({ question: '¿El inmueble está inscrito a tu nombre o del afectado?', kind: 'documento', priority: 9, rationale: 'Necesario para la medida cautelar del Art. 157 ter CPP.' });
      priorities.push({ question: '¿La ocupación fue con violencia, daño o sin ninguno de los dos?', kind: 'conducta', priority: 8, rationale: 'Define el artículo aplicable (457, 457 bis o 458 CP).' });
      priorities.push({ question: '¿En qué fecha y de qué forma tomaste conocimiento de la ocupación?', kind: 'fecha', priority: 7, rationale: 'La flagrancia está limitada a 12 horas (Art. 134 CPP).' });
    }
    if (qualification.figure === 'despido-injustificado') {
      priorities.push({ question: '¿Existe contrato de trabajo y cuántos años de servicio?', kind: 'documento', priority: 8, rationale: 'Base de cálculo de la indemnización.' });
      priorities.push({ question: '¿La causal invocada en el despido fue justificada o injustificada?', kind: 'conducta', priority: 7, rationale: 'Determina recargos legales.' });
    }
    if (qualification.figure === 'herencia-intestada') {
      priorities.push({ question: '¿Existía testamento u otra sucesión previa?', kind: 'documento', priority: 8, rationale: 'Cambia las reglas aplicables.' });
    }

    if (priorities.length === 0) {
      priorities.push({ question: '¿Qué documentación tienes disponible (contratos, escrituras, correos, boletas)?', kind: 'documento', priority: 5, rationale: 'La prueba documental fundamenta cualquier análisis.' });
    }

    return priorities.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }
}

export const missingFactsEngine = new MissingFactsEngine();

function evidenceItem(probanza: string, mentioned: boolean, kind: string): EvidenceItem {
  return {
    probanza,
    kind,
    mentioned,
    strength: mentioned ? 'Se menciona; valorar oportunidad y admisibilidad' : null,
    note: mentioned ? 'La prueba concreta debe acompañarse a la demanda o denuncia según corresponda.' : 'No se menciona: reunirla antes de cualquier acción.',
  };
}

export class EvidenceAssessmentEngine {
  assess(message: string, qualification: LegalQualification): EvidenceItem[] {
    const items: EvidenceItem[] = [
      evidenceItem('Documental', /contrato|escritura|título|inscripc|boleta|factura|correo|carta|escrito|testamento|poder|recibo/.test(message), 'documental'),
      evidenceItem('Testimonial', /testigo|declar|amigo|vecino|persona/.test(message), 'testimonial'),
      evidenceItem('Instrumental pública', /notario|escritura pública|protocoliz/.test(message), 'instrumental'),
      evidenceItem('Pericial', /perito|informe pericial|medico legal|informe t[eé]cnico/.test(message), 'pericial'),
      evidenceItem('Registro audiovisual / fotográfico', /video|foto|registro|c[aá]mara/.test(message), 'audiovisual'),
    ];

    if (qualification.figure?.includes('usurpacion')) {
      items.push(evidenceItem('Inscripción vigente del inmueble (conservador de bienes raíces)', /inscri|conservador|título/.test(message), 'instrumental'));
      items.push(evidenceItem('Denuncia ante Carabineros / Ministerio Público', /denuncia|carabinero|fiscal/.test(message), 'documental'));
    }

    return items;
  }
}

export const evidenceAssessmentEngine = new EvidenceAssessmentEngine();

function costBenefitCheck(norm: string): boolean {
  return /consumidor|reclamo|sernac|multa|devoluci/.test(norm);
}

export class LegalConflictEngine {
  conflicts(qualification: LegalQualification, message: string): LegalConflictItem[] {
    const norm = message.toLowerCase();
    const list: LegalConflictItem[] = [];

    if (qualification.figure?.includes('usurpacion')) {
      list.push({ type: 'temporal', title: 'Derecho del poseedor vs. estado de flagrancia', detail: 'El Art. 134 CPP amplía la detención por flagrancia a la ocupación, pero no reemplaza las acciones posesorias del Código Civil; conviven acciones penal y civil.' });
    }
    if (qualification.areas.length > 1) {
      list.push({ type: 'aparente', title: 'Posible concurrencia de áreas', detail: `La consulta podría enmarcarse en más de un área (${qualification.areas.map(a => a.area).join(', ')}). Validar la vía procesal correcta.` });
    }
    if (costBenefitCheck(norm)) {
      list.push({ type: 'competencia', title: 'Análisis costo/beneficio y vía administrativa previa', detail: 'Antes de judicializar, verificar instancias administrativas (Sernac, Inspección del Trabajo, SII) que pueden resolver sin juicio.' });
    }

    return list;
  }
}

export const legalConflictEngine = new LegalConflictEngine();

function risk(level: RiskItem['level'], title: string, detail: string, mitigation: string): RiskItem {
  return { level, title, detail, mitigation };
}

export class LegalRiskEngine {
  risks(qualification: LegalQualification, facts: ExtractedFacts): RiskItem[] {
    const risks: RiskItem[] = [];

    if (qualification.figure?.includes('usurpacion')) {
      risks.push(risk('CRITICO', 'El tiempo juega en contra', 'La flagrancia de la ocupación se limita a 12 horas (Art. 134 CPP); el desalojo cautelar del Art. 157 ter CPP puede solicitarse en cualquier etapa.', 'Actuar de inmediato: denunciar y solicitar medida cautelar real.'));
      risks.push(risk('ALTO', 'Cálculo de pena según modalidad', 'Las penas varían sustancialmente entre 457, 457 bis y 458 CP según violencia/daño.', 'Precisar los hechos de la ocupación para fijar el artículo aplicable.'));
    }
    if (qualification.figure === 'despido-injustificado' && facts.dates.length === 0) {
      risks.push(risk('ALTO', 'Prescripción laboral', 'Las acciones laborales prescriben en 2 años (Art. 510 CT), y en 6 meses desde la terminación de los servicios.', 'No demorar la reclamación laboral.'));
    }
    if (qualification.primaryArea === 'civil' || qualification.figure === 'incumplimiento-contractual') {
      risks.push(risk('MEDIO', 'Prescripción civil', 'Acciones ejecutivas: 3 años; ordinarias: 5 años (Art. 2515 CC).', 'Verificar fecha de exigibilidad de la obligación.'));
    }
    if (qualification.areas.length === 0) {
      risks.push(risk('BAJO', 'Falta de contexto', 'No se pudo enmarcar el tema en un área jurídica con certeza.', 'Enriquecer el relato con fechas y documentos.'));
    }

    return risks;
  }
}

export const legalRiskEngine = new LegalRiskEngine();

export class AdaptiveLegalInterview {
  build(askedCount: number, qualification: LegalQualification, missingFacts: MissingFact[]): AdaptiveInterviewResult {
    const questions: InterviewQuestion[] = [];

    const base = (idx: number): InterviewQuestion => ({
      question: missingFacts[idx].question,
      option1: null,
      option2: null,
      option3: null,
      option4: null,
      option5: null,
      required: missingFacts[idx].priority >= 8,
      rationale: missingFacts[idx].rationale,
    });

    const budget = Math.max(0, 3 - askedCount);
    for (let i = 0; i < Math.min(budget, missingFacts.length); i++) {
      questions.push(base(i));
    }

    const answered = questions.length;
    const exhausted = askedCount + answered >= 10;

    return {
      questions,
      askedCount: askedCount + answered,
      exhausted,
    };
  }
}

export const adaptiveLegalInterview = new AdaptiveLegalInterview();