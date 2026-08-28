import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad | JurisNexa.ai',
  description: 'Política de privacidad y manejo de datos personales de JurisNexa.ai.',
  alternates: {
    canonical: '/privacidad',
  },
};


export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <LandingHeader />

      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-bold text-white mb-8">Política de Privacidad</h1>
        <p className="text-sm text-zinc-500 mb-8">Última actualización: Enero 2025</p>
        
        <div className="prose prose-invert max-w-none space-y-8 text-zinc-400">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Información que Recopilamos</h2>
            <p>Recopilamos la siguiente información cuando utiliza nuestro Servicio:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong className="text-white">Información de cuenta:</strong> nombre, correo electrónico, contraseña hasheada</li>
              <li><strong className="text-white">Datos de uso:</strong> consultas realizadas, documentos subidos, historial de conversaciones</li>
              <li><strong className="text-white">Información técnica:</strong> dirección IP, tipo de navegador, dispositivo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Cómo Usamos su Información</h2>
            <p>Utilizamos su información para:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Proporcionar y mejorar el Servicio</li>
              <li>Personalizar sus consultas</li>
              <li>Enviar notificaciones importantes</li>
              <li>Prevenir fraude y abusos</li>
              <li>Cumplir obligaciones legales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Cookies y Tecnologías de Rastreo</h2>
            <p>
              Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar el
              uso del Servicio y personalizar el contenido. Puede configurar su navegador para
              rechazar cookies, aunque esto podría afectar la funcionalidad del Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Compartir Información</h2>
            <p>
              No vendemos su información personal. Podemos compartir información con:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Proveedores de servicios que nos ayudan a operar (hosting, análisis)</li>
              <li>Autoridades legales cuando sea requerido por ley</li>
              <li>En caso de fusión o adquisición empresarial</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Seguridad de Datos</h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas para proteger su
              información personal contra acceso no autorizado, alteración, divulgación o
              destrucción. Utilizamos cifrado SSL/TLS y almacenamiento seguro en la nube.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Retención de Datos</h2>
            <p>
              Conservamos su información personal mientras su cuenta esté activa o según sea
              necesario para proporcionar el Servicio. Puede solicitar eliminación de sus datos
              en cualquier momento.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Sus Derechos (Ley 29733 de Perú y Ley 19.628 de Chile)</h2>
            <p>De acuerdo con la legislación de protección de datos de Perú y Chile, usted tiene derecho a:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Acceder a sus datos personales</li>
              <li>Solicitar rectificación de datos inexactos</li>
              <li>Solicitar eliminación de sus datos</li>
              <li>Oponerse al procesamiento de sus datos</li>
              <li>Solicitar portabilidad de datos</li>
              <li>Revocar el consentimiento en cualquier momento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Datos de Documentos Subidos</h2>
            <p>
              Los documentos PDF que usted sube son procesados para extraer texto y generar
              análisis. El texto extraído se almacena de forma segura y solo es accesible por
              su cuenta. No compartimos el contenido de sus documentos con terceros.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Cambios en esta Política</h2>
            <p>
              Podemos actualizar esta política de privacidad ocasionalmente. Le notificaremos
              de cambios significativos por correo electrónico o mediante aviso en el Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Contacto</h2>
            <p>
              Para ejercer sus derechos o hacer preguntas sobre esta política, contáctenos en:
              privacidad@jurisnexa.ai
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}