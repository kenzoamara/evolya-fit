const FEATURES = [
  { icon: '📅', label: 'Agenda & planning' },
  { icon: '💪', label: 'Programmes sportifs' },
  { icon: '🥗', label: 'Suivi nutritionnel' },
  { icon: '✅', label: 'Habitudes & suivi' },
  { icon: '💬', label: 'Messagerie intégrée' },
  { icon: '📊', label: 'Statistiques membres' },
  { icon: '📬', label: 'Rapport hebdomadaire' },
  { icon: '📋', label: 'Check-ins automatiques' },
  { icon: '👤', label: 'Espace membre dédié' },
  { icon: '🎨', label: 'Personnalisation' },
  { icon: '🧮', label: 'Outils de calcul' },
  { icon: '🛡️', label: 'Données sécurisées UE' },
]

export function IncludedInAllPlans() {
  return (
    <section className="bg-white py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-10 bg-[#E5E7EB]" />
            <span className="text-[11px] font-bold text-[#4E9B6F] tracking-[0.15em] uppercase">
              Inclus dans tous les plans
            </span>
            <div className="h-px w-10 bg-[#E5E7EB]" />
          </div>
          <p className="text-[16px] sm:text-[18px] font-semibold text-[#0D1F3C]">
            Peu importe le plan choisi, tu accèdes à l&apos;intégralité de la plateforme.
          </p>
        </div>

        {/* Grid features */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2.5 bg-[#F8FAFB] border border-[#F0F0F0] rounded-xl px-3.5 py-3"
            >
              <span className="text-[18px] leading-none flex-shrink-0">{f.icon}</span>
              <span className="text-[12.5px] sm:text-[13px] font-medium text-[#374151] leading-snug">{f.label}</span>
            </div>
          ))}
        </div>

        {/* CTA vers pricing */}
        <div className="flex justify-center mt-8">
          <a
            href="#pricing"
            className="flex items-center gap-2 text-[13px] font-semibold text-[#4E9B6F] hover:text-[#3D7A5F] transition-colors group"
          >
            Voir les tarifs
            <svg
              width="14" height="14" viewBox="0 0 14 14" fill="none"
              className="transition-transform duration-200 group-hover:translate-y-0.5"
            >
              <path d="M2 4.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>

      </div>
    </section>
  )
}
