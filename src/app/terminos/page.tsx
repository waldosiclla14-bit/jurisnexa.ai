import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TÃ©rminos de Servicio | JurisNexa.ai',
  description: 'TÃ©rminos y condiciones de uso de JurisNexa.ai.',
  alternates: {
    canonical: '/terminos',
  },
};


export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <LandingHeader />

      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-bold text-white mb-8">TÃ©rminos de Servicio</h1>
        <p className="text-sm text-zinc-500 mb-8">Ãšltima actualizaciÃ³n: Enero 2025</p>
        
        <div className="prose prose-invert max-w-none space-y-8 text-zinc-400">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. AceptaciÃ³n de TÃ©rminos</h2>
            <p>
              Al acceder y utilizar JurisNexa.ai (&quot;el Servicio&quot;), usted acepta estos TÃ©rminos de Servicio.
              Si no estÃ¡ de acuerdo con alguno de estos tÃ©rminos, no utilice el Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. DescripciÃ³n del Servicio</h2>
            <p>
              JurisNexa.ai es un asistente de informaciÃ³n jurÃ­dica basado en inteligencia artificial
              que proporciona informaciÃ³n general sobre legislaciÃ³n de PerÃº y Chile. El Servicio
              NO constituye asesoramiento legal profesional.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Aviso Legal Importante</h2>
            <p className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white">
              <strong>LA INFORMACIÃ“N PROPORCIONADA POR JURISNEXA.AI ES DE CARÃCTER GENERAL Y NO
              SUSTITUYE EL ASESORAMIENTO DE UN ABOGADO. LA APLICACIÃ“N NO GARANTIZA UN RESULTADO
              JUDICIAL.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Cuentas de Usuario</h2>
            <p>
              Para utilizar ciertas funciones del Servicio, usted debe crear una cuenta. Usted es
              responsable de mantener la confidencialidad de su contraseÃ±a y de todas las actividades
              que ocurran en su cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Uso Aceptable</h2>
            <p>Usted acepta no utilizar el Servicio para:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Proporcionar informaciÃ³n falsa o engaÃ±osa</li>
              <li>Intentar obtener asesoramiento legal vinculante</li>
              <li>Reproducir o redistribuir massivamente el contenido</li>
              <li>Realizar consultas automatizadas o scraping</li>
              <li>Violar cualquier ley o regulaciÃ³n aplicable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Propiedad Intelectual</h2>
            <p>
              El Servicio y su contenido original, caracterÃ­sticas y funcionalidad son propiedad
              de JurisNexa.ai y estÃ¡n protegidos por derechos de autor, marcas registradas y
              otras leyes de propiedad intelectual.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. LimitaciÃ³n de Responsabilidad</h2>
            <p>
              EN NINGÃšN CASO JURISNEXA.AI SERÃ RESPONSABLE POR DAÃ‘OS INDIRECTOS, INCIDENTALES,
              ESPECIALES, CONSECUENTES O PUNITIVOS, NI POR PÃ‰RDIDA DE DATOS O BENEFICIOS,
              DERIVADOS DEL USO DEL SERVICIO.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos tÃ©rminos en cualquier momento. Las
              modificaciones entrarÃ¡n en vigor inmediatamente despuÃ©s de su publicaciÃ³n. El uso
              continuado del Servicio despuÃ©s de las modificaciones constituye aceptaciÃ³n de los
              nuevos tÃ©rminos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Ley Aplicable</h2>
            <p>
              Estos tÃ©rminos se regirÃ¡n e interpretarÃ¡n de acuerdo con las leyes de la RepÃºblica
              del PerÃº y la RepÃºblica de Chile, segÃºn corresponda.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Contacto</h2>
            <p>
              Para preguntas sobre estos TÃ©rminos de Servicio, contÃ¡ctenos en: hola@jurisnexa.ai
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
