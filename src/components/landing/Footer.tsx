export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-900/50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl font-bold text-white">
                Juris<span className="text-emerald-400">Nexa</span>
              </span>
            </div>
            <p className="text-sm text-zinc-400">
              Asistente jurídico inteligente para Perú y Chile.
              Respuestas precisas con fuentes verificadas.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Producto</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><a href="/chat" className="hover:text-white transition-colors">Chat</a></li>
              <li><a href="/precios" className="hover:text-white transition-colors">Precios</a></li>
              <li><a href="/documentos" className="hover:text-white transition-colors">Documentos</a></li>
              <li><a href="/historial" className="hover:text-white transition-colors">Historial</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><a href="/sobre-nosotros" className="hover:text-white transition-colors">Sobre nosotros</a></li>
              <li><a href="/contacto" className="hover:text-white transition-colors">Contacto</a></li>
              <li><a href="/terminos" className="hover:text-white transition-colors">Términos de servicio</a></li>
              <li><a href="/privacidad" className="hover:text-white transition-colors">Política de privacidad</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><span className="text-zinc-500">Perú 🇵🇪</span></li>
              <li><span className="text-zinc-500">Chile 🇨🇱</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">
            © 2026 JurisNexa.ai. Todos los derechos reservados.
          </p>
          <p className="text-xs text-zinc-600 max-w-md text-center sm:text-right">
            La información proporcionada es de carácter general y no sustituye el
            asesoramiento de un abogado.
          </p>
        </div>
      </div>
    </footer>
  );
}
