export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-sm text-emerald-400 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          Potenciado por IA — 260k+ normas BCN · 1.5M sentencias PJUD
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6">
          Asistente Jurídico
          <br />
          <span className="text-emerald-400">Inteligente</span> para
          <br />
          Perú y Chile
        </h1>

        <p className="mx-auto max-w-2xl text-lg text-zinc-400 mb-10">
          Consultas legales precisas, redacción de documentos y carpetas de caso pre-armadas
          con fundamentación verificada. Compatible con la Oficina Judicial Virtual de Chile.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/chat"
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors text-center"
          >
            Probar Ahora — Gratis
          </a>
          <a
            href="#como-funciona"
            className="w-full sm:w-auto px-8 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg border border-zinc-700 transition-colors text-center"
          >
            Ver Cómo Funciona
          </a>
        </div>

        <p className="mt-6 text-sm text-zinc-500">
          Sin tarjeta de crédito · 10 consultas gratis · Cancela cuando quieras
        </p>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">14+</div>
            <div className="text-xs text-zinc-500 mt-1">Tipos de documentos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">20k+</div>
            <div className="text-xs text-zinc-500 mt-1">Leyes chilenas indexadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">1900+</div>
            <div className="text-xs text-zinc-500 mt-1">Artículos RAG disponibles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">OJV</div>
            <div className="text-xs text-zinc-500 mt-1">Compatible Chile</div>
          </div>
        </div>
      </div>
    </section>
  );
}
