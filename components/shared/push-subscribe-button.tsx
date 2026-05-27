'use client'

import { useState, useEffect } from 'react'

type Props = {
  token: string
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray.buffer
}

export function PushSubscribeButton({ token }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'>('idle')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'granted') setStatus('granted')
    if (Notification.permission === 'denied') setStatus('denied')
  }, [])

  async function handleSubscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    setStatus('loading')

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setStatus('denied'); return }

      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      const subscription = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, subscription: subscription.toJSON() }),
      })

      if (res.ok) {
        setStatus('granted')
      } else {
        setStatus('idle')
      }
    } catch {
      setStatus('idle')
    }
  }

  if (status === 'unsupported' || status === 'denied') return null
  if (status === 'granted') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[#EEF9F3] rounded-xl">
        <div className="w-1.5 h-1.5 rounded-full bg-[#4E9B6F] flex-shrink-0" />
        <span className="text-[11px] text-[#4E9B6F] font-medium">Notifications activées</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={status === 'loading'}
      className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl hover:border-[#4E9B6F] hover:bg-[#EEF9F3] transition-colors disabled:opacity-50"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4E9B6F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
      <span className="text-[11px] text-[#0D1F3C] font-medium">
        {status === 'loading' ? 'Activation...' : 'Activer les notifications'}
      </span>
    </button>
  )
}
