import Link from 'next/link'
import { SectionTag } from '@/components/landing/section-tag'

export function FinalCTA() {
  return (
    <section className="bg-gradient-to-b from-[#0F2440] to-[#0D1F3C] py-28 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.10]"
          style={{ background: 'radial-gradient(circle, #4E9B6F 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Eyebrow */}
        <SectionTag variant="dark">Prêt à commencer ?</SectionTag>

        {/* Title */}
        <h2 className="text-[42px] md:text-[52px] font-bold text-white tracking-[-0.02em] leading-[1.08] mb-6">
          Récupère plus de 21h par semaine tout en préservant la qualité de la relation avec tes membres.
        </h2>

        {/* Subtitle */}
        <p className="text-[17px] text-white/55 leading-relaxed mb-12 max-w-lg mx-auto">
          14 jours d'essai gratuit, sans engagement, sans carte bancaire.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center gap-2 bg-[#4E9B6F] text-white text-[15px] font-semibold px-8 py-4 rounded-xl hover:bg-[#3D7A5F] transition-colors"
          >
            Créer mon compte gratuitement
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <Link
            href="#pricing"
            className="inline-flex items-center justify-center gap-2 bg-white/[0.06] border border-white/15 text-white text-[15px] font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors"
          >
            Voir les tarifs
          </Link>
        </div>

        {/* Micro trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
          {[
            'Sans carte bancaire',
            'Configuration en 10 min',
            'Support 7j/7',
          ].map((signal, i) => (
            <div key={i} className="flex items-center gap-2 text-[13px] text-white/60">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="rgba(78,155,111,0.5)" strokeWidth="1.2"/>
                <path d="M4.5 7l1.8 1.8L9.5 5" stroke="#4E9B6F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {signal}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
