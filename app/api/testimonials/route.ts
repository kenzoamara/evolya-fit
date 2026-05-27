import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('testimonials')
    .select('id, coach_name, coaching_type, content, rating, created_at')
    .eq('is_approved', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(12)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const content: string = (body.content ?? '').trim()
  const rating: number = Math.min(5, Math.max(1, Number(body.rating) || 5))

  if (content.length < 20) {
    return NextResponse.json({ error: 'Le témoignage doit faire au moins 20 caractères.' }, { status: 400 })
  }
  if (content.length > 600) {
    return NextResponse.json({ error: 'Le témoignage ne peut pas dépasser 600 caractères.' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, coaching_type')
    .eq('id', user.id)
    .single()

  const admin = createAdminClient()
  const { error } = await admin.from('testimonials').insert({
    coach_id: user.id,
    coach_name: profile?.full_name ?? 'Coach',
    coaching_type: profile?.coaching_type ?? null,
    content,
    rating,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Vous avez déjà soumis un témoignage.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
