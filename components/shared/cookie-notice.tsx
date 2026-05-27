'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'evolya_cookie_notice_dismissed'

export function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (!dismissed) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div
        className="max-w-2xl mx-auto bg-[#0D1F3C] text-white rounded-xl px-5 py-4 flex items-start sm:items-center gap-4 shadow-2xl pointer-events-auto"
        role="complementary"
        aria-label="Information cookies"
      >
        <svg className="flex-shrink-0 mt-0.5 sm:mt-0" width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7.5" stroke="#4E9B6F" strokeWidth="1.5"/>
          <path d="M9 8v5M9 6v.5" stroke="#4E9B6F" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <p className="text-[13px] leading-relaxed flex-1">
          Ce site utilise uniquement des cookies <strong>strictement nécessaires</strong> à votre authentification (session Supabase). Aucun cookie publicitaire ni tracker tiers.{' '}
          <Link href="/politique-confidentialite#cookies" className="text-[#4E9B6F] underline hover:text-[#6EC48A] transition-colors">
            En savoir plus
          </Link>
        </p>
        <button
          onClick={dismiss}
          className="flex-shrink-0 text-[13px] font-semibold text-white bg-[#4E9B6F] hover:bg-[#3D7A5F] px-4 py-1.5 rounded-lg transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  )
}
