'use client';

interface SuggestedQuestionsProps {
  onQuestionClick: (question: string) => void;
}

const SUGGESTIONS = [
  {
    icon: '⚖️',
    text: 'Me despidieron sin previo aviso. ¿Qué derechos tengo?',
  },
  {
    icon: '📋',
    text: '¿Cuáles son los plazos para prescribir una deuda en Perú vs Chile?',
  },
  {
    icon: '🏠',
    text: 'Necesito saber qué pasa si mi arrendador no devuelve el depósito',
  },
  {
    icon: '💼',
    text: '¿Cuáles son las diferencias en regulación laboral entre Perú y Chile?',
  },
];

export default function SuggestedQuestions({ onQuestionClick }: SuggestedQuestionsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {SUGGESTIONS.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onQuestionClick(suggestion.text)}
          className="group flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-left transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5"
        >
          <span className="text-lg">{suggestion.icon}</span>
          <span className="text-sm text-zinc-400 group-hover:text-zinc-200">
            {suggestion.text}
          </span>
        </button>
      ))}
    </div>
  );
}
