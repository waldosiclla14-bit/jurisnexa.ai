'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { FirmProfileForm } from '@/components/firm/FirmProfileForm';
import { FirmCredential } from '@/components/firm/FirmCredential';
import { FirmMemberList } from '@/components/firm/FirmMemberList';
import { FirmInviteForm } from '@/components/firm/FirmInviteForm';
import { LawFirm, FirmMembership, FirmRole, FirmInvitation } from '@/types';

interface FirmData {
  firm: LawFirm;
  members: FirmMembership[];
  isAdmin: boolean;
}

export default function EstudioPage() {
  const { user } = useAuth();
  const [firmData, setFirmData] = useState<FirmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invitations, setInvitations] = useState<FirmInvitation[]>([]);

  const loadFirm = useCallback(async () => {
    if (!user) return;
    const res = await fetch('/api/firms');
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setFirmData(null);
    } else if (data.firm) {
      setError('');
      setFirmData(data);
    } else {
      setFirmData(null);
    }
  }, [user]);

  const loadInvitations = useCallback(async () => {
    if (!user) return;
    const res = await fetch('/api/invitations');
    const data = await res.json();
    if (!data.error) setInvitations(data.invitations || []);
  }, [user]);

  useEffect(() => {
    loadFirm().finally(() => setLoading(false));
    loadInvitations();
  }, [loadFirm, loadInvitations]);

  const handleAcceptInvitation = async (token: string) => {
    const res = await fetch(`/api/invitations/${token}`, { method: 'POST' });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setInvitations((prev) => prev.filter((inv) => inv.token !== token));
    await loadFirm();
  };

  const handleCreate = async (data: {
    name: string;
    ruc?: string;
    rut?: string;
    address?: string;
    phone?: string;
    website?: string;
    description?: string;
  }) => {
    const res = await fetch('/api/firms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    await loadFirm();
  };

  const handleUpdate = async (data: {
    name: string;
    ruc?: string;
    rut?: string;
    address?: string;
    phone?: string;
    website?: string;
    description?: string;
  }) => {
    if (!firmData) return;
    const res = await fetch(`/api/firms/${firmData.firm.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    await loadFirm();
  };

  const handleInvite = async (email: string, role: FirmRole) => {
    if (!firmData) return;
    const res = await fetch(`/api/firms/${firmData.firm.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
  };

  const handleRemove = async (memberId: string) => {
    if (!firmData) return;
    const res = await fetch(`/api/firms/${firmData.firm.id}/members/${memberId}`, {
      method: 'DELETE',
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    await loadFirm();
  };

  const handleChangeRole = async (memberId: string, role: FirmRole) => {
    if (!firmData) return;
    const res = await fetch(`/api/firms/${firmData.firm.id}/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    await loadFirm();
  };

  if (loading) {
    return <div className="text-center py-12 text-zinc-400">Cargando estudio...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">Inicia sesión para gestionar tu estudio jurídico.</p>
      </div>
    );
  }

  if (error && !firmData) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
          <p className="text-sm text-red-400 mb-4">{error}</p>
          <button
            onClick={loadFirm}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">🏛️ Mi Estudio Jurídico</h1>

      {invitations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Invitaciones pendientes</h2>
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="p-4 bg-zinc-900 border border-blue-800 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div>
                <p className="text-sm text-white font-medium">
                  {inv.firm?.name || 'Estudio jurídico'}
                </p>
                <p className="text-xs text-zinc-400">
                  Rol: <span className="capitalize">{inv.role}</span> · Invitado el{' '}
                  {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleAcceptInvitation(inv.token).catch((err) =>
                      setError(err?.message || 'Error al aceptar invitación')
                    )
                  }
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg"
                >
                  Aceptar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!firmData ? (
        <div className="space-y-4">
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300">
            <p className="mb-2">
              Asocia tu <span className="text-white font-medium">estudio jurídico</span> para que todos tus abogados
              compartan consultas, credenciales y un plan único.
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 text-xs">
              <li>Credencial verificable para el estudio</li>
              <li>Invita a tus socios y asociados por correo</li>
              <li>Consultas compartidas en un solo plan</li>
              <li>Roles: administrador, socio, asociado, practicante</li>
            </ul>
          </div>
          <FirmProfileForm isEdit={false} existing={null} onSave={handleCreate} />
        </div>
      ) : (
        <>
          <FirmCredential firm={firmData.firm} memberCount={firmData.members.length} />

          {firmData.isAdmin && (
            <FirmInviteForm onInvite={handleInvite} />
          )}

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">
              Miembros ({firmData.members.length})
            </h2>
            <FirmMemberList
              members={firmData.members}
              isAdmin={firmData.isAdmin}
              currentUserId={user.id}
              onRemove={handleRemove}
              onChangeRole={handleChangeRole}
            />
          </div>

          {firmData.isAdmin && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Editar datos del estudio</h2>
              <FirmProfileForm
                isEdit
                existing={{
                  name: firmData.firm.name,
                  ruc: firmData.firm.ruc,
                  rut: firmData.firm.rut,
                  address: firmData.firm.address,
                  phone: firmData.firm.phone,
                  website: firmData.firm.website,
                  description: firmData.firm.description,
                }}
                onSave={handleUpdate}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}