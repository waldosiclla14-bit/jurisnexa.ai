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
          Potenciado por IA — corpus de 3.050 normas chilenas con fuente verificada
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6">
          Asistente Jurídico
          <br />
          <span className="text-emerald-400">Inteligente</span> para
          <br />
          Perú y Chile
        </h1>

        <p className="mx-auto max-w-2xl text-lg text-zinc-400 mb-6">
          Consultas legales precisas que responden con cita de norma y artículo.
          Si la respuesta no está respaldada por el corpus, el sistema lo dice
          y pide aclaración en lugar de inventar.
        </p>

        <div className="mx-auto max-w-3xl flex flex-wrap items-center justify-center gap-3 mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/80 border border-zinc-700 rounded-full text-sm text-zinc-300">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Sin alucinaciones
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/80 border border-zinc-700 rounded-full text-sm text-zinc-300">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Fuentes verificables [n]
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/80 border border-zinc-700 rounded-full text-sm text-zinc-300">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Estado de vigencia por norma
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/80 border border-zinc-700 rounded-full text-sm text-zinc-300">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Compatible con la OJV de Chile
          </span>
        </div>

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
          Sin tarjeta de crédito · 10 consultas mensuales gratis · Cancela cuando quieras
        </p>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">14+</div>
            <div className="text-xs text-zinc-500 mt-1">Tipos de documentos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">3.050</div>
            <div className="text-xs text-zinc-500 mt-1">Normas chilenas indexadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">100%</div>
            <div className="text-xs text-zinc-500 mt-1">Respuestas con fuente</div>
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