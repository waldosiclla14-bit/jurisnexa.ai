'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Conversation {
  id: string;
  title: string;
  country: string;
  legal_area: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export function ConversationHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch {
      setError('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const openConversation = (id: string) => {
    router.push(`/chat?conversationId=${id}`);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta conversación?')) return;

    try {
      await fetch(`/api/conversations?id=${id}`, { method: 'DELETE' });
      setConversations(prev => prev.filter(c => c.id !== id));
    } catch {
      setError('Error al eliminar');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Hace minutos';
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-PE');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">{error}</div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p>No hay conversaciones aún</p>
        <a href="/chat" className="text-sm mt-2 text-emerald-400 hover:text-emerald-300 inline-block">
          Iniciar una consulta legal
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conv) => (
        <div
          key={conv.id}
          onClick={() => openConversation(conv.id)}
          className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-emerald-500/30 hover:bg-zinc-800/80 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">{conv.title}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                <span>{conv.country === 'PERU' ? '🇵🇪 Perú' : conv.country === 'CHILE' ? '🇨🇱 Chile' : '🌎 Comparar'}</span>
                {conv.legal_area && <span>• {conv.legal_area}</span>}
                <span>• {conv.message_count} mensajes</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">{formatDate(conv.updated_at)}</p>
            </div>
            <button
              onClick={(e) => deleteConversation(conv.id, e)}
              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-all"
              title="Eliminar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
