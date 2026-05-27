const CATEGORIES = [
  {
    emoji: '🧠',
    label: 'Suivi & performance',
    items: [
      'Suivi de tes membres en temps réel, 7j/7',
      'Ajustements et déblocages du coaching à la volée',
      'Historique complet et progression des performances',
    ],
  },
  {
    emoji: '🏋️',
    label: 'Coaching & planification',
    items: [
      'Calendrier de planification intégré',
      'Lancement des séances depuis une interface épurée',
      'Plans sportifs, nutritionnels et hygiène de vie',
    ],
  },
  {
    emoji: '💬',
    label: 'Communication',
    items: [
      'Messagerie coach / membres disponible 24h/24',
    ],
  },
  {
    emoji: '⚙️',
    label: 'Automatisation & personnalisation',
    items: [
      'Espaces coach et membre personnalisables',
      'Rapport hebdomadaire automatique chaque lundi matin',
      'Détection automatique des membres inactifs',
    ],
  },
  {
    emoji: '📊',
    label: 'Business & gestion',
    items: [
      'Vue d\'ensemble de la croissance de ton activité',
      'Statistiques des membres actifs, inactifs et nouveaux',
    ],
  },
]

// Aplatit toutes les features en liste avec leur catégorie
const FLAT: { cat: string; emoji: string; text: string }[] = []
CATEGORIES.forEach(cat => {
  cat.items.forEach(item => {
    FLAT.push({ cat: cat.label, emoji: cat.emoji, text: item })
  })
})

// Split en 2 colonnes
const col1 = FLAT.slice(0, Math.ceil(FLAT.length / 2))
const col2 = FLAT.slice(Math.ceil(FLAT.length / 2))

export function AllFeatures() {
  return (
    <section className="bg-[#0A1628] py-20 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Titre */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2.5 mb-5">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1l1.8 5.5H18l-4.9 3.6 1.8 5.5L9 12.1 4.1 15.6l1.8-5.5L1 6.5h7.2Z" fill="#4E9B6F" opacity="0.9"/>
            </svg>
            <h2 className="text-[26px] md:text-[32px] font-bold text-white tracking-tight">
              Tous les abonnements possèdent
            </h2>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1l1.8 5.5H18l-4.9 3.6 1.8 5.5L9 12.1 4.1 15.6l1.8-5.5L1 6.5h7.2Z" fill="#4E9B6F" opacity="0.9"/>
            </svg>
          </div>
        </div>

        {/* Grille 2 colonnes */}
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-0">
          {[col1, col2].map((col, ci) => (
            <div key={ci} className="flex flex-col">
              {col.map((feat, i) => {
                // Affiche le header de catégorie si la catégorie change
                const prevCat = i > 0 ? col[i - 1].cat : null
                const showHeader = feat.cat !== prevCat
                return (
                  <div key={i}>
                    {showHeader && (
                      <div className="flex items-center gap-2 mt-8 mb-3 first:mt-0">
                        <span className="text-[16px]">{feat.emoji}</span>
                        <span className="text-[11px] font-bold text-[#4E9B6F] tracking-[0.12em] uppercase">
                          {feat.cat}
                        </span>
                        <div className="flex-1 h-px bg-white/8" />
                      </div>
                    )}
                    <div className="flex items-start gap-3 py-2.5 border-b border-white/5">
                      <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8.5l3.5 3.5 6.5-7" stroke="#4E9B6F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-[13px] text-white/70 leading-snug">{feat.text}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Et bien plus encore */}
        <div className="mt-10 text-center">
          <span className="inline-flex items-center gap-2 text-[13px] text-white/30 font-medium">
            <span className="w-8 h-px bg-white/15 inline-block" />
            et bien plus encore
            <span className="w-8 h-px bg-white/15 inline-block" />
          </span>
        </div>

      </div>
    </section>
  )
}
