/**
 * OpenWA API client
 * Docs: https://www.open-wa.org
 * Self-hosted on Railway via OPENWA_URL env variable
 */

const OPENWA_URL = process.env.OPENWA_URL ?? ''
const OPENWA_API_KEY = process.env.OPENWA_API_KEY ?? ''

function headers() {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': OPENWA_API_KEY,
  }
}

/** Format phone number to WhatsApp chatId: "33612345678@c.us" */
export function toWhatsAppId(phone: string): string {
  // Remove spaces, dashes, +
  const cleaned = phone.replace(/[\s\-\+\(\)]/g, '')
  // If starts with 0, replace with country code (assume FR = 33)
  const normalized = cleaned.startsWith('0') ? '33' + cleaned.slice(1) : cleaned
  return `${normalized}@c.us`
}

/** Create and start a WhatsApp session for a coach — returns the internal UUID */
export async function createSession(sessionName: string): Promise<{ ok: boolean; uuid?: string; error?: string }> {
  try {
    // Check if session with this name already exists
    const listRes = await fetch(`${OPENWA_URL}/api/sessions`, { headers: headers() })
    if (listRes.ok) {
      const sessions = await listRes.json() as Array<{ id: string; name: string; status: string }>
      const existing = sessions.find(s => s.name === sessionName)
      if (existing) {
        // Already exists — just start it
        await fetch(`${OPENWA_URL}/api/sessions/${existing.id}/start`, {
          method: 'POST',
          headers: headers(),
        })
        return { ok: true, uuid: existing.id }
      }
    }

    // Create the session
    const res = await fetch(`${OPENWA_URL}/api/sessions`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ name: sessionName }),
    })
    if (!res.ok) return { ok: false, error: await res.text() }
    const data = await res.json() as { id: string; name: string }
    const uuid = data.id

    // Start the session
    const startRes = await fetch(`${OPENWA_URL}/api/sessions/${uuid}/start`, {
      method: 'POST',
      headers: headers(),
    })
    if (!startRes.ok) return { ok: false, error: await startRes.text() }

    return { ok: true, uuid }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

/** Get QR code for scanning */
export async function getQRCode(sessionId: string): Promise<{ qr: string | null; status: string }> {
  try {
    const res = await fetch(`${OPENWA_URL}/api/sessions/${sessionId}/qr`, {
      headers: headers(),
    })
    if (!res.ok) return { qr: null, status: 'loading' }

    const data = await res.json()
    // OpenWA returns { qrCode: "data:image/png;base64,..." , status: "qr_ready" }
    return { qr: data.qrCode ?? data.qr ?? data.base64 ?? null, status: data.status ?? 'loading' }
  } catch {
    return { qr: null, status: 'error' }
  }
}

/** Check session status — maps OpenWA statuses to our internal ones */
export async function getSessionStatus(sessionId: string): Promise<'CONNECTED' | 'SCAN_QR_CODE' | 'LOADING' | 'STOPPED' | 'ERROR'> {
  try {
    const res = await fetch(`${OPENWA_URL}/api/sessions/${sessionId}`, {
      headers: headers(),
    })
    if (!res.ok) return 'STOPPED'
    const data = await res.json()
    const s: string = data.status ?? ''
    // OpenWA statuses: created, initializing, qr_ready, connected, disconnected, stopped, error
    if (s === 'connected' || s === 'ready') return 'CONNECTED'
    if (s === 'qr_ready') return 'SCAN_QR_CODE'
    if (s === 'initializing' || s === 'created') return 'LOADING'
    if (s === 'disconnected' || s === 'stopped') return 'STOPPED'
    return 'ERROR'
  } catch {
    return 'ERROR'
  }
}

/** Stop and delete a session */
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const res = await fetch(`${OPENWA_URL}/api/sessions/${sessionId}/stop`, {
      method: 'POST',
      headers: headers(),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Send a text message via WhatsApp */
export async function sendWhatsAppMessage(sessionId: string, phone: string, text: string): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  try {
    const chatId = toWhatsAppId(phone)
    const res = await fetch(`${OPENWA_URL}/api/sessions/${sessionId}/messages/send-text`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ chatId, text }),
    })
    if (!res.ok) {
      const errText = await res.text()
      return { ok: false, error: errText }
    }
    const data = await res.json()
    return { ok: true, messageId: data.id ?? data.messageId }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

/** Configure webhook URL on a session */
export async function setWebhook(sessionId: string, webhookUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${OPENWA_URL}/api/sessions/${sessionId}/webhooks`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        url: webhookUrl,
        events: ['message.received', 'session.status'],
      }),
    })
    return res.ok
  } catch {
    return false
  }
}
