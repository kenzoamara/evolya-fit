import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mentions légales — Evolyafit',
  description: 'Mentions légales de Evolyafit, plateforme SaaS de suivi coach-client.',
}

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] bg-white px-6 py-4">
        <Link href="/" className="text-sm text-[#4E9B6F] hover:underline">← Retour à l'accueil</Link>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <div>
          <h1 className="text-3xl font-semibold text-[#0D1F3C] mb-2">Mentions légales</h1>
          <p className="text-sm text-[#64748B]">Dernière mise à jour : avril 2026</p>
        </div>

        {/* 1. Éditeur */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">1. Éditeur du site</h2>
          <div className="text-sm text-[#0D1F3C] space-y-1 leading-relaxed">
            <p><strong>Dénomination :</strong> Evolyafit</p>
            <p><strong>Statut juridique :</strong> Auto-entrepreneur / Micro-entreprise</p>
            <p><strong>Représentant légal :</strong> Kenzo Amara</p>
            <p><strong>Siège social :</strong> 26200 Montélimar, France</p>
            <p><strong>N° SIRET :</strong> [À compléter]</p>
            <p><strong>Email de contact :</strong> <a href="mailto:contact@evolyafit.fr" className="text-[#4E9B6F] hover:underline">contact@evolyafit.fr</a></p>
            <p><strong>Site web :</strong> https://www.evolyafit.fr</p>
          </div>
        </section>

        {/* 2. Hébergeur */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">2. Hébergement</h2>
          <div className="text-sm text-[#0D1F3C] space-y-3 leading-relaxed">
            <div>
              <p className="font-medium">Hébergeur principal (Frontend & API) :</p>
              <p>Vercel Inc.</p>
              <p>340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</p>
              <p>Site : <a href="https://vercel.com" className="text-[#4E9B6F] hover:underline" target="_blank" rel="noopener noreferrer">vercel.com</a></p>
            </div>
            <div>
              <p className="font-medium">Base de données & Authentification :</p>
              <p>Supabase Inc.</p>
              <p>970 Toa Payoh North, Singapour (serveurs hébergés dans l'UE — région eu-west)</p>
              <p>Site : <a href="https://supabase.com" className="text-[#4E9B6F] hover:underline" target="_blank" rel="noopener noreferrer">supabase.com</a></p>
            </div>
          </div>
        </section>

        {/* 3. Directeur de publication */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">3. Directeur de publication</h2>
          <p className="text-sm text-[#0D1F3C] leading-relaxed">
            Le directeur de la publication est <strong>Kenzo Amara</strong>, en sa qualité de représentant légal de Evolya.
          </p>
        </section>

        {/* 4. Propriété intellectuelle */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">4. Propriété intellectuelle</h2>
          <p className="text-sm text-[#0D1F3C] leading-relaxed">
            L'ensemble du contenu du site Evolya (textes, graphismes, logos, icônes, images, code source, architecture) est la propriété exclusive de Evolya et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle (Loi n° 92-597 du 1er juillet 1992, Code de la Propriété Intellectuelle).
          </p>
          <p className="text-sm text-[#0D1F3C] leading-relaxed">
            Toute reproduction, distribution, modification, adaptation, retransmission ou publication de ces différents éléments est strictement interdite sans l'accord exprès par écrit de Evolya. Cette représentation ou reproduction, par quelque procédé que ce soit, constitue une contrefaçon sanctionnée par les articles L335-2 et suivants du Code de la Propriété Intellectuelle.
          </p>
          <div className="text-sm text-[#0D1F3C] leading-relaxed space-y-1">
            <p className="font-medium">Composants open source utilisés (licences MIT sauf mention contraire) :</p>
            <ul className="list-disc list-inside space-y-1 text-[#64748B] ml-2">
              <li>Next.js — MIT License (Vercel)</li>
              <li>React — MIT License (Meta)</li>
              <li>Tailwind CSS — MIT License</li>
              <li>Supabase JS Client — MIT License</li>
              <li>Stripe JS SDK — Apache 2.0</li>
            </ul>
          </div>
        </section>

        {/* 5. Responsabilité */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">5. Limitation de responsabilité</h2>
          <p className="text-sm text-[#0D1F3C] leading-relaxed">
            Evolya s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Cependant, Evolya ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition. En conséquence, Evolya décline toute responsabilité pour :
          </p>
          <ul className="list-disc list-inside text-sm text-[#64748B] space-y-1 ml-2 leading-relaxed">
            <li>Toute imprécision, inexactitude ou omission portant sur des informations disponibles sur le site</li>
            <li>Tous dommages résultant d'une intrusion frauduleuse d'un tiers ayant entraîné une modification des informations</li>
            <li>Tout dommage direct ou indirect, quelle qu'en soit la cause, origine, nature ou conséquence, provoqué en raison d'un accès au site ou d'une impossibilité d'y accéder</li>
            <li>L'utilisation du site et/ou du crédit accordé à une quelconque information provenant directement ou indirectement du site</li>
          </ul>
          <p className="text-sm text-[#0D1F3C] leading-relaxed">
            Les liens hypertextes mis en place dans le cadre du site en direction d'autres ressources présentes sur Internet ne sauraient engager la responsabilité de Evolya.
          </p>
        </section>

        {/* 6. Données personnelles */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">6. Données personnelles & RGPD</h2>
          <p className="text-sm text-[#0D1F3C] leading-relaxed">
            Evolya collecte et traite des données personnelles dans le respect du Règlement Général sur la Protection des Données (RGPD — UE 2016/679) et de la loi française Informatique et Libertés (Loi n° 78-17 du 6 janvier 1978 modifiée).
          </p>
          <p className="text-sm text-[#0D1F3C] leading-relaxed">
            Pour toute information concernant la collecte et le traitement de vos données personnelles, veuillez consulter notre{' '}
            <Link href="/politique-confidentialite" className="text-[#4E9B6F] hover:underline">Politique de confidentialité</Link>.
          </p>
          <p className="text-sm text-[#0D1F3C] leading-relaxed">
            Pour exercer vos droits (accès, rectification, suppression, portabilité), contactez : <a href="mailto:contact.evolya.pro@gmail.com" className="text-[#4E9B6F] hover:underline">contact.evolya.pro@gmail.com</a>
          </p>
        </section>

        {/* 7. Cookies */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">7. Cookies</h2>
          <p className="text-sm text-[#0D1F3C] leading-relaxed">
            Evolya utilise uniquement des cookies essentiels au fonctionnement du service (session d'authentification, jeton CSRF). Aucun cookie publicitaire ou de traçage n'est utilisé. Aucune donnée n'est partagée avec des régies publicitaires.
          </p>
        </section>

        {/* 8. Droit applicable */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">8. Droit applicable et juridiction</h2>
          <p className="text-sm text-[#0D1F3C] leading-relaxed">
            Les présentes mentions légales sont soumises au droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux français seront seuls compétents.
          </p>
        </section>

        <div className="border-t border-[#E2E8F0] pt-6 flex flex-wrap gap-4 text-xs text-[#94A3B8]">
          <Link href="/" className="hover:text-[#4E9B6F]">Accueil</Link>
          <Link href="/politique-confidentialite" className="hover:text-[#4E9B6F]">Politique de confidentialité</Link>
          <Link href="/cgu" className="hover:text-[#4E9B6F]">CGU</Link>
        </div>
      </main>
    </div>
  )
}
