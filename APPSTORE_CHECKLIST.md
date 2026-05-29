# Checklist Publication App Store & Play Store
**Généré le 2026-05-29 — Evolya'Fit (`fr.evolyafit.app`)**

---

## Ce que j'ai fait (code & configuration)

- [x] `android/app/build.gradle` — ajout bloc `signingConfigs.release` avec env vars (`ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`). Le `buildType.release` référence maintenant ce signingConfig.
- [x] `codemagic.yaml` — workflow Android passe de `assembleRelease` (APK) à `bundleRelease` (AAB). Artifact path: `android/app/build/outputs/bundle/release/*.aab`. Workflow iOS complété avec export IPA via `ExportOptions.plist`.
- [x] `ios/App/ExportOptions.plist` — créé pour l'export App Store (`method: app-store`, `signingStyle: manual`).
- [x] `store-metadata/fr-FR/description_play_store.txt` — titre, description courte, description longue pour le Play Store (FR).
- [x] `store-metadata/fr-FR/description_app_store.txt` — nom, sous-titre, mots-clés, description pour l'App Store (FR).
- [x] `store-metadata/en-US/description_play_store.txt` — version anglaise pour le Play Store.
- [x] `store-metadata/screenshots_spec.txt` — spécifications des screenshots à prendre.
- [x] `components/providers/NotificationProvider.tsx` — correction TypeScript `bytes.buffer as ArrayBuffer`.
- [x] `app/(coach)/programmes/[id]/programme-builder.tsx` — correction `onClick={() => addDay()}`.

---

## Ce que tu dois faire (dans l'ordre)

### Etape 1 — Comptes développeurs (une seule fois)

- [ ] **Google Play Console** — créer compte sur https://play.google.com/console ($25 unique)
  - Après création : aller dans "Créer une application" → package `fr.evolyafit.app`
  - Catégorie : Santé & Forme physique
  - Gratuite ou payante : Gratuite
- [ ] **Apple Developer Program** — https://developer.apple.com/programs ($99/an, nécessite un Mac ou iPhone)
  - Après inscription : créer un Bundle ID `fr.evolyafit.app` dans Certificates, IDs & Profiles
  - Créer l'app dans App Store Connect : https://appstoreconnect.apple.com

---

### Etape 2 — Keystore Android (si pas encore fait)

Ton fichier `evolya-release.jks` existe déjà. Tu as besoin de connaître :
- **Alias de la clé** : tu l'as choisi à la création (probablement `evolya-key`)
- **Mot de passe du keystore** : celui que tu as défini
- **Mot de passe de la clé** : idem

Pour vérifier l'alias :
```
keytool -list -keystore evolya-release.jks
```
(Java doit être installé et keytool dans le PATH)

---

### Etape 3 — Configuration Codemagic (build AAB)

1. Aller sur https://codemagic.io → ton app Evolya
2. **App Settings > Environment variables** — ajouter :
   - `ANDROID_KEYSTORE_PASSWORD` = ton mot de passe keystore
   - `ANDROID_KEY_ALIAS` = evolya-key (ou l'alias réel)
   - `ANDROID_KEY_PASSWORD` = ton mot de passe clé
3. **App Settings > Code signing (Android)** → uploader `evolya-release.jks` → Codemagic définira `CM_KEYSTORE_PATH` automatiquement
4. Lancer le workflow `android-workflow` → récupérer le fichier `.aab`

---

### Etape 4 — Soumettre l'AAB au Play Store

1. Dans Play Console → ton app → "Production" → "Créer une nouvelle version"
2. Uploader le fichier `.aab` généré par Codemagic
3. Remplir les champs avec `store-metadata/fr-FR/description_play_store.txt`
4. **Questionnaire contenu** (obligatoire) :
   - Audience : 16+ (sport/fitness)
   - Publicités : Non
   - Contenu généré par utilisateurs : Non (messagerie privée coach-client uniquement)
5. **Screenshots** — voir `store-metadata/screenshots_spec.txt` pour les specs
6. Soumettre pour examen (délai Google : 1–3 jours)

---

### Etape 5 — Build iOS (nécessite un Mac ou Codemagic)

Option A — **Codemagic** (recommandé, tu es sur Windows) :
1. Dans Codemagic > App Settings > Integrations → connecter App Store Connect API
   - Générer une clé API dans App Store Connect > Utilisateurs > Clés API
   - Ajouter `APP_STORE_CONNECT_KEY_IDENTIFIER`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_PRIVATE_KEY` dans les env vars
   - Ajouter `APPLE_TEAM_ID` (ton Team ID Apple, visible dans developer.apple.com)
2. Lancer le workflow `ios-workflow` → récupérer le fichier `.ipa`

Option B — **Mac local** :
- Ouvrir `ios/App/App.xcworkspace` dans Xcode
- Product > Archive → distribuer via App Store Connect

---

### Etape 6 — Soumettre l'IPA à l'App Store

1. Dans App Store Connect → ton app → "TestFlight" d'abord pour tester
2. Uploader avec Xcode Organizer ou Transporter (Mac) ou via Codemagic direct upload
3. Remplir les champs avec `store-metadata/fr-FR/description_app_store.txt`
4. **Screenshots obligatoires** : iPhone 6.7" (1290 x 2796 px) — voir `store-metadata/screenshots_spec.txt`
5. **Note de révision** : inclure le compte de test (voir description_app_store.txt)
6. Soumettre pour examen (délai Apple : 1–2 jours en moyenne)

---

## Informations techniques de l'app

| Champ | Valeur |
|-------|--------|
| Bundle/Package ID | `fr.evolyafit.app` |
| Version | 1.0 |
| versionCode (Android) | 1 |
| Keystore | `evolya-release.jks` |
| Framework | Capacitor 8 + Next.js 14 |
| URL de production | https://evolya-ebal1g55h-kenzo-team-url.vercel.app |
| Min SDK Android | voir `android/variables.gradle` |
| iOS min | iOS 13+ (Capacitor 8 default) |

---

## SQL migrations à appliquer dans Supabase

Ces migrations sont dans `supabase/migrations/` mais doivent être **exécutées manuellement** dans le dashboard Supabase (SQL Editor) :

- [ ] `20260529_coach_push_subscriptions.sql` — table pour les push notifications des coachs
- [ ] `20260529_superset_periodisation.sql` — colonnes `superset_group` et `phase` pour les programmes

**Pour appliquer** : Supabase Dashboard → SQL Editor → coller le contenu du fichier → Run

---

## Proof / Vérification rapide

```bash
# Verifier que le signingConfig est dans build.gradle
grep -n "signingConfigs\|bundleRelease\|signingConfig" android/app/build.gradle

# Verifier que codemagic build l'AAB
grep -n "bundleRelease\|\.aab" codemagic.yaml

# Verifier ExportOptions.plist
cat ios/App/ExportOptions.plist

# Verifier les metadata
ls store-metadata/fr-FR/

# Verifier TypeScript fix push
grep -n "as ArrayBuffer" components/providers/NotificationProvider.tsx
```
