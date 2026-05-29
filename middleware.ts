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

  if (isPublicRoute || isClientRoute || isApiRoute) {
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
