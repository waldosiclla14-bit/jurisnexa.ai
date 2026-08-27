'use client';

import { LegalArea, LEGAL_AREAS } from '@/types';

interface LegalAreaSelectorProps {
  value: LegalArea | undefined;
  onChange: (area: LegalArea | undefined) => void;
}

export default function LegalAreaSelector({ value, onChange }: LegalAreaSelectorProps) {
  return (
    <div className="w-full">
      <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
        Área Jurídica
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onChange(undefined)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
            !value
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
          }`}
        >
          Todas
        </button>
        {LEGAL_AREAS.map((area) => (
          <button
            key={area.value}
            onClick={() => onChange(area.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              value === area.value
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
            }`}
          >
            {area.label}
          </button>
        ))}
      </div>
    </div>
  );
}
