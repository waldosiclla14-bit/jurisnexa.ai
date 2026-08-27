'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FirmCaso } from '@/lib/db/queries';

interface FirmCaseListProps {
  firmId: string;
  isAdmin: boolean;
}

const ESTADOS: { value: FirmCaso['estado']; label: string; badge: string }[] = [
  { value: 'activo', label: 'Activo', badge: 'bg-emerald-900/40 text-emerald-300' },
  { value: 'pausado', label: 'Pausado', badge: 'bg-amber-900/40 text-amber-300' },
  { value: 'archivado', label: 'Archivado', badge: 'bg-zinc-700/40 text-zinc-300' },
  { value: 'perdido', label: 'Perdido', badge: 'bg-red-900/40 text-red-300' },
  { value: 'ganado', label: 'Ganado', badge: 'bg-emerald-900/40 text-emerald-300' },
];

const MATERIAS = ['Civil', 'Laboral', 'Familia', 'Penal', 'Tributario', 'Comercial', 'Administrativo', 'Notarial', 'Migración', 'Otro'];

const emptyForm = {
  cliente: '',
  contraparte: '',
  materia: '',
  tribunal: '',
  rol: '',
  vencimiento: '',
  notas: '',
};

export default function FirmCaseList({ firmId, isAdmin }: FirmCaseListProps) {
  const [casos, setCasos] = useState<FirmCaso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  const fetchCasos = useCallback(async (): Promise<FirmCaso[]> => {
    const res = await fetch(`/api/firms/${firmId}/casos`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return (data.casos as FirmCaso[]) || [];
  }, [firmId]);

  useEffect(() => {
    let cancelled = false;
    fetchCasos()
      .then(casos => {
        if (!cancelled) {
          setCasos(casos);
          setError('');
        }
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar los casos');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchCasos]);

  const hoy = new Date();
  const hoyIni = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  const daysUntil = (dateStr: string | null): number | null => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    return Math.round((target.getTime() - hoyIni.getTime()) / 86400000);
  };

  const handleCreate = async () => {
    if (!form.cliente.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/firms/${firmId}/casos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: form.cliente.trim(),
          contraparte: form.contraparte.trim() || undefined,
          materia: form.materia || undefined,
          tribunal: form.tribunal.trim() || undefined,
          rol: form.rol.trim() ? Number(form.rol.trim()) : null,
          vencimiento: form.vencimiento || null,
          notas: form.notas.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setForm(emptyForm);
      setShowForm(false);
      fetchCasos()
        .then(casos => setCasos(casos))
        .catch(err => setError(err instanceof Error ? err.message : 'Error al refrescar casos'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el caso');
    } finally {
      setSaving(false);
    }
  };

  const handleEstado = async (caso: FirmCaso, estado: string) => {
    setError('');
    try {
      const res = await fetch(`/api/firms/${firmId}/casos/${caso.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCasos(prev => prev.map(c => (c.id === caso.id ? { ...c, estado: estado as FirmCaso['estado'] } : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el estado');
    }
  };

  const handleDelete = async (caso: FirmCaso) => {
    if (!window.confirm(`¿Eliminar el caso de ${caso.cliente}? Esta acción no se puede deshacer.`)) return;
    setError('');
    try {
      const res = await fetch(`/api/firms/${firmId}/casos/${caso.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCasos(prev => prev.filter(c => c.id !== caso.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el caso');
    }
  };

  const activos = casos.filter(c => c.estado === 'activo');
  const sinVencimientoPlazo = casos.filter(c => c.vencimiento && daysUntil(c.vencimiento) !== null && daysUntil(c.vencimiento)! <= 3 && c.estado === 'activo');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-white">Casos ({casos.length})</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Nuevo caso'}
        </button>
      </div>

      {sinVencimientoPlazo.length > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm font-medium text-red-400">
            ⚠️ {sinVencimientoPlazo.length} caso{sinVencimientoPlazo.length > 1 ? 's' : ''} con vencimiento en 3 días o menos:
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {sinVencimientoPlazo.map(c => (
              <span key={c.id} className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs text-red-300">
                {c.cliente} — vence {new Date(c.vencimiento!).toLocaleDateString('es')}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-[11px] text-zinc-400">
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 ring-1 ring-emerald-500/20">{activos.length} activos</span>
        <Link href="/plazos" className="rounded-full bg-violet-500/10 px-2.5 py-1 ring-1 ring-violet-500/20 text-violet-300 hover:bg-violet-500/20 transition-colors">
          Usa la calculadora de plazos →
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Cliente *</label>
              <input
                value={form.cliente}
                onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))}
                placeholder="Nombre del cliente"
                className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2.5 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Contraparte</label>
              <input
                value={form.contraparte}
                onChange={e => setForm(f => ({ ...f, contraparte: e.target.value }))}
                placeholder="Parte contraria"
                className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2.5 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Materia</label>
              <select
                value={form.materia}
                onChange={e => setForm(f => ({ ...f, materia: e.target.value }))}
                className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2.5 py-1.5 text-sm text-white outline-none focus:border-emerald-500/50"
              >
                <option value="">Seleccionar materia</option>
                {MATERIAS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Tribunal / Juzgado</label>
              <input
                value={form.tribunal}
                onChange={e => setForm(f => ({ ...f, tribunal: e.target.value }))}
                placeholder="Ej. 3° Juzgado de Trabajo"
                className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2.5 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Rol / Expediente</label>
              <input
                value={form.rol}
                onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}
                placeholder="N° de rol, expediente o RIT"
                className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2.5 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Próximo vencimiento</label>
              <input
                type="date"
                value={form.vencimiento}
                onChange={e => setForm(f => ({ ...f, vencimiento: e.target.value }))}
                className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2.5 py-1.5 text-sm text-white outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Notas</label>
            <textarea
              value={form.notas}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              rows={2}
              placeholder="Plazos a vigilar, acuerdos, pendientes..."
              className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2.5 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500/50 resize-none"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!form.cliente.trim() || saving}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar caso'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando casos...</p>
      ) : casos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
          <p className="text-sm text-zinc-500">Aún no hay casos registrados.</p>
          <p className="text-xs text-zinc-600 mt-1">Registra tus expedientes para no perder ningún vencimiento.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Materia</th>
                <th className="px-4 py-3 font-medium">Tribunal / Rol</th>
                <th className="px-4 py-3 font-medium">Vencimiento</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {casos.map(c => {
                const dias = daysUntil(c.vencimiento);
                const badge = ESTADOS.find(e => e.value === c.estado) || ESTADOS[0];
                return (
                  <tr key={c.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/40">
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{c.cliente}</div>
                      {c.contraparte && (
                        <div className="text-[11px] text-zinc-500">vs {c.contraparte}</div>
                      )}
                      {c.abogado?.full_name && (
                        <div className="text-[10px] text-zinc-600">{c.abogado.full_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{c.materia || '—'}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      <div>{c.tribunal || '—'}</div>
                      {c.rol && <div className="text-[11px] text-zinc-600">Rol: {c.rol}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {c.vencimiento ? (
                        <div>
                          <span className="text-zinc-200">{new Date(c.vencimiento).toLocaleDateString('es')}</span>
                          {dias !== null && dias <= 5 && (
                            <div className={`text-[11px] font-medium ${dias < 0 ? 'text-red-400' : dias <= 3 ? 'text-red-400' : 'text-amber-400'}`}>
                              {dias < 0 ? `venció hace ${Math.abs(dias)}d` : dias === 0 ? '¡vence hoy!' : `en ${dias}d`}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={c.estado}
                        onChange={e => handleEstado(c, e.target.value)}
                        className={`rounded-full border-0 px-2.5 py-1 text-[11px] font-medium outline-none cursor-pointer ${badge.badge}`}
                      >
                        {ESTADOS.map(es => (
                          <option key={es.value} value={es.value} className="bg-zinc-900 text-zinc-200">{es.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {c.vencimiento && (
                          <Link
                            href="/plazos"
                            title="Ver plazos"
                            className="rounded p-1.5 text-zinc-500 hover:text-violet-400 hover:bg-zinc-800 transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                          </Link>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(c)}
                            title="Eliminar caso"
                            className="rounded p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}