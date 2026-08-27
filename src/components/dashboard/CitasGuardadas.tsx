'use client';

import { useState, useEffect, useCallback } from 'react';

interface SavedCitation {
  id: string;
  norma: string;
  numero: string;
  articulo: string;
  pais: 'PERU' | 'CHILE';
  estado: string;
  url?: string;
  notas?: string;
  created_at: string;
}

const STORAGE_KEY = 'jurisnexa-saved-citations';

function loadCitations(): SavedCitation[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveCitations(citations: SavedCitation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(citations));
}

export default function CitasGuardadas() {
  const [citations, setCitations] = useState<SavedCitation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ norma: '', numero: '', articulo: '', pais: 'PERU' as 'PERU' | 'CHILE', estado: 'VIGENTE', url: '', notas: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { setCitations(loadCitations()); }, []);

  const addCitation = useCallback(() => {
    if (!form.norma || !form.numero) return;
    const newCitation: SavedCitation = {
      id: editingId || crypto.randomUUID(),
      norma: form.norma,
      numero: form.numero,
      articulo: form.articulo,
      pais: form.pais,
      estado: form.estado,
      url: form.url || undefined,
      notas: form.notas || undefined,
      created_at: editingId ? citations.find(c => c.id === editingId)?.created_at || new Date().toISOString() : new Date().toISOString(),
    };
    const updated = editingId
      ? citations.map(c => c.id === editingId ? newCitation : c)
      : [newCitation, ...citations];
    setCitations(updated);
    saveCitations(updated);
    setForm({ norma: '', numero: '', articulo: '', pais: 'PERU', estado: 'VIGENTE', url: '', notas: '' });
    setEditingId(null);
    setShowForm(false);
  }, [form, citations, editingId]);

  const editCitation = (c: SavedCitation) => {
    setForm({ norma: c.norma, numero: c.numero, articulo: c.articulo, pais: c.pais, estado: c.estado, url: c.url || '', notas: c.notas || '' });
    setEditingId(c.id);
    setShowForm(true);
  };

  const deleteCitation = (id: string) => {
    if (!confirm('¿Eliminar esta cita?')) return;
    const updated = citations.filter(c => c.id !== id);
    setCitations(updated);
    saveCitations(updated);
  };

  const formatCitation = (c: SavedCitation) => {
    return `${c.norma} ${c.numero}${c.articulo ? ' - ' + c.articulo : ''} - ${c.pais === 'PERU' ? 'Perú' : 'Chile'} - ${c.estado}`;
  };

  const exportCitations = () => {
    const text = citations.map(c => formatCitation(c)).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jurisnexa-citas-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Citas Guardadas</h1>
          <p className="text-sm text-zinc-400">
            Guarda las referencias legales más importantes para consulta rápida.
          </p>
        </div>
        <div className="flex gap-2">
          {citations.length > 0 && (
            <button
              onClick={exportCitations}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-400 hover:border-emerald-500/40 hover:text-emerald-400 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Exportar
            </button>
          )}
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ norma: '', numero: '', articulo: '', pais: 'PERU', estado: 'VIGENTE', url: '', notas: '' }); }}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {showForm ? 'Cancelar' : 'Nueva cita'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
          <h3 className="text-sm font-medium text-white mb-3">{editingId ? 'Editar cita' : 'Agregar cita legal'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Nombre de la norma *</label>
              <input value={form.norma} onChange={e => setForm(p => ({ ...p, norma: e.target.value }))} placeholder="Ej: Código del Trabajo" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Número / Decreto *</label>
              <input value={form.numero} onChange={e => setForm(p => ({ ...p, numero: e.target.value }))} placeholder="Ej: D.S. 003-97-TR" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Artículo(s)</label>
              <input value={form.articulo} onChange={e => setForm(p => ({ ...p, articulo: e.target.value }))} placeholder="Ej: Artículo 34" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">País</label>
                <select value={form.pais} onChange={e => setForm(p => ({ ...p, pais: e.target.value as 'PERU' | 'CHILE' }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none">
                  <option value="PERU">🇵🇪 Perú</option>
                  <option value="CHILE">🇨🇱 Chile</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Estado</label>
                <select value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none">
                  <option value="VIGENTE">Vigente</option>
                  <option value="DEROGADA">Derogada</option>
                  <option value="MODIFICADA">Modificada</option>
                  <option value="DESCONOCIDA">Desconocida</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">URL fuente oficial</label>
              <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Notas</label>
              <input value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} placeholder="Contexto o uso..." className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={addCitation} disabled={!form.norma || !form.numero} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-40 transition-all">
              {editingId ? 'Actualizar' : 'Guardar cita'}
            </button>
          </div>
        </div>
      )}

      {citations.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-zinc-700">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p>No hay citas guardadas</p>
          <p className="text-xs mt-1">Agrega referencias legales que encuentres en las respuestas del chat</p>
        </div>
      ) : (
        <div className="space-y-2">
          {citations.map((c) => (
            <div key={c.id} className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-emerald-500/30 transition-all group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{formatCitation(c)}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                    <span>{c.pais === 'PERU' ? '🇵🇪 Perú' : '🇨🇱 Chile'}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      c.estado === 'VIGENTE' ? 'bg-emerald-500/10 text-emerald-400' :
                      c.estado === 'DEROGADA' ? 'bg-red-500/10 text-red-400' :
                      c.estado === 'MODIFICADA' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-zinc-700 text-zinc-400'
                    }`}>{c.estado}</span>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">
                        Fuente oficial ↗
                      </a>
                    )}
                    {c.notas && <span className="italic text-zinc-600">&ldquo;{c.notas}&rdquo;</span>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => editCitation(c)} className="p-1 text-zinc-500 hover:text-emerald-400 transition-colors" title="Editar">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => deleteCitation(c.id)} className="p-1 text-zinc-500 hover:text-red-400 transition-colors" title="Eliminar">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
