import { LegalArea, LEGAL_AREAS, LEGAL_AREA_LABELS } from '@/types';
import { useState } from 'react';
import { updateUserProfile } from '@/lib/auth';

interface LawyerProfileFormProps {
  user: {
    id: string;
    full_name: string;
    colegiatura: string;
    legal_areas: LegalArea[];
    plan: string;
  };
  onSave: (data: {
    colegiatura: string;
    legal_areas: LegalArea[];
  }) => Promise<void>;
}

export function LawyerProfileForm({ user, onSave }: LawyerProfileFormProps) {
  const [colegiatura, setColegiatura] = useState(user.colegiatura || '');
  const [selectedAreas, setSelectedAreas] = useState<LegalArea[]>(
    user.legal_areas || []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ colegiatura, legal_areas: selectedAreas });
  };

  const LegalAreaCheckbox = ({
    area,
    idx,
  }: {
    area: LegalArea;
    idx: number;
  }) => {
    const isChecked = selectedAreas.includes(area);
    const isDisabled = !isChecked && selectedAreas.length >= 5;
    return (
      <label key={idx} className={`flex items-center gap-2 cursor-pointer ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <input
          type="checkbox"
          checked={isChecked}
          disabled={isDisabled}
          onChange={() => {
            if (isChecked) {
              setSelectedAreas(selectedAreas.filter((a) => a !== area));
            } else {
              setSelectedAreas([...selectedAreas, area]);
            }
          }}
          className="rounded border-gray-300 p-1"
        />
        <span className="text-sm">{LEGAL_AREA_LABELS[area]}</span>
      </label>
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-white rounded-lg shadow max-w-md mx-auto space-y-6"
    >
      <h3 className="text-xl font-bold text-amber-600">
        📜 Perfil de Abogado
      </h3>

      <div>
        <label className="block text-sm font-medium mb-2">
          Número de Colegiatura
        </label>
        <input
          value={colegiatura}
          onChange={(e) => setColegiatura(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="Ej: 12345-2024"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Especialidades Jurídicas
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Selecciona hasta 5 áreas de práctica
        </p>
        <div className="grid grid-cols-4 gap-2">
          {LEGAL_AREAS.map(({ value: area }, idx) => (
            <LegalAreaCheckbox area={area} idx={idx} />
          ))}
        </div>
        <p className="text-right text-xs text-gray-500 mt-2">
          {selectedAreas.length} de {LEGAL_AREAS.length} seleccionadas
        </p>
      </div>

      <div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-amber-600 text-white rounded font-medium hover:bg-amber-700 transition-colors"
          disabled={colegiatura.trim() === ''}
        >
          Guardar Credencial
        </button>
      </div>
    </form>
  );
}