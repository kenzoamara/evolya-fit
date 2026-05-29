import type { Metadata } from 'next'
import { Inter, Barlow, Barlow_Condensed, Poppins, Montserrat, Raleway, Anton, Playfair_Display } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from 'sonner'
import { CookieNotice } from '@/components/shared/cookie-notice'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const barlow = Barlow({
  subsets: ['latin'],
  variable: '--font-barlow',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  variable: '--font-barlow-condensed',
  display: 'swap',
  weight: ['600', '700', '800'],
})

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const anton = Anton({
  subsets: ['latin'],
  variable: '--font-anton',
  display: 'swap',
  weight: ['400'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '700'],
  style: ['normal', 'italic'],
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
}

export const metadata: Metadata = {
  title: "Evolya'Fit — Suivi coach-client",
  description: "La plateforme de suivi coach-client — Centralise le suivi de tes clients, automatise les check-ins et concentre-toi sur ton coaching.",
  manifest: '/manifest.json',
  openGraph: {
    title: "Evolya'Fit — Suivi coach-client",
    description: "La plateforme de suivi coach-client — Centralise le suivi de tes clients, automatise les check-ins et concentre-toi sur ton coaching.",
    url: 'https://www.evolyafit.fr',
    siteName: "Evolya'Fit",
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: "Evolya'Fit — Suivi coach-client",
    description: "La plateforme de suivi coach-client — Centralise le suivi de tes clients, automatise les check-ins et concentre-toi sur ton coaching.",
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Evolya'Fit",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${GeistSans.variable} ${GeistMono.variable} ${barlow.variable} ${barlowCondensed.variable} ${poppins.variable} ${montserrat.variable} ${raleway.variable} ${anton.variable} ${playfair.variable}`}>
      <head>
        <meta name="google" content="notranslate" />
        <meta name="theme-color" content="#4E9B6F" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
        `}} />
      </head>
      <body className="font-sans antialiased bg-[#F8FAFB] text-[#0D1F3C]">
        {children}
        <CookieNotice />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-inter), var(--font-geist-sans)',
              fontSize: '13.5px',
              borderRadius: '10px',
            },
          }}
        />
      </body>
    </html>
  )
}
