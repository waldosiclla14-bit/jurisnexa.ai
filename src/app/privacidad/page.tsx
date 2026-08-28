import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PolÃ­tica de Privacidad | JurisNexa.ai',
  description: 'PolÃ­tica de privacidad y manejo de datos personales de JurisNexa.ai.',
  alternates: {
    canonical: '/privacidad',
  },
};


export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <LandingHeader />

      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-bold text-white mb-8">PolÃ­tica de Privacidad</h1>
        <p className="text-sm text-zinc-500 mb-8">Ãšltima actualizaciÃ³n: Enero 2025</p>
        
        <div className="prose prose-invert max-w-none space-y-8 text-zinc-400">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. InformaciÃ³n que Recopilamos</h2>
            <p>Recopilamos la siguiente informaciÃ³n cuando utiliza nuestro Servicio:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong className="text-white">InformaciÃ³n de cuenta:</strong> nombre, correo electrÃ³nico, contraseÃ±a hasheada</li>
              <li><strong className="text-white">Datos de uso:</strong> consultas realizadas, documentos subidos, historial de conversaciones</li>
              <li><strong className="text-white">InformaciÃ³n tÃ©cnica:</strong> direcciÃ³n IP, tipo de navegador, dispositivo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. CÃ³mo Usamos su InformaciÃ³n</h2>
            <p>Utilizamos su informaciÃ³n para:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Proporcionar y mejorar el Servicio</li>
              <li>Personalizar sus consultas</li>
              <li>Enviar notificaciones importantes</li>
              <li>Prevenir fraude y abusos</li>
              <li>Cumplir obligaciones legales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Cookies y TecnologÃ­as de Rastreo</h2>
            <p>
              Utilizamos cookies y tecnologÃ­as similares para mejorar su experiencia, analizar el
              uso del Servicio y personalizar el contenido. Puede configurar su navegador para
              rechazar cookies, aunque esto podrÃ­a afectar la funcionalidad del Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Compartir InformaciÃ³n</h2>
            <p>
              No vendemos su informaciÃ³n personal. Podemos compartir informaciÃ³n con:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Proveedores de servicios que nos ayudan a operar (hosting, anÃ¡lisis)</li>
              <li>Autoridades legales cuando sea requerido por ley</li>
              <li>En caso de fusiÃ³n o adquisiciÃ³n empresarial</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Seguridad de Datos</h2>
            <p>
              Implementamos medidas de seguridad tÃ©cnicas y organizativas para proteger su
              informaciÃ³n personal contra acceso no autorizado, alteraciÃ³n, divulgaciÃ³n o
              destrucciÃ³n. Utilizamos cifrado SSL/TLS y almacenamiento seguro en la nube.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. RetenciÃ³n de Datos</h2>
            <p>
              Conservamos su informaciÃ³n personal mientras su cuenta estÃ© activa o segÃºn sea
              necesario para proporcionar el Servicio. Puede solicitar eliminaciÃ³n de sus datos
              en cualquier momento.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Sus Derechos (LGPD y LFPDPPP)</h2>
            <p>De acuerdo con la legislaciÃ³n de protecciÃ³n de datos de PerÃº y Chile, usted tiene derecho a:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Acceder a sus datos personales</li>
              <li>Solicitar rectificaciÃ³n de datos inexactos</li>
              <li>Solicitar eliminaciÃ³n de sus datos</li>
              <li>Oponerse al procesamiento de sus datos</li>
              <li>Solicitar portabilidad de datos</li>
              <li>Revocar el consentimiento en cualquier momento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Datos de Documentos Subidos</h2>
            <p>
              Los documentos PDF que usted sube son procesados para extraer texto y generar
              anÃ¡lisis. El texto extraÃ­do se almacena de forma segura y solo es accesible por
              su cuenta. No compartimos el contenido de sus documentos con terceros.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Cambios en esta PolÃ­tica</h2>
            <p>
              Podemos actualizar esta polÃ­tica de privacidad ocasionalmente. Le notificaremos
              de cambios significativos por correo electrÃ³nico o mediante aviso en el Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Contacto</h2>
            <p>
              Para ejercer sus derechos o hacer preguntas sobre esta polÃ­tica, contÃ¡ctenos en:
              privacidad@jurisnexa.ai
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
