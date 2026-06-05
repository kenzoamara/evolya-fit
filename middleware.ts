import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Routes publiques
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/suspended', '/cgu', '/mentions-legales', '/politique-confidentialite', '/stats', '/rejoindre']
  const isPublicRoute = publicRoutes.some((r) => pathname.startsWith(r)) || pathname === '/'
  const isClientRoute = pathname.startsWith('/c/')
  const isApiRoute = pathname.startsWith('/api/')

  // ── App native (Capacitor) — détectée via le marqueur User-Agent ──
  // Pas de landing : ouverture directe sur la connexion.
  // Création de compte interdite dans l'app (le choix du plan + paiement se fait sur le web).
  const isNativeApp = /EvolyaApp/i.test(request.headers.get('user-agent') || '')
  if (isNativeApp && !isApiRoute) {
    if (pathname === '/' && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
    if (pathname.startsWith('/auth/signup')) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('from', 'app')
      return NextResponse.redirect(url)
    }
  }

  // ── Espace élève (/c/[token]/*) — création de compte OBLIGATOIRE ──
  // Tant que l'élève n'a pas créé son compte (mot de passe), on le force vers
  // la page de création de compte. Vaut pour le web ET l'app.
  if (isClientRoute) {
    const parts = pathname.split('/')        // ['', 'c', token, sous-route, ...]
    const token = parts[2] ?? ''
    const sub = parts[3] ?? ''
    const exempt = token === 'login' || sub === 'create-account'
    if (token && !exempt) {
      const { data: client } = await supabase
        .from('clients')
        .select('auth_user_id')
        .eq('magic_token', token)
        .maybeSingle()
      if (client && !client.auth_user_id) {
        const url = request.nextUrl.clone()
        url.pathname = `/c/${token}/create-account`
        return NextResponse.redirect(url)
      }
    }
    return supabaseResponse
  }

  if (isPublicRoute || isApiRoute) {
    return supabaseResponse
  }

  // Non authentifié → login
  if (!user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    return NextResponse.redirect(redirectUrl)
  }

  // Vérifier suspension pour les routes coach (/dashboard, /clients, etc.)
  // (pas pour /admin qui a sa propre vérification)
  const isCoachRoute = !pathname.startsWith('/admin')
  if (isCoachRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('suspended, role')
      .eq('id', user.id)
      .single()

    if (profile?.suspended) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/auth/suspended'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
