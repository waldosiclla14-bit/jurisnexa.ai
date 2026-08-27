export function CTASection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <div className="p-12 bg-gradient-to-r from-emerald-600/20 to-emerald-600/10 border border-emerald-500/20 rounded-2xl">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
            Únete a profesionales del derecho que ya utilizan JurisNexa.ai
            para obtener respuestas legales precisas y verificadas.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/chat"
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              Probar Ahora
            </a>
            <a
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg border border-zinc-700 transition-colors"
            >
              Crear Cuenta
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
