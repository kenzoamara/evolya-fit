import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Evolyafit",
  description: "Conditions Générales d'Utilisation de Evolyafit, plateforme SaaS de suivi coach-client.",
}

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      <div className="border-b border-[#E2E8F0] bg-white px-6 py-4">
        <Link href="/" className="text-sm text-[#4E9B6F] hover:underline">← Retour à l'accueil</Link>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <div>
          <h1 className="text-3xl font-semibold text-[#0D1F3C] mb-2">Conditions Générales d'Utilisation</h1>
          <p className="text-sm text-[#64748B]">Entrée en vigueur : avril 2026 — Version 1.0</p>
        </div>

        <section className="bg-[#F0F7F1] border border-[#C8D8CA] rounded-xl px-5 py-4 text-sm text-[#0D1F3C] leading-relaxed">
          En accédant à Evolya et en utilisant ses services, vous acceptez sans réserve les présentes Conditions Générales d'Utilisation (CGU). Si vous n'acceptez pas ces conditions, vous devez cesser d'utiliser le service.
        </section>

        {/* 1. Objet */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">1. Objet et définitions</h2>
          <p className="text-sm text-[#0D1F3C] leading-relaxed">
            Les présentes CGU régissent l'accès et l'utilisation de la plateforme Evolya, accessible à l'adresse <strong>https://www.evolyafit.fr</strong>, éditée par Evolya (auto-entrepreneur, France).
          </p>
          <div className="text-sm text-[#64748B] leading-relaxed space-y-1">
            <p><strong>« Service »</strong> : la plateforme SaaS Evolya permettant aux coachs de gérer le suivi de leurs membres (check-ins, séances, programmes, progression, messagerie).</p>
            <p><strong>« Coach »</strong> : toute personne physique ou morale ayant souscrit à un abonnement Evolya (utilisateur B2B).</p>
            <p><strong>« Membre »</strong> : toute personne suivie par un coach via Evolya, accédant au service via un lien personnalisé sans création de compte.</p>
            <p><strong>« Contenu »</strong> : données, textes, notes, check-ins, programmes et messages créés ou publiés par les utilisateurs sur la plateforme.</p>
            <p><strong>« Nous » / « Evolya »</strong> : l'entreprise éditrice du service.</p>
          </div>
        </section>

        {/* 2. Accès */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">2. Accès au service</h2>
          <div className="text-sm text-[#0D1F3C] leading-relaxed space-y-2">
            <p><strong>Conditions d'accès :</strong> Le Coach doit être âgé d'au moins 18 ans et disposer de la capacité juridique pour contracter. L'utilisation professionnelle du service implique que le Coach exerce une activité de coaching déclarée.</p>
            <p><strong>Identifiants :</strong> Le Coach est seul responsable de la confidentialité de ses identifiants et de toute activité effectuée depuis son compte. Il s'engage à notifier Evolya immédiatement en cas d'accès non autorisé à <a href="mailto:contact.evolya.pro@gmail.com" className="text-[#4E9B6F] hover:underline">contact.evolya.pro@gmail.com</a>.</p>
            <p><strong>Membres :</strong> Les membres des coachs accèdent au service via un lien personnalisé sécurisé généré par leur coach. Ils ne disposent pas de compte au sens de l'authentification classique.</p>
          </div>
        </section>

        {/* 3. Plans et facturation */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">3. Plans, tarification et facturation</h2>
          <div className="text-sm text-[#0D1F3C] leading-relaxed space-y-2">
            <p><strong>Periode d'essai :</strong> Evolya propose une periode d'essai gratuite de 14 jours a la creation du compte. Aucune carte bancaire n'est requise pendant l'essai.</p>
            <p><strong>Plans payants :</strong></p>
            <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-2">
              <li><strong>Découverte :</strong> 1 membre — gratuit, sans limite de durée</li>
              <li><strong>Lancement :</strong> Jusqu'à 10 membres — 19 €/mois (ou 15 €/mois en annuel)</li>
              <li><strong>Croissance :</strong> Jusqu'à 25 membres — 29 €/mois (ou 23 €/mois en annuel, soit 275 €/an)</li>
              <li><strong>Pro :</strong> Jusqu'à 45 membres — 49 €/mois (ou 39 €/mois en annuel, soit 470 €/an)</li>
            </ul>
            <p>Les prix sont affichés en euros TTC sur la page de tarification. Evolya se réserve le droit de modifier ses tarifs avec un préavis de <strong>30 jours</strong> par email.</p>
            <p><strong>Paiement :</strong> Les paiements sont traités exclusivement par Stripe. Les données bancaires ne transitent jamais par nos serveurs (certification PCI DSS niveau 1 de Stripe). En cas d'impayé, le service peut être suspendu après 5 jours.</p>
            <p><strong>Remboursement :</strong> Les abonnements mensuels ne sont pas remboursables au prorata. En cas de résiliation, l'accès reste actif jusqu'à la fin de la période payée.</p>
          </div>
        </section>

        {/* 4. Obligations coach */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">4. Obligations et responsabilités du Coach</h2>
          <div className="text-sm text-[#0D1F3C] leading-relaxed space-y-2">
            <p>Le Coach s'engage à :</p>
            <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-2 leading-relaxed">
              <li>Utiliser Evolya uniquement dans le cadre de son activité professionnelle de coaching</li>
              <li>Obtenir le consentement de ses membres avant de saisir leurs données personnelles sur la plateforme</li>
              <li>Informer ses membres de l'existence de la plateforme et de la présente politique de confidentialité</li>
              <li>Ne pas partager les liens d'accès de ses membres avec des tiers non autorisés</li>
              <li>Maintenir l'exactitude et la mise à jour des données de ses membres</li>
              <li>Respecter les droits RGPD de ses membres (accès, rectification, suppression) sur demande</li>
            </ul>
            <p className="text-[#64748B]">Le Coach agit en qualité de <strong>responsable de traitement</strong> pour les données de ses membres. Evolya agit comme sous-traitant (Art. 28 RGPD) pour ces données.</p>
          </div>
        </section>

        {/* 5. Utilisations interdites */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">5. Utilisations interdites</h2>
          <p className="text-sm text-[#0D1F3C] leading-relaxed">Il est strictement interdit d'utiliser Evolya pour :</p>
          <ul className="list-disc list-inside text-sm text-[#64748B] space-y-1 ml-2 leading-relaxed">
            <li>Toute activité illégale, frauduleuse ou contraire à l'ordre public</li>
            <li>Stocker ou partager des données sensibles (santé médicale, données biométriques, données génétiques) sans base légale appropriée</li>
            <li>Harceler, menacer ou nuire à quiconque</li>
            <li>Procéder à de l'ingénierie inverse, du scraping, ou tenter de contourner les mesures de sécurité</li>
            <li>Revendre, sous-licencier ou louer l'accès au service à des tiers</li>
            <li>Créer des comptes multiples pour contourner les limites d'abonnement</li>
            <li>Introduire des virus, malware ou codes malveillants</li>
          </ul>
        </section>

        {/* 6. Propriété du contenu */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">6. Propriété intellectuelle et contenu</h2>
          <div className="text-sm text-[#0D1F3C] leading-relaxed space-y-2">
            <p><strong>Contenu de l'utilisateur :</strong> Le Coach conserve l'intégralité des droits sur le contenu qu'il crée (notes de séances, programmes, messages). Evolya ne revendique aucun droit de propriété sur ce contenu.</p>
            <p><strong>Licence accordée à Evolya :</strong> En utilisant le service, le Coach accorde à Evolya une licence limitée, non exclusive, pour héberger, stocker et traiter le contenu uniquement dans le but de fournir le service. Evolya ne vend, ne loue ni ne cède le contenu des utilisateurs à des tiers.</p>
            <p><strong>Plateforme :</strong> Le code source, le design, les interfaces et la marque Evolya sont la propriété exclusive de Evolya. Toute reproduction ou réutilisation sans autorisation écrite est interdite.</p>
          </div>
        </section>

        {/* 7. Disponibilité */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">7. Disponibilité et maintenance</h2>
          <div className="text-sm text-[#0D1F3C] leading-relaxed space-y-2">
            <p>Evolya s'efforce de maintenir la disponibilité du service 24h/24 et 7j/7. Des interruptions peuvent survenir pour maintenance planifiée (préavis de 24h si possible) ou incidents imprévus (force majeure, pannes hébergeur).</p>
            <p>Evolya ne garantit pas une disponibilité de 100% et décline toute responsabilité pour les pertes indirectes liées à une indisponibilité du service. Aucun remboursement n'est accordé pour des interruptions inférieures à 24 heures consécutives.</p>
          </div>
        </section>

        {/* 8. Limitation de responsabilité */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">8. Limitation de responsabilité</h2>
          <div className="text-sm text-[#0D1F3C] leading-relaxed space-y-2">
            <p>Le service est fourni « tel quel » sans garantie explicite ou implicite. Dans les limites permises par la loi, Evolya ne saurait être tenu responsable de :</p>
            <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-2 leading-relaxed">
              <li>Pertes de données dues à une erreur de l'utilisateur</li>
              <li>Dommages indirects, manques à gagner ou pertes de clientèle</li>
              <li>Contenus erronés créés par le Coach et communiqués à ses membres</li>
              <li>Conséquences d'un usage du service non conforme aux présentes CGU</li>
            </ul>
            <p>La responsabilité totale de Evolya envers un Coach est plafonnée au montant des abonnements payés par ce Coach au cours des <strong>12 derniers mois</strong>.</p>
          </div>
        </section>

        {/* 9. Résiliation */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">9. Résiliation et suppression de compte</h2>
          <div className="text-sm text-[#0D1F3C] leading-relaxed space-y-2">
            <p><strong>Par le Coach :</strong> Le Coach peut résilier son abonnement à tout moment depuis ses paramètres ou en contactant Evolya. La résiliation prend effet à la fin de la période en cours.</p>
            <p><strong>Par Evolya :</strong> Evolya peut suspendre ou résilier un compte en cas de violation grave des CGU, avec notification immédiate. En cas de résiliation pour autre motif, un préavis de 30 jours est accordé.</p>
            <p><strong>Après résiliation :</strong></p>
            <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-2 leading-relaxed">
              <li>Le Coach peut exporter ses données avant la clôture effective</li>
              <li>Les données de compte sont supprimées dans un délai de 30 jours après la clôture</li>
              <li>Les données de facturation sont conservées 6 ans (obligation légale, Code de Commerce art. L110-1)</li>
              <li>Les logs de sécurité sont conservés 13 mois</li>
            </ul>
          </div>
        </section>

        {/* 10. Parrainage */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">10. Programme de parrainage</h2>
          <div className="text-sm text-[#0D1F3C] leading-relaxed space-y-2">
            <p>Evolya propose un programme de parrainage :</p>
            <ul className="list-disc list-inside text-[#64748B] space-y-1 ml-2 leading-relaxed">
              <li><strong>Parrain :</strong> reçoit <strong>1 mois offert</strong> sur son abonnement dès que son filleul souscrit à un abonnement payant. Le crédit est appliqué automatiquement via Stripe.</li>
              <li><strong>Filleul :</strong> bénéficie de <strong>7 jours d'essai supplémentaires</strong> (21 jours au total) à l'inscription avec un code de parrainage valide.</li>
            </ul>
            <p className="text-[#64748B]">Evolya se réserve le droit de modifier ou d'interrompre le programme de parrainage à tout moment avec un préavis de 14 jours.</p>
          </div>
        </section>

        {/* 11. Droit applicable */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">11. Droit applicable et règlement des litiges</h2>
          <div className="text-sm text-[#0D1F3C] leading-relaxed space-y-2">
            <p>Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'engagent à chercher une résolution amiable avant toute action judiciaire (délai de 30 jours de négociation).</p>
            <p>À défaut de résolution amiable, les litiges commerciaux relèvent de la compétence du Tribunal de Commerce compétent selon le siège de Evolya. Les consommateurs peuvent également saisir le médiateur de la consommation compétent.</p>
          </div>
        </section>

        {/* 12. Modification */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">12. Modification des CGU</h2>
          <p className="text-sm text-[#0D1F3C] leading-relaxed">
            Evolya se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs actifs seront notifiés par email au moins <strong>30 jours</strong> avant l'entrée en vigueur des modifications. La poursuite de l'utilisation du service après cette date vaut acceptation des nouvelles CGU.
          </p>
        </section>

        {/* Contact */}
        <section className="bg-[#F8FAFB] border border-[#E2E8F0] rounded-xl px-5 py-4 text-sm">
          <p className="font-medium text-[#0D1F3C] mb-1">Contact</p>
          <p className="text-[#64748B] leading-relaxed">Pour toute question relative aux présentes CGU : <a href="mailto:contact.evolya.pro@gmail.com" className="text-[#4E9B6F] hover:underline">contact.evolya.pro@gmail.com</a></p>
        </section>

        <div className="border-t border-[#E2E8F0] pt-6 flex flex-wrap gap-4 text-xs text-[#94A3B8]">
          <Link href="/" className="hover:text-[#4E9B6F]">Accueil</Link>
          <Link href="/mentions-legales" className="hover:text-[#4E9B6F]">Mentions légales</Link>
          <Link href="/politique-confidentialite" className="hover:text-[#4E9B6F]">Politique de confidentialité</Link>
        </div>
      </main>
    </div>
  )
}
