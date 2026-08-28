import { LandingHeader } from '@/components/landing/LandingHeader';
import { PricingSection } from '@/components/landing/PricingSection';
import { Footer } from '@/components/landing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Precios | JurisNexa.ai',
  description: 'Planes y precios para JurisNexa.ai. Consultas legales inteligentes para Perú y Chile.',
  alternates: {
    canonical: '/precios',
  },
};


export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <LandingHeader activePage="/precios" />

      <main>
        <div className="pt-16 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Precios</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto px-4">
            Elige el plan que mejor se adapte a tus necesidades jurídicas.
          </p>
        </div>
        <PricingSection />
      </main>

      <Footer />
    </div>
  );
}
