'use client'

import { AnimatedBackground } from '../AnimatedBackground'

const STEPS = [
  {
    number: '01',
    title: 'Ton espace coach est prêt en 2 minutes',
    desc: 'Aucune carte bancaire, aucune formation. Tu es opérationnel avant la fin de ton café.',
  },
  {
    number: '02',
    title: 'Ton membre reçoit son accès en 1 clic',
    desc: 'Il arrive dans un espace à ton image, professionnel, avec déjà ses objectifs et son programme.',
  },
  {
    number: '03',
    title: 'Tu gères, tu suis, tu accompagnes — sans te noyer dans la gestion',
    desc: 'Programmes, check-ins, messagerie, paiements — tout est centralisé. Moins de gestion, plus de coaching.',
  },
  {
    number: '04',
    title: 'Tu vois en temps réel qui progresse, qui décroche, et quoi faire',
    desc: 'Les données de chaque membre, en clair, pour des décisions coaching que les autres coachs n\'ont pas.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="bg-white py-24 px-6 relative overflow-hidden">
      <AnimatedBackground mode="ribbons" theme="light" intensity={0.15} density={20} speed={0.35} accent={0.35} />
      <div className="max-w-5xl mx-auto relative z-[1]">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-white border border-[#E5E7EB] text-[#4E9B6F] text-[11px] font-bold px-3 py-1.5 rounded-full mb-5 tracking-[0.12em] uppercase">
            Prise en main
          </div>
          <h2 className="text-[36px] md:text-[44px] font-bold text-[#0D1F3C] tracking-[-0.02em] mb-5 leading-tight">
            De zéro à ton premier membre suivi{' '}
            <span className="text-[#4E9B6F]">en moins de 10 minutes.</span>
          </h2>
          <p className="text-[16px] text-[#6B7280] max-w-xl mx-auto leading-relaxed">
            Evolya s'adapte à ta façon de coacher — pas l'inverse. Un flux de travail complet et clair
          </p>
        </div>

        {/* Steps — 4 colonnes desktop, vertical mobile */}
        <div className="grid md:grid-cols-4 gap-0 relative">
          {/* Ligne de connexion desktop */}
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-[1px] bg-[#E5E7EB]" />

          {STEPS.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center px-5">
              {/* Cercle numéro */}
              <div className="relative z-10 w-20 h-20 rounded-full bg-white border-2 border-[#E5E7EB] flex items-center justify-center mb-7 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                <span className="text-[20px] font-bold text-[#0D1F3C] tracking-tight">
                  {step.number}
                </span>
              </div>

              {/* Contenu */}
              <h3 className="text-[15px] font-semibold text-[#0D1F3C] mb-2.5 leading-snug">
                {step.title}
              </h3>
              <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
                {step.desc}
              </p>

              {/* Connecteur mobile */}
              {i < STEPS.length - 1 && (
                <div className="md:hidden w-[1px] h-10 bg-[#E5E7EB] my-6" />
              )}
            </div>
          ))}
        </div>

        {/* CTA bas */}
        <div className="text-center mt-16">
          <a
            href="/#pricing"
            className="inline-flex items-center gap-2 bg-[#0D1F3C] text-white text-[14px] font-semibold px-7 py-3.5 rounded-xl hover:bg-[#152E55] transition-colors"
          >
            Démarrer gratuitement
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M3 7.5h9M8.5 4l3.5 3.5L8.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <p className="text-[12px] text-[#B0B7C3] mt-3">Essai gratuit 14 jours · Sans carte bancaire</p>
        </div>

      </div>
    </section>
  )
}
