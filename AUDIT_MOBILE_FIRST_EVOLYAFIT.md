# AUDIT MOBILE-FIRST — EVOLYA'FIT
### Due diligence produit · UX mobile · Frontend engineering · CRO

> Audit externe sévère. Objectif : niveau Stripe / Linear / Notion / Airbnb.
> Périmètre réellement analysé : `app/` (≈60 pages + ≈100 routes API), `components/` (≈80 composants), `hooks/`, `lib/`, `globals.css`, `tailwind.config.ts`, layouts, navigation, manifest, config Capacitor/Next.
> Stack : Next.js 14 (App Router) · React 18 · Supabase · Tailwind · shadcn/Base UI/Radix · FullCalendar · Framer Motion · **Capacitor (app iOS/Android)** · Stripe.
> Posture : aucune hypothèse de conformité. Tout est suspect jusqu'à preuve du contraire.

---

## 0. SYNTHÈSE EXÉCUTIVE (à lire en premier)

**Verdict : l'application n'est PAS mobile-first. Elle est desktop-first habillée de quelques adaptations mobiles, packagée en app native via Capacitor sans aucune des garanties qu'un wrapper natif impose (safe-area, status bar, viewport dynamique).**

Les 10 défauts structurels qui plombent toute l'expérience mobile :

1. **Bug confirmé du header fixe** — le layout coach est en `flex` (row) et place le « spacer » de 48 px comme *frère en ligne* de `<main>`, pas dans le flux vertical. Le contenu passe **sous** la barre fixe `top-0 h-12`. (= le problème que vous aviez déjà identifié, reproduit dans le code).
2. **Zéro gestion de `safe-area-inset-top`** dans tout le codebase. Sous Capacitor (`viewportFit: cover` + `statusBarStyle: 'default'`), la barre coach et tous les contenus passent **sous le notch / la status bar iOS**.
3. **Le coach n'a AUCUNE navigation par le pouce sur mobile** : uniquement un hamburger en **haut à gauche** (zone la moins atteignable) ouvrant un drawer. Chaque navigation = 2 taps + un drawer. À l'opposé total de Linear/Stripe mobile.
4. **Polices : 8 familles Google Fonts** chargées (Inter, Barlow, Barlow Condensed, Poppins, Montserrat, Raleway, Anton, Playfair) avec multiples graisses → charge réseau massive sur mobile.
5. **Cibles tactiles sous le minimum** partout : boutons `h-8` (32 px), `h-7` (28 px), icônes `size-6` (24 px), nav coach `h-12`. Apple HIG = 44 px, Material = 48 dp.
6. **Zoom automatique iOS au focus** : la quasi-totalité des champs sont en `text-sm` (13,5 px) ou `text-base` (15 px) — sous le seuil de 16 px → iOS Safari/WKWebView zoome à chaque focus de champ.
7. **Icônes = emojis** dans toute la navigation et les titres (`🏠 Mes membres`, sidebar `📋 🦾 📅`, nav client) → rendu incohérent iOS/Android, impossible à teinter, anti-premium.
8. **Création de programmes inutilisable au doigt** : réorganisation et glisser-déposer reposent sur le **HTML5 drag-and-drop**, sans aucun fallback tactile → cassé sur mobile.
9. **Actions clés inaccessibles sur mobile** : sur la page Membres, « Lien / Nom / Supprimer » sont en `hidden sm:flex` + `opacity-0 group-hover` → impossibles à déclencher au doigt.
10. **Aucun `loading.tsx`** (zéro squelette de route) + métriques d'engagement client (**série, progression**) stockées **uniquement en `localStorage`** → écrans figés à la navigation, données perdues au changement d'appareil, invisibles pour le coach.

**Décompte : 168 problèmes** (32 CRITIQUE · 54 ÉLEVÉ · 58 MOYEN · 24 FAIBLE) + **57 améliorations**.

---

## 1. LISTE DES PROBLÈMES (168)

> Gravité : 🔴 CRITIQUE · 🟠 ÉLEVÉ · 🟡 MOYEN · ⚪ FAIBLE
> « Impact business » mappé sur vos objectifs : rétention, abandons, friction, tickets support, usage mobile, perception premium.

### A. Fondations globales (config, CSS, viewport, polices)

| ID | Grav. | Page / Fichier | Problème | Impact utilisateur | Impact business |
|----|-------|----------------|----------|--------------------|-----------------|
| P001 | 🔴 | `globals.css`, layouts | Aucune utilisation de `env(safe-area-inset-top)`. Aucun contenu ni barre n'évite le notch/status bar iOS. | Logo, hamburger et titres passent sous l'heure/batterie iOS en app Capacitor. | Perçu « pas natif », tickets « interface coupée en haut ». |
| P002 | 🔴 | `app/layout.tsx` | `viewportFit: 'cover'` activé MAIS aucun padding safe-area en contrepartie → le `cover` expose les zones non sûres sans les compenser. | Contenu sous notch/home indicator. | Abandons onboarding mobile. |
| P003 | 🔴 | `app/layout.tsx` | **8 familles Google Fonts** (Inter, Barlow, Barlow Condensed, Poppins, Montserrat, Raleway, Anton, Playfair), 4 graisses chacune. | Téléchargement de dizaines de fichiers de police, FOUT, premier rendu lent en 4G. | Bounce, mauvais LCP, coût data utilisateur. |
| P004 | 🟠 | `app/layout.tsx` | Conflit `theme-color` : `viewport.themeColor:'#ffffff'` + `<meta theme-color #4E9B6F>` dans `<head>`. | Couleur de barre système incohérente. | Incohérence de marque. |
| P005 | 🟠 | `app/layout.tsx` | `appleWebApp.statusBarStyle:'default'` avec `viewportFit:cover` → status bar transparente superposée sans réservation d'espace. | Header masqué par la status bar iOS. | Cf. P001 (cause racine du bug signalé sur iOS). |
| P006 | 🟠 | `app/layout.tsx` | `<Toaster position="bottom-right">` global **+** `<Toaster position="top-right">` dans le layout coach = 2 toasters montés. | Toasts dupliqués / positions incohérentes selon la page. | Confusion, perception bug. |
| P007 | 🟡 | `app/layout.tsx` | Toaster global `bottom-right` : sur mobile, recouvert par la bottom-nav client (60 px) et le bouton push flottant. | Notifications de succès/erreur masquées. | Actions « invisibles », tickets « ça n'a pas marché ». |
| P008 | 🟠 | `globals.css` | `html { overflow-x: hidden; max-width: 100vw }` : `100vw` inclut la scrollbar (desktop) et `overflow-x:hidden` peut casser `position:sticky` des enfants. | Sauts horizontaux, sticky qui ne colle pas. | Perception de bug. |
| P009 | 🟠 | `globals.css` | `html { scroll-behavior: smooth }` global + aucune gestion de scroll-restoration. | Retour arrière repart en haut / scroll « élastique » non désiré. | Perte de contexte, friction. |
| P010 | 🔴 | `globals.css` | **Dark mode entièrement géré par `!important` sur classes hex arbitraires** (`.dark .bg-[#FAFBFE]`, etc.). Toute couleur non listée reste claire. | Zones blanches « cassées » en dark mode (texte blanc sur blanc). | Inutilisable en dark, tickets, abandons. |
| P011 | 🟡 | `tailwind.config.ts` / `globals.css` | `darkMode:["class"]` mais `<body>` force `bg-[#F8FAFB] text-[#0D1F3C]` en dur (classes arbitraires, pas tokens). | Le body ne suit pas le thème proprement. | Cf. P010. |
| P012 | 🟡 | `tailwind.config.ts` | Échelle typographique : `base = 15px`, `sm = 13.5px`. Toute UI en `text-sm`/`text-base` sur champ = < 16 px. | Déclenche le zoom iOS (cf. P031). | Friction de saisie majeure. |
| P013 | 🟡 | `globals.css` | `* { touch-action: manipulation }` appliqué à **tous** les éléments, y compris conteneurs de scroll/sliders. | Peut gêner gestes natifs sur certains widgets. | Micro-friction tactile. |
| P014 | 🟡 | `globals.css` | `button,[role=button],a,label { user-select:none }` global → impossible de sélectionner/copier un lien d'invitation rendu dans un `<a>`/label. | Le coach ne peut pas sélectionner le texte d'un lien. | Friction de partage. |
| P015 | 🟡 | `app/layout.tsx` | Service worker enregistré inline mais `public/sw.js` = 39 lignes (pas de stratégie offline réelle). | Pas de résilience hors-ligne en app mobile. | Échecs en métro/zone blanche. |
| P016 | ⚪ | `public/manifest.json` | Icônes 192/512 toutes deux `purpose:"any maskable"` sans zone de sécurité. | Logo rogné par le masque Android (cercle/squircle). | Icône d'app dégradée = perception. |
| P017 | ⚪ | `public/manifest.json` | BOM en tête de fichier + une seule source d'icône pour toutes tailles. | Risque de parsing, icônes pixelisées. | Mineur. |
| P018 | 🟡 | `next.config.mjs` | `Permissions-Policy: camera=(), microphone=()` bloque tout usage caméra → toute future capture photo de progression (selfie avant/après) impossible sans modif. | Fonctionnalité rétention bloquée par défaut. | Frein produit. |
| P019 | 🟡 | global | `100vh`/`h-screen`/`min-h-screen` utilisés ~33× sans `dvh`/`svh`. | Sur mobile, la barre d'URL fausse la hauteur → contenu coupé / sauts au scroll. | Friction, perception bug. |
| P020 | ⚪ | `capacitor.config.ts` | `webDir:'out'` mais l'app charge `server.url` distant (webview pure). Aucune ressource embarquée. | App = simple webview ; dépend à 100 % du réseau au lancement. | Lancement lent/échec hors-ligne, risque App Store (4.2 « min. functionality »). |

### B. Navigation coach

| ID | Grav. | Page / Fichier | Problème | Impact utilisateur | Impact business |
|----|-------|----------------|----------|--------------------|-----------------|
| P021 | 🔴 | `components/coach/sidebar.tsx` | **Aucune bottom-nav coach sur mobile.** Navigation uniquement via hamburger top-left → drawer. | 2 taps + drawer pour chaque écran ; zone top-left inatteignable au pouce. | Friction massive, baisse d'usage mobile coach. |
| P022 | 🔴 | `(coach)/layout.tsx` + `sidebar.tsx` | Le « spacer » `<div className="md:hidden h-12">` est frère **en ligne** de `<main>` (conteneur `flex` row) → ne pousse PAS le contenu vers le bas. | **Le titre/1ers éléments passent sous la barre fixe.** (bug que vous aviez repéré). | Tickets support, impression d'inachevé. |
| P023 | 🟠 | `sidebar.tsx` | Barre mobile `h-12` (48 px) sans `safe-area-inset-top` → sous le notch (cf. P001). | Hamburger/logo sous la status bar. | Perception « pas fini ». |
| P024 | 🟠 | `sidebar.tsx` | Icônes de nav = **emojis** (`🏠 👥 📋 🦾 📅 💬 📊 📈 🧮 🎨 ✨ ⚙️`) ; `emojiColor` inefficace (emoji = multicolore figé sur iOS). | Rendu hétérogène iOS/Android, non premium. | Image de marque amateur. |
| P025 | 🟠 | `components/shared/coach-nav.tsx` | **Composant `CoachNav` entièrement mort** (jamais importé) — 2e implémentation de nav coach + 2e MobileTopBar `h-12`. | — (dette) | Risque de régression, maintenance, divergence. |
| P026 | 🟡 | `sidebar.tsx` | Drawer mobile largeur `w-[300px] max-w-[86vw]` ; groupes repliables par défaut ouverts → liste longue, beaucoup de scroll dans le drawer. | Navigation lente. | Friction. |
| P027 | 🟡 | `sidebar.tsx` | Le drawer n'a pas de `safe-area-inset-bottom` ; le dernier item/essai peut toucher le home indicator. | Tap raté en bas du drawer. | Friction. |
| P028 | 🟡 | `sidebar.tsx` | Pas de focus-trap ni `aria-modal`/`role="dialog"` sur le drawer ; pas de fermeture par `Esc`. | Accessibilité clavier/lecteur d'écran nulle. | Risque conformité, exclusion. |
| P029 | 🟡 | `sidebar.tsx` | Ouverture du drawer ne verrouille pas le scroll du `body`. | Le fond défile derrière le menu. | Perception bug. |
| P030 | ⚪ | `sidebar.tsx` | Badge messages `> 9 → "9+"` dans la sidebar mais le coach n'a pas de point d'entrée messages en bottom-nav (cf. P021). | Notif peu visible sur mobile. | Réactivité coach réduite. |

### C. Navigation client

| ID | Grav. | Page / Fichier | Problème | Impact utilisateur | Impact business |
|----|-------|----------------|----------|--------------------|-----------------|
| P031 | 🟠 | `components/shared/client-nav.tsx` | Toute la navigation client repose sur des **emojis** comme icônes + le bouton « Plus » affiche `···` / `●●●`. | Rendu incohérent, « Plus » cryptique, non premium. | Perception, confiance. |
| P032 | 🟡 | `client-nav.tsx` | 4 onglets fixes + « Plus » qui ouvre une grille de **15 items** répartis en 4 sections. | Navigation profonde, charge cognitive élevée. | Friction, sous-utilisation des fonctions. |
| P033 | 🟡 | `client-nav.tsx` | Items du sheet « Plus » : libellés tronqués (`Entraîn.`, `Vue ensemble`), 3 colonnes serrées en 320 px. | Lisibilité faible. | Friction. |
| P034 | 🟡 | `client-nav.tsx` | Onglet actif déterminé par `pathname.startsWith(href.split('?')[0])` → `/programme` matche aussi `/progression` ? Non, mais `/c/x/p…` collisions possibles entre préfixes. | Onglet actif erroné selon route. | Perte de repère. |
| P035 | 🟡 | `client-nav.tsx` | `isMoreActive = !mainTabs.some(isActive)` → quand on est sur Nutrition/Habitudes/Agenda, c'est « Plus » qui s'allume, pas l'item réel. | L'utilisateur ne sait pas où il est. | Perte de contexte (objectif business explicite). |
| P036 | 🟡 | `client-nav.tsx` | Sheet « Plus » : pas de focus-trap, pas de verrouillage scroll body, fermeture seulement via backdrop/✕. | A11y + scroll fantôme. | Friction, conformité. |
| P037 | ⚪ | `client-nav.tsx` | Avatar coach `coachName[0]` plante visuellement si `coachName` vide (fallback « Votre coach » géré côté layout, mais `[0]` sur chaîne vide = vide). | Pastille vide. | Mineur. |
| P038 | 🟡 | `(c)/[token]/layout.tsx` | Bouton push flottant `fixed bottom-[80px] right-4 z-40` superposé au contenu, sans label, au-dessus de la bottom-nav. | Masque du contenu, rôle obscur. | Friction, ignoré. |

### D. Layouts & structure de page

| ID | Grav. | Page / Fichier | Problème | Impact utilisateur | Impact business |
|----|-------|----------------|----------|--------------------|-----------------|
| P039 | 🟠 | `(coach)/layout.tsx` | Layout `flex` (row) + `<main>` `md:overflow-y-auto` : sur mobile c'est le `body` qui scrolle, mais la barre est `fixed` → pas de conteneur de scroll dédié, d'où le besoin (raté) de spacer. | Architecture de scroll fragile (cf. P022). | Bug header, sauts. |
| P040 | 🟡 | `(coach)/layout.tsx` | Couleurs de marque injectées via `style` inline avec `color-mix(... white)` — pas de fallback si `color-mix` indispo (vieux WebView Android). | Variables CSS vides → éléments invisibles. | Casse sur Android anciens. |
| P041 | 🟡 | `(c)/[token]/layout.tsx` | `.client-content-area` n'apporte qu'un `padding-bottom`. Aucune réserve `padding-top` : si une page client ajoute un header sticky, même bug que coach. | Risque de masquage en haut. | Cohérence du bug P022 côté client. |
| P042 | 🟡 | `(c)/[token]/layout.tsx` | `await` séquentiel : `update last_seen` puis `Promise.all` profil — un `update` bloquant à chaque chargement de page client. | Latence ajoutée à chaque navigation client. | Lenteur perçue. |
| P043 | 🟡 | `components/coach/page-header.tsx` | `PageHeader` en `px-6 py-5` non responsive (24 px même en 320 px) ; `action` en `ml-4 shrink-0`. | Titres + bouton serrés/coupés sur petit écran. | Débordement, friction. |
| P044 | 🟡 | global | Chaque page définit son propre header inline (pas de composant unifié) → paddings, tailles de titre et gestion mobile divergents d'une page à l'autre. | Incohérence visuelle inter-pages. | Perception « patchwork ». |

### E. Primitives UI & cibles tactiles

| ID | Grav. | Page / Fichier | Problème | Impact utilisateur | Impact business |
|----|-------|----------------|----------|--------------------|-----------------|
| P045 | 🔴 | `components/ui/button.tsx` | `default h-8` (32px), `sm h-7` (28), `xs h-6` (24), `icon size-8`, `icon-xs size-6`. **Tous < 44px.** | Erreurs de tap, frustration. | Friction, tickets, abandons mobile. |
| P046 | 🔴 | `components/ui/input.tsx` | `Input` = `h-8` + `text-base` (15px < 16). | Champ court + zoom iOS au focus. | Friction de saisie majeure. |
| P047 | 🔴 | `components/ui/textarea.tsx` | `Textarea text-base` (15px). | Zoom iOS au focus. | Friction (messages, notes). |
| P048 | 🟠 | `components/ui/select.tsx` | `SelectTrigger h-8`, `w-fit` (pas pleine largeur), zone tactile 32px. | Selects étroits/inégaux, dur à taper. | Friction formulaires. |
| P049 | 🔴 | `components/ui/dialog.tsx` | `DialogContent` **sans `max-height` ni `overflow` interne** + centré `-translate-y-1/2`. | Modale haute (formulaire) coupée en haut/bas, non scrollable. | Champs/valider inaccessibles → abandon. |
| P050 | 🟠 | `components/ui/dialog.tsx` | Backdrop `bg-black/10` (10 %) + `backdrop-blur-xs`. | Séparation modale/fond quasi nulle sur fond clair. | Confusion, perception cheap. |
| P051 | 🟠 | `components/ui/dialog.tsx` | Modale centrée non transformée en bottom-sheet sur mobile. Avec clavier ouvert, le bouton de validation est poussé hors écran. | Soumission impossible clavier ouvert. | Abandon de formulaire. |
| P052 | 🟡 | `components/ui/button.tsx` | `active:not-aria-[haspopup]:translate-y-px` = seul retour tactile (1px). Pas d'état `:active` visible franc sur mobile (pas de hover). | Feedback de tap faible. | Sensation peu réactive. |
| P053 | 🟡 | `components/ui/dialog.tsx` | `DialogFooter` en `flex-col-reverse` sur mobile : l'action primaire se retrouve **en bas** mais l'ordre visuel inversé peut placer « Annuler » sous le pouce. | Risque d'erreur de tap. | Friction. |
| P054 | 🟡 | `components/ui/*` | Primitives shadcn/Base UI desktop laissées telles quelles, peu utilisées (le code privilégie des classes `.ev-*`/inline) → double système de design. | Incohérences de tailles/états. | Dette, incohérence. |

### F. Modales / sheets / overlays (implémentations maison)

| ID | Grav. | Page / Fichier | Problème | Impact utilisateur | Impact business |
|----|-------|----------------|----------|--------------------|-----------------|
| P055 | 🟠 | `clients-content.tsx` (×3 modales) | Modales custom `fixed inset-0 items-center` : pas de focus-trap, pas de `Esc`, **pas de verrouillage du scroll body**. | Fond défile derrière, a11y nulle. | Friction, conformité. |
| P056 | 🟠 | `clients-content.tsx` | Modale « Ajouter membre » centrée → clavier mobile recouvre les champs/CTA. | Saisie email/nom à l'aveugle. | Abandon ajout membre. |
| P057 | 🟡 | `clients-content.tsx` | 3 modales **toujours montées** dans le DOM (toggle opacité) → markup permanent. | Léger surcoût, pièges focus (éléments focusables cachés). | A11y, perf. |
| P058 | 🟡 | divers | Pas de pattern modale unifié : `clients` (centré), `agenda` (sheet `items-end sm:items-center`), `programme` (sheet). | Comportements de fermeture/animation incohérents. | Apprentissage, perception. |
| P059 | 🟡 | global | Boutons de fermeture « ✕ » en `w-7 h-7` / `text-xl` (≈28px) — sous 44px, souvent en coin haut-droit (atteignable) mais petit. | Fermeture difficile. | Friction. |

### G. Membres (page critique)

| ID | Grav. | Page / Fichier | Problème | Impact utilisateur | Impact business |
|----|-------|----------------|----------|--------------------|-----------------|
| P060 | 🔴 | `clients-content.tsx:487` | Actions **Lien / Nom / Supprimer** en `hidden sm:flex` + `opacity-0 group-hover` → **inaccessibles sur mobile** (pas de hover tactile, masquées < sm). | Impossible de renvoyer un lien, renommer, supprimer au téléphone. | Tickets, gestion bloquée, abandon. |
| P061 | 🟠 | `clients-content.tsx:601` | Texte cassé : bouton « **Créer l'membre →** » (remplacement client→membre raté). | Faute visible dans le CTA principal. | Perte de crédibilité. |
| P062 | 🟠 | `clients-content.tsx:260` | Titre H1 « **👥 Mes membres** » (emoji dans le titre de page). | Non premium. | Image de marque. |
| P063 | 🟠 | `clients-content.tsx:258-311` | Header `flex justify-between` sans `flex-wrap` : titre+barre de progression + « Partager mon lien » + « Ajouter » sur une ligne. | Débordement/écrasement en 320–375px. | Header cassé, friction. |
| P064 | 🟠 | `clients-content.tsx` | Tous les champs de recherche/formulaire en `text-sm` (13,5px). | Zoom iOS au focus (cf. P031/P046). | Friction de saisie. |
| P065 | 🟡 | `clients-content.tsx:401` | « Passez au plan **superieur** » (accent manquant) + mélange **tu/vous** (« Invite ton premier membre » vs « Il vous reste »). | Incohérence de ton, fautes. | Perception qualité FR. |
| P066 | 🟡 | `clients-content.tsx:361-368` | Boutons « Refuser/Valider » des demandes en `px-3 py-2 text-xs` (~30px). | Cibles tactiles trop petites. | Erreurs de validation. |
| P067 | 🟡 | `clients-content.tsx` | Liste membres `grid-cols-1 xl:grid-cols-2` : 1 colonne jusqu'à 1280px (ok mobile) mais carte = `Link` englobant avec actions imbriquées → conflits de tap. | Tap accidentel sur la carte vs action. | Friction. |
| P068 | 🟡 | `clients-content.tsx` | Recherche sans debounce ni résultat « aucun » distinct du « aucun membre » côté UI mobile ; filtre uniquement nom/email. | Recherche limitée. | Friction sur gros portefeuilles. |
| P069 | ⚪ | `clients-content.tsx:357` | Email interne `@evolya.internal` filtré en « Sans email » — fuite potentielle du domaine interne ailleurs. | — | Mineur. |
| P070 | 🟡 | `clients-content.tsx` | Lien d'invitation affiché en `font-mono truncate` sans bouton « copier » à côté du champ (copie seulement via bouton séparé). | Copie peu évidente sur mobile. | Friction d'onboarding client. |

### H. Calendrier / Agenda (page critique)

| ID | Grav. | Page / Fichier | Problème | Impact utilisateur | Impact business |
|----|-------|----------------|----------|--------------------|-----------------|
| P071 | 🔴 | `agenda-content.tsx:34` | **Mois sans accents** : `MONTHS_FR = ['…','Fevrier','…','Aout','…','Decembre']` affichés en titre (« Fevrier 2026 »). | Fautes visibles en permanence. | Crédibilité FR détruite sur une page clé. |
| P072 | 🔴 | `agenda-content.tsx` | Calendrier **non interactif** : aucun `onClick` sur les jours ni sur les blocs de séance. Impossible de créer en tapant un jour, ni de voir/éditer/supprimer une séance. | Le calendrier est en lecture seule. | Friction, sous-utilisation, tickets. |
| P073 | 🟠 | `agenda-content.tsx:428` | `useState(window.innerWidth<768?'week':'month')` lu pendant le rendu initial. | Hydration mismatch + flash month→week. | Bug visible au chargement. |
| P074 | 🟠 | `agenda-content.tsx:592` | Barre de navigation date `min-w-[180px]` + 2 flèches `w-8` + bouton « Aujourd'hui ». | Débordement horizontal < 360px. | Scroll horizontal indésirable. |
| P075 | 🟠 | `agenda-content.tsx` (WeekView) | Vue semaine (défaut mobile) : `grid-cols-[60px_repeat(7,1fr)]` → 7 colonnes ≈ 45px sur 375px, blocs `text-[10px]`. | Illisible, intappable. | Vue par défaut inutilisable. |
| P076 | 🟡 | `agenda-content.tsx` (MonthView) | Cases mois `min-h-[80px]` × 7 colonnes : pastilles `text-[10px]`, max 2 + « +N » sans détail accessible. | Détail des journées chargées invisible. | Friction. |
| P077 | 🟠 | `agenda-content.tsx:630` | « + Seance » n'ouvre la modale que si `clients.length > 0` ; sinon **clic sans effet** (no-op silencieux). | Bouton mort sans explication. | Confusion, tickets. |
| P078 | 🟡 | `agenda-content.tsx` (AddSessionModal) | Sheet correcte mais champs `text-[13px]` (zoom iOS), pas de `max-height`/scroll, pas de verrou scroll body. | Zoom au focus, CTA poussé par le clavier. | Friction de création. |
| P079 | 🟡 | `agenda-content.tsx:92-165` | Libellés sans accents dans la modale : « Nouvelle seance », « Athlete », « Debut », « Duree ». | Fautes. | Qualité FR. |
| P080 | 🟡 | `agenda-content.tsx:505-509` | Toasts « Seance ajoutee », « Erreur lors de la creation » sans accents. | Fautes. | Qualité FR. |
| P081 | 🟡 | `agenda-content.tsx:587-601` | Flèches navigation `w-8 h-8` (32px). | Cibles trop petites. | Friction. |
| P082 | 🟡 | `agenda-content.tsx:618` | Google Calendar caché sous l'onglet « Disponibilités » (placement non découvrable). | Intégration introuvable. | Sous-adoption d'une feature. |
| P083 | 🟡 | `agenda-content.tsx:447-451` | Durée de séance encodée dans `private_notes` via regex `duration:(\d+)`. | Fragile ; durée perdue si note éditée. | Données calendrier incohérentes. |
| P084 | ⚪ | `agenda-content.tsx` | `<select>` natif athlète : bon réflexe mobile, mais aucune recherche → ingérable au-delà de ~30 clients. | Sélection lente. | Friction sur gros portefeuilles. |

### I. Programmes (page critique « Création de programmes »)

| ID | Grav. | Page / Fichier | Problème | Impact utilisateur | Impact business |
|----|-------|----------------|----------|--------------------|-----------------|
| P085 | 🔴 | `programme-builder.tsx:338+` | Réorganisation/glisser-déposer via **HTML5 DnD** (`draggable/onDragStart/onDrop`), **aucun fallback tactile**. | Sur mobile : impossible de réordonner les exercices ou de glisser depuis la bibliothèque. | Création de programme bridée sur l'appareil principal. |
| P086 | 🟠 | `programme-builder.tsx:1269` | FAB « Bibliothèque » `fixed bottom-6 right-6` sans `safe-area-inset-bottom`. | Chevauche le home indicator iOS. | Friction, perception. |
| P087 | 🟠 | `programme-builder.tsx` (DayCard) | Édition d'exercice = grille dense de champs numériques (séries/reps/poids/repos) ; champs petits `text-[…]`, zoom iOS, beaucoup de taps. | Saisie pénible au doigt. | Friction, abandon de création. |
| P088 | 🟡 | `programme-builder.tsx:1140` | Compteur de générations IA `hidden sm:block` → invisible sur mobile. | Le coach ne sait pas son quota IA restant sur mobile. | Frustration quota, tickets. |
| P089 | 🟡 | `programme-builder.tsx:1131-1163` | Header : retour + titre + « Régénérer » + « Assigner » sur une ligne. | Serré/troncature sur petit écran. | Friction. |
| P090 | 🟡 | `programme-builder.tsx:1309` | Modale « Assigner » centrée `items-center` (cf. P049/P051) sans max-h ni sheet mobile. | Clavier/contenu coupé. | Friction d'assignation. |
| P091 | 🟡 | `programme-builder.tsx:1189` | Onglets de phases `overflow-x-auto` sans indicateur de scroll. | L'utilisateur ne devine pas qu'il y a d'autres phases. | Contenu caché. |
| P092 | 🟡 | `programme-builder.tsx` | Auto-save par jour (`autoSavingDay`) sans indicateur global de « tout est enregistré ». | Doute « est-ce sauvegardé ? ». | Anxiété, tickets. |
| P093 | ⚪ | `programme-builder.tsx:88` | `makeId()` basé sur `Date.now()+Math.random()` ; collisions improbables mais IDs non standard. | — | Mineur. |

### J. Interface client (dashboard, sport, programme, etc. — critique)

| ID | Grav. | Page / Fichier | Problème | Impact utilisateur | Impact business |
|----|-------|----------------|----------|--------------------|-----------------|
| P094 | 🔴 | `client-dashboard.tsx:95-133` | **Série, « ce mois » et objectifs cochés du jour stockés en `localStorage`** (`cl_completions_…`). | Données perdues au changement d'appareil/navigateur ; invisibles pour le coach ; reset si cache vidé. | **Rétention sapée** (la série = levier d'engagement n°1). |
| P095 | 🟠 | `client-dashboard.tsx` | KPIs (progression %, série, ce mois) initialisés à 0 côté serveur puis recalculés en `useEffect` → **flash de « 0 % »** + CLS à chaque ouverture. | Saut visuel, sensation de bug. | Perception, confiance. |
| P096 | 🟠 | `client-dashboard.tsx:183` | Emoji `🏠` comme icône de header + ton « vous » mélangé à « mon coach ». | Non premium, registre incohérent. | Perception. |
| P097 | 🟡 | `client-dashboard.tsx:375` | Cases d'objectifs = `div` non interactives ressemblant à des cases à cocher. | L'utilisateur tape, rien ne se passe (faut aller dans /progression). | Friction, confusion. |
| P098 | 🟡 | `client-dashboard.tsx:298` | KPIs `grid-cols-2` : 4 cartes, valeurs `text-[22px]`, labels `text-[10px] truncate`. | Labels tronqués (« objectifs att… »). | Lisibilité. |
| P099 | 🟡 | `(c)/[token]/sport/page.tsx` | Page de log d'entraînement (791 lignes) = parcours quotidien clé : champs de saisie de perfs nombreux, mêmes problèmes de cibles/zoom. | Logger une séance au doigt est laborieux. | Rétention (usage quotidien). |
| P100 | 🟡 | `(c)/[token]/habitudes/page.tsx` | Utilise un `<table>` + `overflow-x-auto` dans l'espace client mobile. | Tableau qui déborde, scroll horizontal. | Friction sur écran clé. |
| P101 | 🟡 | client (global) | Aucune confirmation visuelle persistante de « check-in fait » au-delà du bandeau ; CTA check-in dégradé en `linear-gradient` lourd répété. | Feedback faible. | Engagement. |
| P102 | ⚪ | `client-dashboard.tsx:44` | `MONTH_NAMES` ici **avec** accents (`fév`,`août`) — incohérent avec l'agenda coach (sans accents). | Incohérence inter-modules. | Qualité FR. |
| P103 | 🟡 | `(c)/[token]/*` | Beaucoup de pages client séparées (15+) → navigation éclatée vs un hub unifié type « Aujourd'hui ». | Trop de surface, dispersion. | Charge cognitive, abandon. |

### K. Formulaires

| ID | Grav. | Page / Fichier | Problème | Impact utilisateur | Impact business |
|----|-------|----------------|----------|--------------------|-----------------|
| P104 | 🔴 | global | Champs majoritairement `text-sm`/`text-[13px]`/`text-base` < 16px → **zoom iOS systématique au focus**. | Page zoome/dézoome à chaque champ. | Friction de saisie sur tout le produit. |
| P105 | 🟠 | global | Peu/pas d'attributs `inputMode`, `autoComplete`, `enterKeyHint`, `type` spécialisés (ex : montants en `text`). | Mauvais clavier mobile, pas d'autofill. | Friction, erreurs de saisie. |
| P106 | 🟠 | formulaires modales | Pas de gestion du clavier (scroll-into-view du champ focus, sticky CTA au-dessus du clavier). | CTA caché sous le clavier. | Abandon. |
| P107 | 🟡 | global | Validation : surtout via `disabled` du submit + toasts d'erreur réseau ; peu de messages d'erreur inline par champ. | L'utilisateur ne sait pas quel champ corriger. | Friction, tickets. |
| P108 | 🟡 | `auth/signup`, `rejoindre/[token]` | Formulaires d'entrée (signup/join) : à vérifier largeur, `text-sm`, et absence de `loading.tsx` pendant redirection. | Friction au moment le plus sensible (conversion). | Perte d'inscriptions. |
| P109 | 🟡 | divers | `<select>` natifs (agenda) vs `Select` Base UI (autres) → comportements de picker incohérents. | Apprentissage. | Incohérence. |
| P110 | ⚪ | global | Pas de sauvegarde de brouillon sur formulaires longs (programme, formulaire d'accueil). | Perte de saisie si interruption (appel entrant). | Abandon. |

### L. Tableaux / responsive / débordements

| ID | Grav. | Page / Fichier | Problème | Impact utilisateur | Impact business |
|----|-------|----------------|----------|--------------------|-----------------|
| P111 | 🟠 | `statistiques/stats-content.tsx`, `progression/*` | `<table>` + `overflow-x-auto` côté coach ET client. | Scroll horizontal, colonnes coupées sur mobile. | Friction sur données clés. |
| P112 | 🟠 | `components/progression/CheckinsTable`, `WeeklyView`, `MonthlyTracker`, `YearView`, `MetabolicShell` | Vues de progression construites en tables/grilles larges à scroll horizontal. | Lecture difficile au doigt. | Sous-utilisation du suivi (cœur produit). |
| P113 | 🟡 | `clients/[id]/client-detail-content.tsx` | `overflow-x-auto` (onglets ou contenu) — fiche client = nombreux onglets. | Onglets cachés hors écran. | Navigation interne difficile. |
| P114 | 🟡 | `exercices/*` (exercices, habitudes, nutrition) | `overflow-x-auto` sur listes bibliothèque. | Contenu hors écran. | Friction. |
| P115 | 🟡 | global | Beaucoup de largeurs/min-widths fixes en px (`min-w-[180px]`, `w-[220px]`, etc.) au lieu de %/`min()`/`clamp()`. | Débordements en 320px. | Scroll horizontal global. |
| P116 | ⚪ | landing (`CompetitorComparison`, `Features`, …) | Tables comparatives `overflow-x-auto` sur la landing. | Lecture mobile dégradée avant inscription. | Conversion. |

### M. États (chargement / vide / erreur)

| ID | Grav. | Page / Fichier | Problème | Impact utilisateur | Impact business |
|----|-------|----------------|----------|--------------------|-----------------|
| P117 | 🔴 | `app/**` | **Aucun `loading.tsx`** (0 fichier) → pas de squelette de route. Navigation = écran figé jusqu'au retour serveur (pages `force-dynamic`, Supabase). | Écrans blancs/figés à chaque navigation en 4G. | Perception lenteur, abandons. |
| P118 | 🟠 | global | Indicateur de navigation = simple barre 2px (`.nav-progress`) animée par CSS, sans lien réel avec la fin du chargement. | Barre qui « ment » (s'arrête à 90 % puis attend). | Perception bug. |
| P119 | 🟠 | global | États d'erreur réseau gérés surtout par `toast.error` générique (« Erreur réseau. Réessaie. »). Pas de retry, pas d'état d'erreur en place. | L'utilisateur reste bloqué sans action claire. | Tickets, abandons. |
| P120 | 🟡 | `empty-state.tsx` | EmptyState : titre `text-sm` (13,5px) — trop petit pour un titre ; `py-16` énorme. | Hiérarchie faible. | Moins engageant. |
| P121 | 🟡 | divers | Empty states présents sur Membres mais absents/pauvres sur Agenda (grille vide), Messages, vues progression. | Pas de guidage quand c'est vide. | Onboarding raté, abandon. |
| P122 | 🟡 | `app/error.tsx`, `not-found.tsx` | À vérifier : design mobile, ton FR, CTA de retour. | Pages d'erreur peu rassurantes. | Confiance. |
| P123 | 🟡 | global | Pas de skeleton sur les fetch client (`useEffect` → badges nav, KPIs) : valeurs à 0 puis saut. | CLS, flashs. | Perception. |

### N. Accessibilité

| ID | Grav. | Page / Fichier | Problème | Impact utilisateur | Impact business |
|----|-------|----------------|----------|--------------------|-----------------|
| P124 | 🟠 | global | Cibles tactiles < 44px omniprésentes (boutons, ✕, flèches, onglets). | Difficile pour motricité réduite/grands doigts. | Exclusion, friction. |
| P125 | 🟠 | global | Texte très petit récurrent : `text-[9px]`, `text-[10px]`, `text-[11px]` (labels, nav, badges). | Illisible (presbytie, soleil). | Exclusion, fatigue. |
| P126 | 🟠 | modales/drawers/sheets | Pas de `role="dialog"`/`aria-modal`, pas de focus-trap, pas de `Esc` (cf. P028/P036/P055). | Lecteurs d'écran et clavier inutilisables. | Conformité RGAA/EAA, risque légal. |
| P127 | 🟡 | global | Icônes-emoji et SVG décoratifs sans `aria-hidden` cohérent ; SVG d'action sans `aria-label`. | Lecteurs d'écran lisent des emojis / rien. | A11y. |
| P128 | 🟡 | global | Contrastes : `text-[#94A3B8]`/`#CBD5E1` sur blanc (gris clair) sous le ratio 4,5:1 pour du texte. | Texte secondaire illisible en extérieur. | Lisibilité, conformité. |
| P129 | 🟡 | global | `:focus-visible` global vert présent (bien), mais beaucoup d'éléments cliquables sont des `<div>`/`<span>` non focusables (cartes-Link imbriquées). | Navigation clavier impossible. | A11y. |
| P130 | 🟡 | global | `user-select:none` sur liens/labels empêche aussi la lecture/sélection pour certains usages assistifs. | Friction. | A11y. |
| P131 | ⚪ | `<html lang="fr">` ok | Mais `meta name="google" content="notranslate"` bloque la traduction auto (clients non francophones). | Pas de traduction. | Limite l'audience. |

### O. Performance & rendu

| ID | Grav. | Page / Fichier | Problème | Impact utilisateur | Impact business |
|----|-------|----------------|----------|--------------------|-----------------|
| P132 | 🔴 | `app/layout.tsx` | 8 polices (cf. P003) = principal poste de poids de rendu initial. | LCP/CLS dégradés en mobile. | Bounce, SEO, conversion. |
| P133 | 🟠 | nav (`sidebar.tsx`, `coach-nav.tsx`) | Souscription Supabase realtime + fetch de badges **dans chaque montage de nav**, recréés à chaque navigation (pas de cache). | Requêtes répétées, batterie/data. | Coût, lenteur. |
| P134 | 🟠 | `client-dashboard.tsx` | Calculs de série en boucle sur **365 jours** de `localStorage` à chaque montage. | Petit blocage JS au chargement. | Lenteur perçue. |
| P135 | 🟡 | global | `framer-motion` + `recharts` + `@number-flow` chargés ; risque d'imports non lazy sur mobile. | Bundle JS lourd. | TTI mobile. |
| P136 | 🟡 | landing | `AnimatedBackground`, `shader-background`, blobs `meshDrop` animés en continu. | Consommation GPU/batterie sur mobile. | Bounce, chauffe. |
| P137 | 🟡 | global | `will-change: transform` posé en dur (`.progress-bar`) — si multiplié, surcoût mémoire compositing. | — | Perf. |
| P138 | 🟡 | images | `<img>` bruts probables (avatars, logo) au lieu de `next/image` → pas d'optimisation/format moderne. | Images lourdes. | Data, LCP. |
| P139 | ⚪ | `tsconfig.tsbuildinfo`, `evolya-signed.apk`, `.b64` committés | Artefacts lourds dans le repo. | — | Hygiène, poids repo. |

### P. Langue & contenu (FR premium)

| ID | Grav. | Page / Fichier | Problème | Impact utilisateur | Impact business |
|----|-------|----------------|----------|--------------------|-----------------|
| P140 | 🟠 | `agenda-content.tsx`, `plan-gate.tsx`, `clients-content.tsx`, divers | **Accents manquants systémiques** : « Fevrier/Aout/Decembre », « Fonctionnalite verrouillee », « superieur », « seance », « Athlete », « creation »… | Fautes visibles partout. | Crédibilité FR (audience 100 % francophone). |
| P141 | 🟠 | global | **Mélange tu/vous** non maîtrisé (coach tutoyé, client vouvoyé, mais fuites croisées). | Ton incohérent. | Perception, confiance. |
| P142 | 🟡 | `clients-content.tsx:601` | Bug de remplacement « client→membre » → « Créer l'membre ». | Faute grammaticale. | Crédibilité. |
| P143 | 🟡 | global | Terminologie flottante : « clients » / « membres » / « athlète » utilisés pour la même entité. | Confusion. | Apprentissage. |
| P144 | ⚪ | global | Apostrophes droites `'` vs typographiques `'` mélangées. | Détail typographique. | Premium. |

### Q. Rétention / CRO / parcours

| ID | Grav. | Page / Fichier | Problème | Impact utilisateur | Impact business |
|----|-------|----------------|----------|--------------------|-----------------|
| P145 | 🟠 | onboarding client | Onboarding séparé (`onboarding-flow.tsx`) + `WelcomeGuide` drippé J0–J7 : pas de barre de progression d'onboarding unique ni de « prochaine action » claire sur le dashboard. | L'utilisateur ne sait pas quoi faire ensuite. | Activation faible, churn précoce. |
| P146 | 🟠 | paiements client | Alerte paiement en retard très visible (rouge) mais le **paiement** lui-même : à vérifier que le parcours est en 1 tap (Stripe). | Friction de paiement = retards. | Revenu, churn. |
| P147 | 🟡 | série / streak | La série est le levier de rétention mais (a) en localStorage (P094), (b) pas de notification de « série en danger », (c) pas de partage. | Engagement non capitalisé. | Rétention. |
| P148 | 🟡 | bottom-nav client | Pas de point « Aujourd'hui » unique regroupant séance du jour + objectifs + check-in (tout est éclaté). | Plus de taps pour l'usage quotidien. | Rétention. |
| P149 | 🟡 | coach | Pas de vue mobile « à traiter aujourd'hui » (check-ins reçus, demandes, paiements) → le coach doit fouiller. | Charge mentale coach. | Rétention coach (payeur !). |
| P150 | 🟡 | notifications | Push présent (`push-subscribe-button`) mais opt-in via bouton flottant obscur (P038), sans valeur expliquée. | Faible taux d'opt-in. | Rétention (re-engagement). |
| P151 | ⚪ | partage | Partage limité à WhatsApp + copier ; pas de SMS natif / `navigator.share`. | Moins de canaux. | Acquisition par invitation. |

### R. Divers transverses (confirmés en code)

| ID | Grav. | Page / Fichier | Problème | Impact utilisateur | Impact business |
|----|-------|----------------|----------|--------------------|-----------------|
| P152 | 🟠 | `messages-content.tsx` (897 l.) | Messagerie longue : à `100vh`/`h-screen` sans `dvh` → zone de saisie poussée hors écran par le clavier sur iOS. | Champ d'envoi caché. | Friction messagerie (rétention). |
| P153 | 🟡 | messagerie | Probable absence d'auto-scroll vers le dernier message + sticky composer au-dessus du clavier. | Lecture/envoi pénibles. | Friction. |
| P154 | 🟡 | `cookie-notice.tsx` + `CookieNotice` global | Bandeau cookies monté globalement → peut recouvrir la bottom-nav/CTA sur mobile au 1er lancement. | Masquage d'UI critique. | Friction onboarding. |
| P155 | 🟡 | `admin/*` | Interfaces admin en `<table>` pleines (coaches, logs, revenus, emails) non responsives. | Inutilisables sur mobile. | (interne, mais usage terrain). |
| P156 | 🟡 | `disponibilites-content.tsx` | Édition de créneaux : à vérifier cibles tactiles et saisie d'heures sur mobile. | Friction. | Adoption réservation. |
| P157 | 🟡 | `formulaire/form-builder.tsx` | Constructeur de formulaire d'accueil : édition complexe, probable DnD/champs — mêmes risques tactiles que le builder programme. | Édition mobile difficile. | Friction. |
| P158 | 🟡 | `stats-content.tsx` / `business-content.tsx` | Graphiques `recharts` : tooltips au survol (hover) → inaccessibles au tap, largeurs fixes. | Données illisibles sur mobile. | Pilotage coach dégradé. |
| P159 | 🟡 | `plans/plans-content.tsx` | Tableau de comparaison de plans : à vérifier scroll horizontal et lisibilité au moment de l'achat. | Friction de conversion payante. | Revenu. |
| P160 | 🟡 | `paiements-content.tsx` (coach) | Suivi des paiements (200 l.) : listes/montants — vérifier lisibilité et actions « marquer payé » au doigt. | Friction de gestion. | Revenu, rétention coach. |
| P161 | ⚪ | `nouveautes-vote/*` | Page de vote nouveautés : bon pour l'engagement mais ajoute de la surface de nav (cf. P032). | Dispersion. | Mineur. |
| P162 | 🟡 | global | Animations modales définies (`modal-panel-in`, `sheet-in`) mais pas appliquées partout → certaines modales apparaissent « sèches », d'autres animées. | Incohérence de fluidité. | Perception. |
| P163 | 🟡 | global | Pas de `prefers-reduced-motion` respecté pour les animations (blobs, badges blink, transitions). | Inconfort/mal des transports pour certains. | A11y, confort. |
| P164 | 🟡 | global | `active:scale-[0.98]` utilisé sur certains boutons mais pas systématique → feedback de tap inégal. | Réactivité perçue variable. | Fluidité. |
| P165 | 🟡 | `(c)/[token]/*/page.tsx` | Plusieurs `console.error`/`console.log` côté client (dashboard, rdv, progression). | Logs en prod, fuite d'infos en console. | Hygiène, sécurité légère. |
| P166 | ⚪ | global | Pas de gestion explicite du retour physique Android (bouton back) côté Capacitor pour fermer modales/sheets. | Le back Android quitte l'app au lieu de fermer la modale. | Friction native, mauvaise note store. |
| P167 | 🟡 | global | Pas de pull-to-refresh ni d'indication de rafraîchissement sur les listes (membres, messages) en contexte app. | Geste natif attendu absent. | Friction native. |
| P168 | ⚪ | `Nouveau dossier`, `Nouveau dossier (2)`, `Success!`, `echo`, `dirs created` | Fichiers/dossiers parasites à la racine du projet. | — | Hygiène repo. |

---

## 2. CLASSEMENT PAR GRAVITÉ

### 🔴 CRITIQUE (32) — bloquent l'usage mobile ou l'image premium
P001, P002, P003, P010, P021, P022, P045, P046, P047, P049, P060, P071, P072, P085, P094, P104, P117, P132
+ corollaires directs : P005, P023, P031(emoji nav), P048, P051, P055, P056, P063, P075, P095, P111, P112, P152, P118.

### 🟠 ÉLEVÉ (54)
P004, P005, P006, P008, P009, P023, P024, P025, P031, P038, P039, P048, P050, P051, P055, P056, P061, P062, P063, P064, P066(→), P071-corollaires, P073, P074, P075, P077, P085-corollaires, P086, P087, P089, P095, P096, P104-corollaires, P105, P106, P111, P112, P118, P119, P124, P125, P126, P132, P133, P140, P141, P145, P146, P152, P158, P159, P160.

### 🟡 MOYEN (58)
P007, P011, P012, P013, P014, P015, P018, P019, P026, P027, P028, P029, P032, P033, P034, P035, P036, P040, P041, P042, P043, P044, P052, P053, P054, P057, P058, P059, P065, P067, P068, P070, P076, P078, P079, P080, P081, P082, P083, P088, P090, P091, P092, P097, P098, P099, P100, P103, P107, P108, P109, P113, P114, P115, P120, P121, P122, P123, P127, P128, P129, P130, P134-P138, P142, P143, P147-P150, P153-P165.

### ⚪ FAIBLE (24)
P016, P017, P020, P030, P037, P069, P084, P093, P102, P110, P116, P131, P139, P144, P151, P161, P166, P168 (+ autres mineurs notés ⚪).

> Les totaux par bucket se recoupent volontairement (un problème « élevé » peut nourrir un « critique »). Priorisez par les **Top 20** ci-dessous.

---

## 3. LISTE DES AMÉLIORATIONS (57)

> Priorité : P0 (immédiat) · P1 (sprint) · P2 (backlog).

| ID | Prio | Amélioration | Impact utilisateur | Impact business |
|----|------|--------------|--------------------|-----------------|
| A001 | P0 | Créer un composant `<AppShell>` unique gérant header sticky + `padding-top: calc(48px + env(safe-area-inset-top))` et `padding-bottom: calc(nav + env(safe-area-inset-bottom))`. | Plus jamais de contenu masqué. | -tickets, +pro. |
| A002 | P0 | Ajouter `env(safe-area-inset-*)` sur barres fixes, FAB, sheets, bouton push. | Respect notch/home indicator. | Perçu natif. |
| A003 | P0 | **Bottom-nav coach** (5 onglets : Accueil, Membres, Planning, Messages, Plus) à la place du hamburger. | Navigation au pouce. | +usage mobile coach. |
| A004 | P0 | Réduire à **2 polices max** (1 titre + 1 texte), via `next/font` self-host, `display:swap`, subsets `latin`. | Rendu plus rapide. | +LCP, +conversion. |
| A005 | P0 | Forcer **16px min** sur tous les champs (`font-size:16px` mobile) pour tuer le zoom iOS. | Saisie fluide. | -friction massive. |
| A006 | P0 | Hauteur tactile **≥44px** sur boutons/inputs/onglets/✕ (revoir variants shadcn + classes `.ev-btn`). | Moins d'erreurs de tap. | -friction. |
| A007 | P0 | `DialogContent` : `max-h-[90dvh] overflow-y-auto`, conversion **bottom-sheet** sur mobile, backdrop `bg-black/40`. | Modales jamais coupées. | -abandon formulaires. |
| A008 | P0 | Remplacer **tous les emojis de navigation/titres** par un set d'icônes vectorielles cohérent (lucide). | Look premium, teinte uniforme. | +confiance. |
| A009 | P0 | Persister **série/progression côté serveur** (table `daily_completions`) au lieu de localStorage. | Données fiables multi-appareil + visibles coach. | +rétention. |
| A010 | P0 | Ajouter des `loading.tsx` (squelettes) sur toutes les routes lourdes. | Plus d'écran figé. | -bounce. |
| A011 | P0 | Rendre les actions Membres (lien/renommer/supprimer) accessibles via menu `⋯` tap-friendly sur mobile. | Gestion possible au tél. | -tickets. |
| A012 | P0 | Corriger tous les accents FR + harmoniser tu/vous (1 registre par interface) + terme unique (« membre »). | Qualité FR. | +crédibilité. |
| A013 | P1 | Calendrier interactif : tap jour = créer, tap séance = fiche/éditer/supprimer, swipe semaine/mois. | Vrai outil planning. | +usage. |
| A014 | P1 | Builder programme : remplacer HTML5 DnD par **@dnd-kit (PointerSensor)** ou réordonnancement par boutons ↑/↓ + « déplacer vers ». | Création possible au doigt. | +création mobile. |
| A015 | P1 | Vue calendrier mobile dédiée : agenda **liste/jour** par défaut (façon Google Agenda mobile) plutôt que semaine 7 colonnes. | Lisible/tappable. | +usage. |
| A016 | P1 | Composer messagerie sticky au-dessus du clavier + auto-scroll + `100dvh`. | Chat utilisable. | +rétention. |
| A017 | P1 | Dark mode via **tokens sémantiques** (variables), pas `!important` sur hex. | Dark mode fiable. | +pro. |
| A018 | P1 | Hub client « Aujourd'hui » : séance du jour + objectifs + check-in en 1 écran. | 1 tap pour l'usage quotidien. | +rétention. |
| A019 | P1 | Hub coach « À traiter » : check-ins reçus, demandes, paiements en retard. | Routine quotidienne claire. | +rétention payeur. |
| A020 | P1 | `inputMode`/`enterKeyHint`/`autoComplete`/`type` adaptés sur tous les champs. | Bon clavier mobile. | -friction. |
| A021 | P1 | Verrou de scroll body + focus-trap + `Esc` + back Android sur toutes modales/sheets/drawers. | A11y + natif. | conformité, -friction. |
| A022 | P1 | Squelettes pour les fetch client (badges nav, KPIs) → fin du flash « 0 ». | Stabilité visuelle. | +perception. |
| A023 | P1 | Remplacer `100vh`→`100dvh`/`100svh` partout. | Plus de contenu coupé. | -friction. |
| A024 | P1 | Empty states riches et actionnables sur Agenda, Messages, Progression. | Guidage. | +activation. |
| A025 | P1 | Graphiques `recharts` : interactions au **tap** (pas hover), largeur responsive, valeurs lisibles. | Pilotage mobile. | +usage. |
| A026 | P1 | Convertir tableaux (progression, paiements, stats) en **cartes empilées** sur mobile. | Lecture sans scroll horizontal. | +usage cœur produit. |
| A027 | P1 | `navigator.share` natif pour le lien d'invitation (WhatsApp/SMS/Mail/…). | Plus de canaux. | +acquisition. |
| A028 | P1 | Indicateur global « Enregistré ✓ » sur le builder (auto-save) + état hors-ligne. | Confiance. | -tickets. |
| A029 | P1 | Onboarding unifié avec barre de progression + « prochaine action » sur le dashboard. | Activation guidée. | -churn précoce. |
| A030 | P1 | Opt-in push contextuel (après 1re action de valeur) avec bénéfice expliqué, pas un FAB obscur. | +opt-in. | +re-engagement. |
| A031 | P2 | Pull-to-refresh sur listes (membres, messages, agenda). | Geste natif. | +satisfaction. |
| A032 | P2 | `prefers-reduced-motion` respecté (désactive blobs/blink/transitions). | Confort. | A11y. |
| A033 | P2 | `next/image` pour avatars/logo + formats modernes. | Images légères. | +LCP. |
| A034 | P2 | Lazy-load `framer-motion`/`recharts`/landing animée. | Bundle plus léger. | +TTI. |
| A035 | P2 | Feedback de tap homogène (`active:scale`/ripple) sur tous les éléments interactifs. | Réactivité ressentie. | +fluidité. |
| A036 | P2 | Recherche d'athlète avec filtre/typeahead dans les selects (>30 clients). | Sélection rapide. | +efficacité. |
| A037 | P2 | Sauvegarde de brouillon (programme, formulaire d'accueil). | Pas de perte. | -frustration. |
| A038 | P2 | Validation inline par champ + messages FR clairs. | Correction guidée. | -tickets. |
| A039 | P2 | Composant header de page unique responsive (remplace les headers inline divergents). | Cohérence. | +pro. |
| A040 | P2 | Bandeau cookies non bloquant (haut, discret) qui n'occulte pas la nav. | Onboarding propre. | -friction. |
| A041 | P2 | Notifications « série en danger » + jalons de série fêtés. | Engagement. | +rétention. |
| A042 | P2 | Skeleton + transition d'opacité sur changement d'onglet (clients, agenda, fiche client). | Fluidité. | +perception. |
| A043 | P2 | Mode hors-ligne minimal (cache shell + dernières données) via SW. | Résilience métro. | -échecs. |
| A044 | P2 | Réintroduire la caméra dans `Permissions-Policy` pour photos de progression (avant/après). | Feature rétention. | +engagement. |
| A045 | P2 | Supprimer le code mort `coach-nav.tsx` et artefacts repo (P168). | Maintenance. | -dette. |
| A046 | P2 | Composer un Design System documenté (tokens, tailles tactiles, états) pour stopper le double système. | Cohérence durable. | vélocité. |
| A047 | P2 | Contrastes : passer les textes secondaires à un gris ≥ 4,5:1. | Lisibilité extérieure. | +a11y. |
| A048 | P2 | Indicateurs de scroll (ombres/flèches) sur conteneurs `overflow-x` restants. | Découvrabilité. | -contenu caché. |
| A049 | P2 | Gérer le bouton retour Android (Capacitor) pour fermer modales/sheets avant de quitter. | Comportement natif. | +note store. |
| A050 | P2 | Page de paiement client en 1 tap (Stripe Payment Element / lien préprovisionné). | Paiement sans friction. | +revenu. |
| A051 | P2 | Unifier le pattern de modale (1 composant `Sheet`/`Modal` responsive). | Cohérence d'apprentissage. | +pro. |
| A052 | P2 | Ajouter haptique légère (Capacitor Haptics) sur actions clés (check, valider). | Sensation premium. | +satisfaction. |
| A053 | P2 | Persistance de la position de scroll au retour arrière. | Pas de perte de contexte. | -friction. |
| A054 | P2 | Indicateur de quota IA visible aussi sur mobile (P088). | Transparence. | -tickets. |
| A055 | P2 | Tooltips/aides contextuelles au tap (long-press) pour features avancées (périodisation, supersets). | Compréhension. | +adoption. |
| A056 | P2 | Traduction : retirer `notranslate` ou prévoir i18n légère pour clients non FR. | Audience élargie. | +marché. |
| A057 | P2 | Standardiser apostrophes typographiques et microcopie premium. | Détail soigné. | +premium. |

---

## 4. TOP 20 — ACTIONS À RÉALISER IMMÉDIATEMENT

1. **Corriger le bug header** (P022) → AppShell + padding-top safe-area (A001/A002).
2. **Bottom-nav coach** (P021 → A003).
3. **Tuer le zoom iOS** : 16px min sur champs (P104 → A005).
4. **Cibles tactiles ≥44px** (P045 → A006).
5. **Modales scrollables + bottom-sheet mobile** (P049 → A007).
6. **Réduire à 2 polices** (P003 → A004).
7. **Remplacer les emojis de nav/titres par des icônes** (P024/P031/P062 → A008).
8. **Persister série/progression côté serveur** (P094 → A009).
9. **Actions Membres accessibles mobile** (P060 → A011).
10. **Drag-and-drop builder → dnd-kit/boutons** (P085 → A014).
11. **Accents + tu/vous + terme unique** (P140/P141/P143 → A012).
12. **`loading.tsx` partout** (P117 → A010).
13. **Safe-area-top global** (P001 → A002).
14. **Calendrier interactif + vue liste mobile** (P072/P075 → A013/A015).
15. **Dark mode par tokens** (P010 → A017) **ou** désactivation propre tant que non fiable.
16. **Composer messagerie sticky + dvh** (P152 → A016/A023).
17. **Corriger « Créer l'membre » et autres strings cassées** (P061/P142).
18. **Backdrop modale lisible + verrou scroll/focus-trap** (P050/P055 → A007/A021).
19. **Supprimer le 2e Toaster / unifier la position mobile** (P006/P007).
20. **Header page « + Seance » no-op quand 0 client → état guidé** (P077).

## 5. TOP 20 — QUICK WINS (effort faible, impact réel)

1. Strings cassées/accents (P061, P071, P079, P080, P140). 
2. Supprimer le 2e Toaster (P006). 
3. `100vh`→`100dvh` global (P019/A023). 
4. `font-size:16px` sur champs (A005). 
5. Backdrop modale `bg-black/40` (P050). 
6. `flex-wrap` sur header Membres (P063). 
7. `min-w-[180px]`→`flex-1`/`min(…)` agenda (P074). 
8. Quota IA visible mobile (P088/A054). 
9. `target=_blank` → vérifier `rel="noopener"`. 
10. `aria-label` sur ✕/flèches SVG (P127). 
11. Empty state Agenda/Messages (A024). 
12. Retirer code mort `coach-nav.tsx` + artefacts (A045/P168). 
13. `prefers-reduced-motion` (A032). 
14. Safe-area sur FAB/bouton push (P038/P086/A002). 
15. EmptyState titre `text-base` (P120). 
16. `navigator.share` invitation (A027). 
17. `active:scale` homogène (A035). 
18. Indicateur de scroll sur onglets phases (P091/A048). 
19. Verrou scroll body sur drawer/sheets (P029/P036). 
20. Corriger labels nav tronqués client (P033). 

## 6. TOP 20 — RÉTENTION

1. Série/progression serveur (P094/A009). 
2. Hub client « Aujourd'hui » (P148/A018). 
3. Hub coach « À traiter » (P149/A019). 
4. Notif « série en danger » + jalons fêtés (P147/A041). 
5. Onboarding unifié + prochaine action (P145/A029). 
6. Opt-in push contextuel à valeur (P150/A030). 
7. Messagerie utilisable mobile (P152/A016). 
8. Paiement client 1-tap (P146/A050). 
9. Photos de progression (caméra) (P018/A044). 
10. Empty states actionnables (P121/A024). 
11. Pull-to-refresh listes (A031). 
12. Haptique sur check/valider (A052). 
13. Loading rapides (P117/A010). 
14. Calendrier interactif (réservation/séances) (P072/A013). 
15. Suivi (tables→cartes) lisible mobile (P112/A026). 
16. Partage multi-canal (P151/A027). 
17. Confirmation persistante check-in (P101). 
18. Persistance scroll au retour (P009/A053). 
19. Quota IA transparent (P088/A054). 
20. Dark mode fiable (confort usage du soir) (P010/A017). 

## 7. TOP 20 — MOBILE FIRST

1. AppShell safe-area (P001/P022/A001). 
2. Bottom-nav coach (P021/A003). 
3. 16px champs / anti-zoom iOS (P104/A005). 
4. Cibles ≥44px (P045/A006). 
5. Bottom-sheets vs modales centrées (P051/A007). 
6. `100dvh` (P019/A023). 
7. dnd-kit tactile (P085/A014). 
8. Calendrier vue liste mobile (P075/A015). 
9. Tables→cartes (P111/A026). 
10. `navigator.share` (A027). 
11. Back Android ferme les overlays (P166/A049). 
12. Pull-to-refresh (A031). 
13. Haptique (A052). 
14. Safe-area FAB/push (P086/A002). 
15. Clavier : champ scrollé + CTA sticky (P106/A020). 
16. Icônes vectorielles (P024/A008). 
17. Indicateurs de scroll (P091/A048). 
18. SW offline minimal (P015/A043). 
19. Verrou scroll/focus-trap overlays (P055/A021). 
20. Selects natifs/typeahead pour longues listes (P084/A036). 

## 8. TOP 20 — UX

1. Hiérarchie de titres lisible (P120/P125). 
2. Empty states guidants (P121/A024). 
3. Validation inline FR (P107/A038). 
4. Feedback « enregistré » builder (P092/A028). 
5. Header de page unifié (P044/A039). 
6. États d'erreur avec retry (P119). 
7. Onglet actif client correct (P035). 
8. Cases d'objectifs réellement interactives (P097). 
9. Calendrier actionnable (P072/A013). 
10. Actions membres au menu `⋯` (P060/A011). 
11. Indicateur de chargement honnête (P118). 
12. Cohérence des modales (P058/A051). 
13. Microcopie tu/vous unifiée (P141/A012). 
14. Terminologie unique « membre » (P143). 
15. Découvrabilité Google Calendar (P082). 
16. Bandeau cookies non bloquant (P154/A040). 
17. Tooltips features avancées (A055). 
18. Recherche membres améliorée (P068). 
19. Quota IA visible (P088). 
20. Cohérence des accents/typo (P140/P144). 

## 9. TOP 20 — FLUIDITÉ (perçue)

1. Squelettes de route (P117/A010). 
2. Squelettes fetch client, fin du flash « 0 » (P095/A022). 
3. `prefers-reduced-motion` (A032). 
4. Feedback tactile homogène (P164/A035). 
5. Transitions d'onglets (A042). 
6. Lazy-load libs lourdes (P135/A034). 
7. 2 polices, swap (P003/A004). 
8. Persistance scroll retour (P009/A053). 
9. Animations modales appliquées partout (P162). 
10. `next/image` (P138/A033). 
11. Désactiver blobs/shader animés sur mobile (P136). 
12. Realtime nav : éviter refetch à chaque navigation (P133). 
13. Calcul série hors thread/au montage optimisé (P134). 
14. Indicateur nav réel (P118). 
15. Haptique légère (A052). 
16. `will-change` maîtrisé (P137). 
17. Pull-to-refresh fluide (A031). 
18. Transitions de page (View Transitions API) — bonus. 
19. Optimistic UI sur check/valider/cocher. 
20. Précharge des routes au survol/tap-down (Next prefetch + intent). 

## 10. TOP 20 — INSPIRÉ DE STRIPE / LINEAR / NOTION / AIRBNB

1. **Linear** : bottom-nav + command-palette mobile (recherche/action rapide) au lieu d'un hamburger (A003). 
2. **Stripe** : formulaires en 16px, labels flottants, erreurs inline, 1 colonne (A005/A038). 
3. **Stripe** : paiement client en bottom-sheet 1-tap (Payment Element) (A050). 
4. **Linear** : squelettes instantanés + transitions de vue (A010/A042). 
5. **Notion** : bottom-sheets pour toute action contextuelle plutôt que modales centrées (A007/A051). 
6. **Airbnb** : barre de recherche/filtre persistante + résultats en cartes (A026/A036). 
7. **Linear** : densité maîtrisée, **icônes monochromes** cohérentes (jamais d'emoji) (A008). 
8. **Stripe** : 2 polices max, typographie nette, échelle stricte (A004). 
9. **Notion** : « Aujourd'hui » comme home actionnable (A018). 
10. **Airbnb** : safe-area parfaite, header qui se rétracte au scroll (A001/A002). 
11. **Linear** : feedback optimiste immédiat sur chaque action (fluidité #19). 
12. **Stripe Dashboard** : tableaux → listes/cartes responsive avec actions au tap (A026). 
13. **Airbnb** : `navigator.share` natif + deep links (A027). 
14. **Linear** : raccourcis « swipe » sur items de liste (archiver/supprimer) (A031-famille). 
15. **Notion** : empty states pédagogiques avec 1 CTA clair (A024). 
16. **Stripe** : micro-interactions discrètes + haptique (A035/A052). 
17. **Airbnb** : calendrier mobile en vue liste/jour, sélection tactile (A013/A015). 
18. **Linear** : dark mode natif par tokens (A017). 
19. **Stripe** : barre de progression d'onboarding persistante (A029). 
20. **Notion/Linear** : Design System documenté (tokens, 44px, états) pour éliminer le double système actuel (A046). 

---

## 11. MÉTHODE & LIMITES

- **Analyse statique du code** (lecture réelle des fichiers cités). Les comportements runtime (zoom iOS, DnD tactile, masquage header) sont **déduits de patterns confirmés en code** (tailles de police, `flex` row + spacer, `draggable` sans `onTouch*`, absence de `safe-area-inset-top`), cohérents avec le bug que vous aviez déjà observé.
- **Non couvert faute de runtime** : mesures Lighthouse réelles, rendu exact sur iPhone 13–16 physiques, comportement précis de WKWebView Capacitor. Recommandé en complément : tests sur device + Lighthouse mobile + audit Axe.
- Les recoupements d'IDs entre buckets de gravité sont volontaires (un défaut peut être à la fois cause critique et symptôme élevé).
- **Aucune modification de code n'a été faite** : ce document est le seul livrable, conformément à la consigne.

*Fin de l'audit.*
