'use client';

import { useState } from 'react';
import { FirmMembership, FirmRole, FIRM_ROLE_LABELS } from '@/types';

const ROLES: FirmRole[] = ['admin', 'partner', 'associate', 'intern'];

interface FirmMemberListProps {
  members: FirmMembership[];
  isAdmin: boolean;
  currentUserId: string;
  onRemove: (memberId: string) => Promise<void>;
  onChangeRole: (memberId: string, role: FirmRole) => Promise<void>;
}

export function FirmMemberList({ members, isAdmin, currentUserId, onRemove, onChangeRole }: FirmMemberListProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleRemove = async (memberId: string) => {
    if (!confirm('¿Seguro que deseas remover a este miembro del estudio?')) return;
    setBusy(memberId);
    setError('');
    try {
      await onRemove(memberId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al remover miembro');
    } finally {
      setBusy(null);
    }
  };

  const handleRole = async (memberId: string, role: FirmRole) => {
    setBusy(memberId);
    setError('');
    try {
      await onChangeRole(memberId, role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar rol');
    } finally {
      setBusy(null);
    }
  };

  if (members.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-6">Aún no hay miembros en el estudio.</p>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {error && <p className="text-sm text-red-600 bg-red-50 p-2">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Miembro</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Colegiatura</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especialidades</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => {
              const isSelf = member.user_id === currentUserId;
              const user = member.user;
              return (
                <tr key={member.id} className={isSelf ? 'bg-blue-50' : ''}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.full_name || 'Sin nombre'}
                      {isSelf && <span className="ml-2 text-xs text-blue-600">(Tú)</span>}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {user?.colegiatura || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(user?.legal_areas || []).slice(0, 3).map((area) => (
                        <span key={area} className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">
                          {area}
                        </span>
                      ))}
                      {(user?.legal_areas || []).length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{(user?.legal_areas || []).length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && !isSelf ? (
                      <select
                        value={member.role}
                        disabled={busy === member.user_id}
                        onChange={(e) => handleRole(member.user_id, e.target.value as FirmRole)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{FIRM_ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        member.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        member.role === 'partner' ? 'bg-amber-100 text-amber-800' :
                        member.role === 'associate' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {FIRM_ROLE_LABELS[member.role]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && !isSelf && member.role !== 'admin' && (
                      <button
                        onClick={() => handleRemove(member.user_id)}
                        disabled={busy === member.user_id}
                        className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        Remover
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}