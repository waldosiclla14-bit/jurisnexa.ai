import { ConversationHistory } from '@/components/dashboard/ConversationHistory';

export default function HistorialPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Historial de Consultas</h1>
        <p className="text-sm text-zinc-400">
          Revisa y reanuda tus conversaciones legales anteriores.
        </p>
      </div>
      <ConversationHistory />
    </div>
  );
}
