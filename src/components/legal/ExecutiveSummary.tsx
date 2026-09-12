'use client';

export function ExecutiveSummary({ text }: { text: string }) {
  if (!text) return null;
  return (
    <section className="rounded-xl border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-4 mb-4">
      <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Resumen ejecutivo</h3>
      <p className="text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-100">{text}</p>
    </section>
  );
}
