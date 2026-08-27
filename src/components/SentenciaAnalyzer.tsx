'use client';

import { useState } from 'react';
import { Country, LegalArea } from '@/types';

interface SentenciaAnalyzerProps {
  country: Country;
  legalArea?: LegalArea;
  onAnalyze: (texto: string) => void;
  onClose: () => void;
}

export default function SentenciaAnalyzer({ country, onAnalyze, onClose }: SentenciaAnalyzerProps) {
  const [texto, setTexto] = useState('');

  const charCount = texto.length;
  const maxChars = 20000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Analizador de Sentencias</h2>
            <p className="text-xs text-zinc-500">
              Pega el texto de una sentencia o resolución de {country === 'PERU' ? 'Perú' : country === 'CHILE' ? 'Chile' : 'Perú o Chile'} para obtener un análisis estructurado
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Texto de la resolución
            </label>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder={`Pega aquí el texto íntegro o el fundamento de la sentencia/resolución.\n\nSugerencia: copia desde "VISTOS" o "CONSIDERANDO" hasta el final de la parte resolutiva.`}
              rows={12}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 resize-y"
            />
            <div className="mt-1 flex justify-end">
              <span className={`text-[10px] ${charCount > maxChars ? 'text-red-400' : 'text-zinc-600'}`}>
                {charCount.toLocaleString('es')} / {maxChars.toLocaleString('es')} caracteres
              </span>
            </div>
          </div>

          <button
            onClick={() => onAnalyze(texto)}
            disabled={!texto.trim() || charCount > maxChars}
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Analizar sentencia
          </button>

          <p className="text-[10px] text-zinc-600">
            El análisis se basa únicamente en el texto que proporciones. No sustituye la revisión de la resolución oficial
            ni el criterio del abogado patrocinante.
          </p>
        </div>
      </div>
    </div>
  );
}