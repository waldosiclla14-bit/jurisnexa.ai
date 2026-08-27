const plans = [
  {
    name: "Free",
    price: "$0",
    period: "para siempre",
    description: "Perfecto para probar la plataforma",
    features: [
      "10 consultas mensuales",
      "Acceso a legislación básica",
      "Soporte por email",
      "Perú y Chile"
    ],
    cta: "Comenzar Gratis",
    ctaLink: "/register",
    highlighted: false
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mes",
    description: "Para profesionales del derecho",
    features: [
      "100 consultas mensuales",
      "Todas las áreas jurídicas",
      "Análisis de documentos PDF",
      "Comparación binacional",
      "Historial completo",
      "Soporte prioritario"
    ],
    cta: "Elegir Pro",
    ctaLink: "/register?plan=pro",
    highlighted: true
  },
  {
    name: "Professional",
    price: "$79",
    period: "/mes",
    description: "Para bufetes y empresas",
    features: [
      "500 consultas mensuales",
      "Todo de Pro incluido",
      "API de integración",
      "Múltiples usuarios",
      "Personalización de respuestas",
      "Soporte dedicado",
      "SLA garantizado"
    ],
    cta: "Contactar Ventas",
    ctaLink: "/contacto",
    highlighted: false
  }
];

export function PricingSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">
            Planes simples y transparentes
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Elige el plan que se adapte a tus necesidades. Sin costos ocultos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-2xl border ${
                plan.highlighted
                  ? 'bg-zinc-800 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'bg-zinc-800/50 border-zinc-700'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-600 text-white text-xs font-medium rounded-full">
                  Más Popular
                </div>
              )}
              
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-zinc-400">{plan.period}</span>
              </div>
              <p className="text-sm text-zinc-400 mb-6">{plan.description}</p>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <a
                href={plan.ctaLink}
                className={`block w-full py-3 text-center font-medium rounded-lg transition-colors ${
                  plan.highlighted
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-zinc-500 text-sm">
            ¿Necesitas un plan personalizado?{' '}
            <a href="/contacto" className="text-emerald-400 hover:text-emerald-300">
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
