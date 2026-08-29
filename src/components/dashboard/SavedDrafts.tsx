'use client';

import { useState, useEffect, useCallback } from 'react';
import { downloadPDF } from '@/lib/pdf';

interface Draft {
  id: string;
  title: string;
  document_type: string;
  country: string;
  legal_area: string | null;
  content?: string;
  created_at: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  'demanda-civil': 'Demanda Civil',
  'demanda-laboral': 'Demanda Laboral',
  'demanda-penal-querella': 'Querella Penal',
  'contestacion-demanda': 'Contestación',
  'recurso-apelacion': 'Recurso de Apelación',
  'recurso-nulidad': 'Recurso de Nulidad',
  'demanda-familiar': 'Demanda Familiar',
  'contrato-locacion': 'Contrato de Locación',
  'contrato-trabajo': 'Contrato de Trabajo',
  'carta-reclamo': 'Carta de Reclamo',
  'informe-juridico': 'Informe Jurídico',
  'consultoria-legal': 'Consultoría Legal',
};

const STORAGE_KEY = 'jurisnexa-saved-drafts';

function loadLocalDrafts(): Draft[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalDrafts(drafts: Draft[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

function formatDocType(type: string): string {
  return DOC_TYPE_LABELS[type] || type;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function SavedDrafts() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch('/api/documents/saved-drafts');
      const data = await res.json();
      if (data.drafts) {
        setDrafts(data.drafts);
        setUseLocalStorage(false);
      } else {
        setDrafts(loadLocalDrafts());
        setUseLocalStorage(true);
      }
    } catch {
      setDrafts(loadLocalDrafts());
      setUseLocalStorage(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  const deleteDraft = async (id: string) => {
    if (!confirm('¿Eliminar este borrador?')) return;

    if (useLocalStorage) {
      const updated = drafts.filter(d => d.id !== id);
      setDrafts(updated);
      saveLocalDrafts(updated);
      return;
    }

    try {
      await fetch(`/api/documents/saved-drafts?id=${id}`, { method: 'DELETE' });
      setDrafts(prev => prev.filter(d => d.id !== id));
    } catch {
      console.error('Error deleting draft');
    }
  };

  const openDraft = (draft: Draft) => {
    if (draft.content) {
      setSelectedDraft(draft);
    } else {
      // Fetch full content
      fetch(`/api/documents/saved-drafts?id=${draft.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.draft) setSelectedDraft(data.draft);
        })
        .catch(() => {});
    }
  };

  const handleDownloadPDF = async (draft: Draft) => {
    const content = draft.content || '';
    const filename = `jurisnexa-${draft.document_type}-${new Date().toISOString().split('T')[0]}.pdf`;
    await downloadPDF(content, filename);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (selectedDraft) {
    return (
      <div>
        <button
          onClick={() => setSelectedDraft(null)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-4 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver a borradores
        </button>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">{selectedDraft.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
              <span>{formatDocType(selectedDraft.document_type)}</span>
              <span>·</span>
              <span>{selectedDraft.country === 'PERU' ? '🇵🇪 Perú' : '🇨🇱 Chile'}</span>
              <span>·</span>
              <span>{formatDate(selectedDraft.created_at)}</span>
            </div>
          </div>
          <button
            onClick={() => handleDownloadPDF(selectedDraft)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Descargar PDF
          </button>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 prose prose-invert prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-sans leading-relaxed">
            {selectedDraft.content}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div>
      {drafts.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-zinc-700">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p>No hay borradores guardados</p>
          <p className="text-xs mt-1">Usa el botón &quot;Guardar borrador&quot; en el chat para almacenar documentos generados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-emerald-500/30 hover:bg-zinc-800/80 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => openDraft(draft)}
                >
                  <h3 className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">
                    {draft.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                    <span>{formatDocType(draft.document_type)}</span>
                    <span>·</span>
                    <span>{draft.country === 'PERU' ? '🇵🇪 Perú' : '🇨🇱 Chile'}</span>
                    {draft.legal_area && (
                      <>
                        <span>·</span>
                        <span className="capitalize">{draft.legal_area}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{formatDate(draft.created_at)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownloadPDF(draft)}
                    className="p-1.5 text-zinc-500 hover:text-emerald-400 transition-colors"
                    title="Descargar PDF"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteDraft(draft.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
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
