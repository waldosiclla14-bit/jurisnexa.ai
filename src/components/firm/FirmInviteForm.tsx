'use client';

import { useState } from 'react';
import { FirmRole } from '@/types';

interface FirmInviteFormProps {
  onInvite: (email: string, role: FirmRole) => Promise<void>;
}

const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function FirmInviteForm({ onInvite }: FirmInviteFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<FirmRole>('associate');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!VALID_EMAIL.test(email.trim())) {
      setMessage({ type: 'error', text: 'Ingresa un correo electrónico válido' });
      return;
    }
    setSending(true);
    try {
      await onInvite(email.trim(), role);
      setMessage({ type: 'success', text: `Invitación enviada a ${email.trim()}` });
      setEmail('');
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error al enviar la invitación' });
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow p-4 space-y-3"
    >
      <h4 className="text-sm font-semibold text-gray-800">Invitar nuevo miembro</h4>

      {message && (
        <p className={`text-sm p-2 rounded ${
          message.type === 'success' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
        }`}>
          {message.text}
        </p>
      )}

      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="correo@abogado.com"
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as FirmRole)}
          className="px-3 py-2 border rounded text-sm bg-white"
        >
          <option value="associate">Asociado</option>
          <option value="partner">Socio</option>
          <option value="intern">Practicante</option>
          <option value="admin">Administrador</option>
        </select>
        <button
          type="submit"
          disabled={sending}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {sending ? 'Enviando...' : 'Invitar'}
        </button>
      </div>
      <p className="text-xs text-gray-500">
        El miembro recibirá un enlace de invitación válido por 7 días.
      </p>
    </form>
  );
}