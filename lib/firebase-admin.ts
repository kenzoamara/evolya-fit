import admin from 'firebase-admin'

// Récupère la clé de service :
//  - en prod : variable d'env FIREBASE_SERVICE_ACCOUNT (JSON brut OU base64)
//  - en local : fichier firebase-service-account.json à la racine (gitignored)
function getServiceAccount(): admin.ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (raw) {
    try { return JSON.parse(raw) } catch { /* peut être en base64 */ }
    try { return JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) } catch { /* ignore */ }
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs'); const path = require('path')
    const p = path.join(process.cwd(), 'firebase-service-account.json')
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch { /* ignore */ }
  return null
}

let cached: admin.app.App | null = null

export function getFirebaseAdmin(): admin.app.App | null {
  if (cached) return cached
  if (admin.apps.length) { cached = admin.apps[0]!; return cached }
  const sa = getServiceAccount()
  if (!sa) {
    console.warn('[firebase-admin] Aucune clé de service — push natifs désactivés.')
    return null
  }
  cached = admin.initializeApp({ credential: admin.credential.cert(sa) })
  return cached
}
