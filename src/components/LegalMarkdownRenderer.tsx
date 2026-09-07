'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { ensureLegalStructure } from '@/lib/format/response-formatter';

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-6 mb-3 text-lg font-bold text-white sm:text-xl">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-6 mb-2.5 text-base font-bold text-white sm:text-lg">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2.5 mt-6 text-[13px] font-bold uppercase tracking-wider text-emerald-400 sm:text-sm">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-3 text-[14px] leading-[1.65] text-zinc-100 sm:text-[15px]">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 ml-5 list-disc space-y-1 text-[14px] leading-[1.65] text-zinc-100 sm:text-[15px]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 ml-5 list-decimal space-y-1 text-[14px] leading-[1.65] text-zinc-100 sm:text-[15px]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  hr: () => <hr className="my-4 border-zinc-700" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-zinc-700 bg-zinc-800 px-2 py-1 text-left font-semibold text-white">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-zinc-700 px-2 py-1 text-zinc-100">
      {children}
    </td>
  ),
};

function prepareContent(content: string): string {
  let processed = ensureLegalStructure(content);
  // Casos pegados que el LLM genera y que ensure no cubre cuando hay \n antes
  processed = processed.replace(/\n---\s*(#{1,6})/g, '\n\n---\n\n$1');
  processed = processed.replace(/([^\n#])\s*(#{1,6}\s+)/g, '$1\n$2');
  // Tolerancia para heading con negrita pegada: ##**Título** -> ## Título
  processed = processed.replace(/^(#{1,6})\*\*\s*/gm, '$1 ');
  processed = processed.replace(/\*\*(?=\n|$)/gm, '');
  // Tolerancia para tabla sin fila separadora GFM: inyecta | --- | si falta
  const lines = processed.split('\n');
  const tableStart = lines.findIndex((l, i) => {
    if (!l.includes('|')) return false;
    const next = lines[i + 1];
    if (!next || !next.includes('|')) return false;
    if (/^\s*\|?\s*[-|:\s]+\s*\|?\s*$/.test(next) && next.replace(/[^|\-]/g, '').length >= 2) return false;
    return l.split('|').filter((c) => c.trim()).length >= 3 && next.split('|').filter((c) => c.trim()).length >= 3;
  });
  if (tableStart !== -1) {
    const cols = lines[tableStart].split('|').filter((c) => c.trim()).length;
    const sep = (lines[tableStart].trim().startsWith('|') ? '|' : '') + Array(cols).fill(' --- ').join('|') + (lines[tableStart].trim().startsWith('|') ? '|' : '');
    lines.splice(tableStart + 1, 0, sep);
    processed = lines.join('\n');
  }
  return processed;
}

export function LegalMarkdownRenderer({ content }: { content: string }) {
  const prepared = prepareContent(content);
  return (
    <div className="max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {prepared}
      </ReactMarkdown>
    </div>
  );
}
