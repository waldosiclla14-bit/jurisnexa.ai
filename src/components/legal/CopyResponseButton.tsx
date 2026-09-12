'use client';

import { useState } from 'react';
import type { LegalResponse } from '@/lib/legal/types';

function toMarkdown(response: LegalResponse): string {
  const lines: string[] = [`# ${response.title}`, ''];
  if (response.executiveSummary) lines.push(response.executiveSummary, '');
  if (response.legalIssue) {
    lines.push('## Problema jurídico', response.legalIssue.primaryIssue, '');
  }
  if (response.applicableLaw?.length) {
    lines.push('## Normativa aplicable');
    for (const n of response.applicableLaw) lines.push(`- **${n.name}** ${n.article ? `Art. ${n.article}` : ''} — ${n.status ?? 'unknown'}`);
    lines.push('');
  }
  if (response.analysis) {
    lines.push('## Análisis');
    for (const s of response.analysis.sections) {
      lines.push(`### ${s.title}`);
      if (s.application) lines.push(s.application);
    }
    lines.push('');
  }
  if (response.conclusion) {
    lines.push('## Conclusión', response.conclusion.answer, '');
  }
  if (response.sources.length) {
    lines.push('## Fuentes');
    for (const s of response.sources) lines.push(`- ${s.title}${s.url ? ` (${s.url})` : ''}`);
  }
  return lines.join('\n');
}

export function CopyResponseButton({ response }: { response: LegalResponse }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(toMarkdown(response));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800">
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}
