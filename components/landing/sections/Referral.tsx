import Link from 'next/link'

export function Referral() {
  return (
    <section className="bg-[#091528] border-t border-white/[0.06] py-10 px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#4E9B6F]/15 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L13 8H19L14 12L16 18L10 14L4 18L6 12L1 8H7L10 2Z" stroke="#4E9B6F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-white">Programme de parrainage</p>
            <p className="text-[13px] text-white/50 mt-0.5">
              Parraine un coach et reçois <strong className="text-white/80">1 mois offert</strong> dès qu&apos;il s&apos;abonne. Ton filleul bénéficie de <strong className="text-white/80">7 jours d&apos;essai supplémentaires</strong>.
            </p>
          </div>
        </div>
        <Link
          href="#pricing"
          className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#4E9B6F] hover:bg-[#3d7d58] text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
        >
          Voir les offres
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
      </div>
    </section>
  )
}
