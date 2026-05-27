import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Logo } from '@/components/shared/logo'

export const dynamic = 'force-dynamic'

async function getStats() {
  const admin = createAdminClient()
  const [coachesRes, clientsRes, checkinsRes] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'coach'),
    admin.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('checkins').select('id', { count: 'exact', head: true }),
  ])
  return {
    coaches: coachesRes.count ?? 0,
    activeClients: clientsRes.count ?? 0,
    checkins: checkinsRes.count ?? 0,
  }
}

export default async function StatsPage() {
  const stats = await getStats()

  const metrics = [
    { label: 'Coachs inscrits', value: stats.coaches, desc: 'Coachs sportifs utilisant Evolya' },
    { label: 'Clients suivis', value: stats.activeClients, desc: 'Clients actifs accompagnes sur la plateforme' },
    { label: 'Check-ins realises', value: stats.checkins, desc: 'Check-ins hebdomadaires completes par des clients' },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFB] text-[#0D1F3C]">

      {/* Nav */}
      <nav className="border-b border-[#E2E8F0] bg-white px-6">
        <div className="max-w-[960px] mx-auto h-16 flex items-center justify-between">
          <Link href="/">
            <Logo height={32} variant="default" />
          </Link>
          <Link href="/auth/login" className="text-sm text-[#64748B] hover:text-[#0D1F3C] transition-colors">
            Connexion
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="px-6 pt-20 pb-16 text-center">
        <div className="max-w-[640px] mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#EEF9F3] border border-[#4E9B6F]/30 rounded-full px-4 py-1.5 mb-7">
            <span className="text-[12px] font-semibold text-[#4E9B6F] tracking-wide uppercase">Transparence totale</span>
          </div>
          <h1 className="text-[clamp(32px,5vw,48px)] font-bold tracking-tight leading-tight mb-5">
            Evolya en chiffres
          </h1>
          <p className="text-[17px] text-[#64748B] leading-relaxed max-w-[480px] mx-auto">
            Des metriques reelles, mises a jour toutes les heures. Aucun chiffre invente.
          </p>
        </div>
      </section>

      {/* Metrics grid */}
      <section className="px-6 pb-20">
        <div className="max-w-[960px] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white rounded-2xl p-9 border border-[#E2E8F0]">
              <p className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider mb-4">
                {m.label}
              </p>
              <p className="text-[48px] font-bold text-[#4E9B6F] leading-none mb-3 tracking-tight">
                {m.value.toLocaleString('fr-FR')}
              </p>
              <p className="text-[13px] text-[#64748B] leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Note */}
      <section className="px-6 pb-24">
        <div className="max-w-[960px] mx-auto">
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] flex gap-4 items-start">
            <div className="w-1 flex-shrink-0 bg-[#4E9B6F] rounded self-stretch" />
            <div>
              <p className="text-sm font-semibold text-[#0D1F3C] mb-1.5">Comment ces chiffres sont calcules</p>
              <p className="text-[13px] text-[#64748B] leading-relaxed">
                Les donnees sont extraites directement de la base de production Evolya et mises en cache toutes les heures.
                Aucun arrondi, aucune extrapolation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 text-center">
        <Link href="/" className="inline-flex items-center gap-2 bg-[#4E9B6F] hover:bg-[#3d8058] text-white rounded-full px-8 py-3.5 text-[15px] font-medium transition-colors">
          Rejoindre Evolya
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] py-7 text-center">
        <p className="text-[13px] text-[#64748B]">&copy; {new Date().getFullYear()} Evolya</p>
      </footer>
    </div>
  )
}
