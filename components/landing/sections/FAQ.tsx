'use client'

import { useState } from 'react'

/* ─── Données FAQ ──────────────────────────────────────────── */

const FAQS = [
  {
    q: 'J\'ai déjà mes habitudes avec WhatsApp et Google Sheets. Pourquoi changer maintenant ?',
    a: 'Ces outils fonctionnent jusqu\'à un certain volume. Passé 15 membres, chaque message non tracé, chaque tableau à mettre à jour et chaque relance oubliée te coûte du temps et de l\'énergie. Evolya\'Fit ne te demande pas de changer ta façon de coacher — juste de centraliser là où tu passes déjà du temps, pour arrêter de gérer et recommencer à coacher.',
  },
  {
    q: 'Combien de temps vais-je réellement gagner ?',
    a: 'En centralisant tes programmes, check-ins, messages et paiements au même endroit, tu élimines les allers-retours entre outils. Les coachs qui utilisent Evolya\'Fit récupèrent en moyenne 21h par semaine dès les premiers jours d\'utilisation — du temps qu\'ils réinvestissent dans leur coaching ou dans l\'acquisition de nouveaux membres.',
  },
  {
    q: 'Puis-je personnaliser la plateforme pour garder mon image professionnelle ?',
    a: 'Tu choisis la couleur principale de ton interface, la police d\'écriture et le mode clair ou sombre. Tes membres voient ton nom, ta photo de profil et un espace à tes couleurs — pas un outil générique. Tout se configure en quelques clics dans les paramètres, sans rien de technique.',
  },
  {
    q: 'La plateforme est-elle vraiment facile à prendre en main ?',
    a: 'Aucune complexité technique. Dès l\'inscription, un parcours d\'onboarding te guide étape par étape. Tu choisis ce qui te sert et supprimes l\'inutile — la plateforme s\'adapte à toi, pas l\'inverse.',
  },
  {
    q: 'Puis-je résilier mon abonnement à tout moment ?',
    a: 'Oui, sans condition ni préavis. Tu peux résilier depuis ton espace en quelques secondes. Aucun engagement, aucune pénalité.',
  },
]

/* ─── Composant item FAQ ───────────────────────────────────── */

function FAQItem({ item, open, onToggle }: {
  item: { q: string; a: string }
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className={`border-b border-[#F3F4F6] last:border-b-0 transition-colors duration-200 ${open ? 'bg-[#FAFAFA]' : ''}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
      >
        <span className={`text-[15px] font-semibold leading-snug transition-colors duration-200 ${open ? 'text-[#0D1F3C]' : 'text-[#374151] group-hover:text-[#0D1F3C]'}`}>
          {item.q}
        </span>
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            backgroundColor: open ? '#0D1F3C' : '#F3F4F6',
            color: open ? '#FFFFFF' : '#6B7280',
          }}
        >
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>

      {/* Contenu accordéon */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? '200px' : '0px', opacity: open ? 1 : 0 }}
      >
        <p className="px-6 pb-5 text-[14px] text-[#6B7280] leading-relaxed">
          {item.a}
        </p>
      </div>
    </div>
  )
}

/* ─── Composant principal ──────────────────────────────────── */

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="bg-[#F8FAFB] py-24 px-6">
      <div className="max-w-2xl mx-auto">

        {/* Header FAQ */}
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold text-[#4E9B6F] tracking-[0.15em] uppercase mb-3">FAQ</p>
          <h2 className="text-[28px] md:text-[34px] font-bold text-[#0D1F3C] tracking-tight leading-tight mb-3">
            Questions fréquentes
          </h2>
          <p className="text-[15px] text-[#9CA3AF] leading-relaxed">
            Tout ce que tu dois savoir avant de commencer.
          </p>
        </div>

        {/* Accordéon */}
        <div className="rounded-2xl border border-[#E5E7EB] overflow-hidden bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          {FAQS.map((item, i) => (
            <FAQItem
              key={i}
              item={item}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>


      </div>
    </section>
  )
}
