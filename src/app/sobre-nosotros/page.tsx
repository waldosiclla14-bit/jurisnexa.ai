import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | JurisNexa.ai',
  description: 'Conoce al equipo detrÃ¡s de JurisNexa.ai. Nuestra misiÃ³n es hacer el derecho accesible para todos.',
  alternates: {
    canonical: '/sobre-nosotros',
  },
};


export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <LandingHeader activePage="/sobre-nosotros" />

      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-bold text-white mb-8">Sobre Nosotros</h1>
        
        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Nuestra MisiÃ³n</h2>
            <p className="text-zinc-400 leading-relaxed">
              En JurisNexa.ai creemos que el acceso a informaciÃ³n jurÃ­dica precisa y verificable
              no deberÃ­a ser un privilegio. Nuestra misiÃ³n es hacer que el derecho sea accesible
              para todos los profesionales, empresas y ciudadanos de PerÃº y Chile.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Â¿QuÃ© hacemos?</h2>
            <p className="text-zinc-400 leading-relaxed">
              Utilizamos inteligencia artificial avanzada para crear un asistente jurÃ­dico que:
            </p>
            <ul className="list-disc list-inside text-zinc-400 mt-4 space-y-2">
              <li>Responde consultas legales con precisiÃ³n</li>
              <li>Cita fuentes oficiales verificables</li>
              <li>AnÃ¡liza documentos jurÃ­dicos</li>
              <li>Compara legislaciÃ³n entre PerÃº y Chile</li>
              <li>Se actualiza constantemente con nuevas normativas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Nuestros Valores</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-2">PrecisiÃ³n</h3>
                <p className="text-zinc-400 text-sm">
                  Nunca inventamos informaciÃ³n. Si no tenemos una fuente verificable, lo decimos.
                </p>
              </div>
              <div className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-2">Transparencia</h3>
                <p className="text-zinc-400 text-sm">
                  Cada respuesta incluye citas a normas oficiales. Sabes de dÃ³nde viene la informaciÃ³n.
                </p>
              </div>
              <div className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-2">Accesibilidad</h3>
                <p className="text-zinc-400 text-sm">
                  El derecho es para todos. Por eso ofrecemos un plan gratuito sin lÃ­mites de tiempo.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">TecnologÃ­a</h2>
            <p className="text-zinc-400 leading-relaxed">
              JurisNexa.ai utiliza modelos de lenguaje de Ãºltima generaciÃ³n combinados con
              una base de datos de legislaciÃ³n actualizada de PerÃº y Chile. Nuestro sistema
              de RAG (Retrieval-Augmented Generation) asegura que cada respuesta estÃ© respaldada
              por fuentes documentales verificables.
            </p>
          </section>

          <section className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
            <h2 className="text-2xl font-bold text-white mb-4">Aviso Legal</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              JurisNexa.ai es una herramienta de informaciÃ³n jurÃ­dica general y <strong className="text-white">no sustituye
              el asesoramiento de un abogado</strong>. La informaciÃ³n proporcionada no constituye
              asesoramiento legal profesional y no debe ser interpretada como tal. Siempre
              recomendamos consultar con un profesional del derecho para casos especÃ­ficos.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
