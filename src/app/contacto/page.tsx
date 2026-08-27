'use client';

import { useState } from 'react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';

export default function ContactoPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <LandingHeader activePage="/contacto" />

      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-4xl font-bold text-white mb-4">Contacto</h1>
        <p className="text-zinc-400 mb-8">
          ¿Tienes preguntas? Estamos aquí para ayudarte.
        </p>

        {submitted ? (
          <div className="p-8 bg-zinc-800/50 border border-zinc-700 rounded-xl text-center">
            <svg className="w-16 h-16 mx-auto text-emerald-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-xl font-semibold text-white mb-2">Mensaje enviado</h2>
            <p className="text-zinc-400">Te responderemos en menos de 24 horas.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Nombre</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Asunto</label>
              <select
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Selecciona un asunto</option>
                <option value="general">Consulta general</option>
                <option value="ventas">Ventas / Planes</option>
                <option value="soporte">Soporte técnico</option>
                <option value="partnership">Alianzas</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Mensaje</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 resize-none"
                placeholder="¿En qué podemos ayudarte?"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Enviando...' : 'Enviar Mensaje'}
            </button>
          </form>
        )}

        <div className="mt-12 p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Información de contacto</h3>
          <div className="space-y-3 text-sm text-zinc-400">
            <p>Email: hola@jurisnexa.ai</p>
            <p>Lima, Perú</p>
            <p>Horario: Lun - Vie, 9:00 AM - 6:00 PM (PET)</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
