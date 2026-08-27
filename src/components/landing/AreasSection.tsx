const legalAreas = [
  { name: "Civil", icon: "⚖️" },
  { name: "Penal", icon: "🔒" },
  { name: "Laboral", icon: "👷" },
  { name: "Familia", icon: "👨‍👩‍👧" },
  { name: "Constitucional", icon: "📜" },
  { name: "Tributario", icon: "💰" },
  { name: "Comercial", icon: "🏢" },
  { name: "Consumidor", icon: "🛒" },
  { name: "Migratorio", icon: "✈️" },
  { name: "Inmobiliario", icon: "🏠" },
];

export function AreasSection() {
  return (
    <section className="py-24 bg-zinc-900/50">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">
            Cobertura completa en áreas jurídicas
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Nuestro asistente cubre las principales ramas del derecho en
            Perú y Chile.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {legalAreas.map((area, index) => (
            <div
              key={index}
              className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-center hover:border-emerald-500/50 transition-colors"
            >
              <span className="text-3xl mb-2 block">{area.icon}</span>
              <span className="text-sm font-medium text-white">{area.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
