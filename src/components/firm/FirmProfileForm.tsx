'use client';

import { useState } from 'react';

interface FirmProfileFormProps {
  existing?: {
    name: string;
    ruc?: string;
    rut?: string;
    address?: string;
    phone?: string;
    website?: string;
    description?: string;
  } | null;
  isEdit: boolean;
  onSave: (data: {
    name: string;
    ruc?: string;
    rut?: string;
    address?: string;
    phone?: string;
    website?: string;
    description?: string;
  }) => Promise<void>;
}

export function FirmProfileForm({ existing, isEdit, onSave }: FirmProfileFormProps) {
  const [name, setName] = useState(existing?.name || '');
  const [ruc, setRuc] = useState(existing?.ruc || '');
  const [rut, setRut] = useState(existing?.rut || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [website, setWebsite] = useState(existing?.website || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 3) {
      setError('El nombre del estudio es obligatorio (mínimo 3 caracteres)');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        ruc: ruc.trim() || undefined,
        rut: rut.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        description: description.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el estudio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-white rounded-lg shadow max-w-md mx-auto space-y-4"
    >
      <h3 className="text-xl font-bold text-blue-600">
        {isEdit ? '🏛️ Datos del Estudio Jurídico' : '🏛️ Crear Estudio Jurídico'}
      </h3>

      <div>
        <label className="block text-sm font-medium mb-1">Nombre del Estudio *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ej: Estudio Jurídico Pérez & Asociados"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">RUC (Perú)</label>
          <input
            value={ruc}
            onChange={(e) => setRuc(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="20XXXXXXXXX"
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">RUT (Chile)</label>
          <input
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="XX.XXX.XXX-X"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Dirección</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Av. Principal 123, Oficina 401"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Teléfono</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+51 999 999 999"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sitio web</label>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://estudio.cl"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
          placeholder="Describe los servicios y especialidades del estudio"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {saving
          ? 'Guardando...'
          : isEdit
            ? 'Actualizar Estudio'
            : 'Crear Estudio Jurídico'}
      </button>
    </form>
  );
}