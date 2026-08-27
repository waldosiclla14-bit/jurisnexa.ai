import SavedDrafts from '@/components/dashboard/SavedDrafts';

export default function BorradoresPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Borradores Guardados</h1>
        <p className="text-sm text-zinc-400">
          Documentos jurídicos generados que puedes revisar, descargar o reutilizar.
        </p>
      </div>
      <SavedDrafts />
    </div>
  );
}
