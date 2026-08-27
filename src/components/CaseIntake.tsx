'use client';

import { useState, useCallback, useRef } from 'react';

interface CaseIntakeProps {
  onComplete: (facts: string, matter: string) => void;
  onClose: () => void;
}

interface IntakeStep {
  id: string;
  question: string;
  hint?: string;
  type: 'text' | 'textarea' | 'select' | 'date';
  options?: { value: string; label: string }[];
  required?: boolean;
}

const INTAKE_STEPS: IntakeStep[] = [
  {
    id: 'tipo',
    question: '¿Qué tipo de problema jurídico tienes?',
    hint: 'Selecciona la categoría que mejor describa tu caso',
    type: 'select',
    options: [
      { value: 'laboral', label: 'Despido / Problema laboral' },
      { value: 'civil', label: 'Deuda / Incumplimiento contractual' },
      { value: 'familia', label: 'Familia (pensión, divorcio, tenencia)' },
      { value: 'arriendo', label: 'Arriendo / Alquiler' },
      { value: 'accidente', label: 'Accidente / Daño' },
      { value: 'consumidor', label: 'Consumidor / SERNAC' },
      { value: 'otro', label: 'Otro' },
    ],
    required: true,
  },
  {
    id: 'relato',
    question: 'Cuéntame desde el principio, con fechas. ¿Qué pasó?',
    hint: 'Incluye fechas, nombres, montos, y una narración cronológica',
    type: 'textarea',
    required: true,
  },
  {
    id: 'documentos',
    question: '¿Qué documentos tienes como prueba?',
    hint: 'Lista los documentos disponibles (contrato, liquidaciones, correos, WhatsApp, fotos, etc.)',
    type: 'textarea',
  },
  {
    id: 'objetivo',
    question: '¿Qué quieres lograr con esto?',
    hint: 'Ej: Que me paguen, que me readmitan, que me devuelvan dinero, que se vayan, etc.',
    type: 'text',
    required: true,
  },
  {
    id: 'comuna',
    question: '¿En qué comuna de Chile ocurre el problema?',
    hint: 'Esto determina el tribunal competente',
    type: 'text',
  },
  {
    id: 'plazo',
    question: '¿Cuándo ocurrió o terminó el problema?',
    hint: 'Fecha aproximada. Importante para detectar plazos fatales.',
    type: 'date',
  },
];

function detectRUT(text: string): string[] {
  const rutRegex = /\b\d{1,2}\.\d{3}\.\d{3}-[\dkK]\b/g;
  return text.match(rutRegex) || [];
}

function detectDates(text: string): string[] {
  const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
  return text.match(dateRegex) || [];
}

function detectAmounts(text: string): string[] {
  const amountRegex = /\$[\d.,]+(?:\s*(?:CLP|UF|UTM))?|\b\d{1,3}(?:\.\d{3})+\s*(?:CLP|pesos)?\b/gi;
  return text.match(amountRegex) || [];
}

function calculateDeadlineWarning(startDate: string, matter: string): string | null {
  if (!startDate) return null;
  try {
    const start = new Date(startDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (matter === 'laboral') {
      const deadline60 = 60 - diffDays;
      if (deadline60 > 0 && deadline60 <= 15) {
        return `ALERTA: Plazo de 60 días hábiles para demandar vence en ~${deadline60} días (Art. 168 CT). ¡Actúa rápido!`;
      }
      if (deadline60 <= 0) {
        return `ALERTA: El plazo de 60 días hábiles para demandar pudo haber vencido. Verifica en el Buscador PJUD.`;
      }
    }

    if (diffDays > 180) {
      return `ALERTA: Han pasado ${diffDays} días desde los hechos. La prescripción es de 6 meses en materias laborales (Art. 510 CT).`;
    }
  } catch { /* ignore */ }
  return null;
}

export default function CaseIntake({ onComplete, onClose }: CaseIntakeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [alerts, setAlerts] = useState<string[]>([]);
  const [detectedEntities, setDetectedEntities] = useState<{ ruts: string[]; dates: string[]; amounts: string[] }>({ ruts: [], dates: [], amounts: [] });
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const step = INTAKE_STEPS[currentStep];
  const progress = ((currentStep + 1) / INTAKE_STEPS.length) * 100;

  const handleAnswer = useCallback((value: string) => {
    setAnswers(prev => ({ ...prev, [step.id]: value }));

    // Detect entities
    const allText = Object.values({ ...answers, [step.id]: value }).join(' ');
    const ruts = detectRUT(allText);
    const dates = detectDates(allText);
    const amounts = detectAmounts(allText);
    setDetectedEntities({ ruts, dates, amounts });

    // Check deadline
    if (step.id === 'plazo' || step.id === 'relato') {
      const matter = answers.tipo || '';
      const warning = calculateDeadlineWarning(value, matter);
      if (warning && !alerts.includes(warning)) {
        setAlerts(prev => [...prev, warning]);
      }
    }
  }, [step, answers, alerts]);

  const canProceed = () => {
    if (step.required && !answers[step.id]?.trim()) return false;
    return true;
  };

  const handleNext = () => {
    if (currentStep < INTAKE_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Build final facts string
      const facts = buildFactsString(answers);
      const matter = answers.tipo || 'otro';
      onComplete(facts, matter);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && canProceed()) {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">

        {/* Header */}
        <div className="border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">Armador de Carpetas</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAnswers({
                    tipo: 'laboral',
                    relato: 'Me despidieron el 10 de agosto 2026 en Santiago, sin carta de aviso. Trabajé 2 años con contrato indefinido, sueldo $800.000. No me pagaron mes de aviso. Tengo liquidaciones.',
                    documentos: 'Contrato indefinido, liquidaciones de sueldo.',
                    objetivo: 'Que me paguen la indemnización y el mes de aviso.',
                    comuna: 'Santiago',
                    plazo: '2026-08-10',
                  });
                  setCurrentStep(5);
                }}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                Caso de prueba
              </button>
              <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>Paso {currentStep + 1} de {INTAKE_STEPS.length}</span>
            <span>·</span>
            <span className="text-emerald-400">Chile</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1 rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mx-6 mt-4 space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-300 flex items-start gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {alert}
              </div>
            ))}
          </div>
        )}

        {/* Detected entities */}
        {(detectedEntities.ruts.length > 0 || detectedEntities.dates.length > 0 || detectedEntities.amounts.length > 0) && (
          <div className="mx-6 mt-3 flex flex-wrap gap-2">
            {detectedEntities.ruts.map((r, i) => (
              <span key={`r${i}`} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                RUT: {r}
              </span>
            ))}
            {detectedEntities.dates.map((d, i) => (
              <span key={`d${i}`} className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400">
                Fecha: {d}
              </span>
            ))}
            {detectedEntities.amounts.map((a, i) => (
              <span key={`a${i}`} className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                Monto: {a}
              </span>
            ))}
          </div>
        )}

        {/* Question */}
        <div className="px-6 py-6">
          <label className="block text-sm font-medium text-white mb-1">{step.question}</label>
          {step.hint && <p className="text-xs text-zinc-500 mb-3">{step.hint}</p>}

          {step.type === 'text' && (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={answers[step.id] || ''}
              onChange={e => handleAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Escribe tu respuesta..."
              autoFocus
            />
          )}

          {step.type === 'textarea' && (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={answers[step.id] || ''}
              onChange={e => handleAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[120px] resize-none"
              placeholder="Cuenta los hechos con fechas y detalles..."
              autoFocus
            />
          )}

          {step.type === 'select' && (
            <div className="grid grid-cols-1 gap-2">
              {step.options?.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { handleAnswer(opt.value); }}
                  className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-all ${
                    answers[step.id] === opt.value
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {step.type === 'date' && (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="date"
              value={answers[step.id] || ''}
              onChange={e => handleAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              autoFocus
            />
          )}
        </div>

        {/* Navigation */}
        <div className="border-t border-zinc-800 px-6 py-4 flex items-center justify-between">
          <button
            onClick={currentStep === 0 ? onClose : handleBack}
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            {currentStep === 0 ? 'Cancelar' : '← Atrás'}
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {currentStep === INTAKE_STEPS.length - 1 ? 'Generar Carpeta →' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function buildFactsString(answers: Record<string, string>): string {
  const matterLabels: Record<string, string> = {
    laboral: 'DESPIDO / PROBLEMA LABORAL',
    civil: 'DEUDA / INCUMPLIMIENTO CONTRACTUAL',
    familia: 'FAMILIA (PENSIÓN, DIVORCIO, TENENCIA)',
    arriendo: 'ARRIENDO / ALQUILER',
    accidente: 'ACCIDENTE / DAÑO',
    consumidor: 'CONSUMIDOR / SERNAC',
    otro: 'OTRO',
  };

  let facts = '';
  facts += `MATERIA: ${matterLabels[answers.tipo] || answers.tipo}\n\n`;
  facts += `RELATO DEL CLIENTE:\n${answers.relato}\n\n`;

  if (answers.documentos) {
    facts += `DOCUMENTOS DISPONIBLES:\n${answers.documentos}\n\n`;
  }

  facts += `OBJETIVO DEL CLIENTE:\n${answers.objetivo}\n\n`;

  if (answers.comuna) {
    facts += `COMUNA: ${answers.comuna}\n\n`;
  }

  if (answers.plazo) {
    facts += `FECHA RELEVANTE: ${answers.plazo}\n`;
  }

  return facts;
}
