'use client';

import { useState } from 'react';

interface FeedbackFormProps {
  messageId: string;
  onSubmitted?: () => void;
}

export default function FeedbackForm({ messageId, onSubmitted }: FeedbackFormProps) {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleRate = async (value: 'positive' | 'negative') => {
    if (submitted) return;

    setRating(value);
    setSending(true);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          rating: value,
          comment: comment || undefined,
        }),
      });
      setSubmitted(true);
      onSubmitted?.();
    } catch {
      // Silently fail
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500">
        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>Gracias por tu feedback</span>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="text-[10px] text-zinc-600">¿Fue útil?</span>
      <button
        onClick={() => handleRate('positive')}
        disabled={sending}
        aria-label="Marcar como útil"
        className={`p-1 rounded transition-colors ${
          rating === 'positive'
            ? 'text-emerald-400 bg-emerald-500/10'
            : 'text-zinc-600 hover:text-emerald-400'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      </button>
      <button
        onClick={() => handleRate('negative')}
        disabled={sending}
        aria-label="Marcar como no útil"
        className={`p-1 rounded transition-colors ${
          rating === 'negative'
            ? 'text-red-400 bg-red-500/10'
            : 'text-zinc-600 hover:text-red-400'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
        </svg>
      </button>
      {!submitted && rating && (
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comentario (opcional)"
          className="ml-1 flex-1 rounded border border-zinc-700 bg-zinc-800/50 px-2 py-0.5 text-[11px] text-zinc-400 placeholder-zinc-600 outline-none focus:border-emerald-500/50"
          maxLength={200}
        />
      )}
    </div>
  );
}
