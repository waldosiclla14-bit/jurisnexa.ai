import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';
import ContactForm from '@/components/landing/ContactForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto | JurisNexa.ai',
  description: 'Contacta al equipo de JurisNexa.ai. Respondemos consultas, soporte y alianzas en menos de 24 horas.',
  alternates: {
    canonical: '/contacto',
  },
};


export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <LandingHeader activePage="/contacto" />

      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-4xl font-bold text-white mb-4">Contacto</h1>
        <p className="text-zinc-400 mb-8">
          Â¿Tienes preguntas? Estamos aquÃ­ para ayudarte.
        </p>

        <ContactForm />

        <div className="mt-12 p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">InformaciÃ³n de contacto</h3>
          <div className="space-y-3 text-sm text-zinc-400">
            <p>Email: hola@jurisnexa.ai</p>
            <p>Lima, PerÃº</p>
            <p>Horario: Lun - Vie, 9:00 AM - 6:00 PM (PET)</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}