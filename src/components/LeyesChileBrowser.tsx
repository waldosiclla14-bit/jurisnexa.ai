'use client';

import { useState, useEffect, useCallback } from 'react';

interface LawMeta {
  identifier: string;
  title: string;
  rank: string;
  rankLabel: string;
  publication_date: string;
  status: string;
  source: string;
  department: string;
  official_type: string;
  official_number: string;
}

interface LawDetail extends LawMeta {
  content: string;
  totalArticles: number;
  articles: { number: number; title: string }[];
}

interface LawType { value: string; label: string; }

interface SearchResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  laws: LawMeta[];
  types: LawType[];
}

function ArticleNav({ articles, onJump }: { articles: { number: number; title: string }[]; onJump: (n: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
      {articles.map(a => (
        <button
          key={a.number}
          onClick={() => onJump(a.number)}
          className="px-1.5 py-0.5 text-[10px] text-zinc-400 hover:text-emerald-400 bg-zinc-800/50 rounded hover:bg-zinc-700/50 transition-colors"
        >
          Art. {a.number}
        </button>
      ))}
    </div>
  );
}

function LawDetailModal({ identifier, onClose }: { identifier: string; onClose: () => void }) {
  const [detail, setDetail] = useState<LawDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leyes-chile/${encodeURIComponent(identifier)}`)
      .then(r => { if (!r.ok) throw new Error('Error'); return r.json(); })
      .then(d => { setDetail(d); setLoading(false); })
      .catch(() => { setError('Error al cargar la ley'); setLoading(false); });
  }, [identifier]);

  const handleJump = (artNum: number) => {
    const el = document.getElementById(`art-${artNum}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Simple markdown → HTML (headers + articles)
  const renderContent = (md: string) => {
    return md
      .replace(/^#### (.+)$/gm, '<h4 class="text-sm font-semibold text-zinc-300 mt-4 mb-1">$1</h4>')
      .replace(/^##### (.+)$/gm, (match, text) => {
        const artMatch = text.match(/Artículo\s+(\d+)/i);
        const id = artMatch ? ` id="art-${artMatch[1]}"` : '';
        return `<h5${id} class="text-sm font-medium text-emerald-400 mt-3 mb-1 scroll-mt-20">${text}</h5>`;
      })
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-zinc-200 mt-6 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-white mt-4 mb-3">$1</h1>')
      .replace(/\n\n/g, '</p><p class="text-sm text-zinc-400 leading-relaxed mb-2">')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center pt-8 pb-8 overflow-y-auto" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-4xl mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-800">
          <div className="flex-1 min-w-0">
            {detail && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{detail.identifier}</span>
                  <span className="text-xs text-zinc-500 bg-zinc-700/50 px-2 py-0.5 rounded">{detail.rankLabel}</span>
                  {detail.status === 'in_force' && (
                    <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">Vigente</span>
                  )}
                  {detail.totalArticles > 0 && (
                    <span className="text-xs text-zinc-500">{detail.totalArticles} artículos</span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white">{detail.title}</h2>
                <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                  {detail.publication_date && <span>{detail.publication_date}</span>}
                  {detail.department && <span>{detail.department}</span>}
                  {detail.official_number && <span>DO N° {detail.official_number}</span>}
                </div>
              </>
            )}
          </div>
          <button onClick={onClose} className="ml-4 p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {loading ? (
            <div className="text-center py-12 text-zinc-500">Cargando texto completo...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">{error}</div>
          ) : detail ? (
            <>
              {detail.articles.length > 0 && (
                <div className="mb-4 p-3 bg-zinc-800/30 rounded-lg">
                  <p className="text-xs text-zinc-500 mb-2">Navegación rápida ({detail.articles.length} artículos):</p>
                  <ArticleNav articles={detail.articles} onJump={handleJump} />
                </div>
              )}
              <div
                className="prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: `<p class="text-sm text-zinc-400 leading-relaxed">${renderContent(detail.content)}</p>` }}
              />
            </>
          ) : null}
        </div>

        {/* Footer */}
        {detail && (
          <div className="flex items-center justify-between p-5 border-t border-zinc-800">
            {detail.source && (
              <a
                href={detail.source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                Ver en BCN Ley Chile ↗
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeyesChileBrowser() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<LawType[]>([]);
  const [viewingLaw, setViewingLaw] = useState<string | null>(null);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (type) params.set('type', type);
      if (status) params.set('status', status);
      params.set('page', String(page));
      params.set('limit', '50');
      const res = await fetch(`/api/leyes-chile?${params}`);
      const json: SearchResponse = await res.json();
      setData(json);
      if (json.types?.length) setTypes(json.types);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [query, type, status, page]);

  useEffect(() => { search(); }, [search]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); search(); };

  return (
    <div className="space-y-6">
      {viewingLaw && <LawDetailModal identifier={viewingLaw} onClose={() => setViewingLaw(null)} />}

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por título, número, ministerio..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50">
          <option value="">Todos los tipos</option>
          {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50">
          <option value="">Todos los estados</option>
          <option value="in_force">Vigente</option>
          <option value="repealed">Derogada</option>
        </select>
        <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors">
          Buscar
        </button>
      </form>

      {data && (
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>{data.total.toLocaleString()} leyes encontradas</span>
          <span>Página {data.page} de {data.totalPages}</span>
        </div>
      )}

      {loading && !data ? (
        <div className="text-center py-12 text-zinc-500">Cargando leyes...</div>
      ) : data && data.laws.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">No se encontraron leyes</div>
      ) : data ? (
        <div className="space-y-2">
          {data.laws.map(law => (
            <div key={law.identifier}
              onClick={() => setViewingLaw(law.identifier)}
              className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-emerald-500/30 hover:bg-zinc-800/80 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{law.identifier}</span>
                    <span className="text-[10px] text-zinc-500 bg-zinc-700/50 px-1.5 py-0.5 rounded">{law.rankLabel}</span>
                    {law.status === 'in_force' && (
                      <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">Vigente</span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-zinc-200 truncate group-hover:text-emerald-300 transition-colors">{law.title}</h3>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500">
                    {law.publication_date && <span>{law.publication_date}</span>}
                    {law.department && <span className="truncate max-w-[300px]">{law.department}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-zinc-600 group-hover:text-emerald-400 transition-colors">Ver texto →</span>
                  {law.source && (
                    <a href={law.source} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded transition-colors">
                      BCN ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed">← Anterior</button>
          {Array.from({ length: Math.min(7, data.totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 3, data.totalPages - 6));
            const p = start + i;
            if (p > data.totalPages) return null;
            return (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 text-sm rounded-lg transition-colors ${p === page ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'}`}>
                {p}
              </button>
            );
          })}
          <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed">Siguiente →</button>
        </div>
      )}
    </div>
  );
}
