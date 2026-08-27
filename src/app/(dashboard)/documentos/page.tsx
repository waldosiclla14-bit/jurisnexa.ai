import { DocumentUpload } from '@/components/dashboard/DocumentUpload';

export default function DocumentosPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Mis Documentos</h1>
        <p className="text-sm text-zinc-400">
          Sube documentos PDF legales para indexarlos y usarlos como fuente en tus consultas.
        </p>
      </div>
      <div className="max-w-2xl">
        <DocumentUpload />
      </div>
      <div className="mt-8 p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg max-w-2xl">
        <h3 className="text-sm font-medium text-zinc-300 mb-2">Cómo funciona</h3>
        <ul className="text-xs text-zinc-500 space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">1.</span>
            <span>Sube un documento PDF (sentencias, contratos, leyes, etc.)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">2.</span>
            <span>Haz clic en &quot;Procesar&quot; para dividir el texto en fragmentos indexables</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">3.</span>
            <span>El sistema generará embeddings semánticos para búsquedas precisas</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">4.</span>
            <span>Las consultas en el chat usarán automáticamente tus documentos procesados</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
