'use client';

import { useState } from 'react';
import { Country, LegalArea } from '@/types';
import { DocumentType, DOCUMENT_TYPES } from '@/lib/prompts/drafting';
import { createStreamAccumulator } from '@/lib/streaming';

interface DocumentDraftingProps {
  country: Country;
  legalArea?: LegalArea;
  onDraftGenerated: (content: string, docType: DocumentType) => void;
  onClose: () => void;
}

interface Parties {
  demandante: { nombre: string; dni: string; domicilio: string };
  demandado: { nombre: string; dni: string; domicilio: string };
}

export default function DocumentDrafting({
  country,
  legalArea,
  onDraftGenerated,
  onClose,
}: DocumentDraftingProps) {
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [facts, setFacts] = useState('');
  const [parties, setParties] = useState<Parties>({
    demandante: { nombre: '', dni: '', domicilio: '' },
    demandado: { nombre: '', dni: '', domicilio: '' },
  });
  const [showParties, setShowParties] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'select' | 'configure'>('select');

  const filteredTypes = DOCUMENT_TYPES.filter(
    d => d.countries.includes(country) || d.countries.includes('BOTH')
  );

  const areas = [...new Set(filteredTypes.map(d => d.area))];

  const handleGenerate = async () => {
    if (!selectedType || !facts.trim()) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/documents/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: selectedType,
          country,
          legalArea: legalArea || DOCUMENT_TYPES.find(d => d.id === selectedType)?.area,
          facts: facts.trim(),
          parties: showParties ? parties : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
        throw new Error(errorData.error || `Error HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No se pudo leer la respuesta');

      const decoder = new TextDecoder();
      let fullContent = '';

      const accumulator = createStreamAccumulator((line) => {
        if (line.startsWith('__META__')) return;
        if (line.startsWith('__ERROR__')) throw new Error(line.slice(9));
        fullContent += line + '\n';
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulator.push(decoder.decode(value, { stream: true }));
      }
      accumulator.flush();

      onDraftGenerated(fullContent, selectedType);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al generar documento: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="mx-4 max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Generando documento...
          </h3>
          <p className="text-sm text-zinc-400">
            Redactando {DOCUMENT_TYPES.find(d => d.id === selectedType)?.label} con fundamentación legal verificada
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Redactar Documento Jurídico</h2>
            <p className="text-xs text-zinc-500">
              Documentos con fundamentación legal verificada — {country === 'PERU' ? 'Perú' : 'Chile'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('select')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'select'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            1. Seleccionar tipo
          </button>
          <button
            onClick={() => setActiveTab('configure')}
            disabled={!selectedType}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'configure'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : selectedType
                ? 'text-zinc-500 hover:text-zinc-300'
                : 'text-zinc-700 cursor-not-allowed'
            }`}
          >
            2. Configurar
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'select' ? (
            <div className="space-y-4">
              {areas.map(area => (
                <div key={area}>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">
                    {area}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredTypes
                      .filter(d => d.area === area)
                      .map(doc => (
                        <button
                          key={doc.id}
                          onClick={() => {
                            setSelectedType(doc.id);
                            setActiveTab('configure');
                          }}
                          className={`text-left p-3 rounded-lg border transition-all ${
                            selectedType === doc.id
                              ? 'border-emerald-500/50 bg-emerald-500/10'
                              : 'border-zinc-800 bg-zinc-800/50 hover:border-zinc-700'
                          }`}
                        >
                          <div className="text-sm font-medium text-white">{doc.label}</div>
                          <div className="text-xs text-zinc-500 mt-1">{doc.description}</div>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected type indicator */}
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="text-sm font-medium text-emerald-400">
                  {DOCUMENT_TYPES.find(d => d.id === selectedType)?.label}
                </span>
                <button
                  onClick={() => setSelectedType(null)}
                  className="ml-auto text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Cambiar
                </button>
              </div>

              {/* Facts */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Hechos del caso *
                </label>
                <textarea
                  value={facts}
                  onChange={e => setFacts(e.target.value)}
                  placeholder="Describe los hechos relevantes del caso de forma cronológica y precisa. Incluye fechas, personas, montos, eventos..."
                  rows={6}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 resize-none"
                />
              </div>

              {/* Parties toggle */}
              <button
                onClick={() => setShowParties(!showParties)}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${showParties ? 'rotate-90' : ''}`}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                {showParties ? 'Ocultar datos de las partes' : 'Agregar datos de las partes (opcional)'}
              </button>

              {/* Parties form */}
              {showParties && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg border border-zinc-800 bg-zinc-800/30">
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Demandante / Reclamante
                    </h4>
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={parties.demandante.nombre}
                      onChange={e =>
                        setParties(p => ({
                          ...p,
                          demandante: { ...p.demandante, nombre: e.target.value },
                        }))
                      }
                      className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50"
                    />
                    <input
                      type="text"
                      placeholder="DNI / RUT"
                      value={parties.demandante.dni}
                      onChange={e =>
                        setParties(p => ({
                          ...p,
                          demandante: { ...p.demandante, dni: e.target.value },
                        }))
                      }
                      className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50"
                    />
                    <input
                      type="text"
                      placeholder="Domicilio"
                      value={parties.demandante.domicilio}
                      onChange={e =>
                        setParties(p => ({
                          ...p,
                          demandante: { ...p.demandante, domicilio: e.target.value },
                        }))
                      }
                      className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Demandado / Reclamado
                    </h4>
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={parties.demandado.nombre}
                      onChange={e =>
                        setParties(p => ({
                          ...p,
                          demandado: { ...p.demandado, nombre: e.target.value },
                        }))
                      }
                      className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50"
                    />
                    <input
                      type="text"
                      placeholder="DNI / RUT"
                      value={parties.demandado.dni}
                      onChange={e =>
                        setParties(p => ({
                          ...p,
                          demandado: { ...p.demandado, dni: e.target.value },
                        }))
                      }
                      className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50"
                    />
                    <input
                      type="text"
                      placeholder="Domicilio"
                      value={parties.demandado.domicilio}
                      onChange={e =>
                        setParties(p => ({
                          ...p,
                          demandado: { ...p.demandado, domicilio: e.target.value },
                        }))
                      }
                      className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={!selectedType || !facts.trim()}
                className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Generar Documento
              </button>

              <p className="text-center text-[10px] text-zinc-600">
                El documento generado es un borrador que requiere revisión y adaptación por un abogado antes de su presentación oficial.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
