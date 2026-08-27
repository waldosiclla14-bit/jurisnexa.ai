'use client';

import { useMemo, useState } from 'react';
import { PaisPlazos, ModoComputo, calcularPlazo, formatFecha, fechaISO } from '@/lib/legal/plazos';

export default function PlazosPage() {
  const [fechaNotificacion, setFechaNotificacion] = useState(() => fechaISO(new Date()));
  const [plazo, setPlazo] = useState(10);
  const [pais, setPais] = useState<PaisPlazos>('PERU');
  const [modo, setModo] = useState<ModoComputo>('habiles');
  const [nota, setNota] = useState('');

  const resultado = useMemo(() => {
    if (!fechaNotificacion || plazo < 1) return null;
    try {
      return calcularPlazo(fechaNotificacion, plazo, pais, modo);
    } catch {
      return null;
    }
  }, [fechaNotificacion, plazo, pais, modo]);

  const diasRestantes = useMemo(() => {
    if (!resultado) return null;
    const hoy = new Date();
    const hoyIni = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return Math.round((resultado.fechaVencimiento.getTime() - hoyIni.getTime()) / 86400000);
  }, [resultado]);

  const calendarioUrl = resultado
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Vence plazo jurídico')}&dates=${fechaISO(resultado.fechaInicio)}/${fechaISO(resultado.fechaVencimiento)}`
    : '';

  const referencia = pais === 'PERU'
    ? 'Art. 144 y 145 del Código Procesal Civil (días hábiles; corre desde el día siguiente a la notificación)'
    : 'Arts. 38 a 40 del Código de Procedimiento Civil (término corre desde el día siguiente; plazos de días se cuentan en días hábiles)';

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">Calculadora de Plazos Procesales</h1>
        <p className="text-sm text-zinc-500">
          Calcula el vencimiento de plazos en días hábiles o corridos para {pais === 'PERU' ? 'Perú' : 'Chile'}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">País</label>
            <div className="grid grid-cols-2 gap-2">
              {(['PERU', 'CHILE'] as PaisPlazos[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPais(p)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    pais === p
                      ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40'
                      : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 ring-1 ring-zinc-800'
                  }`}
                >
                  {p === 'PERU' ? 'Perú' : 'Chile'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="fecha-notif">
              Fecha de notificación
            </label>
            <input
              id="fecha-notif"
              type="date"
              value={fechaNotificacion}
              max={addDefaultDays(365)}
              onChange={e => setFechaNotificacion(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="plazo-dias">
              Plazo (días)
            </label>
            <input
              id="plazo-dias"
              type="number"
              min={1}
              max={720}
              value={plazo}
              onChange={e => setPlazo(Math.max(1, parseInt(e.target.value, 10) || 0))}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Cómputo</label>
            <div className="grid grid-cols-2 gap-2">
              {(['habiles', 'calendario'] as ModoComputo[]).map(m => (
                <button
                  key={m}
                  onClick={() => setModo(m)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    modo === m
                      ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40'
                      : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 ring-1 ring-zinc-800'
                  }`}
                >
                  {m === 'habiles' ? 'Días hábiles' : 'Días corridos'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Nota (opcional)</label>
            <input
              type="text"
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Ej. Término para contestar la demanda"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          {resultado ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-zinc-500">Base legal</span>
                <span className="text-[10px] text-zinc-600">{pais === 'PERU' ? 'CPC Perú' : 'CPC Chile'}</span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-500">{referencia}</p>

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Notificación</span>
                  <span className="text-zinc-200">{formatFecha(resultado.fechaNotificacion, pais)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Comienza a correr</span>
                  <span className="text-zinc-200">{formatFecha(resultado.fechaInicio, pais)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-zinc-800 pt-2">
                  <span className="text-zinc-300 font-medium">Vence</span>
                  <span className={`font-bold ${diasRestantes !== null && diasRestantes < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatFecha(resultado.fechaVencimiento, pais)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-zinc-800/50 p-3">
                  <div className="text-xl font-bold text-white">{resultado.diasCalendario}</div>
                  <div className="text-[10px] text-zinc-500">días corridos</div>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-3">
                  <div className={`text-xl font-bold ${diasRestantes !== null && diasRestantes < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {diasRestantes !== null ? (diasRestantes <= 0 ? 0 : diasRestantes) : '—'}
                  </div>
                  <div className="text-[10px] text-zinc-500">días restantes hoy</div>
                </div>
              </div>

              {resultado.feriadosIntermedios.length > 0 && (
                <details>
                  <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">
                    {resultado.feriadosIntermedios.length} feriado{resultado.feriadosIntermedios.length > 1 ? 's' : ''} en el período
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {resultado.feriadosIntermedios.map((f, i) => (
                      <li key={i} className="flex justify-between text-xs text-zinc-400">
                        <span>{f.nombre}</span>
                        <span className="text-zinc-500">{formatFecha(f.fecha, pais)}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {calendarioUrl && (
                <a
                  href={calendarioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-white py-2.5 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Agregar vencimiento al calendario
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Ingresa los datos para calcular el vencimiento.</p>
          )}
        </div>
      </div>

      <p className="text-[10px] text-zinc-600">
Cálculo referencial. No incluye feriados puente/sándwich ni particularidades de ciertos tribunales
        y materias (penal, laboral, tributario). Verifica siempre el cómputo definitivo en tu expediente.
      </p>
    </div>
  );
}

function addDefaultDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}