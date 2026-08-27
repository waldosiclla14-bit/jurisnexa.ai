'use client';

import { useState } from 'react';
import { Country } from '@/types';

interface ValidationResult {
  country: 'PERU' | 'CHILE';
  encontrada: boolean;
  verificacion: 'VIGENTE' | 'DEROGADA' | 'MODIFICADA' | 'SUSPENDIDA' | 'DESCONOCIDA';
  norma?: string;
  tipo?: string;
  articulo?: string | null;
  url?: string | null;
  fragmento?: string;
  nota?: string;
}

interface NormValidatorProps {
  country: Country;
  onClose: () => void;
}

const BADGE_STYLES: Record<ValidationResult['verificacion'], { label: string; className: string }> = {
  VIGENTE: { label: 'VIGENTE', className: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40' },
  DEROGADA: { label: 'DEROGADA', className: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/40' },
  MODIFICADA: { label: 'MODIFICADA', className: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40' },
  SUSPENDIDA: { label: 'SUSPENDIDA', className: 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/40' },
  DESCONOCIDA: { label: 'DESCONOCIDA', className: 'bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/40' },
};

const COUNTRY_OPTIONS: { value: string; label: string }[] = [
  { value: 'PERU', label: 'Perú' },
  { value: 'CHILE', label: 'Chile' },
  { value: 'BOTH', label: 'Perú y Chile' },
];

export default function NormValidator({ country, onClose }: NormValidatorProps) {
  const initialCountry = country === 'PERU' || country === 'CHILE' ? country : 'PERU';
  const [texto, setTexto] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<'PERU' | 'CHILE' | 'BOTH'>(initialCountry);
  const [results, setResults] = useState<ValidationResult[] | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!texto.trim()) return;
    setIsChecking(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/validar-norma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: texto.trim(), country: selectedCountry }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
        throw new Error(errorData.error || `Error HTTP ${response.status}`);
      }

      const data = await response.json();
      setResults(data.resultados || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Verificador de Normas</h2>
            <p className="text-xs text-zinc-500">
              Consulta el estado de vigencia de una ley, código o artículo antes de citarlo
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
              ¿Qué norma quieres verificar?
            </label>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCheck();
                }
              }}
              placeholder="Ej. Artículo 1322 del Código Civil  |  Ley 20.744 contrato de trabajo"
              rows={2}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">País</label>
            <div className="flex flex-wrap gap-2">
              {COUNTRY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedCountry(opt.value as 'PERU' | 'CHILE' | 'BOTH')}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedCountry === opt.value
                      ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40'
                      : 'text-zinc-500 hover:text-zinc-300 ring-1 ring-zinc-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCheck}
            disabled={!texto.trim() || isChecking}
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isChecking ? 'Verificando...' : 'Verificar vigencia'}
          </button>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {results && (
            <div className="space-y-3">
              {results.map((r, i) => {
                const badge = BADGE_STYLES[r.verificacion];
                return (
                  <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                        {r.country === 'CHILE' ? 'Chile' : 'Perú'}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badge.className}`}>
                        {badge.label}
                      </span>
                      {r.articulo && (
                        <span className="rounded-full bg-zinc-700/50 px-2.5 py-0.5 text-[11px] text-zinc-300">
                          Art. {r.articulo}
                        </span>
                      )}
                    </div>

                    {r.norma && (
                      <p className="text-sm font-medium text-white">{r.norma}</p>
                    )}
                    {r.tipo && (
                      <p className="text-xs text-zinc-500">{r.tipo}</p>
                    )}
                    {r.nota && (
                      <p className="text-xs text-zinc-400">{r.nota}</p>
                    )}
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 underline"
                      >
                        Ver fuente oficial
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    )}
                    {r.fragmento && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">
                          Ver texto recuperado
                        </summary>
                        <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded bg-zinc-900 p-3 text-[11px] leading-relaxed text-zinc-300">
                          {r.fragmento}
                        </pre>
                      </details>
                    )}
                  </div>
                );
              })}

              <p className="text-[10px] text-zinc-600">
                La verificación se hace contra las fuentes indexadas en JurisNexa. Para una certeza absoluta confirma siempre en el texto oficial
                {results.some(r => r.url) ? ' (enlace "Ver fuente oficial")' : ''}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}