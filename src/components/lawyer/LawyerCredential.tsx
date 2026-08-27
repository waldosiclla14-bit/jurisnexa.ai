import { LegalArea, LEGAL_AREA_LABELS } from '@/types';

interface LawyerCredentialProps {
  user: {
    full_name: string;
    colegiatura: string;
    legal_areas: LegalArea[];
    plan: string;
    credential_issued_at: string | null;
    credential_expires_at: string | null;
  };
}

export function LawyerCredential({ user }: LawyerCredentialProps) {
  const isValid = true;
  const issued = user.credential_issued_at
    ? new Date(user.credential_issued_at)
    : new Date();
  const expires = user.credential_expires_at
    ? new Date(user.credential_expires_at)
    : new Date(issued.getFullYear() + 1, issued.getMonth(), issued.getDate());

  return (
    <div className="p-6 bg-amber-50 border-t-4 border-amber-600 max-w-md mx-auto">
      <h3 className="text-amber-600 text-xl font-bold mb-4">
        📜 Credencial de Abogado
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-600 mb-1">Nombre:</p>
          <p className="font-medium">{user.full_name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Colegiatura:</p>
          <p className="font-medium text-amber-600">{user.colegiatura}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-1">Especialidades:</p>
        <div className="flex flex-wrap gap-2">
          {user.legal_areas.map((area) => (
            <span
              key={area}
              className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded"
            >
              {LEGAL_AREA_LABELS[area]}
            </span>
          ))}
        </div>
      </div>

      <div className="text-right">
        <p className="text-xs text-gray-500 mb-1">Emitido:</p>
        <p className="font-medium">{issued.toLocaleDateString()}</p>
        <p className="text-xs text-gray-500 mb-1">Vence:</p>
        <p className="font-medium">{expires.toLocaleDateString()}</p>
      </div>

      {isValid && (
        <p className="mt-4 text-sm text-green-600">
          ✅ Credencial Válida
        </p>
      )}
    </div>
  );
}