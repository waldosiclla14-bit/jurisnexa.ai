import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos de Servicio | JurisNexa.ai',
  description: 'Términos y condiciones de uso de JurisNexa.ai.',
  alternates: {
    canonical: '/terminos',
  },
};


export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <LandingHeader />

      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-bold text-white mb-8">Términos de Servicio</h1>
        <p className="text-sm text-zinc-500 mb-8">Última actualización: Enero 2025</p>
        
        <div className="prose prose-invert max-w-none space-y-8 text-zinc-400">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Aceptación de Términos</h2>
            <p>
              Al acceder y utilizar JurisNexa.ai (&quot;el Servicio&quot;), usted acepta estos Términos de Servicio.
              Si no está de acuerdo con alguno de estos términos, no utilice el Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Descripción del Servicio</h2>
            <p>
              JurisNexa.ai es un asistente de información jurídica basado en inteligencia artificial
              que proporciona información general sobre legislación de Perú y Chile. El Servicio
              NO constituye asesoramiento legal profesional.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Aviso Legal Importante</h2>
            <p className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white">
              <strong>LA INFORMACIÓN PROPORCIONADA POR JURISNEXA.AI ES DE CARÁCTER GENERAL Y NO
              SUSTITUYE EL ASESORAMIENTO DE UN ABOGADO. LA APLICACIÓN NO GARANTIZA UN RESULTADO
              JUDICIAL.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Cuentas de Usuario</h2>
            <p>
              Para utilizar ciertas funciones del Servicio, usted debe crear una cuenta. Usted es
              responsable de mantener la confidencialidad de su contraseña y de todas las actividades
              que ocurran en su cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Uso Aceptable</h2>
            <p>Usted acepta no utilizar el Servicio para:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Proporcionar información falsa o engañosa</li>
              <li>Intentar obtener asesoramiento legal vinculante</li>
              <li>Reproducir o redistribuir masivamente el contenido</li>
              <li>Realizar consultas automatizadas o scraping</li>
              <li>Violar cualquier ley o regulación aplicable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Propiedad Intelectual</h2>
            <p>
              El Servicio y su contenido original, características y funcionalidad son propiedad
              de JurisNexa.ai y están protegidos por derechos de autor, marcas registradas y
              otras leyes de propiedad intelectual.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Limitación de Responsabilidad</h2>
            <p>
              EN NINGÚN CASO JURISNEXA.AI SERÁ RESPONSABLE POR DAÑOS INDIRECTOS, INCIDENTALES,
              ESPECIALES, CONSECUENTES O PUNITIVOS, NI POR PÉRDIDA DE DATOS O BENEFICIOS,
              DERIVADOS DEL USO DEL SERVICIO.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Las
              modificaciones entrarán en vigor inmediatamente después de su publicación. El uso
              continuado del Servicio después de las modificaciones constituye aceptación de los
              nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Ley Aplicable</h2>
            <p>
              Estos términos se regirán e interpretarán de acuerdo con las leyes de la República
              del Perú y la República de Chile, según corresponda.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Contacto</h2>
            <p>
              Para preguntas sobre estos Términos de Servicio, contáctenos en: hola@jurisnexa.ai
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}