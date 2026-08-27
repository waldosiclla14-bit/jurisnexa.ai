'use client';

import { useState } from 'react';

interface FeedbackFormProps {
  messageId: string;
  onSubmitted?: () => void;
}

export function FeedbackForm({ messageId, onSubmitted }: FeedbackFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;

    setLoading(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          rating,
          comment: comment || undefined,
          feedbackType: rating <= 2 ? 'inaccuracy' : 'helpful',
        }),
      });
      setSubmitted(true);
      onSubmitted?.();
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
    };
  if (submitted) {
    return (
      <p className="text-xs text-emerald-400">Gracias por tu feedback</p>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-zinc-500">¿Útil?</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => setRating(value)}
            className={`w-6 h-6 rounded transition-colors ${
              rating === value
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {value}
          </button>
        ))}
      </div>
      {rating && rating <= 2 && (
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="¿Qué mejorar?"
          className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
        />
      )}
      {rating && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs"
        >
          {loading ? '...' : 'Enviar'}
        </button>
      )}
    </div>
  );
}
