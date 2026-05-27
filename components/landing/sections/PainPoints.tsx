import Link from 'next/link'

const POINTS = [
  {
    tag: 'Rétention',
    tagColor: '#D97706',
    tagBg: '#FFF7ED',
    tagBorder: '#FDE68A',
    title: 'Tes clients décrochent en silence.',
    desc: "Un client ne répond plus, ne poste plus de check-in. Tu t'en rends compte… deux semaines après. Sans alerte, tu n'as aucune chance d'intervenir à temps.",
    before: [
      "Tu découvres l'inactivité trop tard",
      'Tu dois fouiller chaque fiche une par une',
      'Le client est déjà parti dans la tête',
    ],
    after: {
      title: 'Avec Evolya',
      bullets: [
        'Alerte automatique dès le seuil dépassé',
        'Relance en 1 clic depuis ton dashboard',
        'Seuil configurable par coach (3 à 30 jours)',
      ],
      accent: '#4E9B6F',
    },
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8.5" stroke="#D97706" strokeWidth="1.4"/>
        <path d="M10 6v4.5M10 13.5v.5" stroke="#D97706" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    tag: 'Trésorerie',
    tagColor: '#DC2626',
    tagBg: '#FEF2F2',
    tagBorder: '#FECACA',
    title: 'Tes impayés dorment sans relance.',
    desc: "Tu as facturé, tu attends. Le paiement ne vient pas. Relancer un client pour l'argent, c'est inconfortable — alors tu remets à plus tard jusqu'à oublier.",
    before: [
      "Aucune visibilité sur ce qui est en retard",
      "Relancer manuellement, client par client",
      'Argent perdu faute de suivi systématique',
    ],
    after: {
      title: 'Avec Evolya',
      bullets: [
        'Email automatique à J+3, J+7 et J+14',
        'Bouton "Relancer" dans le modal de paiement',
        'Vue centralisée de tous tes impayés',
      ],
      accent: '#4E9B6F',
    },
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="5" width="14" height="10" rx="2" stroke="#DC2626" strokeWidth="1.4"/>
        <path d="M3 8.5h14" stroke="#DC2626" strokeWidth="1.4"/>
        <path d="M7 12h2M11 12h2" stroke="#DC2626" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export function PainPoints() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-12">
          <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#94A3B8] mb-3">Ce qui bloque ta croissance</p>
          <h2 className="text-[26px] sm:text-[32px] font-bold text-[#0D1F3C] tracking-[-0.02em] leading-tight">
            Quand le système ne suit plus,<br className="hidden sm:block" /> c&apos;est ton temps qui disparaît.
          </h2>
          <p className="text-[15px] text-[#64748B] leading-relaxed mt-4 max-w-xl mx-auto">
            À partir d&apos;un certain volume d&apos;membres, la gestion prend le dessus sur le coaching. Chaque heure perdue sur un système qui casse est une heure qui t&apos;empêche de passer à +30.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {POINTS.map((p) => (
            <div
              key={p.tag}
              className="rounded-2xl border border-[#E8ECF0] overflow-hidden"
              style={{ boxShadow: '0 2px 12px rgba(13,31,60,0.05)' }}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-5 border-b border-[#F1F5F9]">
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: p.tagBg, border: `1px solid ${p.tagBorder}` }}
                  >
                    {p.icon}
                  </div>
                  <span
                    className="text-[10.5px] font-bold tracking-[0.14em] uppercase px-2.5 py-1 rounded-full mt-1 flex-shrink-0"
                    style={{ color: p.tagColor, background: p.tagBg, border: `1px solid ${p.tagBorder}` }}
                  >
                    {p.tag}
                  </span>
                </div>
                <h3 className="text-[16px] font-bold text-[#0D1F3C] leading-snug mb-2">
                  {p.title}
                </h3>
                <p className="text-[13px] text-[#64748B] leading-relaxed">{p.desc}</p>
              </div>

              {/* Before */}
              <div className="px-6 py-4 bg-[#F8FAFB] border-b border-[#F1F5F9]">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#94A3B8] mb-2.5">Aujourd&apos;hui</p>
                <ul className="space-y-1.5">
                  {p.before.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <svg className="mt-[3px] flex-shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M3 6l2.5 2.5L9 3" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-[12.5px] text-[#94A3B8] line-through">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* After */}
              <div className="px-6 py-4 bg-white">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-2.5" style={{ color: p.after.accent }}>
                  {p.after.title}
                </p>
                <ul className="space-y-1.5">
                  {p.after.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <svg className="mt-[3px] flex-shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6.5l2.5 2.5L10 3" stroke="#4E9B6F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-[12.5px] text-[#374151] font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* CTA bas */}
        <div className="text-center mt-10">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-[#0D1F3C] text-white text-[13.5px] font-semibold px-6 py-3 rounded-xl hover:bg-[#162B4A] transition-colors"
          >
            Résoudre ces deux problèmes
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
              <path d="M3 7.5h9M8.5 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <p className="text-[11px] text-[#94A3B8] mt-2.5">14 jours gratuits · Sans carte bancaire</p>
        </div>

      </div>
    </section>
  )
}
