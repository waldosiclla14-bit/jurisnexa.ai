'use client';

import { LawFirm } from '@/types';

interface FirmCredentialProps {
  firm: LawFirm;
  memberCount: number;
}

export function FirmCredential({ firm, memberCount }: FirmCredentialProps) {
  const createdYear =
    firm.created_at && !isNaN(new Date(firm.created_at).getTime())
      ? new Date(firm.created_at).getFullYear()
      : null;
  const expires = firm.credential_expires_at
    ? new Date(firm.credential_expires_at)
    : createdYear
      ? new Date(createdYear + 1, 0, 1)
      : null;

  return (
    <div className="p-6 bg-blue-50 border-t-4 border-blue-600 max-w-md mx-auto">
      <h3 className="text-blue-600 text-xl font-bold mb-4">
        🏛️ Credencial del Estudio
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-600 mb-1">Estudio:</p>
          <p className="font-semibold">{firm.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">{firm.ruc ? 'RUC' : 'RUT'}:</p>
          <p className="font-medium text-blue-600">{firm.ruc || firm.rut || '—'}</p>
        </div>
      </div>

      {firm.address && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Dirección:</p>
          <p className="text-sm">{firm.address}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Plan</p>
          <p className="font-medium capitalize">{firm.plan}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Miembros</p>
          <p className="font-medium">{memberCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Consultas</p>
          <p className="font-medium">
            {firm.queries_used}/{firm.queries_limit}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-xs text-gray-500 mb-1">Vence:</p>
        <p className="font-medium">{expires ? expires.toLocaleDateString() : '—'}</p>
      </div>

      <p className="mt-4 text-sm text-green-600">
        ✅ Credencial Válida - Estudio Jurídico Registrado
      </p>
    </div>
  );
}