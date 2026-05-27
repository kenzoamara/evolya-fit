import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Evolyafit',
  description: 'Politique de confidentialité et protection des données personnelles de Evolyafit.',
}

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      <div className="border-b border-[#E2E8F0] bg-white px-6 py-4">
        <Link href="/" className="text-sm text-[#4E9B6F] hover:underline">← Retour à l'accueil</Link>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <div>
          <h1 className="text-3xl font-semibold text-[#0D1F3C] mb-2">Politique de confidentialité</h1>
          <p className="text-sm text-[#64748B]">Entrée en vigueur : avril 2026 — Version 1.0</p>
        </div>

        {/* Intro */}
        <section className="bg-[#F0F7F1] border border-[#C8D8CA] rounded-xl px-5 py-4 text-sm text-[#0D1F3C] leading-relaxed">
          Evolya s'engage à protéger la vie privée de ses utilisateurs. La présente politique explique quelles données nous collectons, pourquoi, comment nous les utilisons et les droits dont vous disposez, conformément au <strong>Règlement Général sur la Protection des Données (RGPD — UE 2016/679)</strong> et à la <strong>loi Informatique et Libertés (n° 78-17 du 6 janvier 1978)</strong>.
        </section>

        {/* 1. Responsable */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">1. Responsable du traitement</h2>
          <div className="text-sm text-[#0D1F3C] space-y-1 leading-relaxed">
            <p><strong>Dénomination :</strong> Evolyafit</p>
            <p><strong>Représentant légal :</strong> Kenzo Amara</p>
            <p><strong>Statut :</strong> Auto-entrepreneur / Micro-entreprise — France</p>
            <p><strong>Contact RGPD :</strong> <a href="mailto:contact.evolya.pro@gmail.com" className="text-[#4E9B6F] hover:underline">contact.evolya.pro@gmail.com</a></p>
            <p className="text-[#64748B] text-xs mt-2">Aucun Délégué à la Protection des Données (DPO) n'est désigné à ce stade (entreprise de moins de 250 salariés ne traitant pas de données sensibles à grande échelle). La CNIL sera notifiée en cas d'incident grave (Art. 33 RGPD).</p>
          </div>
        </section>

        {/* 2. Données collectées */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">2. Données collectées</h2>

          <div className="space-y-4 text-sm">
            <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
              <div className="bg-[#F8FAFB] px-4 py-2 font-semibold text-[#0D1F3C]">A. Données des coachs (utilisateurs B2B)</div>
              <div className="px-4 py-3 space-y-1 text-[#0D1F3C] leading-relaxed">
                <p>• Nom complet et adresse email (création de compte)</p>
                <p>• Mot de passe (haché via bcrypt par Supabase Auth — jamais stocké en clair)</p>
                <p>• Type de coaching sélectionné (fitness, yoga, musculation, etc.)</p>
                <p>• Informations d'abonnement (plan, date fin d'essai, statut)</p>
                <p>• Identifiants Stripe (customer_id, subscription_id — sans données bancaires directes)</p>
                <p>• Code de parrainage et historique de parrainage</p>
                <p>• Date de dernière activité (last_seen_at)</p>
                <p>• Tickets de support et messages associés</p>
              </div>
            </div>

            <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
              <div className="bg-[#F8FAFB] px-4 py-2 font-semibold text-[#0D1F3C]">B. Données des clients des coachs (utilisateurs finaux)</div>
              <div className="px-4 py-3 space-y-2 text-[#0D1F3C] leading-relaxed">
                <p className="font-medium text-[#64748B] text-xs uppercase tracking-wide pt-1">Identité</p>
                <p>• Prénom, nom et adresse email (optionnelle)</p>
                <p>• Date de naissance</p>
                <p>• Genre (homme / femme)</p>
                <p>• Jeton d&apos;accès magique (UUID, accès permanent) — pas de mot de passe requis</p>
                <p className="font-medium text-[#64748B] text-xs uppercase tracking-wide pt-2">Données physiques et de santé</p>
                <p>• Taille (cm) et poids (kg)</p>
                <p>• Mesures corporelles : cou, épaules, poitrine, biceps, avant-bras, taille, hanches, cuisses (cm)</p>
                <p>• Évolution du poids (saisies hebdomadaires)</p>
                <p>• Blessures, douleurs et contraintes physiques (champ libre)</p>
                <p>• Heures de sommeil moyennes et saisies quotidiennes</p>
                <p>• Performances sportives et records personnels</p>
                <p>• Calories journalières estimées et saisies quotidiennes</p>
                <p>• IMC calculé à partir de la taille et du poids</p>
                <p className="font-medium text-[#64748B] text-xs uppercase tracking-wide pt-2">Suivi de coaching</p>
                <p>• Objectif principal (perte de poids, performance, etc.)</p>
                <p>• Niveau d&apos;activité physique</p>
                <p>• Habitudes alimentaires (intolérances, régimes, restrictions)</p>
                <p>• Réponses aux check-ins hebdomadaires (questions libres + score d&apos;énergie 1-10)</p>
                <p>• Objectifs de coaching (titre, statut, date cible)</p>
                <p>• Notes de séances (contenu rédigé par le coach)</p>
                <p>• Notes personnelles du client</p>
                <p>• Date et heure du consentement à la présente politique</p>
              </div>
            </div>

            <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
              <div className="bg-[#F8FAFB] px-4 py-2 font-semibold text-[#0D1F3C]">C. Données techniques</div>
              <div className="px-4 py-3 space-y-1 text-[#0D1F3C] leading-relaxed">
                <p>• Logs d'audit (actions INSERT/UPDATE/DELETE sur les données clés)</p>
                <p>• Logs d'envoi d'emails (type, destinataire, date)</p>
                <p>• Événements Stripe (type, montant, statut)</p>
                <p>• Jetons de session (supprimés automatiquement à expiration)</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              <strong>Données relatives à la santé (Art. 9 RGPD) :</strong> Certaines données collectées (blessures, poids, mesures corporelles, sommeil) peuvent être qualifiées de données relatives à la santé au sens du RGPD. Ces données sont traitées exclusivement dans le cadre contractuel du suivi de coaching sportif, sur la base du <strong>consentement explicite de la personne concernée</strong> (Art. 9.2.a RGPD), recueilli lors de l&apos;onboarding. Elles ne sont jamais partagées avec des tiers à des fins commerciales ou médicales.
            </div>
          </div>
        </section>

        {/* 3. Bases légales */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">3. Bases légales des traitements (Art. 6 RGPD)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-[#E2E8F0] rounded-lg overflow-hidden">
              <thead className="bg-[#F8FAFB]">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#64748B] uppercase">Données</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#64748B] uppercase">Base légale</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#64748B] uppercase">Durée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                <tr><td className="px-3 py-2">Compte coach (nom, email)</td><td className="px-3 py-2">Contrat (Art. 6.1.b)</td><td className="px-3 py-2">Durée du contrat + 3 ans</td></tr>
                <tr><td className="px-3 py-2">Données de coaching client</td><td className="px-3 py-2">Contrat (Art. 6.1.b)</td><td className="px-3 py-2">Durée du suivi + 1 an</td></tr>
                <tr><td className="px-3 py-2">Paiements Stripe</td><td className="px-3 py-2">Contrat + Obligation légale (Art. 6.1.b + 6.1.c)</td><td className="px-3 py-2">6 ans (Code de Commerce)</td></tr>
                <tr><td className="px-3 py-2">Logs d'audit sécurité</td><td className="px-3 py-2">Intérêt légitime (Art. 6.1.f)</td><td className="px-3 py-2">13 mois (purge automatique)</td></tr>
                <tr><td className="px-3 py-2">Événements Stripe</td><td className="px-3 py-2">Obligation légale (Art. 6.1.c)</td><td className="px-3 py-2">6 ans (Code de Commerce)</td></tr>
                <tr><td className="px-3 py-2">Emails transactionnels</td><td className="px-3 py-2">Intérêt légitime (Art. 6.1.f)</td><td className="px-3 py-2">Durée du service</td></tr>
                <tr><td className="px-3 py-2">Consentement marketing</td><td className="px-3 py-2">Consentement (Art. 6.1.a)</td><td className="px-3 py-2">Jusqu'au retrait du consentement</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Sous-traitants */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">4. Sous-traitants et transferts internationaux</h2>
          <p className="text-sm text-[#64748B] leading-relaxed">Les sous-traitants suivants peuvent être amenés à traiter vos données dans le cadre de la fourniture du service. Chaque contrat inclut des Clauses Contractuelles Types (SCC) de la Commission Européenne pour les transferts hors UE.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-[#E2E8F0] rounded-lg overflow-hidden">
              <thead className="bg-[#F8FAFB]">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#64748B] uppercase">Prestataire</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#64748B] uppercase">Rôle</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#64748B] uppercase">Localisation</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#64748B] uppercase">Mécanisme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                <tr>
                  <td className="px-3 py-2 font-medium">Supabase Inc.</td>
                  <td className="px-3 py-2">Base de données, Auth</td>
                  <td className="px-3 py-2">UE (eu-west)</td>
                  <td className="px-3 py-2">Accord DPA (données UE)</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Vercel Inc.</td>
                  <td className="px-3 py-2">Hébergement app & API</td>
                  <td className="px-3 py-2">États-Unis</td>
                  <td className="px-3 py-2">SCC — Décision 2021/914/UE</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Stripe Inc.</td>
                  <td className="px-3 py-2">Paiement en ligne</td>
                  <td className="px-3 py-2">États-Unis / Irlande</td>
                  <td className="px-3 py-2">SCC + Adequacy Ireland (DPA signé)</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Resend Inc.</td>
                  <td className="px-3 py-2">Emails transactionnels</td>
                  <td className="px-3 py-2">États-Unis</td>
                  <td className="px-3 py-2">SCC — Décision 2021/914/UE</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">OpenAI Inc.</td>
                  <td className="px-3 py-2">Génération de programmes d'entraînement (IA)</td>
                  <td className="px-3 py-2">États-Unis</td>
                  <td className="px-3 py-2">SCC + Data Processing Addendum (API)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-[#64748B] leading-relaxed">
            Les données de carte bancaire ne sont <strong>jamais stockées sur nos serveurs</strong>. Seuls les identifiants Stripe (customer_id, subscription_id) sont conservés. Le traitement des paiements est entièrement délégué à Stripe, certifié PCI DSS niveau 1.
          </p>
        </section>

        {/* 5. Vos droits */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">5. Vos droits (Art. 12–22 RGPD)</h2>
          <p className="text-sm text-[#64748B] leading-relaxed">Vous disposez des droits suivants sur vos données personnelles. Pour les exercer, écrivez à <a href="mailto:contact.evolya.pro@gmail.com" className="text-[#4E9B6F] hover:underline">contact.evolya.pro@gmail.com</a>. Nous vous répondrons dans un délai maximum de <strong>30 jours</strong>.</p>

          <div className="grid gap-3">
            {[
              { droit: "Droit d'accès (Art. 15)", desc: "Obtenir une copie de toutes vos données personnelles que nous détenons, dans un format structuré (JSON ou CSV)." },
              { droit: "Droit de rectification (Art. 16)", desc: "Corriger toute donnée inexacte ou incomplète vous concernant (modifiable directement dans vos paramètres de compte)." },
              { droit: "Droit à l'effacement (Art. 17)", desc: "Demander la suppression définitive de vos données. Délai d'exécution : 30 jours. Exceptions légales : données de facturation (6 ans), logs de sécurité (13 mois)." },
              { droit: "Droit à la limitation (Art. 18)", desc: "Suspendre le traitement de vos données en cas de contestation d'exactitude ou traitement illicite." },
              { droit: "Droit à la portabilité (Art. 20)", desc: "Récupérer vos données dans un format exploitable pour les transférer à un autre service." },
              { droit: "Droit d'opposition (Art. 21)", desc: "Vous opposer au traitement de vos données fondé sur l'intérêt légitime (notamment emails de rappel)." },
            ].map(r => (
              <div key={r.droit} className="border border-[#E2E8F0] rounded-lg px-4 py-3 text-sm">
                <p className="font-medium text-[#0D1F3C]">{r.droit}</p>
                <p className="text-[#64748B] mt-0.5 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#F1F5F9] rounded-lg px-4 py-3 text-sm text-[#64748B] leading-relaxed">
            <strong>Réclamation auprès de la CNIL :</strong> Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) : <a href="https://www.cnil.fr" className="text-[#4E9B6F] hover:underline" target="_blank" rel="noopener noreferrer">www.cnil.fr</a> — 3 Place de Fontenoy, 75007 Paris.
          </div>
        </section>

        {/* 6. Sécurité */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">6. Sécurité des données</h2>
          <div className="text-sm text-[#0D1F3C] leading-relaxed space-y-2">
            <p>Evolya met en œuvre les mesures techniques et organisationnelles suivantes pour protéger vos données :</p>
            <ul className="list-disc list-inside space-y-1 text-[#64748B] ml-2">
              <li>Chiffrement en transit : TLS 1.3 (HTTPS obligatoire)</li>
              <li>Chiffrement au repos : AES-256 (base de données Supabase)</li>
              <li>Mots de passe : hachage bcrypt (jamais stockés en clair)</li>
              <li>Accès restreints par politique RLS (Row Level Security) au niveau base de données</li>
              <li>Jetons d'accès client à durée limitée (expiration automatique)</li>
              <li>Clés API isolées par environnement (production / développement)</li>
            </ul>
            <p className="text-[#64748B]">En cas de violation de données susceptible d'engendrer un risque pour vos droits et libertés, Evolya s'engage à notifier la CNIL dans un délai de <strong>72 heures</strong> (Art. 33 RGPD) et les personnes concernées dans les meilleurs délais.</p>
          </div>
        </section>

        {/* 7. Violation de données */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">7. Procédure en cas de violation de données (Art. 33–34 RGPD)</h2>
          <p className="text-sm text-[#64748B] leading-relaxed">
            En cas de violation de sécurité susceptible d'engendrer un risque pour les droits et libertés des personnes, Evolya s'engage à respecter la procédure suivante :
          </p>
          <div className="space-y-2">
            {[
              { step: '1', title: 'Détection et qualification (H+0 à H+4)', desc: "Identification de la nature et de l'étendue de la violation. Classification du risque (faible / moyen / élevé)." },
              { step: '2', title: 'Notification CNIL (H+72 max)', desc: "Si le risque est avéré, déclaration sur le portail CNIL (notifications.cnil.fr) dans un délai de 72 heures (Art. 33 RGPD). Contenu : nature de la violation, catégories et nombre approximatif de personnes concernées, mesures prises." },
              { step: '3', title: 'Notification des personnes concernées (sans délai inutile)', desc: "Si le risque est élevé, email individuel à chaque utilisateur concerné décrivant : la nature de la violation, les données exposées, les mesures correctives prises et les recommandations de protection." },
              { step: '4', title: 'Documentation interne', desc: "Consignation de l'incident dans le registre de violations avec : date, description, mesures correctives, notifications effectuées (Art. 33.5 RGPD)." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3 border border-[#E2E8F0] rounded-lg px-4 py-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 bg-[#0D1F3C] text-white rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5">{step}</span>
                <div>
                  <p className="font-medium text-[#0D1F3C]">{title}</p>
                  <p className="text-[#64748B] mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-[#64748B] leading-relaxed">
            Contact urgence sécurité : <a href="mailto:contact.evolya.pro@gmail.com" className="text-[#4E9B6F] hover:underline">contact.evolya.pro@gmail.com</a> — mentionnez « VIOLATION DONNÉES » en objet.
          </p>
        </section>

        {/* 8. Cookies */}
        <section id="cookies" className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">8. Cookies</h2>
          <p className="text-sm text-[#0D1F3C] leading-relaxed">
            Evolya n'utilise que des cookies strictement nécessaires au fonctionnement du service :
          </p>
          <ul className="list-disc list-inside text-sm text-[#64748B] space-y-1 ml-2 leading-relaxed">
            <li><strong>sb-access-token</strong> : jeton d'authentification Supabase — durée de session</li>
            <li><strong>sb-refresh-token</strong> : renouvellement de session — 7 jours</li>
          </ul>
          <p className="text-sm text-[#64748B] leading-relaxed">
            Aucun cookie publicitaire, de tracking ou analytique tiers n'est déposé. Aucune donnée n'est partagée avec Google Analytics, Facebook, ou toute autre régie publicitaire.
          </p>
        </section>

        {/* 9. Modification */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0D1F3C] border-b border-[#E2E8F0] pb-2">9. Modification de la présente politique</h2>
          <p className="text-sm text-[#0D1F3C] leading-relaxed">
            Evolya se réserve le droit de modifier la présente politique à tout moment. Les utilisateurs actifs seront notifiés par email au moins <strong>14 jours</strong> avant l'entrée en vigueur des modifications substantielles. La poursuite de l'utilisation du service vaut acceptation de la nouvelle politique.
          </p>
        </section>

        <div className="border-t border-[#E2E8F0] pt-6 flex flex-wrap gap-4 text-xs text-[#94A3B8]">
          <Link href="/" className="hover:text-[#4E9B6F]">Accueil</Link>
          <Link href="/mentions-legales" className="hover:text-[#4E9B6F]">Mentions légales</Link>
          <Link href="/cgu" className="hover:text-[#4E9B6F]">CGU</Link>
        </div>
      </main>
    </div>
  )
}
