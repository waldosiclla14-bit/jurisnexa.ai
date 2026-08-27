import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | JurisNexa.ai',
  description: 'Conoce al equipo detrás de JurisNexa.ai. Nuestra misión es hacer el derecho accesible para todos.',
};

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <LandingHeader activePage="/sobre-nosotros" />

      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-bold text-white mb-8">Sobre Nosotros</h1>
        
        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Nuestra Misión</h2>
            <p className="text-zinc-400 leading-relaxed">
              En JurisNexa.ai creemos que el acceso a información jurídica precisa y verificable
              no debería ser un privilegio. Nuestra misión es hacer que el derecho sea accesible
              para todos los profesionales, empresas y ciudadanos de Perú y Chile.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">¿Qué hacemos?</h2>
            <p className="text-zinc-400 leading-relaxed">
              Utilizamos inteligencia artificial avanzada para crear un asistente jurídico que:
            </p>
            <ul className="list-disc list-inside text-zinc-400 mt-4 space-y-2">
              <li>Responde consultas legales con precisión</li>
              <li>Cita fuentes oficiales verificables</li>
              <li>Análiza documentos jurídicos</li>
              <li>Compara legislación entre Perú y Chile</li>
              <li>Se actualiza constantemente con nuevas normativas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Nuestros Valores</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-2">Precisión</h3>
                <p className="text-zinc-400 text-sm">
                  Nunca inventamos información. Si no tenemos una fuente verificable, lo decimos.
                </p>
              </div>
              <div className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-2">Transparencia</h3>
                <p className="text-zinc-400 text-sm">
                  Cada respuesta incluye citas a normas oficiales. Sabes de dónde viene la información.
                </p>
              </div>
              <div className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-2">Accesibilidad</h3>
                <p className="text-zinc-400 text-sm">
                  El derecho es para todos. Por eso ofrecemos un plan gratuito sin límites de tiempo.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Tecnología</h2>
            <p className="text-zinc-400 leading-relaxed">
              JurisNexa.ai utiliza modelos de lenguaje de última generación combinados con
              una base de datos de legislación actualizada de Perú y Chile. Nuestro sistema
              de RAG (Retrieval-Augmented Generation) asegura que cada respuesta esté respaldada
              por fuentes documentales verificables.
            </p>
          </section>

          <section className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
            <h2 className="text-2xl font-bold text-white mb-4">Aviso Legal</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              JurisNexa.ai es una herramienta de información jurídica general y <strong className="text-white">no sustituye
              el asesoramiento de un abogado</strong>. La información proporcionada no constituye
              asesoramiento legal profesional y no debe ser interpretada como tal. Siempre
              recomendamos consultar con un profesional del derecho para casos específicos.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
