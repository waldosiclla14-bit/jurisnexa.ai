import LeyesChileBrowser from '@/components/LeyesChileBrowser';

export const metadata = {
  title: 'Leyes de Chile - JurisNexa.ai',
  description: 'Explora más de 20,000 leyes chilenas consolidadas de la Biblioteca del Congreso Nacional (BCN).',
};

export default function LeyesChilePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Leyes de Chile</h1>
        <p className="text-sm text-zinc-400">
          Explora más de 20,000 normas chilenas consolidadas. Fuente: Biblioteca del Congreso Nacional (BCN) — Ley Chile.
        </p>
      </div>

      <LeyesChileBrowser />

      <div className="mt-8 p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg">
        <h3 className="text-sm font-medium text-zinc-300 mb-2">Fuentes oficiales</h3>
        <ul className="text-xs text-zinc-500 space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">•</span>
            <span>
              <a href="https://www.bcn.cl/leychile" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">BCN Ley Chile</a>
              {' '}— Biblioteca del Congreso Nacional, certificada ISO 9001
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">•</span>
            <span>
              <a href="https://www.pjud.cl" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">Poder Judicial de Chile</a>
              {' '}— Buscador de sentencias judiciales
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">•</span>
            <span>
              Datos procesados desde{' '}
              <a href="https://github.com/clemente-h/legalize-cl" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">legalize-cl</a>
              {' '}— Legislación consolidada en Markdown
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
